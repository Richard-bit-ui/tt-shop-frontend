/**
 * TT-Shop-Assistent – regelbasierter Shop-Chatbot.
 * Antwortet ausschließlich aus vorhandenen Daten: Katalog, Shop-Regeln (Versand, Rabatte, Montage,
 * Zahlung, Widerruf), Glossar und Ratgeber. Nichts wird erfunden; abgeleitete Einordnungen sind
 * als solche gekennzeichnet. Unklare Fälle gehen an die persönliche Fachberatung.
 */
import { BRANDS, CATEGORIES, formatPrice, getProduct, inCat, products, search, SHOP, specLine, thicknessRange, type CatId, type Product } from './catalog';
import { pairPrice, suitability, type Level } from './advice';
import { GLOSSARY, GUIDES } from './guides';
import { deliveryWindow } from './delivery';

export interface BotLink {
  label: string;
  to: string;
}
export interface BotReply {
  text: string;
  products?: string[];
  links?: BotLink[];
  chips?: string[];
  /** Artikel, auf den sich Folgefragen („Passt der für Einsteiger?“) beziehen */
  context?: string;
}
export interface BotContext {
  lastProduct?: string;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[„“"!?.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const any = (t: string, ...re: RegExp[]) => re.some((r) => r.test(t));

export const START_CHIPS = ['Belag für Offensivspieler', 'Holz für Einsteiger', 'Versandkosten', 'Was kostet die Montage?', 'Rabatt ab 2 Belägen', 'Mit einem Menschen sprechen'];

const STOP = new Set(
  'ich du er sie es wir ihr habe hast hat haben eine einen einem einer ein frage fragen zu zum zur der die das den dem des fuer mit und oder gibt es habt suche suchen brauche brauchen welche welcher welches mir mich bitte zeig zeige zeigen kann koennt koennen ist sind was wie gut gute guten neuen neue info infos ueber von am im in auf noch mal einfach'.split(
    ' ',
  ),
);
/** Freitext auf die Suchbegriffe reduzieren („Ich habe eine Frage zu Xiom Vega“ → „xiom vega“) */
const keywords = (t: string) =>
  t
    .split(' ')
    .filter((w) => w.length > 1 && !STOP.has(w))
    .join(' ');

const TITLES = [...products].map((p) => ({ p, n: norm(p.title) })).sort((a, b) => b.n.length - a.n.length);
/** Artikel, der im Text namentlich genannt wird (längster Treffer gewinnt) */
function mentioned(t: string): Product | null {
  for (const { p, n } of TITLES) if (n.length > 5 && t.includes(n)) return p;
  for (const { p, n } of TITLES) {
    const words = n.split(' ').filter((w) => w.length > 2);
    if (words.length >= 2 && words.slice(0, 3).every((w) => t.includes(w))) return p;
  }
  return null;
}

const THICKNESS_RULE =
  'Faustregel aus unserem Ratgeber:\n• 1,5–1,8 mm: Kontrolle, Abwehr, Einsteiger\n• 2,0 mm: der Allrounder für die meisten Vereinsspieler\n• max: maximales Tempo für Offensivspieler';

const CONTACT: BotReply = {
  text: `Gern verbinde ich dich mit unserer Fachberatung:\n**Telefon:** ${SHOP.phone} (${SHOP.hours})\n**E-Mail:** ${SHOP.email}\n**Fachgeschäft:** ${SHOP.address.slice(1).join(', ')}`,
  links: [
    { label: `Anrufen: ${SHOP.phone}`, to: SHOP.phoneHref },
    { label: 'E-Mail schreiben', to: `mailto:${SHOP.email}` },
  ],
};

/* ---------------- Erkennung von Kategorie, Niveau, Stil ---------------- */
const CAT_WORDS: [CatId, RegExp][] = [
  ['belaege', /(belag|belaege|belages|gummi|rubber|\btensor|\bhybrid|noppen|\banti\b)/],
  ['hoelzer', /(holz\b|hoelzer|holzes|blade|carbon|\balc\b|\bzlc\b)/],
  ['schlaeger', /(schlaeger|kelle\b|racket)/],
  ['baelle', /(\bball\b|baelle|\bballs\b)/],
  ['tische', /(\btisch\b|\btische\b|platte\b|platten\b)/],
  ['roboter', /\b(roboter|ballmaschine|robo)\b/],
  ['schuhe', /\b(schuh|schuhe)\b/],
  ['bekleidung', /\b(trikot|shirt|hose|short|bekleidung|socken|jacke)\b/],
  ['zubehoer', /\b(kleber|reiniger|kantenband|huelle|koffer|tasche|netz)\b/],
];
function detectCat(t: string): CatId | null {
  for (const [c, re] of CAT_WORDS) if (re.test(t)) return c;
  return null;
}
function detectLevel(t: string): Level | null {
  if (any(t, /anfaeng|einsteig|beginner|anfang|hobby|kind|jugend|neu im verein/)) return 'Einsteiger';
  if (any(t, /fortgeschritten|aufsteig|mittel|vereinsspieler|kreisliga/)) return 'Fortgeschrittene';
  if (any(t, /profi|leistung|turnier|oberliga|verbandsliga|landesliga|bezirks|schnellste/)) return 'Leistungsspieler';
  return null;
}
type Style = 'OF' | 'AR' | 'DEF' | 'STOER';
function detectStyle(t: string): Style | null {
  if (any(t, /noppen|stoer|block|anti/)) return 'STOER';
  if (any(t, /abwehr|defens|unterschnitt|def\b/)) return 'DEF';
  if (any(t, /allround|kontroll|sicher/)) return 'AR';
  if (any(t, /offensiv|angriff|topspin|tempo|schnell|power|spin\b|of\b/)) return 'OF';
  return null;
}
function detectMaxPrice(t: string): number | null {
  const m = t.match(/(?:unter|bis|max(?:imal)?|hoechstens|weniger als|budget)\s*(\d{1,4})/) ?? t.match(/(\d{1,4})\s*(?:€|euro|eur)\b/);
  return m ? Number(m[1]) : null;
}

function styleMatch(p: Product, style: Style | null): boolean {
  if (!style) return true;
  const s = suitability(p);
  if (!s) return false;
  if (style === 'OF') return /^OF/.test(s.code) || /OF/.test(s.code);
  if (style === 'AR') return /AR/.test(s.code);
  if (style === 'DEF') return /DEF/.test(s.code);
  return /Stör|Block/.test(s.code);
}

const RUBBER_TYPE_WORDS: [string, RegExp][] = [
  ['Tensor', /\btensor/],
  ['Hybrid', /\bhybrid/],
  ['Klebrig', /klebrig|chines|sticky/],
  ['Klassisch', /klassisch/],
  ['Kurze Noppen', /kurz(e|en)? noppen|kurznoppe/],
  ['Halblange Noppen', /halblang/],
  ['Lange Noppen', /lang(e|en)? noppen|langnoppe/],
  ['Anti', /\banti\b/],
];

function recommend(t: string, cat: CatId): BotReply | null {
  const level = detectLevel(t);
  const style = detectStyle(t);
  const max = detectMaxPrice(t);
  const cheap = any(t, /guenstig|billig|preiswert|preis wert|spar/);
  const type = cat === 'belaege' ? (RUBBER_TYPE_WORDS.find(([, re]) => re.test(t))?.[0] ?? null) : null;
  const hard = cat === 'belaege' ? (any(t, /\bhart|hard/) ? 'hart' : any(t, /weich|soft/) ? 'weich' : null) : null;
  const outdoor = cat === 'tische' ? (any(t, /outdoor|draussen|garten|wetterfest/) ? true : any(t, /indoor|drinnen|keller|halle/) ? false : null) : null;
  const material = cat === 'hoelzer' ? (any(t, /\bzlc/) ? 'ZLC' : any(t, /\balc/) ? 'ALC' : any(t, /carbon/) ? 'Carbon' : any(t, /allholz|vollholz/) ? 'Allholz' : null) : null;
  const kids = any(t, /kind|jugend|junior/);
  if (!level && !style && !max && !cheap && !type && !hard && outdoor === null && !material && !kids) return null;

  let list = inCat(cat);
  if (type) list = list.filter((p) => p.specs.rubberType === type);
  if (material) list = list.filter((p) => (material === 'Carbon' ? /Carbon|ALC|ZLC/.test(p.specs.material ?? '') : p.specs.material === material));
  if (kids && list.some((p) => p.sub === 'kinder')) list = list.filter((p) => p.sub === 'kinder');
  else if (level && (cat === 'belaege' || cat === 'hoelzer'))
    list = list.filter((p) => suitability(p)?.level === level || (level === 'Leistungsspieler' && suitability(p)?.level === 'Fortgeschrittene' && /OF\+/.test(suitability(p)?.code ?? '')));
  if (style) list = list.filter((p) => styleMatch(p, style));
  if (hard === 'hart') list = list.filter((p) => (p.specs.hardness ?? 0) >= 47 || /Hard|Medium\+/.test(p.specs.hardnessClass ?? ''));
  if (hard === 'weich') list = list.filter((p) => (p.specs.hardness ?? 99) <= 42 || /Soft|Medium-/.test(p.specs.hardnessClass ?? ''));
  if (outdoor !== null) list = list.filter((p) => (p.specs.usage === 'Outdoor') === outdoor);
  if (max) list = list.filter((p) => p.price <= max);
  list = [...list].sort((a, b) => Number(b.inStock) - Number(a.inStock) || (cheap ? a.price - b.price : 0));

  const catName = { belaege: 'Beläge', hoelzer: 'Hölzer', schlaeger: 'Schläger', baelle: 'Bälle', tische: 'Tische', roboter: 'Roboter', schuhe: 'Schuhe', bekleidung: 'Artikel', zubehoer: 'Artikel' }[
    cat
  ];
  const crit = [
    type,
    material,
    kids ? 'für Kinder' : level && `für ${level}`,
    style && { OF: 'offensiv', AR: 'Allround', DEF: 'Abwehr', STOER: 'Stör- und Blockspiel' }[style],
    hard,
    outdoor === true ? 'Outdoor' : outdoor === false ? 'Indoor' : null,
    max && `bis ${formatPrice(max)}`,
    cheap && 'günstigste zuerst',
  ]
    .filter(Boolean)
    .join(', ');
  const sp = new URLSearchParams();
  if (type) sp.set('typ', type);
  if (material && material !== 'Carbon') sp.set('material', material);
  if (level && !kids && (cat === 'belaege' || cat === 'hoelzer')) sp.set('niveau', level);
  if (max) sp.set('preis', `_${max}`);
  if (outdoor !== null) sp.set('einsatz', outdoor ? 'Outdoor' : 'Indoor');
  const url = kids && list.every((p) => p.sub === 'kinder') ? `/c/${cat}/kinder` : `/c/${cat}${sp.toString() ? `?${sp}` : ''}`;

  if (!list.length) {
    return {
      text: `Für „${crit}“ finde ich leider keine passenden ${catName}. Lockere ein Kriterium – oder ruf uns an, wir beraten dich persönlich.`,
      links: [{ label: `Alle ${catName} ansehen`, to: `/c/${cat}` }],
      chips: ['Mit einem Menschen sprechen', 'Material-Berater starten'],
    };
  }
  const usesSuit = Boolean((level && !kids) || style) && (cat === 'belaege' || cat === 'hoelzer');
  return {
    text: `${list.length === 1 ? `Ich habe **1 passenden Artikel** gefunden (${crit}):` : list.length <= 6 ? `Ich habe **${list.length} ${catName}** gefunden (${crit}):` : `Hier sind 6 von **${list.length} ${catName}** (${crit}):`}${usesSuit ? '\nDie Einordnung nach Spielstil und Niveau ist unsere TT-Shop-Orientierung, abgeleitet aus Belagart und Härte bzw. Holzklasse – keine Herstellerangabe.' : ''}`,
    products: list.slice(0, 6).map((p) => p.id),
    links: [{ label: `Alle ${list.length} ${catName} anzeigen`, to: url }],
    chips:
      cat === 'belaege'
        ? ['Welche Schwammstärke passt?', 'Was ist Tensor?', 'Rabatt ab 2 Belägen']
        : cat === 'hoelzer'
          ? ['Was ist ALC?', 'Welche Griffform?', 'Schläger konfigurieren']
          : ['Versandkosten', 'Mit einem Menschen sprechen'],
  };
}

/* ---------------- Artikel-Bezug ---------------- */
function productSummary(p: Product): BotReply {
  const s = suitability(p);
  const specs = specLine(p);
  const pair = pairPrice(p);
  const d = deliveryWindow(p);
  const lines = [
    `**${p.title}** – ${formatPrice(p.price)}${pair ? ` · ${pair.label}` : ''}`,
    specs.length ? specs.join(' · ') : null,
    p.specs.thicknesses?.length ? `Schwammstärken: ${thicknessRange(p.specs.thicknesses)}${p.specs.colors?.length ? ` · Farben: ${p.specs.colors.join(', ')}` : ''}` : null,
    s ? `TT-Shop-Einordnung: **${s.code}** – ${s.style}, für ${s.level}. ${s.note} (abgeleitet, keine Herstellerangabe)` : null,
    `${p.inStock ? 'Auf Lager' : 'Versandfertig in 2–5 Werktagen'} – Lieferung voraussichtlich ${d.label}.`,
  ].filter(Boolean);
  return {
    text: lines.join('\n'),
    products: [p.id],
    chips:
      p.cat === 'belaege'
        ? ['Passt der für Einsteiger?', 'Welche Schwammstärke?', 'Ähnliche Beläge', 'Montage möglich?']
        : p.cat === 'hoelzer'
          ? ['Passt das für Einsteiger?', 'Welche Beläge passen dazu?', 'Ähnliche Hölzer']
          : ['Ähnliche Artikel', 'Versandkosten'],
    context: p.id,
  };
}

function followUp(t: string, p: Product): BotReply | null {
  const s = suitability(p);
  const lvl = detectLevel(t);
  if (lvl && any(t, /passt|geeignet|fuer|gut|taugt|empfehl/)) {
    if (!s) return { text: `Für ${p.title} haben wir keine Einordnung nach Spielniveau. Am besten rufst du uns kurz an: ${SHOP.phone}.`, context: p.id };
    const fit = s.level === lvl || (lvl === 'Leistungsspieler' && s.level === 'Fortgeschrittene');
    const alt = !fit
      ? inCat(p.cat)
          .filter((x) => suitability(x)?.level === lvl && x.id !== p.id && x.inStock)
          .slice(0, 4)
      : [];
    return {
      text: fit
        ? `Ja – nach unserer Einordnung passt ${p.title} zu **${lvl}** (${s.code}, ${s.style}). ${s.note}`
        : `Eher nicht ideal: Wir ordnen ${p.title} für **${s.level}** ein (${s.code}). ${s.note}${alt.length ? `\nFür ${lvl} wären diese eine gute Wahl:` : ''}`,
      products: alt.map((x) => x.id),
      chips: ['Welche Schwammstärke?', 'Mit einem Menschen sprechen'],
      context: p.id,
    };
  }
  if (any(t, /staerke|dicke|mm\b|schwamm/) && p.cat === 'belaege') {
    return {
      text: `${p.title} gibt es in ${thicknessRange(p.specs.thicknesses) ?? 'verschiedenen Stärken'}. ${THICKNESS_RULE}`,
      links: [{ label: 'Ratgeber: Härte & Stärke', to: '/ratgeber/haerte-und-staerke' }],
      context: p.id,
    };
  }
  if (any(t, /aehnlich|alternativ|vergleichbar|statt/)) {
    const same = inCat(p.cat).filter((x) => x.id !== p.id && (x.specs.rubberType ? x.specs.rubberType === p.specs.rubberType : x.sub === p.sub) && suitability(x)?.code === s?.code);
    const list = (same.length ? same : inCat(p.cat).filter((x) => x.id !== p.id && x.sub === p.sub)).slice(0, 6);
    return { text: `Ähnlich wie ${p.title}${s ? ` (${s.code})` : ''}:`, products: list.map((x) => x.id), context: p.id };
  }
  if (any(t, /beleag|belaege passen|dazu passen|kombin/) && p.cat === 'hoelzer') {
    return {
      text: `Im Schläger-Konfigurator kannst du ${p.title} direkt mit zwei Belägen kombinieren – wir montieren inklusive Kantenband für 2,00 €.`,
      links: [{ label: 'Mit diesem Holz konfigurieren', to: `/konfigurator?holz=${p.id}` }],
      context: p.id,
    };
  }
  if (any(t, /montage|aufkleb|montier/)) {
    return {
      text: `Ja. ${p.cat === 'belaege' ? 'Bestell den Belag zusammen mit einem Holz' : 'Bestell das Holz zusammen mit zwei Belägen'} und wähle „Montage“ (2,00 € inkl. Kantenband). Am einfachsten geht es im Schläger-Konfigurator.`,
      links: [{ label: 'Zum Schläger-Konfigurator', to: p.cat === 'hoelzer' ? `/konfigurator?holz=${p.id}` : `/konfigurator?vh=${p.id}` }],
      context: p.id,
    };
  }
  if (any(t, /liefer|wann|versand/)) {
    const d = deliveryWindow(p);
    return { text: `${p.title}: ${p.inStock ? 'auf Lager' : 'versandfertig in 2–5 Werktagen'}, Lieferung voraussichtlich **${d.label}** (${d.method}).`, context: p.id };
  }
  if (any(t, /preis|kostet|teuer/)) {
    const pair = pairPrice(p);
    return { text: `${p.title} kostet ${formatPrice(p.price)}${pair ? ` – ${pair.label}` : ''}.`, products: [p.id], context: p.id };
  }
  return null;
}

/* ---------------- Hauptfunktion ---------------- */
export function answer(input: string, ctx: BotContext = {}): BotReply {
  const t = norm(input);
  if (!t) return { text: 'Wobei kann ich helfen?', chips: START_CHIPS };

  if (/^(hallo|hi|hey|moin|servus|guten (tag|morgen|abend)|gruess)/.test(t) && t.split(' ').length <= 4) {
    return { text: 'Hallo! Frag mich nach Material, Versand, Rabatten oder Montage – oder beschreib dein Spiel, dann schlage ich passende Artikel vor.', chips: START_CHIPS };
  }
  if (/^(danke|vielen dank|super|top|perfekt|ok|okay)/.test(t)) return { text: 'Gern geschehen! Sag Bescheid, wenn ich noch etwas nachschauen soll.', chips: ['Mit einem Menschen sprechen'] };

  if (any(t, /mensch|mitarbeiter|berater(in)?\b|anrufen|telefon|kontakt|e ?mail|erreich|oeffnungszeit|sprechen|beratung/) && !any(t, /material ?berater/)) return CONTACT;
  if (any(t, /meine bestellung|bestellstatus|sendungsverfolgung|tracking|wo ist mein|paket/)) {
    return { ...CONTACT, text: `Auf Bestellungen habe ich keinen Zugriff. Unsere Fachberatung hilft dir sofort weiter:\n**Telefon:** ${SHOP.phone} (${SHOP.hours})\n**E-Mail:** ${SHOP.email}` };
  }
  if (any(t, /material ?berater|berater starten/))
    return {
      text: 'Der Material-Berater stellt dir vier Fragen (Niveau, Spielstil, Schlägerteil, Budget) und zeigt passende Artikel.',
      links: [{ label: 'Material-Berater starten', to: '/berater' }],
    };

  // Folgefragen zum zuletzt besprochenen Artikel
  const last = ctx.lastProduct ? getProduct(ctx.lastProduct) : undefined;
  const refersBack = /\b(der|die|das|er|ihn|den|dieser|diesen|diese|dieses|es|dazu|davon)\b/.test(t) || t.split(' ').length <= 3;
  const otherCat = detectCat(t);
  if (last && refersBack && (!otherCat || otherCat === last.cat) && !detectMaxPrice(t)) {
    const f = followUp(t, last);
    if (f) return f;
  }

  if (any(t, /versand|porto|lieferkost|liefer(zeit|ung)|dpd|spedition|wann kommt|wie lange dauert/)) {
    return {
      text: `**Versand:** ${formatPrice(SHOP.shippingFee)} innerhalb Deutschlands, **versandkostenfrei ab ${formatPrice(SHOP.freeShippingFrom)}**.\nLagerware geht in 1–2 Werktagen mit DPD raus. Bestellungen bis 12 Uhr an Werktagen zählen noch für den aktuellen Tag.\nTische und große Artikel kommen per Spedition (5–10 Werktage).`,
      links: [{ label: 'Versand, Zahlung & Rabatte', to: '/service' }],
      chips: ['Welche Zahlarten gibt es?', 'Rabatt ab 2 Belägen'],
    };
  }
  if (any(t, /zahl|paypal|rechnung|kreditkarte|visa|mastercard|vorkasse|apple ?pay|ueberweis/)) {
    return {
      text: 'Du kannst mit **PayPal, Apple Pay, Visa, Mastercard** oder per **Vorkasse** bezahlen. Kauf auf **Rechnung** gibt es für Vereine, Schulen und öffentliche Einrichtungen.',
      links: [{ label: 'Alle Infos zu Zahlung & Versand', to: '/service' }],
    };
  }
  if (any(t, /widerruf|rueckgabe|zurueck ?schick|umtausch|retour|reklamation/)) {
    return {
      text: 'Du hast **14 Tage Widerrufsrecht**. Ausgenommen sind individuell montierte Schläger, weil sie nach deinen Wünschen angefertigt werden (§ 312g Abs. 2 Nr. 1 BGB). Den Widerruf kannst du direkt online erklären.',
      links: [{ label: 'Vertrag widerrufen', to: '/widerruf' }],
      chips: ['Mit einem Menschen sprechen'],
    };
  }
  if (any(t, /rabatt|prozent|sparen|gutschein|angebot|aktion|sale|black/)) {
    return {
      text: '**15 % Rabatt ab 2 Belägen** auf alle nicht reduzierten Beläge – reduzierte Beläge zählen für die zwei mit.\n**10 % Rabatt auf Hölzer**, die nicht reduziert sind.\nBeides wird automatisch im Warenkorb abgezogen. Dazu läuft gerade unser Sale.',
      links: [
        { label: 'Zum Sale', to: '/c/sale' },
        { label: 'Beläge ansehen', to: '/c/belaege' },
      ],
    };
  }
  if (any(t, /montage|montier|aufkleb|kleben|kantenband|versiegel|zusammenbau|zusammenstell|konfigur/)) {
    return {
      text: '**Montage: 2,00 €** – wir kleben die mitbestellten Beläge auf dein Holz, schneiden sie sauber zu und bringen ein Kantenband an.\n**Versiegelung: 2,50 € bzw. 5,00 €** – schützt das Außenfurnier beim späteren Belagwechsel.\nAm einfachsten im Schläger-Konfigurator: Holz + Vorhand + Rückhand wählen.',
      links: [
        { label: 'Zum Schläger-Konfigurator', to: '/konfigurator' },
        { label: 'Montage-Service', to: '/montage' },
      ],
    };
  }
  if (any(t, /ittf|regel|erlaubt|zugelassen|farbe.*(seite|schwarz|rot)|(schwarz|rot).*seite|beide seiten|zwei (rote|schwarze|blaue)|(rote|schwarze) belaege|welche farbe/)) {
    return {
      text: 'Nach den Regeln muss **eine Seite schwarz** sein, die andere **hellfarbig** (rot, blau, grün, violett oder pink). Für Wettkämpfe brauchst du ITTF-zugelassene Beläge. Unser Konfigurator achtet automatisch auf die Farbregel.',
      links: [{ label: 'Ratgeber: Materialregeln', to: '/ratgeber/materialregeln' }],
    };
  }

  // Glossar
  const terms = GLOSSARY.filter((g) => new RegExp(`(^|\\s)${norm(g.term).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}($|\\s)`).test(t)).slice(0, 3);
  const term = terms[0];
  if (term && (any(t, /was (ist|sind|bedeutet|heisst)|erklaer|unterschied|bedeutung/) || t.split(' ').length <= 3)) {
    const guide = GUIDES.find((g) => norm(JSON.stringify(g)).includes(norm(term.term)));
    return {
      text: terms.map((g) => `**${g.term}:** ${g.text}`).join('\n'),
      links: [{ label: 'Zum Glossar', to: `/glossar#${encodeURIComponent(term.term)}` }, ...(guide ? [{ label: `Ratgeber: ${guide.title}`, to: `/ratgeber/${guide.slug}` }] : [])],
    };
  }

  // Frage zu einem bestimmten Artikel
  const named = mentioned(t);
  if (named) {
    const f = followUp(t, named);
    return f ?? productSummary(named);
  }
  if (any(t, /staerke|schwamm|dicke|\bmm\b/)) return { text: `Welche Schwammstärke passt? ${THICKNESS_RULE}`, links: [{ label: 'Ratgeber: Härte & Stärke', to: '/ratgeber/haerte-und-staerke' }] };

  // Empfehlung nach Kategorie + Kriterien
  const cat = detectCat(t);
  if (cat) {
    const rec = recommend(t, cat);
    if (rec) return rec;
  }
  const brand = BRANDS.find((b) => b.name.length > 2 && new RegExp(`(^|\\s)${norm(b.name)}($|\\s)`).test(t));
  if (brand) {
    const kw = keywords(t.replace(norm(brand.name), ''));
    const exact = kw ? search(`${brand.name} ${kw}`, 6) : [];
    const near = kw && !exact.length ? search(`${brand.name} ${kw.split(' ')[0]}`, 6) : [];
    const list = [...exact, ...near, ...products.filter((p) => p.brand === brand.name && (!cat || p.cat === cat))].filter((p, i, a) => a.indexOf(p) === i);
    return {
      text:
        kw && !exact.length
          ? near.length
            ? `„${kw}“ von ${brand.name} führen wir aktuell nicht. Ähnlich aus dem Sortiment:`
            : `„${kw}“ von ${brand.name} führen wir aktuell nicht. Hier ist eine Auswahl von **${brand.name}** (${brand.count} Artikel):`
          : `Von **${brand.name}** führen wir ${brand.count} Artikel, zum Beispiel:`,
      products: list.slice(0, 6).map((p) => p.id),
      links: [{ label: `Alle ${brand.name}-Artikel`, to: `/marke/${brand.slug}` }],
    };
  }
  if (cat) {
    const c = CATEGORIES.find((x) => x.id === cat)!;
    const sub = c.subs.find((sc) => t.includes(norm(sc.name).slice(0, 5)));
    const list = inCat(cat, sub?.id).sort((a, b) => Number(b.inStock) - Number(a.inStock));
    return {
      text: `${sub ? sub.name : c.name}: ${list.length} Artikel im Sortiment, zum Beispiel:`,
      products: list.slice(0, 6).map((p) => p.id),
      links: [{ label: `Alle ${sub ? sub.name : c.name} ansehen`, to: `/c/${cat}${sub ? `/${sub.id}` : ''}` }],
      chips: ['Versandkosten', 'Mit einem Menschen sprechen'],
    };
  }
  if (!cat && (detectLevel(t) || detectStyle(t))) {
    const rec = recommend(t, 'belaege');
    if (rec) return { ...rec, text: `Ich nehme an, du suchst Beläge. ${rec.text}` };
  }

  // Freie Suche
  const kw = keywords(t);
  const hits = search(input, 6).length ? search(input, 6) : kw ? search(kw, 6) : [];
  if (hits.length) {
    if (hits.length === 1) return productSummary(hits[0]);
    return {
      text: `Dazu habe ich ${hits.length >= 6 ? 'diese' : hits.length} Artikel gefunden:`,
      products: hits.map((p) => p.id),
      links: [{ label: 'Alle Suchergebnisse', to: `/suche?q=${encodeURIComponent(kw || input)}` }],
    };
  }
  return {
    text: `Da bin ich mir nicht sicher. Versuch es mit einem Produktnamen, einer Marke oder beschreib dein Spiel (z. B. „offensiver Belag für Fortgeschrittene bis 50 €“). Oder sprich direkt mit uns: ${SHOP.phone}.`,
    chips: START_CHIPS,
  };
}

export const CATALOG_SIZE = products.length;
