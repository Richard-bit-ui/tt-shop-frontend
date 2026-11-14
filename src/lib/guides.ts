import { asset } from './asset';
/**
 * Ratgeber-Inhalte (Fachwissen Tischtennis-Material). Jeder Artikel verlinkt auf passend
 * gefilterte Produktlisten, damit aus Wissen eine Kaufentscheidung wird.
 */

export interface GuideSection {
  h: string;
  p?: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
}
export interface Guide {
  slug: string;
  title: string;
  teaser: string;
  img: string;
  minutes: number;
  sections: GuideSection[];
  links: { label: string; to: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'belagarten',
    title: 'Belagarten erklärt: Tensor, Hybrid, klebrig, Noppen & Anti',
    teaser: 'Welche Belagart passt zu deinem Spielsystem? Die wichtigsten Typen mit Stärken, Schwächen und typischen Spielern.',
    img: asset('/img/lifestyle/pro-rackets-sm.webp'),
    minutes: 6,
    sections: [
      {
        h: 'Noppen innen: der Standard für Angriff und Allround',
        p: [
          'Die allermeisten Spielerinnen und Spieler nutzen auf beiden Seiten Noppen-innen-Beläge: glattes Obergummi außen, die Noppen zeigen zum Schwamm. Innerhalb dieser Gruppe unterscheiden sich die Beläge vor allem durch Schwamm und Obergummi.',
        ],
        table: {
          head: ['Typ', 'Charakter', 'Für wen?'],
          rows: [
            ['Tensor', 'Vorgespannter Schwamm mit Katapult – viel Tempo und Spin ohne eigene Kraftanstrengung', 'Moderne Topspinspieler vom Aufsteiger bis zum Leistungsbereich'],
            ['Hybrid', 'Griffiges, leicht klebriges Obergummi auf Tensor-Schwamm', 'Spieler, die viel Rotation und Kontrolle am Tisch suchen'],
            ['Klebrig', 'Klebriges Obergummi, oft härterer Schwamm nach chinesischem Vorbild', 'Kraftvolle Spieler mit hoher Schlaggeschwindigkeit, häufig auf der Vorhand'],
            ['Klassisch', 'Ohne Tensoreffekt, sehr berechenbar und kontrolliert', 'Einsteiger, Techniktraining, Allrounder und Abwehrspieler'],
          ],
        },
      },
      {
        h: 'Noppen außen: Kurz-, Halblang- und Langnoppen',
        p: [
          'Bei Noppen-außen-Belägen zeigen die Noppen zum Gegner. Je länger und weicher die Noppe, desto stärker wird gegnerische Rotation umgekehrt – und desto weniger eigenen Spin kannst du erzeugen.',
        ],
        list: [
          'Kurze Noppen: direktes, schnelles Spiel am Tisch, wenig anfällig für gegnerischen Spin. Klassisch für Kurznoppen-Angreifer und Rückhand-Blocker.',
          'Halblange Noppen: zwischen beiden Welten – störend, aber mit mehr Eigenkontrolle als Langnoppen.',
          'Lange Noppen: maximale Rotationsumkehr für Abwehr- und Störspiel. Mit oder ohne Schwamm (OX) erhältlich.',
        ],
      },
      {
        h: 'Anti und Glanti',
        p: [
          'Anti-Beläge haben ein glattes, sehr reibungsarmes Obergummi und neutralisieren gegnerischen Spin. Ein Glanti ist besonders glatt und erzeugt eine noch stärkere Rotationsumkehr. Beide werden meist auf der Rückhand im Block- und Störspiel eingesetzt.',
        ],
      },
      {
        h: 'Faustregeln aus der Beratung',
        list: [
          'Einsteiger und Aufsteiger: Tensor in Soft/Medium oder klassischer Belag, 1,8–2,0 mm.',
          'Variable Offensivspieler: Tensor Medium bis Medium+, auf der Rückhand gern eine Stufe weicher als auf der Vorhand.',
          'Wer viel Material wechseln möchte: erst nach stabiler Technik zu Noppen oder Anti greifen – das Spielgefühl ändert sich stark.',
        ],
      },
    ],
    links: [
      { label: 'Tensor-Beläge', to: '/c/belaege?typ=Tensor' },
      { label: 'Hybrid & klebrig', to: '/c/belaege?typ=Hybrid~Klebrig' },
      { label: 'Kurze Noppen', to: '/c/belaege?typ=Kurze%20Noppen' },
      { label: 'Lange Noppen', to: '/c/belaege?typ=Lange%20Noppen' },
      { label: 'Anti & Glanti', to: '/c/belaege?typ=Anti~Glanti' },
    ],
  },
  {
    slug: 'haerte-und-staerke',
    title: 'Schwammhärte & Schwammstärke richtig wählen',
    teaser: 'Was bedeuten 40°, 47,5° oder „max“? So findest du die passende Kombination für dein Niveau.',
    img: asset('/img/lifestyle/tournament-sm.webp'),
    minutes: 5,
    sections: [
      {
        h: 'Schwammhärte: Kontrolle gegen Durchschlag',
        p: [
          'Die Härte wird in Grad angegeben. Ein weicher Schwamm „schluckt“ den Ball länger – das bringt Gefühl, Kontrolle und Fehlerverzeihung. Ein harter Schwamm entfaltet erst bei hoher Schlaggeschwindigkeit sein volles Tempo und wirkt bei langsamen Schlägen eher stumpf.',
          'Wichtig: Hersteller messen auf unterschiedlichen Skalen. Europäische Angaben (EUR/ESN) liegen typischerweise mehrere Grad über japanischen, chinesische Skalen sind wieder anders. Vergleiche Härten deshalb am besten innerhalb einer Marke oder Serie.',
        ],
        table: {
          head: ['Härteklasse (EUR)', 'Bereich', 'Typischer Einsatz'],
          rows: [
            ['Soft', 'bis ca. 40°', 'Einsteiger, Rückhand, Kontrolle'],
            ['Medium-', 'ca. 41–44°', 'Aufsteiger, variable Rückhand'],
            ['Medium', 'ca. 45–47,5°', 'Breite Mitte des Vereinsspiels'],
            ['Medium+', 'ca. 48–50°', 'Ambitionierte Vorhand-Spieler'],
            ['Hard', 'über 50°', 'Leistungsspieler mit hoher Schlaggeschwindigkeit'],
          ],
        },
      },
      {
        h: 'Schwammstärke: 1,5 mm bis max',
        p: [
          'Ein dickerer Schwamm erhöht Tempo und Katapult, ein dünnerer bringt Kontrolle und ein direkteres Gefühl. „max“ bezeichnet die dickste lieferbare Stärke des jeweiligen Belags (meist 2,1–2,3 mm). Bei Langnoppen bedeutet „OX“: ohne Schwamm.',
        ],
        list: ['1,5–1,8 mm: Kontrolle, Abwehr, Einsteiger', '2,0 mm: der Allrounder für die meisten Vereinsspieler', 'max: maximales Tempo für Offensivspieler'],
      },
      {
        h: 'Gewicht nicht vergessen',
        p: [
          'Dicke und harte Schwämme sind schwerer. Zwei max-Beläge auf einem Carbonholz ergeben schnell einen kopflastigen Schläger. Wer viel Topspin aus der Halbdistanz spielt, profitiert eher von etwas leichterem Material.',
        ],
      },
    ],
    links: [
      { label: 'Beläge Soft & Medium-', to: '/c/belaege?haerte=Soft~Medium-' },
      { label: 'Beläge Medium', to: '/c/belaege?haerte=Medium' },
      { label: 'Beläge Medium+ & Hard', to: '/c/belaege?haerte=Medium%2B~Hard' },
      { label: 'Beläge in 2,0 mm', to: '/c/belaege?staerke=2,0' },
    ],
  },
  {
    slug: 'holzaufbau',
    title: 'Holzaufbau: Allholz, Carbon, ALC & ZLC – und welche Griffform?',
    teaser: 'Furnierzahl, Faserlagen und Griffform entscheiden über Tempo und Gefühl. Ein Überblick für die Holzwahl.',
    img: asset('/img/lifestyle/player-sm.webp'),
    minutes: 6,
    sections: [
      {
        h: 'Allholz: 5- oder 7-lagig',
        p: [
          'Reine Holzaufbauten bieten das meiste Ballgefühl. 5-lagige Hölzer sind flexibler und kontrollierter, 7-lagige steifer und schneller. Für Technikaufbau und variables Spiel sind Allholz-Hölzer nach wie vor erste Wahl.',
        ],
      },
      {
        h: 'Hölzer mit Faserlagen',
        table: {
          head: ['Material', 'Wirkung', 'Typischer Spieler'],
          rows: [
            ['Carbon', 'Mehr Tempo, steiferes Gefühl, großer Sweet Spot', 'Offensivspieler, die Durchschlag suchen'],
            ['ALC (Arylat-Carbon)', 'Schnell, aber etwas weicher und gefühlvoller als reines Carbon', 'Moderne Topspin-Offensive'],
            ['ZLC (Zylon-Carbon)', 'Sehr schnell und direkt', 'Leistungsspieler mit sauberer Technik'],
          ],
        },
        p: [
          'Ob die Faserlage direkt unter dem Deckfurnier („outer“) oder tiefer im Aufbau („inner“) liegt, macht einen spürbaren Unterschied: inner wirkt weicher und kontrollierter, outer direkter und schneller.',
        ],
      },
      {
        h: 'Klassen: OFF, ALL, DEF',
        list: ['OFF+ / OFF: schnelle Offensivhölzer', 'OFF- / ALL+: kontrollierte Offensive, ideal für Aufsteiger', 'ALL: Allround, viel Kontrolle', 'DEF: langsam, für Unterschnittabwehr'],
      },
      {
        h: 'Griffformen',
        list: [
          'Konkav (FL/flared): zum Griffende breiter, sitzt sicher in der Hand – die beliebteste Form.',
          'Gerade (ST/straight): erleichtert Griffwechsel, gut für Rückhand-orientierte Spieler.',
          'Anatomisch (AN): in der Mitte verdickt, füllt die Hand gut aus.',
          'Penholder: für den Stiftgriff (chinesisch oder japanisch/koreanisch).',
        ],
      },
    ],
    links: [
      { label: 'Allholz-Hölzer', to: '/c/hoelzer?material=Allholz' },
      { label: 'Carbon-Hölzer', to: '/c/hoelzer?material=Carbon' },
      { label: 'Hölzer mit konkavem Griff', to: '/c/hoelzer?griff=konkav' },
      { label: 'Penholder-Hölzer', to: '/c/hoelzer/penholder' },
    ],
  },
  {
    slug: 'kleben-und-pflege',
    title: 'Beläge kleben, Kantenband & Pflege',
    teaser: 'Schritt für Schritt zum perfekt montierten Schläger – und wie deine Beläge länger griffig bleiben.',
    img: asset('/img/lifestyle/flatlay-sm.webp'),
    minutes: 4,
    sections: [
      {
        h: 'Kleben in fünf Schritten',
        list: [
          'Holz prüfen: Neue Hölzer vorher versiegeln, damit das Deckfurnier beim späteren Belagwechsel nicht ausreißt.',
          'Kleber dünn und gleichmäßig auf Holz und Schwamm auftragen – nur zugelassene, wasserbasierte Kleber verwenden.',
          'Trocknen lassen, bis der Kleber transparent ist (Herstellerangabe beachten).',
          'Belag vom Griff aus aufrollen, Luftblasen mit einer Andruckrolle ausstreichen.',
          'Mit scharfer Schere entlang der Holzkante schneiden, Kantenband anbringen.',
        ],
      },
      {
        h: 'Pflege',
        p: [
          'Nach dem Training mit Reinigungsschaum oder Wasser und Schwamm säubern, anschließend eine Schutzfolie aufkleben. So bleibt das Obergummi länger griffig. Schläger in einer Hülle transportieren und nicht in der Sonne oder im kalten Auto liegen lassen.',
        ],
      },
      {
        h: 'Keine Lust auf Kleben?',
        p: ['Bestell Holz und Beläge zusammen und wähle die Schlägermontage – wir kleben inklusive Kantenband für 2,00 €. Den Schläger stellst du bequem im Schläger-Konfigurator zusammen.'],
      },
    ],
    links: [
      { label: 'Kleber & Montage-Zubehör', to: '/c/zubehoer/kleber' },
      { label: 'Kantenbänder', to: '/c/zubehoer/kantenbaender' },
      { label: 'Reiniger', to: '/c/zubehoer/reiniger' },
      { label: 'Versiegelung', to: '/c/zubehoer/versiegelung' },
      { label: 'Schläger-Konfigurator', to: '/konfigurator' },
    ],
  },
  {
    slug: 'materialregeln',
    title: 'Materialregeln: Was ist im Wettkampf erlaubt?',
    teaser: 'Belagfarben, maximale Dicke, zugelassene Beläge und Bälle – die wichtigsten Regeln im Überblick.',
    img: asset('/img/lifestyle/blue-table-sm.webp'),
    minutes: 4,
    sections: [
      {
        h: 'Schläger',
        list: [
          'Eine Schlägerseite muss schwarz sein, die andere in einer hellen, deutlich unterscheidbaren Farbe (rot, blau, grün, violett oder pink).',
          'Im Wettkampf sind nur Beläge erlaubt, die auf der aktuellen ITTF-Liste zugelassener Beläge stehen; Markenlogo und Zulassungszeichen müssen am Griff sichtbar sein.',
          'Noppen-innen- und Sandwichbeläge dürfen inklusive Kleber höchstens 4,0 mm dick sein, Noppen außen ohne Schwamm höchstens 2,0 mm.',
          'Das Schlägerblatt muss überwiegend aus Naturholz bestehen; Faserlagen sind innerhalb der Regeln zulässig.',
          'Lösungsmittelhaltige Kleber (Frischkleben) und nachträgliche Behandlungen des Belags („Boostern“) sind verboten.',
        ],
      },
      {
        h: 'Bälle und Tische',
        list: [
          'Wettkampfbälle: 40 mm, 2,7 g, Plastik (40+), in der Regel 3 Sterne und ITTF-zugelassen.',
          'Tisch: 274 × 152,5 cm, Höhe 76 cm, Netzhöhe 15,25 cm. Für Ligaspiele sind meist ITTF-zugelassene Tische vorgeschrieben.',
        ],
      },
      {
        h: 'Gut zu wissen',
        p: [
          'Für deinen Verband bzw. deine Liga können ergänzende Bestimmungen gelten. Im Zweifel gilt immer die aktuelle Wettspielordnung. Bei Fragen zur Zulassung einzelner Beläge beraten wir dich gern.',
        ],
      },
    ],
    links: [
      { label: 'Wettkampfbälle', to: '/c/baelle/wettkampf' },
      { label: 'ITTF-Wettkampftische', to: '/c/tische/wettkampf' },
      { label: 'Kleber (wasserbasiert)', to: '/c/zubehoer/kleber' },
    ],
  },
  {
    slug: 'tischtennisplatte-kaufen',
    title: 'Tischtennisplatte kaufen: Indoor, Outdoor oder Wettkampf?',
    teaser: 'Plattenstärke, Untergestell, Wetterfestigkeit und Platzbedarf – worauf es beim Plattenkauf ankommt.',
    img: asset('/img/lifestyle/table-racket-sm.webp'),
    minutes: 5,
    sections: [
      {
        h: 'Indoor oder Outdoor?',
        p: [
          'Indoor-Platten haben eine Spanplatte (meist 19–25 mm) mit lackierter Oberfläche – das Ballverhalten kommt dem Vereinstisch sehr nahe. Outdoor-Platten nutzen wetterfeste Melaminharz- oder Aluverbund-Platten (meist 4–10 mm) und pulverbeschichtete Gestelle. Sie springen etwas anders, halten aber Regen und Sonne stand.',
        ],
      },
      {
        h: 'Plattenstärke und Sprungverhalten',
        table: {
          head: ['Einsatz', 'Typische Stärke', 'Hinweis'],
          rows: [
            ['Outdoor-Freizeit', '4–7 mm', 'Wetterfest, gutes Freizeitspiel'],
            ['Outdoor-Premium', '8–10 mm', 'Deutlich besseres Sprungverhalten'],
            ['Indoor-Freizeit', '19–22 mm', 'Für Keller und Hobbyraum'],
            ['Indoor/Verein', '25 mm', 'ITTF-Niveau, gleichmäßiger Absprung'],
          ],
        },
      },
      {
        h: 'Ausstattung, die den Alltag erleichtert',
        list: [
          'Rollen mit Feststellbremse und Kippsicherung (EN 14468)',
          'Playback-Funktion zum Alleintraining',
          'Platzsparende Parkposition',
          'Netzgarnitur im Lieferumfang',
          'Abdeckhülle für Outdoor-Platten',
        ],
      },
      {
        h: 'Platzbedarf',
        p: [
          'Die Platte selbst misst 274 × 152,5 cm. Für entspanntes Freizeitspiel solltest du etwa 5,5 × 3,4 m einplanen, für Vereinstraining deutlich mehr. Bei ITTF-Wettbewerben beträgt die Spielfläche 14 × 7 m.',
        ],
      },
    ],
    links: [
      { label: 'Indoor-Platten', to: '/c/tische/indoor' },
      { label: 'Outdoor-Platten', to: '/c/tische/outdoor' },
      { label: 'Wettkampftische (ITTF)', to: '/c/tische/wettkampf' },
      { label: 'Abdeckhüllen', to: '/c/tische/huellen' },
    ],
  },
  {
    slug: 'tischtennisbaelle',
    title: 'Tischtennisbälle: Sterne, Plastik & Packungsgrößen',
    teaser: 'Wettkampf oder Training, mit oder ohne Naht? So findest du den richtigen Ball.',
    img: asset('/img/lifestyle/serve-sm.webp'),
    minutes: 3,
    sections: [
      {
        h: 'Plastik statt Zelluloid',
        p: [
          'Seit 2014 wird im Wettkampf mit Plastikbällen (40+) gespielt. Sie sind etwas größer und rotationsärmer als die alten Zelluloidbälle. Zelluloidbälle findest du heute fast nur noch im Freizeitbereich.',
        ],
      },
      {
        h: 'Sterne, Naht und Material',
        list: [
          '3 Sterne: höchste Qualitätsstufe, für Wettkampf und anspruchsvolles Training.',
          'Trainingsbälle (1–2 Sterne bzw. ohne Sterne): günstig in Großpackungen, ideal für Balleimer-Training und Roboter.',
          'Mit Naht oder nahtlos: Nahtlose Bälle gelten als besonders rund und gleichmäßig im Absprung.',
          'ABS: der heute verbreitete, haltbare Plastiktyp.',
        ],
      },
      {
        h: 'Tipp für Vereine',
        p: ['Großpackungen ab 72 Bällen senken den Stückpreis deutlich. Für Sammelbestellungen machen wir gern ein individuelles Angebot.'],
      },
    ],
    links: [
      { label: 'Wettkampfbälle', to: '/c/baelle/wettkampf' },
      { label: 'Trainingsbälle', to: '/c/baelle/training' },
      { label: 'Großpackungen', to: '/c/baelle?packung=ab%2049%20St%C3%BCck' },
    ],
  },
];

