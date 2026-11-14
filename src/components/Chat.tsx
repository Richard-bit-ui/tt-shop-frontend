import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useChat } from '../store/chat';
import { useSaved } from '../store/ui';
import { cx } from './ui';

const ChatPanel = lazy(() => import('./ChatPanel'));

/**
 * Einstieg in den Shop-Assistenten (wie „Frag einen Specialist“ im Apple Store):
 * kleiner Button unten rechts, das eigentliche Chatfenster wird erst beim ersten Öffnen geladen.
 */
export function ChatLauncher() {
  const open = useChat((s) => s.open);
  const setOpen = useChat((s) => s.setOpen);
  const compare = useSaved((s) => s.compare.length);
  const { pathname } = useLocation();
  const [loaded, setLoaded] = useState(false);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (open) setLoaded(true);
  }, [open]);
  // Nach kurzer Zeit einmal dezent auf den Assistenten hinweisen
  useEffect(() => {
    if (sessionStorage.getItem('tt-chat-hint')) return;
    const t = window.setTimeout(() => {
      setHint(true);
      sessionStorage.setItem('tt-chat-hint', '1');
      window.setTimeout(() => setHint(false), 6000);
    }, 9000);
    return () => window.clearTimeout(t);
  }, []);
  if (pathname.startsWith('/kasse')) return null;
  // Auf dem Handy dort ausblenden, wo eine eigene Kaufleiste am unteren Rand sitzt (Hilfe gibt es dort im Inhalt)
  const hideMobile = /^\/(p\/|konfigurator|warenkorb)/.test(pathname);
  const raised = compare > 0;
  return (
    <>
      <div
        data-print-hide
        className={cx(
          'fixed right-4 z-[60] flex items-center gap-2 transition-[bottom,opacity,transform] duration-300 sm:right-6',
          raised ? 'bottom-[84px] lg:bottom-[96px]' : 'bottom-4 sm:bottom-6',
          hideMobile && 'max-lg:hidden',
          open && 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <span
          className={cx(
            'hidden rounded-full bg-white px-4 py-2.5 text-[13.5px] font-medium shadow-pop transition-all duration-300 sm:block',
            hint ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-2 opacity-0',
          )}
        >
          Brauchst du Hilfe bei der Auswahl?
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Shop-Assistent öffnen"
          className="group flex h-[52px] items-center gap-2.5 rounded-full bg-ink pr-5 pl-[7px] text-white shadow-pop transition-transform hover:scale-[1.03] active:scale-95 max-sm:size-[52px] max-sm:justify-center max-sm:p-0"
        >
          <span className="grid size-[38px] place-items-center rounded-full bg-red">
            <MessageCircle size={19} strokeWidth={2} />
          </span>
          <span className="hidden text-[14px] font-semibold sm:block">Fragen?</span>
        </button>
      </div>
      {loaded && (
        <Suspense fallback={null}>
          <ChatPanel />
        </Suspense>
      )}
    </>
  );
}
