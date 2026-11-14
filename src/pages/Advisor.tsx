import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Phone, RotateCcw, Sparkles, Wrench } from 'lucide-react';
import { HARDNESS_CLASSES, inCat, SHOP, type Product } from '../lib/catalog';
import { suitability } from '../lib/advice';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs, cx, Tag } from '../components/ui';
import { usePageMeta } from '../lib/seo';

/**
 * Material-Berater: regelbasierte Empfehlung aus Ziel, Niveau, Spielstil und Präferenz.
 * Die Regeln spiegeln gängige Fachhändler-Beratung wider und sind bewusst nachvollziehbar
 * („Warum?“-Liste). Ergebnis = Profil + passende Artikel + Link auf die gefilterte Kategorie.
 */

type Goal = 'vh' | 'rh' | 'holz';
type Lvl = 'einsteiger' | 'verein' | 'ambitioniert';
type Style = 'allround' | 'spin' | 'tempo' | 'abwehr' | 'stoer';
type Pref = 'kontrolle' | 'ausgewogen' | 'tempo';

interface Answers {
  goal?: Goal;
  level?: Lvl;
  style?: Style;
  pref?: Pref;
}

const QUESTIONS: { key: keyof Answers; title: string; options: { v: string; label: string; hint: string }[] }[] = [
  {
    key: 'goal',
    title: 'Was suchst du?',
    options: [
      { v: 'vh', label: 'Belag für die Vorhand', hint: 'Meist die angriffsstärkere Seite' },
      { v: 'rh', label: 'Belag für die Rückhand', hint: 'Oft etwas weicher und kontrollierter' },
      { v: 'holz', label: 'Ein neues Holz', hint: 'Die Basis deines Schlägers' },
    ],
  },
  {
    key: 'level',
    title: 'Wie spielst du aktuell?',
    options: [
      { v: 'einsteiger', label: 'Einsteiger / Hobby', hint: 'Technik im Aufbau, Freizeit oder erste Saison' },
      { v: 'verein', label: 'Vereinsspieler', hint: 'Regelmäßiges Training, Kreis- bis Bezirksebene' },
      { v: 'ambitioniert', label: 'Ambitioniert', hint: 'Verbandsebene oder höher, saubere Technik' },
    ],
  },
  {
    key: 'style',
    title: 'Wie würdest du dein Spiel beschreiben?',
    options: [
      { v: 'allround', label: 'Allround & Kontrolle', hint: 'Sicher, variabel, wenig Fehler' },
      { v: 'spin', label: 'Offensiv mit Spin', hint: 'Topspin und Rotation stehen im Mittelpunkt' },
      { v: 'tempo', label: 'Offensiv mit Tempo', hint: 'Schnelle, direkte Angriffe nah am Tisch' },
      { v: 'abwehr', label: 'Abwehr', hint: 'Unterschnitt aus der Distanz' },
      { v: 'stoer', label: 'Störspiel', hint: 'Noppen oder Anti, Gegner aus dem Rhythmus bringen' },
    ],
  },
  {
    key: 'pref',
    title: 'Was ist dir beim Material wichtiger?',
    options: [
      { v: 'kontrolle', label: 'Mehr Kontrolle', hint: 'Gefühl und Sicherheit' },
      { v: 'ausgewogen', label: 'Ausgewogen', hint: 'Die goldene Mitte' },
      { v: 'tempo', label: 'Mehr Tempo', hint: 'Durchschlag und Geschwindigkeit' },
    ],
  },
];

interface Profile {
  cat: 'belaege' | 'hoelzer';
  types?: string[];
  hardness?: [number, number];
  thickness?: string[];
  materials?: string[];
  why: string[];
  query: string;
}

const H = HARDNESS_CLASSES;
const clamp = (n: number) => Math.max(0, Math.min(4, n));

