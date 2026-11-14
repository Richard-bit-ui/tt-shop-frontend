# TT-Shop – Frontend-Prototyp

Mobile-first Prototyp für ein neues Frontend von **tt-shop.de** (Backend: OpenMage / Magento 1) – im Stil eines professionellen Fachhändlers: tiefe Navigation, technische Daten, Fachfilter, Material-Beratung, Produktvergleich und Schläger-Konfigurator.

## Online ansehen

**https://richard-bit-ui.github.io/tt-shop-frontend/**

Die Vorschau wird bei jedem Push auf `main` automatisch per GitHub Actions gebaut und auf GitHub Pages veröffentlicht (`.github/workflows/pages.yml`). Sie ist als Prototyp gekennzeichnet, für Suchmaschinen gesperrt (`noindex`) und löst keine Bestellungen aus.

## Starten

Voraussetzung: Node.js ≥ 23 (getestet mit 24).

```bash
npm install
npm run dev
```

Dann im Browser öffnen: **http://localhost:5173**

**Auf dem Handy testen:** Der Dev-Server lauscht auch im WLAN. Die Adresse steht im Terminal unter `Network:` (z. B. `http://192.168.x.x:5173`). Windows fragt beim ersten Start ggf. nach einer Firewall-Freigabe – „Private Netzwerke“ erlauben. Im AR-Dialog am Desktop erscheint ein QR-Code mit genau dieser Adresse.

Produktions-Build: `npm run build` und danach `npm run preview` (Port 4173). Typprüfung: `npm run typecheck`. Für die GitHub-Pages-Variante setzt der Workflow `GH_PAGES_BASE=/tt-shop-frontend/` (Unterordner) und `VITE_PUBLIC_PREVIEW=1` (Prototyp-Hinweis, `noindex`).

## Was drin ist

Ausgerichtet auf ambitionierte Spieler, Vereine und Trainer. Design im Stil des Apple Store (hellgraue Flächen, weiße Karten, zweifarbige Überschriften, Glas-Navigation) kombiniert mit der Informationstiefe eines Fachhändlers. Die zugrunde liegende Analyse von Apple, Nike, On und TT-Fachshops steht in [docs/UX-Analyse.md](docs/UX-Analyse.md).

