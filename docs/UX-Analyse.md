# UX-Analyse: Was wir von Apple, Sportmarken und TT-Fachshops übernommen haben

Stand: 14.11.2026. Untersucht wurden apple.com/de (Store, Kaufabläufe von iPhone, Mac und Watch, Produkt-, Vergleichs- und Zubehörseiten, Warenkorb, Hilfe), nike.com, on.com sowie die Tischtennis-Shops und -Marken contra.de, schoeler-micke.de, spinfactory.de, tabletennis11, megaspin, Butterfly und Donic. adidas, Joola und Teile von Megaspin ließen sich nicht abrufen.

## 1. Apple Store

| Muster bei Apple | Umsetzung im TT-Shop |
|---|---|
| Hellgraue Seitenflächen, weiße Karten mit großen Radien, Glas-Navigation | Neues Designsystem „Store“ (`src/styles.css`): `#f5f5f7`, Karten mit 18–28 px Radius, Header mit Blur |
| Zweifarbige Überschriften („Das Neueste. Alles für …“) | Alle Abschnittsüberschriften (`SectionHead`), z. B. „Beläge. Tensor & Hybrid – mit Härte, Schwammstärken und Farben.“ |
| Kategoriereihe mit Produktbildern ganz oben | „Der Shop.“ mit 10 Kategorien und Artikelzahlen |
| Produktreihen laufen rechts über den Rand, Pfeile darunter | `ProductRail` |
| Produktkarte: Farbpunkte über dem Namen, kleines farbiges Etikett, „+“-Button | `ProductCard`: Belagfarben, „Sale“ bzw. Einordnung, „+“ öffnet die Schnellansicht |
| Kaufablauf: Schritte als „Nomen. Frage?“, Hilfe pro Schritt, „Nein, danke“-Kachel bei Services | Konfigurator und Produktoptionen: „Holz. Welches passt zu deinem Spiel?“, „Service. Sollen wir ihn für dich aufbauen?“ |
| Nicht verfügbare Optionen bleiben sichtbar und nennen den Grund | Farben und Stärken: „Nicht in schwarz“, „Regel: eine Seite schwarz“ |
| Unterpreise als Aufpreis („Enthalten“, „+ 220 €“) | Schwammstärke, Griff, Montage, Versiegelung |
| „Dein neues MacBook. Stimmt alles?“ mit Teilen-Link | „Dein neuer Schläger. Stimmt alles?“, Konfiguration steckt komplett in der URL |
| Lokale Navigation mit festem „Kaufen“-Button | Abschnittsleiste der Produktseite mit Preis und „Kaufen“ |
| „Hilfe beim Einkauf.“ und „Frag einen Specialist“ | Hilfe-Block auf Produktseite, Konfigurator und Warenkorb plus Chat-Assistent |
| Leerer Warenkorb mit klarer Aufforderung, FAQ darunter | „Dein Warenkorb ist leer.“, FAQ zu Versand, Zahlung, Rabatten und Widerruf |

## 2. Sportmarken (Nike, On)

- **Vollflächige Herofläche mit großer Überschrift und zwei Pill-Buttons.** Umgesetzt als „Black Weeks.“ auf einem lizenzfreien Schwarz-Weiß-Foto. Darunter vier echte reduzierte Artikel, je einer pro Kategorie.
- **Versand und Rückgabe direkt unter dem Kaufen-Button.** Ist auf der Produktseite vorhanden.
- **Vergleich innerhalb einer Serie** (Nike: „Wähle die richtige Dämpfung“). Ist als Serienvergleich auf der Produktseite vorhanden.
- **„Die Highlights.“ mit großen Zahlen.** Auf der Produktseite, aber nur aus vorhandenen Daten: Härte, Stärken, Farben, Furniere, Gewicht.

## 3. Tischtennis-Fachshops

- **Konfigurator Holz → Vorhand → Rückhand → Kantenband, mit Laufpreis.** Contra und Butterfly machen das ähnlich. Unser Konfigurator hat zusätzlich eine 3D-Vorschau und eine Teilen-Funktion.
- **Farbregel.** Bei keinem untersuchten Shop sichtbar automatisch durchgesetzt. Bei uns stellt der Konfigurator die Rückhand automatisch richtig ein und erklärt den Grund.
- **„Gleicher Belag wie Vorhand“.** Diese Abkürzung haben die Konkurrenten nicht.
- **Services als echte Optionen mit Preis statt Bestellkommentar.** Tabletennis11 verlangt einen Kommentar, wir bieten Montage und Versiegelung als Kacheln.
- **Herstellerwerte (Tempo, Spin, Kontrolle) sind zwischen Marken nicht vergleichbar.** Butterfly nutzt etwa 0–100, GEWO z. B. 143. Contra legt trotzdem alles auf eine Skala. Wir zeigen solche Werte nur, wenn sie vorhanden sind, und mischen keine Skalen. Die TT-Shop-Einordnung ist als abgeleitet gekennzeichnet.
- **Produktvergleich mit bis zu 4 Artikeln.** Bei den gelesenen TT-Shops nicht gefunden, bei uns vorhanden.

## 4. Chat-Assistent

Lokaler, regelbasierter Assistent (`src/lib/assistant.ts`) ohne Server und ohne laufende Kosten. Er antwortet nur aus vorhandenen Daten: Katalog mit 792 Artikeln, Versand- und Rabattregeln, Montage, Zahlarten, Widerruf, Glossar und Ratgeber. Er erkennt:

- Produktnamen, Marken, Kategorien und Unterkategorien,
- Spielniveau, Spielstil, Budget, Belagart, Härte und Holzmaterial,
- Folgefragen zum zuletzt besprochenen Artikel, z. B. „Passt der für Einsteiger?“,
- Wünsche nach einem Menschen; dann übergibt er an Telefon oder E-Mail.

Der Chatverlauf wird nicht gespeichert.

**Möglicher Ausbau:** Für freie Fragen könnte später ein KI-Modell über einen kleinen Server angebunden werden. Es sollte dann ebenfalls nur aus dem Katalog antworten.

## 5. Offene Empfehlungen

1. **Lagerbestand und Lieferzeit je Variante** aus OpenMage (Farbe × Stärke) anzeigen, sobald die REST-API freigeschaltet ist.
2. **Echte Bewertungen** mit Spielniveau, Spielstil und Kombination sammeln, z. B. per Bewertungs-E-Mail nach dem Kauf. Bis dahin werden keine Bewertungen angezeigt.
3. **Herstellerwerte als eigene OpenMage-Attribute pflegen,** mit Angabe der Skala.
4. **„Beliebte Kombinationen“** aus echten Bestellungen im Konfigurator anzeigen.
