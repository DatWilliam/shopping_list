# Küchenzettel

Einkaufsliste und Rezepte mit Nährwerten – als Web-App (PWA) fürs Pixel 8a und den PC.
Läuft offline, die Daten bleiben auf dem Gerät.

## Was die App kann

**Einkaufsliste**
- Artikel eintippen („2 Zwiebeln“, „500 g Hack“, „Klopapier“) – mit Vorschlägen aus rund 250 Lebensmitteln
- Kacheln mit schwarz-weißen Icons, automatisch nach Supermarkt-Bereichen sortiert
- Antippen = gekauft (mit Rückgängig), gedrückt halten bzw. Rechtsklick = Menge, Nährwerte, Saison, Tipps
- „Zuletzt gekauft“ und das ganze Sortiment zum schnellen Nachlegen
- Reihenfolge der Bereiche unter **Mehr** an deinen Markt anpassen

**Rezepte**
- Zutaten schreibst du wie gewohnt, eine pro Zeile („1 Dose Kokosmilch“, „Hühnerbrust (~200g)“) – oder fügst die ganze Liste auf einmal ein
- kcal, Eiweiß, Kohlenhydrate, Fett und Ballaststoffe werden schon beim Tippen ausgerechnet (pro Portion und gesamt)
- Portionen umstellen rechnet Mengen und Nährwerte um
- Zutaten anhaken → „auf die Einkaufsliste“ (Mengen werden zusammengerechnet)
- Unbekannte Zutaten (z. B. Markenprodukte) kannst du zuordnen oder neu anlegen – Nährwerte gibt es per Online-Suche aus Open Food Facts

## Am PC starten

```
py main.py
```

Öffnet die App unter http://localhost:8000. In Chrome oder Edge lässt sie sich über das Installieren-Symbol in der Adressleiste auch als eigenes Fenster einrichten.

## Aufs Pixel bringen

Damit Chrome die App installiert und sie offline läuft, muss sie per **HTTPS** erreichbar sein. Am einfachsten und kostenlos geht das mit **GitHub Pages**:

1. Auf [github.com](https://github.com) ein Konto anlegen.
2. Neues Repository erstellen, z. B. `kuechenzettel` (öffentlich).
3. Den Inhalt dieses Ordners hochladen („Add file → Upload files“ oder per `git push`).
4. Im Repository: **Settings → Pages → Branch: `main`, Ordner `/ (root)` → Save**.
5. Nach etwa einer Minute ist die App unter `https://<dein-name>.github.io/kuechenzettel/` erreichbar.
6. Auf dem Pixel in Chrome öffnen → Menü ⋮ → **App installieren** (bzw. „Zum Startbildschirm hinzufügen“).

Der Programmcode ist dann öffentlich, **deine Listen und Rezepte nicht** – die liegen nur im Speicher des Handys.

**Zum Ausprobieren ohne Hosting:** `py main.py` am PC starten und auf dem Handy (gleiches WLAN) die angezeigte Adresse `http://192.168.…:8000` öffnen. Das funktioniert, aber ohne Installation und ohne Offline-Modus.

## Daten & PC

Alles wird im Browser des jeweiligen Geräts gespeichert (localStorage). Handy und PC haben also zunächst getrennte Daten.

- **Mehr → Backup speichern** erzeugt eine Datei `kuechenzettel-backup-JJJJ-MM-TT.json`.
- **Mehr → Backup laden** auf dem anderen Gerät: *Nur Rezepte übernehmen* (Liste bleibt) oder *Alles ersetzen*.
- Praktisch: Backup in OneDrive ablegen und auf dem anderen Gerät von dort laden.

## Anpassen

| Was | Wo |
|---|---|
| Lebensmittel, Nährwerte, Tipps, Saison | `js/foods.js` (Format steht oben in der Datei) |
| Einheiten (EL, Dose, Bund …) | `js/ingredients.js` → `UNITS` |
| Farben & Aussehen | `css/app.css` (oben die Farbvariablen, hell und dunkel) |
| Neue Icons nach Änderungen an `foods.js` | `py tools/build_icons.py` |

**Wichtig nach jeder Änderung:** in `sw.js` die Version hochzählen (`kuechenzettel-v1` → `-v2` …) und neu hochladen. Dann meldet die App auf dem Handy „Neue Version installiert“.

## Aufbau

```
index.html             Grundgerüst
manifest.webmanifest   App-Name, Icons (für die Installation)
sw.js                  Service Worker (offline)
css/app.css            Gestaltung
js/app.js              Oberfläche: Liste, Rezepte, Editor, Einstellungen
js/foods.js            Lebensmittel-Katalog mit Nährwerten
js/ingredients.js      Zutaten verstehen, Gramm & Nährwerte berechnen
js/store.js            Speichern, Backup
js/off.js              Online-Suche bei Open Food Facts
icons/                 App-Icon und Icon-Sprite (OpenMoji)
tools/build_icons.py   baut icons/sprite.svg
main.py                lokaler Server zum Starten am PC
```

## Ideen für später

- **Live-Sync Handy ↔ PC**, z. B. über einen kleinen Python-Server (FastAPI) oder einen kostenlosen Cloud-Dienst
- **REWE-Angebote**: Es gibt keine offizielle Schnittstelle, nur inoffizielle Wege über die REWE-App, die immer wieder brechen. Machbar als separates Python-Skript, aber ohne Garantie.
- Wochenplan, Kochmodus (Bildschirm bleibt an, Timer), Rezept-Fotos, Rezepte von Webseiten importieren

## Quellen & Lizenzen

- Icons: [OpenMoji](https://openmoji.org) – CC BY-SA 4.0
- Produktdaten der Online-Suche: [Open Food Facts](https://openfoodfacts.org) – ODbL
- Nährwerte im Katalog sind gerundete Richtwerte.