| Bereich | Highlights |
|---|---|
| **Startseite** | Herofläche „Black Weeks“ mit echten reduzierten Artikeln, Kategoriereihe, Promo-Kacheln (Konfigurator, Material-Berater), Belag-Finder mit Live-Trefferzahl, „Der TT-Shop-Unterschied“, Marken-Laufband, Ratgeber, Vereinsservice |
| **Navigation & Suche** | Header am Desktop in einer Zeile (Logo, Kategorien, Suche, Icons) mit Apple-artigen Flyout-Menüs, Handy-Menü mit großen Links, schmale Servicezeile mit wechselnden Vorteilen, Kategorieleiste mit Megamenüs (Belagart, Härte, Schwammstärke, Marken, Serien – mit Trefferzahlen), Marken A–Z, mobiles Drill-down-Menü. Schnellsuche (auch `Strg + K`) mit Produkten, Kategorien, Marken **und Wissen** (Glossar, Ratgeber), Tippfehler-Korrektur („Meintest du …?“), findet auch „malin“ → „Ma Lin“ |
| **Kategorien** | Facettenfilter je Kategorie (Beläge: Belagart, Härteklasse, Schwammhärte in ° als Bereich, Schwammstärke, Farbe, Spielniveau, Eignung, Marke, Serie, Spielertyp; Hölzer: Material, Griffform, Furniere, Klasse, Gewicht, Bauform …), disjunktive Trefferzahlen, Filter in der URL, Schnellfilter-Chips, Raster- **und Tabellenansicht** mit sortierbaren technischen Spalten, Schnellansicht |
| **Produktkarten** | Store-Karte mit Farbpunkten, TT-Shop-Einordnung (z. B. „OF+“), Belagart/Härte/Stärken, Paarpreis „ab 2 Belägen je …“, Lagerstatus, Merken & Vergleichen, „+“ für die Schnellansicht |
| **Produktseite** | Mitlaufende Galerie mit Zoom-Lightbox, Auswahl-Kacheln im Apple-Stil („Farbe. Welche soll es sein?“, „Enthalten“ / „+ 2,00 €“, gesperrte Kombinationen mit Grund), „Die Highlights.“ (nur vorhandene Daten), Abschnittsleiste mit festem Kaufen-Button, „Hilfe beim Einkauf.“, Größenwahl mit getrennter Ausführung (Schuhe, Socken), Griffform, Montage (+2,00 €) und Versiegelung (+2,50/+5,00 €) mit Pflichtfeld-Prüfung, Einordnung mit leichteren Alternativen, Datenblatt mit Härte-Skala und Variantenmatrix, Serienvergleich, „Passend dazu“ (Montagezubehör), Lieferdatum mit **Live-Countdown bis 12 Uhr**, Teilen, zuletzt angesehen, schema.org-Produktdaten |
| **Material-Berater** | 4 Fragen (Spielstärke, Spielstil, Schlägerteil, Budget) → Profil, passende Artikel, Link auf die gefilterte Liste |
| **Profi-Setups** | Alle Spieler-Schläger aus dem Sortiment mit Kurzporträt und den wählbaren Belägen |
| **Ratgeber & Glossar** | 7 Kaufberatungen (Belagarten, Härte & Stärke, Holzaufbau, Kleben & Pflege, Materialregeln, Platten, Bälle) mit Tabellen und passenden Filter-Links, Glossar A–Z, Montage-Service-Seite, Vereinsservice mit Anfrageformular |
| **Produktvergleich** | Bis zu 4 Artikel je Kategorie nebeneinander, „Nur Unterschiede“, Vergleichsleiste am unteren Rand |
| **Schläger-Konfigurator** | Kaufablauf im Apple-Stil (Holz → Griff → Vorhand → Rückhand → Service) mit **eigener 3D-Vorschau** (Belagfarben, Schwammstärke, Furniere, Griffform und Kantenband live), Farbregel wird automatisch eingehalten, „Gleicher Belag wie Vorhand“, Hilfe pro Schritt, Zusammenfassung „Stimmt alles?“, animierte Preise, Konfiguration als Link teilbar, im Warenkorb nachträglich bearbeitbar |
| **Chat-Assistent** | „Fragen?“ unten rechts: lokaler Assistent, der nur aus Katalog, Shop-Regeln, Glossar und Ratgebern antwortet (Produktempfehlungen nach Niveau, Stil, Budget; Versand, Rabatte, Montage, Zahlung, Widerruf; Folgefragen zum Artikel; Übergabe an Telefon/E-Mail). Kein Server, keine Kosten, kein gespeicherter Verlauf |
| **Warenkorb & Kasse** | „Dein Warenkorb: 89,70 €.“, FAQ unter dem Warenkorb, Rabattlogik von tt-shop.de (10 % Hölzer, 15 % ab 2 Belägen), Hinweis „noch ein Belag = 15 %“, Montage nachträglich buchbar, Konfigurationen gruppiert, **Materialliste per Link teilen** (z. B. Trainer → Spieler) und **als Angebot drucken** (für Vereinskasse/Schule), Gast-Checkout mit Validierung |
| **Rechtliches DE** | inkl. MwSt./zzgl. Versand, UVP-Kennzeichnung, Grundpreis, Lieferdatum, Widerrufsbutton (§ 356a BGB), Hinweis zum Widerrufsausschluss bei individuell montierten Schlägern (§ 312g Abs. 2 Nr. 1 BGB) |
| **Tische** | Kompakte 3D-Ansicht mit Maßen und Klappstellungen + AR („In deinem Raum“) direkt auf der Produktseite |
| **Qualität** | Lighthouse (mobil, Produktions-Build): Accessibility 100, Best Practices 100, SEO 100 auf Start-, Kategorie-, Produkt- und Konfiguratorseite; CLS 0. Alle 40 geprüften Seiten ohne seitliches Überlaufen auf 375 px und 1440 px. Tastaturbedienung, Skip-Link, ARIA in Menüs/Dialogen, Seitentitel und Meta-Beschreibung je Seite |

## Daten & OpenMage-Anbindung

- **Prototyp-Daten:** 792 echte Artikel aus tt-shop.de, Stand 13.11.2026: 254 Beläge, 218 Hölzer, 70 Schläger, 79 Tische, 30 Bälle, 12 Roboter, 16 Schuhe, 42 Bekleidung, 71 Zubehör – mit Varianten, Service-Optionen und Preisen.
  - `src/data/catalog.json` – Kerndaten (wird sofort geladen)
  - `src/data/options.json` – Varianten & Services (lädt im Hintergrund nach)
  - `src/data/details.json` – Beschreibungstexte (lädt auf der Produktseite nach)
  - Bilder in `public/img/p/` als WebP (1200 px) plus Vorschaubilder `-t.webp` (480 px)
- **Produktbilder:** `node scripts/normalize-images.mjs` schneidet weiße Ränder ab und setzt jedes freigestellte Produkt mit gleichem Abstand auf eine quadratische Fläche (Fotos mit eigenem Hintergrund bleiben unverändert). Die Originale liegen in `img-original/`.
- **Marken-Logos:** aus den Shop-Medien von tt-shop.de (`public/img/brands/`, Zuordnung in `src/lib/brandLogos.ts`).
- **Import:** Die Produktseiten liegen hinter einer Bot-Protection. Die Rohdaten wurden deshalb normal im Browser gesammelt (`scripts/collect-in-browser.js` → `scripts/raw-catalog-v3.json`). `npm run import:shop` erzeugt daraus die JSON-Dateien und lädt/verkleinert fehlende Bilder. Die Belagart stammt aus den Unterkategorien des Shops (`scripts/rubber-types.json`) und einer Serien-Zuordnung im Import-Skript.
- **Live-Betrieb:** Die OpenMage-REST-API (`/api/rest/products`) ist vorhanden, antwortet für Gäste aber mit `403`. Eine Vorlage für das Mapping liegt in `src/api/openmage.ts`. Zum Freischalten:
  1. OpenMage-Admin → System → Web Services → REST-Rollen → Guest: Produkte/Kategorien **nur lesen**
  2. REST-Attribute für Guest freigeben (Name, Preis, Bilder, Lagerstatus …)
  3. Warenkorb/Checkout über einen kleinen Backend-for-Frontend mit OAuth – nie mit Admin-Zugang im Browser