function buildProfile(a: Required<Answers>): Profile {
  const why: string[] = [];
  if (a.goal === 'holz') {
    let materials: string[];
    if (a.style === 'abwehr') {
      materials = ['Allholz'];
      why.push('Abwehrspiel braucht ein langsames, kontrolliertes Holz – meist 5-lagiges Allholz der Klasse DEF oder ALL.');
    } else if (a.style === 'allround' || a.style === 'stoer' || a.level === 'einsteiger') {
      materials = ['Allholz'];
      why.push('Ein Allholz bietet das meiste Ballgefühl und ist ideal für Technikaufbau und variables Spiel.');
    } else if (a.level === 'ambitioniert' && (a.style === 'tempo' || a.pref === 'tempo')) {
      materials = ['Carbon', 'ALC', 'ZLC'];
      why.push('Für schnelle Offensive auf hohem Niveau liefern Carbon-, ALC- oder ZLC-Hölzer Tempo und einen großen Sweet Spot.');
    } else {
      materials = a.pref === 'kontrolle' ? ['Allholz'] : ['Allholz', 'Carbon'];
      why.push(
        a.pref === 'kontrolle' ? 'Ein 7-lagiges Allholz verbindet Offensivpotenzial mit viel Kontrolle.' : 'Ein offensives Allholz oder ein gefühlvolles Carbonholz passt zu modernem Topspinspiel.',
      );
    }
    why.push('Die meisten Spieler wählen den konkaven Griff – bei häufigem Griffwechsel ist „gerade“ eine gute Alternative.');
    return { cat: 'hoelzer', materials, why, query: `/c/hoelzer?material=${encodeURIComponent(materials.join('~'))}` };
  }

  // Beläge
  let types: string[];
  let base = { einsteiger: 0.5, verein: 2, ambitioniert: 3 }[a.level];
  let thickness: string[];
  switch (a.style) {
    case 'stoer':
      types = a.pref === 'tempo' ? ['Kurze Noppen', 'Halblange Noppen'] : ['Lange Noppen', 'Halblange Noppen', 'Anti', 'Glanti'];
      thickness = ['OX', '0,5', '0,6', '0,8', '0,9', '1,0', '1,2', '1,3', '1,5'];
      why.push(
        a.pref === 'tempo'
          ? 'Kurze und halblange Noppen erlauben ein schnelles, störendes Spiel nah am Tisch.'
          : 'Lange Noppen, Anti und Glanti kehren gegnerische Rotation um und bringen den Gegner aus dem Rhythmus.',
      );
      why.push('Für Störspiel eignen sich dünne Schwämme oder OX – das verstärkt den Störeffekt und die Kontrolle.');
      return { cat: 'belaege', types, thickness, why, query: `/c/belaege?typ=${encodeURIComponent(types.join('~'))}` };
    case 'abwehr':
      if (a.goal === 'rh') {
        types = ['Lange Noppen'];
        thickness = ['OX', '0,5', '0,6', '0,8', '1,0', '1,2', '1,5'];
        why.push('Klassische Abwehrspieler nutzen auf der Rückhand meist lange Noppen für unangenehmen Unterschnitt.');
        return { cat: 'belaege', types, thickness, why, query: `/c/belaege?typ=${encodeURIComponent('Lange Noppen')}` };
      }
      types = ['Klassisch', 'Tensor'];
      base = 1;
      thickness = ['1,5', '1,6', '1,7', '1,8', '1,9', '2,0'];
      why.push('Auf der Vorhand braucht die Abwehr einen kontrollierten Belag mit genug Spin für Gegenangriffe.');
      break;
    case 'allround':
      types = ['Klassisch', 'Tensor'];
      base -= 1;
      thickness = ['1,7', '1,8', '1,9', '2,0'];
      why.push('Für sicheres Allround-Spiel sind klassische Beläge oder kontrollierte Tensoren ideal.');
      break;
    case 'tempo':
      types = ['Tensor'];
      base += 0.5;
      thickness = ['2,0', '2,1', '2,2', '2,3', 'max'];
      why.push('Tensor-Beläge mit spürbarem Katapult unterstützen schnelle, direkte Angriffe.');
      break;
    default:
      types = a.level === 'ambitioniert' && a.goal === 'vh' ? ['Tensor', 'Hybrid', 'Klebrig'] : ['Tensor', 'Hybrid'];
      thickness = a.level === 'einsteiger' ? ['1,8', '1,9', '2,0'] : ['2,0', '2,1', '2,2', '2,3', 'max'];
      why.push(
        types.includes('Klebrig')
          ? 'Für spinbetontes Vorhandspiel auf hohem Niveau kommen auch Hybrid- und klebrige Beläge in Frage.'
          : 'Tensor- und Hybridbeläge erzeugen viel Rotation bei moderatem Krafteinsatz.',
      );
  }
  if (a.level === 'einsteiger' && a.style !== 'abwehr') {
    thickness = ['1,5', '1,6', '1,7', '1,8', '1,9', '2,0'];
    why.push('Als Einsteiger profitierst du von 1,8–2,0 mm: genug Tempo, aber deutlich mehr Kontrolle als „max“.');
  }
  if (a.goal === 'rh') {
    base -= 1;
    why.push('Auf der Rückhand darf es eine Härtestufe weicher sein – das erleichtert kurze Bewegungen und Blocks.');
  }
  if (a.pref === 'kontrolle') base -= 0.75;
  if (a.pref === 'tempo') base += 0.75;
  const lo = clamp(Math.floor(base));
  const hi = clamp(Math.ceil(base));
  why.push(`Empfohlene Härte: ${H[lo]}${hi !== lo ? ` bis ${H[hi]}` : ''} – passend zu Niveau und Vorliebe.`);
  const hq = H.slice(lo, hi + 1)
    .map(encodeURIComponent)
    .join('~');
  return { cat: 'belaege', types, hardness: [lo, hi], thickness, why, query: `/c/belaege?typ=${encodeURIComponent(types.join('~'))}&haerte=${hq}` };
}

