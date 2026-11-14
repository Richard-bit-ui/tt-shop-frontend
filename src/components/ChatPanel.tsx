import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Drawer } from 'vaul';
import { ArrowUp, Phone, RotateCcw, X } from 'lucide-react';
import { formatPrice, getProduct, products, SHOP } from '../lib/catalog';
import { useChat, type ChatMsg } from '../store/chat';
import { cx, Img, useMedia } from './ui';

const START = ['Belag für Offensivspieler', 'Holz für Einsteiger', 'Versandkosten', 'Was kostet die Montage?', 'Rabatt ab 2 Belägen', 'Mit einem Menschen sprechen'];

/** **fett** und Zeilenumbrüche – mehr Formatierung braucht der Assistent nicht */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith('**') ? <b key={j}>{part.slice(2, -2)}</b> : <Fragment key={j}>{part}</Fragment>))}
        </Fragment>
      ))}
    </>
  );
}

function Bubble({ m, onNav }: { m: ChatMsg; onNav: () => void }) {
  const bot = m.role === 'bot';
  const items = (m.products ?? []).map((id) => getProduct(id)).filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={cx('flex flex-col', bot ? 'items-start' : 'items-end')}>
      <div className={cx('max-w-[86%] px-4 py-2.5 text-[14.5px] leading-[1.45]', bot ? 'rounded-[20px] rounded-bl-[6px] bg-panel text-ink' : 'rounded-[20px] rounded-br-[6px] bg-info text-white')}>
        <RichText text={m.text} />
      </div>
      {items.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-2 flex w-[calc(100%+2rem)] gap-2.5 overflow-x-auto px-4 pb-1">
          {items.map((p) => (
            <Link
              key={p.id}
              to={`/p/${p.id}`}
              onClick={onNav}
              className="w-[148px] shrink-0 rounded-[16px] bg-white p-2.5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="tile aspect-square rounded-[12px] p-2">
                <Img thumb src={p.images[0]} alt="" className="size-full object-contain" />
              </div>
              <div className="mt-2 line-clamp-2 text-[12.5px] leading-snug font-semibold">{p.title}</div>
              <div className="num mt-0.5 text-[12.5px] text-muted">{formatPrice(p.price)}</div>
            </Link>
          ))}
        </div>
      )}
      {m.links && m.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {m.links.map((l) =>
            /^(tel|mailto):/.test(l.to) ? (
              <a key={l.to} href={l.to} className="rounded-full border border-info/30 px-3 py-1.5 text-[13px] text-info hover:bg-info/[0.06]">
                {l.label}
              </a>
            ) : (
              <Link key={l.to} to={l.to} onClick={onNav} className="rounded-full border border-info/30 px-3 py-1.5 text-[13px] text-info hover:bg-info/[0.06]">
                {l.label} ›
              </Link>
            ),
          )}
        </div>
      )}
    </motion.div>
  );
}

function Chips({ items, onPick }: { items: string[]; onPick: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-ink shadow-[0_0_0_1px_var(--color-line-2)] transition-colors hover:bg-panel"
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function Body({ onClose, title, mobile }: { onClose: () => void; title: ReactNode; mobile: boolean }) {
  const { msgs, typing, send, reset } = useChat();
  const [text, setText] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [msgs.length, typing]);
  useEffect(() => {
    if (!mobile) input.current?.focus();
  }, [mobile]);
  const lastBot = [...msgs].reverse().find((m) => m.role === 'bot');
  const submit = (v: string) => {
    if (!v.trim()) return;
    void send(v);
    setText('');
  };
  const onNav = () => mobile && onClose();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
        <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-bold text-white">
          TT
          <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-ok ring-2 ring-white" />
        </span>
        <div className="min-w-0 flex-1">
          {title}
          <div className="truncate text-[12px] text-muted">Automatischer Assistent · antwortet sofort</div>
        </div>
        {msgs.length > 0 && (
          <button type="button" onClick={reset} className="icon-btn size-9 text-muted" aria-label="Neues Gespräch" title="Neues Gespräch">
            <RotateCcw size={17} />
          </button>
        )}
        <a href={SHOP.phoneHref} className="icon-btn size-9 text-muted" aria-label={`Fachberatung anrufen: ${SHOP.phone}`} title={`Fachberatung: ${SHOP.phone}`}>
          <Phone size={17} />
        </a>
        <button type="button" onClick={onClose} className="icon-btn size-9" aria-label="Assistent schließen">
          <X size={19} />
        </button>
      </div>

      <div ref={list} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
        <Bubble
          m={{
            id: 0,
            role: 'bot',
            text: `Hallo! Ich bin der digitale Assistent vom TT-Shop. Ich kenne alle **${products.length} Artikel**, unsere Versand-, Rabatt- und Montageregeln und das Tischtennis-Glossar.\nBeschreib dein Spiel oder frag einfach los.`,
          }}
          onNav={onNav}
        />
        {msgs.length === 0 && <Chips items={START} onPick={submit} />}
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} onNav={onNav} />
        ))}
        {typing && (
          <div className="flex w-fit items-center gap-1 rounded-[20px] rounded-bl-[6px] bg-panel px-4 py-3.5" aria-label="Assistent schreibt">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="size-1.5 rounded-full bg-muted" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
            ))}
          </div>
        )}
        {!typing && lastBot?.chips && lastBot.id === msgs[msgs.length - 1]?.id && <Chips items={lastBot.chips} onPick={submit} />}
      </div>

      <div className="safe-bottom shrink-0 border-t border-line px-3 pt-3 pb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
          className="flex items-center gap-2 rounded-full bg-panel py-1 pr-1 pl-4 focus-within:ring-2 focus-within:ring-info/30"
        >
          <input
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Frag z. B. nach einem Belag …"
            aria-label="Nachricht an den Assistenten"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-subtle"
            maxLength={300}
          />
          <button
            type="submit"
            disabled={!text.trim() || typing}
            aria-label="Senden"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-info text-white transition-opacity disabled:opacity-30"
          >
            <ArrowUp size={18} strokeWidth={2.4} />
          </button>
        </form>
        <p className="mt-2 px-2 text-center text-[11px] leading-snug text-muted">Automatischer Assistent auf Basis unseres Sortiments – Angaben ohne Gewähr. Verbindliche Beratung: {SHOP.phone}</p>
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const open = useChat((s) => s.open);
  const setOpen = useChat((s) => s.setOpen);
  const desktop = useMedia('(min-width: 640px)');
  const close = () => setOpen(false);
  useEffect(() => {
    if (!open || !desktop) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, desktop]); // eslint-disable-line react-hooks/exhaustive-deps

  if (desktop) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="TT-Shop Assistent"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed right-6 bottom-6 z-[70] flex h-[min(640px,calc(100dvh-120px))] w-[400px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_-20px_rgb(0_0_0/0.35),0_0_0_1px_rgb(0_0_0/0.04)]"
            data-print-hide
          >
            <Body onClose={close} mobile={false} title={<div className="truncate text-[15px] font-semibold tracking-[-0.01em]">TT-Shop Assistent</div>} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[81] flex h-[88dvh] flex-col rounded-t-[24px] bg-white outline-none" aria-describedby={undefined}>
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-line-2" />
          <Body onClose={close} mobile title={<Drawer.Title className="truncate text-[15px] font-semibold tracking-[-0.01em]">TT-Shop Assistent</Drawer.Title>} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