- **Shop-Regeln** wurden von tt-shop.de übernommen: Versand 5,90 €, ab 69 € frei, DPD, Tische 5–10 Werktage per Spedition, Bestellschluss 12 Uhr, Zahlarten, Rabattsystem, Kontakt.

## Bilder & Lizenzen

- Produktbilder und Logo: tt-shop.de (eigene Inhalte des Shops)
- Lifestyle-Fotos: Unsplash und Pexels, beide lizenzfrei für kommerzielle Nutzung, Liste in `src/data/credits.json`. Neu: Netz (Kyle Vaughn), Profi-Schläger (Mattias Banguese) und Turnier-Aufschlag (Marcus Clark), alle Unsplash.
- 3D-Schläger: eigene, prozedurale Geometrie (`src/three/racketModel.ts`), keine fremden Modelle. Ein auf dem Rechner gefundenes Schlägermodell ist nur für private Nutzung und Bildung lizenziert und wurde deshalb nicht verwendet. Nach Pexels-Lizenz darf nicht der Eindruck entstehen, abgebildete Personen würden Produkte empfehlen.
- Schriften: Inter (und Archivo als Paket), selbst gehostet über Fontsource (DSGVO-freundlich, kein Google-CDN)

## Grenzen des Prototyps

- **Technische Daten** (Belagart, Härte, Stärken, Farben, Furniere, Gewicht …) wurden aus Attributen, Varianten, Unterkategorien und Beschreibungstexten von tt-shop.de abgeleitet. Eine Härteangabe gibt es für 87 von 254 Belägen. Für den Live-Betrieb empfiehlt sich ein eigenes Attributset in OpenMage (Belagart, Härte, Gewicht …) – das Frontend zeigt diese Felder automatisch an.
- **„TT-Shop-Einordnung“** (z. B. OF+, Spielniveau) ist eine regelbasierte Ableitung aus Belagart/Härte bzw. Holzklasse/Material (`src/lib/advice.ts`) und als solche gekennzeichnet – keine Herstellerangabe. Tempo-/Spin-/Kontrollwerte, Bewertungen und Lagerbestand je Variante gibt es in den Shopdaten nicht; sie werden bewusst **nicht** erfunden.
- Es werden keine echten Bestellungen, Zahlungen, Logins, Vereinsanfragen oder E-Mails ausgelöst.
- Ohne Herstellerangabe wird für Lagerware eine Lieferzeit von 2–3 Werktagen angenommen (Versand in 1–2 Tagen plus DPD).
- Rechtstexte (AGB, Impressum, Datenschutz) sind nur verlinkt und kommen später aus den OpenMage-CMS-Seiten.
- **Performance:** Als reine Client-App (ohne Server-Rendering) liegt der Lighthouse-Performance-Wert mobil je nach Seite bei ca. 65–85. Der Konfigurator liegt bei ca. 45, weil der Lighthouse-Testbrowser die 3D-Szene ohne Grafikkarte berechnet; die Szene lädt deshalb erst, wenn der Browser frei ist. Für den Live-Betrieb: Server-Rendering bzw. Vorrendern der Kategorie-/Produktseiten, Auslieferung mit Brotli über ein CDN und Bilder über einen Bild-CDN (z. B. `srcset` in mehreren Breiten).

## Projektstruktur

```
src/
  pages/        Home, Category (Liste/Suche/Marke), Product, Compare, Configurator, Advisor,
                ProSetups, Content (Ratgeber, Glossar, Montage, Verein), Cart, Checkout, Misc
  components/   Header + Mega-Menü, Chrome (Footer, Suche, Mini-Warenkorb, Vergleichsleiste),
                ProductCard, QuickView + Lightbox, Options (Varianten/Größen/Services), ui
  three/        tableSpec/tableModel/TableScene (Tische, AR), racketModel/RacketScene (3D-Schläger im Konfigurator)
  lib/          catalog (Daten, Spezifikationen, Suche), facets (Filter), advice (Einordnung), assistant (Chat-Assistent),
                guides (Ratgeber/Glossar), delivery (Lieferdatum, Countdown), seo (Titel, JSON-LD)
  store/        Warenkorb (Rabatte, Teilen-Link), Merkliste/Vergleich/Verlauf, UI-State (zustand)
  api/          openmage.ts – Vorlage für die REST-Anbindung
scripts/        Katalog-Import, Belagarten-Zuordnung, Lifestyle-Bilder, GLB-Export
```

Stack: Vite 8 · React 19 · TypeScript · Tailwind CSS 4 · three.js / react-three-fiber / drei · model-viewer · motion · zustand · NumberFlow (animierte Preise) · Vaul (Bottom-Sheet für den Chat auf dem Handy)