function match(profile: Profile): Product[] {
  if (profile.cat === 'hoelzer') {
    return inCat('hoelzer')
      .filter((p) => p.sub === 'alle' && (!profile.materials || profile.materials.includes(p.specs.material ?? '')))
      .sort((a, b) => Number(b.inStock) - Number(a.inStock) || Number(!!b.specs.weight) - Number(!!a.specs.weight))
      .slice(0, 8);
  }
  const target = profile.hardness ? (profile.hardness[0] + profile.hardness[1]) / 2 : null;
  const idx = (p: Product) => (p.specs.hardnessClass ? HARDNESS_CLASSES.indexOf(p.specs.hardnessClass as (typeof HARDNESS_CLASSES)[number]) : null);
  return inCat('belaege')
    .filter((p) => profile.types!.includes(p.specs.rubberType ?? ''))
    .filter((p) => !profile.thickness || !p.specs.thicknesses?.length || p.specs.thicknesses.some((t) => profile.thickness!.includes(t)))
    .map((p) => ({ p, d: target === null ? 0 : idx(p) === null ? 1.6 : Math.abs(idx(p)! - target) }))
    .filter((x) => target === null || x.d <= 1.6)
    .sort((a, b) => a.d - b.d || Number(b.p.inStock) - Number(a.p.inStock))
    .slice(0, 8)
    .map((x) => x.p);
}

