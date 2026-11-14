import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, Clock, Mail, Package, Phone, Send, Users, Wrench } from 'lucide-react';
import { formatPrice, inCat, SHOP } from '../lib/catalog';
import { getGuide, GLOSSARY, GUIDES } from '../lib/guides';
import { ProductRail } from '../components/ProductCard';
import { Breadcrumbs, cx, Img, SectionHead } from '../components/ui';
import { usePageMeta } from '../lib/seo';

/* ================= Ratgeber-Übersicht ================= */
function GuideIndex() {
  usePageMeta('Ratgeber & Kaufberatung', 'Belagarten, Schwammhärte, Holzaufbau, Kleben & Pflege, Materialregeln und Plattenkauf – Fachwissen vom Tischtennis-Fachhändler.');
  return (
    <div className="container-x pb-16">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Ratgeber' }]} />
      <div className="max-w-3xl">
        <h1 className="h1">Ratgeber.</h1>
        <p className="mt-3 text-[17px] leading-snug text-muted sm:text-[19px]">Fachwissen aus der täglichen Beratung – kompakt erklärt und direkt mit den passenden Produkten verknüpft.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((g) => (
          <Link key={g.slug} to={`/ratgeber/${g.slug}`} className="group overflow-hidden store-card">
            <div className="aspect-[16/9] overflow-hidden">
              <Img src={g.img} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 text-[12px] text-muted">
                <span className="flex items-center gap-1">
                  <BookOpen size={13} /> Ratgeber
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={13} /> {g.minutes} Min.
                </span>
              </div>
              <h2 className="mt-1.5 text-[16px] leading-snug font-semibold group-hover:underline">{g.title}</h2>
              <p className="mt-1 text-[13.5px] leading-snug text-muted">{g.teaser}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <Link to="/berater" className="rounded-lg bg-ink p-5 text-white">
          <div className="text-[16px] font-semibold">Material-Berater</div>
          <p className="mt-1 text-[13.5px] text-white/70">In 4 Fragen zu deiner Belag- und Holzempfehlung.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold">
            Jetzt starten <ArrowRight size={15} />
          </span>
        </Link>
        <Link to="/glossar" className="store-card p-6">
          <div className="text-[16px] font-semibold">Glossar</div>
          <p className="mt-1 text-[13.5px] text-muted">Von ALC bis ZLC – Fachbegriffe kurz erklärt.</p>
        </Link>
        <a href={SHOP.phoneHref} className="store-card p-6">
          <div className="text-[16px] font-semibold">Persönliche Beratung</div>
          <p className="mt-1 text-[13.5px] text-muted">
            {SHOP.phone} · {SHOP.hours}
          </p>
        </a>
      </div>
    </div>
  );
}

/* ================= Ratgeber-Artikel ================= */
function GuideArticle() {
  const { slug = '' } = useParams();
  const g = getGuide(slug);
  usePageMeta(g ? g.title : null, g?.teaser, g?.img);
  if (!g) return <GuideIndex />;
  const related = /belag|haerte/.test(g.slug)
    ? inCat('belaege')
        .filter((p) => p.specs.hardness)
        .slice(0, 10)
    : /holz/.test(g.slug)
      ? inCat('hoelzer').slice(0, 10)
      : /platte/.test(g.slug)
        ? inCat('tische', 'indoor').concat(inCat('tische', 'outdoor')).slice(0, 10)
        : /baelle/.test(g.slug)
          ? inCat('baelle').slice(0, 10)
          : inCat('zubehoer', 'kleber').concat(inCat('zubehoer', 'reiniger')).slice(0, 10);
  return (
    <div className="container-x pb-16">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { to: '/ratgeber', label: 'Ratgeber' }, { label: g.title }]} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 max-w-3xl">
          <div className="flex items-center gap-3 text-[12.5px] text-muted">
            <span className="flex items-center gap-1">
              <BookOpen size={14} /> Ratgeber
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {g.minutes} Min. Lesezeit
            </span>
          </div>
          <h1 className="h1 mt-2">{g.title}</h1>
          <p className="mt-3 text-[17px] leading-snug text-muted sm:text-[19px]">{g.teaser}</p>
          <div className="mt-7 aspect-[16/7] overflow-hidden rounded-[24px]">
            <Img src={g.img.replace('-sm.webp', '.webp')} alt="" eager className="size-full object-cover" />
          </div>
          {g.sections.map((s) => (
            <section key={s.h} className="mt-8">
              <h2 className="h2">{s.h}</h2>
              {s.p?.map((t, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  {t}
                </p>
              ))}
              {s.list && (
                <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-2">
                  {s.list.map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <Check size={17} className="mt-1 shrink-0 text-ok" /> <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.table && (
                <div className="-mx-4 mt-4 overflow-x-auto sm:mx-0">
                  <table className="data-table min-w-[520px]">
                    <thead className="bg-panel">
                      <tr>
                        {s.table.head.map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((r) => (
                        <tr key={r[0]}>
                          {r.map((c, i) => (
                            <td key={i} className={cx(i === 0 && 'font-semibold', 'text-[14px]')}>
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </article>
        <aside className="min-w-0 space-y-4">
          <div className="card sticky top-[calc(var(--hdr)+24px)] p-5">
            <div className="text-[15px] font-semibold">Passende Produkte</div>
            <ul className="mt-3 space-y-1">
              {g.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="flex items-center justify-between rounded px-2 py-2 text-[14px] hover:bg-panel">
                    {l.label} <ArrowRight size={15} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/berater" className="btn btn-dark btn-sm mt-4 w-full">
              Zum Material-Berater
            </Link>
            <a href={SHOP.phoneHref} className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-info">
              <Phone size={14} /> Beratung {SHOP.phone}
            </a>
          </div>
        </aside>
      </div>
      <section className="mt-12">
        <SectionHead title="Aus dem Sortiment" />
        <ProductRail items={related} />
      </section>
      <section className="mt-12">
        <SectionHead title="Weitere Ratgeber" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.filter((x) => x.slug !== g.slug)
            .slice(0, 3)
            .map((x) => (
              <Link key={x.slug} to={`/ratgeber/${x.slug}`} className="store-card p-5">
                <div className="text-[15px] font-semibold">{x.title}</div>
                <div className="mt-1 text-[13px] text-muted">{x.teaser}</div>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}

/* ================= Glossar ================= */
function Glossary() {
  usePageMeta('Glossar: Tischtennis-Material von A bis Z');
  return (
    <div className="container-x pb-16">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { to: '/ratgeber', label: 'Ratgeber' }, { label: 'Glossar' }]} />
      <h1 className="h1">Glossar.</h1>
      <p className="mt-3 text-[17px] leading-snug text-muted sm:text-[19px]">Tischtennis-Material von A bis Z – kurz erklärt.</p>
      <dl className="mt-6 grid gap-x-10 md:grid-cols-2">
        {GLOSSARY.map((g) => (
          <div key={g.term} id={g.term} className="scroll-mt-3 border-t border-line py-3.5">
            <dt className="text-[15px] font-semibold">{g.term}</dt>
            <dd className="mt-0.5 text-[14px] text-ink-2">{g.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ================= Montage-Service ================= */
function Assembly() {
  usePageMeta('Montage-Service für Tischtennisschläger', 'Beläge aufziehen inkl. Kantenband für 2,00 €, Holzversiegelung ab 2,50 € – spielfertig vom Fachhändler.');
  const steps = [
    { icon: Package, title: 'Holz und Beläge wählen', text: 'Im Schläger-Konfigurator oder direkt auf der Produktseite des Holzes die Option „Beläge montieren“ wählen.' },
    { icon: Wrench, title: 'Wir montieren', text: 'Wir kleben die Beläge mit wasserbasiertem Kleber, schneiden sie sauber zu und bringen ein Kantenband an.' },
    { icon: Check, title: 'Spielfertig geliefert', text: 'Dein Schläger kommt einsatzbereit – auf Wunsch mit versiegeltem Holz.' },
  ];
  return (
    <div className="container-x pb-16">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Montage-Service' }]} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <h1 className="h1">Montage-Service.</h1>
          <p className="mt-3 text-[17px] leading-snug text-muted sm:text-[19px] max-w-2xl">Du wählst Holz und Beläge, wir kleben. Sauber zugeschnitten, mit Kantenband und auf Wunsch versiegelt.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-[18px] bg-panel p-5">
                <div className="flex items-center gap-2">
                  <span className="num grid size-7 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">{i + 1}</span>
                  <s.icon size={18} className="text-red" />
                </div>
                <div className="mt-2 text-[15px] font-semibold">{s.title}</div>
                <div className="mt-1 text-[13.5px] text-muted">{s.text}</div>
              </div>
            ))}
          </div>
          <h2 className="h2 mt-10">Eingeschickte Schläger neu belegen</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">
            Du hast dein Holz schon? Bestelle die neuen Beläge und schick uns deinen Schläger. Wir montieren die neuen Beläge auf dein Holz – inklusive Kantenband. Ruf uns vorher kurz an, dann
            besprechen wir die Details.
          </p>
          <a href={SHOP.phoneHref} className="btn btn-outline mt-4">
            <Phone size={16} /> {SHOP.phone}
          </a>
          <p className="mt-6 max-w-2xl text-[12.5px] text-muted">
            Hinweis: Nach deinen Vorgaben montierte Schläger können vom Widerrufsrecht ausgenommen sein (§ 312g Abs. 2 Nr. 1 BGB). Details findest du in unseren AGB.
          </p>
        </div>
        <aside className="card h-fit p-5">
          <div className="text-[16px] font-semibold">Preise</div>
          <table className="mt-3 w-full text-[14px]">
            <tbody>
              {[
                ['Belagmontage inkl. Kantenband', 2],
                ['Holzversiegelung Standard', 2.5],
                ['Holzversiegelung Profi', 5],
              ].map(([k, v]) => (
                <tr key={k as string} className="border-t border-line">
                  <td className="py-2.5">{k}</td>
                  <td className="num py-2.5 text-right font-semibold">{formatPrice(v as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[12.5px] text-muted">Zusätzlich gelten unsere Rabatte: 10 % auf nicht reduzierte Hölzer, 15 % ab zwei Belägen.</p>
          <Link to="/konfigurator" className="btn btn-primary mt-4 w-full">
            <Wrench size={16} /> Schläger zusammenstellen
          </Link>
          <Link to="/profi-setups" className="btn btn-outline mt-2 w-full">
            Profi-Setups ansehen
          </Link>
        </aside>
      </div>
    </div>
  );
}

/* ================= Vereinsservice ================= */
function Club() {
  usePageMeta('Vereinsservice', 'Sammelbestellungen, Teamwear mit Staffelpreisen, Hallenausstattung und Rechnungskauf für Vereine, Schulen und Unternehmen.');
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ verein: '', name: '', email: '', tel: '', thema: 'Sammelbestellung Beläge/Hölzer', text: '' });
  const valid = f.verein.trim() && f.name.trim() && /\S+@\S+\.\S+/.test(f.email);
  const perks = [
    ['Sammelbesteller-Rabatte', 'Individuelle Vereinskonditionen, wenn möglichst viele Spieler gemeinsam bestellen – für Beläge, Trainingsbälle, Spielbögen und mehr.'],
    ['Teamwear mit Staffelpreisen', 'Mengenrabatte auf Trikots, Shorts und Trainingsanzüge für die neue Saison.'],
    ['Vereinsschläger-Service', 'Schläger für Training, Kinder und Einsteiger – auf Wunsch montiert.'],
    ['Tische & Hallenausstattung', 'Angebote für ITTF-Tische, Netze, Umrandungen, Zählgeräte und Roboter.'],
    ['Rechnungskauf', 'Für Vereine, Schulen und öffentliche Einrichtungen – bezahlen nach Erhalt der Ware.'],
  ];
  return (
    <div className="container-x pb-16">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { label: 'Vereinsservice' }]} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div>
          <h1 className="h1">Vereinsservice.</h1>
          <p className="mt-3 text-[17px] leading-snug text-muted sm:text-[19px] max-w-2xl">
            Du bist Vorsitzender, Materialwart oder Trainer? Wir kümmern uns um Sammelbestellungen, Teamwear und Hallenausstattung – mit persönlichem Ansprechpartner.
          </p>
          <ul className="mt-6 space-y-3">
            {perks.map(([t, d]) => (
              <li key={t} className="flex gap-3 rounded-[18px] bg-panel p-5">
                <Users size={20} className="mt-0.5 shrink-0 text-red" />
                <div>
                  <div className="text-[15px] font-semibold">{t}</div>
                  <div className="text-[13.5px] text-muted">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card h-fit p-5">
          {sent ? (
            <div className="py-8 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-ok text-white">
                <Check size={22} strokeWidth={3} />
              </span>
              <div className="mt-3 text-[16px] font-semibold">Danke für deine Anfrage!</div>
              <p className="mt-1 text-[13.5px] text-muted">Wir melden uns schnellstmöglich bei dir. (Prototyp – es wurde nichts gesendet.)</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (valid) setSent(true);
              }}
              className="space-y-3.5"
            >
              <div className="text-[16px] font-semibold">Angebot anfragen</div>
              <label className="block">
                <span className="label">Verein / Schule / Firma</span>
                <input className="input" autoComplete="organization" value={f.verein} onChange={(e) => setF({ ...f, verein: e.target.value })} required />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Ansprechpartner</span>
                  <input className="input" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
                </label>
                <label className="block">
                  <span className="label">Telefon (optional)</span>
                  <input className="input" type="tel" autoComplete="tel" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} />
                </label>
              </div>
              <label className="block">
                <span className="label">E-Mail</span>
                <input className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
              </label>
              <label className="block">
                <span className="label">Thema</span>
                <select className="select h-11 w-full" value={f.thema} onChange={(e) => setF({ ...f, thema: e.target.value })}>
                  {['Sammelbestellung Beläge/Hölzer', 'Teamwear / Trikots', 'Tische & Hallenausstattung', 'Bälle in Großmengen', 'Sonstiges'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Nachricht</span>
                <textarea className="input h-28 py-2.5" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Anzahl Spieler, gewünschtes Material, Termin …" />
              </label>
              <button type="submit" disabled={!valid} className="btn btn-dark w-full">
                <Send size={16} /> Anfrage senden
              </button>
              <div className="flex items-center justify-center gap-4 pt-1 text-[13px] text-muted">
                <a href={SHOP.phoneHref} className="flex items-center gap-1 hover:text-ink">
                  <Phone size={14} /> {SHOP.phone}
                </a>
                <a href={`mailto:${SHOP.email}`} className="flex items-center gap-1 hover:text-ink">
                  <Mail size={14} /> E-Mail
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Content({ page }: { page: 'guides' | 'guide' | 'glossary' | 'assembly' | 'club' }) {
  if (page === 'guide') return <GuideArticle />;
  if (page === 'glossary') return <Glossary />;
  if (page === 'assembly') return <Assembly />;
  if (page === 'club') return <Club />;
  return <GuideIndex />;
}