export const GLOSSARY: { term: string; text: string }[] = [
  { term: 'ALC', text: 'Arylat-Carbon – Faserlage in Hölzern, schnell und trotzdem gefühlvoll.' },
  { term: 'Anti', text: 'Belag mit sehr glattem Obergummi, neutralisiert gegnerischen Spin.' },
  { term: 'Deckfurnier', text: 'Äußerste Holzschicht des Schlägerblatts; prägt Härte und Gefühl.' },
  { term: 'Glanti', text: 'Besonders glattes Anti mit extrem wenig Reibung.' },
  { term: 'Griffform', text: 'Konkav, gerade, anatomisch oder Penholder – beeinflusst Halt und Griffwechsel.' },
  { term: 'Hybrid', text: 'Kombination aus griffig-klebrigem Obergummi und Tensor-Schwamm.' },
  { term: 'Kantenband', text: 'Schutzband für die Holzkante; schützt Holz und Beläge vor Beschädigungen.' },
  { term: 'Katapult', text: 'Eigenbeschleunigung eines Belags, typisch für Tensor-Schwämme.' },
  { term: 'Klasse (OFF/ALL/DEF)', text: 'Tempoeinordnung eines Holzes von offensiv bis defensiv.' },
  { term: 'LARC', text: 'Liste der von der ITTF zugelassenen Beläge (List of Authorized Racket Coverings).' },
  { term: 'max', text: 'Dickste lieferbare Schwammstärke eines Belags (meist 2,1–2,3 mm).' },
  { term: 'Noppen außen', text: 'Belag, dessen Noppen zum Gegner zeigen – kurz, halblang oder lang.' },
  { term: 'Noppen innen', text: 'Standardbelag mit glattem Obergummi außen.' },
  { term: 'Obergummi', text: 'Die Gummischicht mit den Noppen; bestimmt Griffigkeit und Spin.' },
  { term: 'OX', text: 'Noppenbelag ohne Schwamm.' },
  { term: 'Playback', text: 'Eine Tischhälfte hochgeklappt – zum Alleintraining an der Platte.' },
  { term: 'Schwammhärte', text: 'Härte des Schwamms in Grad; Skalen unterscheiden sich je nach Hersteller.' },
  { term: 'Sweet Spot', text: 'Bereich des Schlägerblatts mit optimalem Ballverhalten.' },
  { term: 'Tensor', text: 'Vorgespannter Schwamm mit Katapulteffekt.' },
  { term: 'Versiegelung', text: 'Schutzschicht auf dem Holz, verhindert Ausrisse beim Belagwechsel.' },
  { term: 'ZLC', text: 'Zylon-Carbon – sehr schnelle, direkte Faserlage.' },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