export default function Advisor() {
  const [a, setA] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const done = step >= QUESTIONS.length;
  const profile = useMemo(() => (done ? buildProfile(a as Required<Answers>) : null), [done, a]);
  const items = useMemo(() => (profile ? match(profile) : []), [profile]);
  const q = QUESTIONS[step];
  usePageMeta(
    'Material-Berater: Welcher Belag, welches Holz passt zu mir?',
    'In vier Fragen zur passenden Belag- oder Holzempfehlung – mit Begründung und passenden Artikeln vom Tischtennis-Fachhändler.',
  );

  return (
    <div className="container-x pb-16">
      <Breadcrumbs items={[{ to: '/', label: 'Startseite' }, { to: '/ratgeber', label: 'Ratgeber' }, { label: 'Material-Berater' }]} />
      <div className="max-w-3xl">
        <h1 className="h1">Material-Berater.</h1>
        <p className="mt-3 text-[17px] leading-snug text-muted sm:text-[19px]">Vier Fragen, eine nachvollziehbare Empfehlung – mit passenden Artikeln aus unserem Sortiment.</p>
      </div>

      {/* Fortschritt */}
      <div className="mt-5 flex max-w-3xl gap-1.5" aria-hidden>
        {QUESTIONS.map((x, i) => (
          <span key={x.key} className={cx('h-1.5 flex-1 rounded-full', i < step || done ? 'bg-ink' : i === step ? 'bg-red' : 'bg-line')} />
        ))}
      </div>

      {!done && q && (
        <div className="mt-6 max-w-3xl">
          <div className="num text-[12.5px] text-muted">
            Frage {step + 1} von {QUESTIONS.length}
          </div>
          <h2 className="h2 mt-1">{q.title}</h2>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {q.options.map((o) => {
              const on = a[q.key] === o.v;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => {
                    setA({ ...a, [q.key]: o.v });
                    setStep(step + 1);
                  }}
                  className={cx('flex items-start gap-3 rounded-lg border p-4 text-left transition-colors', on ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-ink')}
                >
                  <span className={cx('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2', on ? 'border-ink bg-ink text-white' : 'border-line-2')}>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold">{o.label}</span>
                    <span className="block text-[13px] text-muted">{o.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="mt-4 inline-flex items-center gap-1 text-[13.5px] text-info hover:underline">
              <ArrowLeft size={15} /> Zurück
            </button>
          )}
        </div>
      )}

      {done && profile && (
        <div className="mt-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-[22px] bg-panel p-6">
              <div className="overline">Deine Empfehlung</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.types?.map((t) => (
                  <Tag key={t} tone="dark">
                    {t}
                  </Tag>
                ))}
                {profile.materials?.map((t) => (
                  <Tag key={t} tone="dark">
                    {t}
                  </Tag>
                ))}
                {profile.hardness && <Tag>{H[profile.hardness[0]] === H[profile.hardness[1]] ? H[profile.hardness[0]] : `${H[profile.hardness[0]]} – ${H[profile.hardness[1]]}`}</Tag>}
                {profile.thickness && (
                  <Tag>
                    {profile.thickness[0] === 'OX'
                      ? 'OX – 1,5 mm'
                      : `${profile.thickness[0]} – ${profile.thickness[profile.thickness.length - 1]}${/\d/.test(profile.thickness[profile.thickness.length - 1]) ? ' mm' : ''}`}
                  </Tag>
                )}
              </div>
              <ul className="mt-4 space-y-2 text-[14px] text-ink-2">
                {profile.why.map((w) => (
                  <li key={w} className="flex gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-ok" /> {w}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={profile.query} className="btn btn-dark btn-sm">
                  Alle passenden Artikel <ArrowRight size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setA({});
                    setStep(0);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  <RotateCcw size={14} /> Neu starten
                </button>
              </div>
            </div>
            <div className="panel h-fit p-5 text-[14px]">
              <div className="font-semibold">Zweite Meinung gewünscht?</div>
              <p className="mt-1 text-ink-2">Unsere Empfehlung ist eine Orientierung. Am Telefon finden wir gemeinsam das Material, das wirklich zu dir passt.</p>
              <a href={SHOP.phoneHref} className="btn btn-outline btn-sm mt-3">
                <Phone size={14} /> {SHOP.phone}
              </a>
              <Link to="/konfigurator" className="mt-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-info hover:underline">
                <Wrench size={14} /> Direkt Schläger zusammenstellen
              </Link>
            </div>
          </div>
          <h2 className="h2 mt-8">Passende Artikel ({items.length})</h2>
          {items.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
                <li key={p.id} className="flex flex-col">
                  <ProductCard p={p} className="w-full flex-1" />
                  {suitability(p) && <div className="mt-1 px-1 text-[12px] text-muted">{suitability(p)!.style}</div>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[14px] text-muted">Keine exakten Treffer – über „Alle passenden Artikel“ findest du die nächstliegenden Beläge.</p>
          )}
        </div>
      )}
    </div>
  );
}
