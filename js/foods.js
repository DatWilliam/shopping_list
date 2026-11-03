// Lebensmittel-Katalog für Küchenzettel.
//
// Jeder Eintrag: F(Name, Kategorie, Icon, Nährwerte, Optionen)
//   Nährwerte pro 100 g: [kcal, Eiweiß, Kohlenhydrate, Fett, Ballaststoffe] – Richtwerte.
//     Z    = vernachlässigbar (Gewürze, Wasser …), zählt in Rezepten als 0
//     null = kein Lebensmittel (Drogerie & Haushalt)
//   Optionen:
//     a: weitere Namen/Schreibweisen, kommagetrennt (für Suche und Rezept-Zutaten)
//     p: Gewicht eines Stücks in g (für „2 Zwiebeln“)
//     d: Dichte in g/ml (für ml-, EL- und TL-Angaben), Standard 1
//     u: Gramm pro Einheit, z. B. { dose: 400, bund: 30 } (Schlüssel siehe UNITS in ingredients.js)
//     s: Saison, t: Tipp
// Icons sind Emoji. Angezeigt werden sie als schwarz-weiße OpenMoji-Grafiken
// (icons/sprite.svg, erzeugt mit `py tools/build_icons.py`). Kein Apostroph in Texten verwenden.

export const CATEGORIES = [
  { id: 'obst', n: 'Obst & Gemüse', i: '🥕' },
  { id: 'brot', n: 'Brot & Backwaren', i: '🥖' },
  { id: 'milch', n: 'Milch, Käse & Eier', i: '🧀' },
  { id: 'fleisch', n: 'Fleisch & Fisch', i: '🥩' },
  { id: 'kuehl', n: 'Kühlregal & Veggie', i: '🥟' },
  { id: 'tk', n: 'Tiefkühl', i: '❄️' },
  { id: 'nudeln', n: 'Nudeln, Reis & Getreide', i: '🍝' },
  { id: 'konserven', n: 'Konserven & Brühe', i: '🥫' },
  { id: 'backen', n: 'Backen & Nüsse', i: '🧁' },
  { id: 'gewuerze', n: 'Gewürze, Öl & Saucen', i: '🧂' },
  { id: 'fruehstueck', n: 'Frühstück & Aufstrich', i: '🥣' },
  { id: 'snacks', n: 'Süßes & Snacks', i: '🍫' },
  { id: 'getraenke', n: 'Getränke', i: '🥤' },
  { id: 'drogerie', n: 'Drogerie & Haushalt', i: '🧴' },
  { id: 'sonstiges', n: 'Sonstiges', i: '🛒' },
];

// Icons, die die Oberfläche zusätzlich braucht (leere Liste, leere Rezepte …)
export const EXTRA_ICONS = ['🧺', '📖', '🍳'];

const Z = [0, 0, 0, 0, 0];

export function slugify(s) {
  return String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const F = (n, c, i, v, o = {}) => ({ ...o, id: slugify(n), n, c, i, v, a: o.a ? o.a.split(/\s*,\s*/) : [] });

export const FOODS = [
  // ---------- Obst & Gemüse ----------
  F('Äpfel', 'obst', '🍎', [52, 0.3, 11.4, 0.2, 2.4], { a: 'Apfel', p: 180, s: 'Aug–Apr', t: 'Getrennt von anderem Obst lagern – Äpfel geben Ethylen ab und lassen es schneller reifen.' }),
  F('Bananen', 'obst', '🍌', [93, 1.2, 20, 0.2, 2], { a: 'Banane', p: 120, t: 'Nicht in den Kühlschrank – dort wird die Schale schnell braun. Grüne Bananen reifen bei Zimmertemperatur nach.' }),
  F('Birnen', 'obst', '🍐', [55, 0.5, 12.4, 0.3, 3.3], { a: 'Birne', p: 180, s: 'Aug–Nov' }),
  F('Orangen', 'obst', '🍊', [45, 1, 8.3, 0.2, 2.2], { a: 'Orange, Apfelsine, Apfelsinen', p: 200, s: 'Nov–Apr' }),
  F('Mandarinen', 'obst', '🍊', [50, 0.7, 10.1, 0.3, 1.7], { a: 'Mandarine, Clementine, Clementinen', p: 70, s: 'Nov–Feb' }),
  F('Zitronen', 'obst', '🍋', [35, 0.7, 3.2, 0.6, 1], { a: 'Zitrone', p: 120, t: 'Vor dem Auspressen fest über die Arbeitsfläche rollen – so gibt sie mehr Saft.' }),
  F('Limetten', 'obst', '🍋‍🟩', [30, 0.5, 1.9, 0.4, 0.3], { a: 'Limette', p: 60 }),
  F('Erdbeeren', 'obst', '🍓', [32, 0.8, 5.5, 0.4, 1.6], { a: 'Erdbeere', u: { packung: 500 }, s: 'Mai–Jul', t: 'Erst kurz vor dem Essen waschen und entstielen, sonst werden sie matschig.' }),
  F('Himbeeren', 'obst', '🍓', [36, 1.3, 4.8, 0.3, 6.7], { a: 'Himbeere', u: { packung: 125 }, s: 'Jun–Sep' }),
  F('Heidelbeeren', 'obst', '🫐', [42, 0.6, 7.4, 0.6, 4.9], { a: 'Heidelbeere, Blaubeeren, Blaubeere', u: { packung: 125 }, s: 'Jul–Sep' }),
  F('Weintrauben', 'obst', '🍇', [70, 0.7, 15.6, 0.3, 1.5], { a: 'Weintraube, Trauben, Traube', u: { packung: 500 }, s: 'Aug–Okt' }),
  F('Wassermelone', 'obst', '🍉', [30, 0.6, 7.5, 0.2, 0.4], { a: 'Melone, Honigmelone', p: 3000, s: 'Jun–Sep' }),
  F('Mango', 'obst', '🥭', [62, 0.6, 12.8, 0.5, 1.7], { a: 'Mangos', p: 350, t: 'Reif, wenn sie auf leichten Druck nachgibt und am Stielansatz duftet.' }),
  F('Ananas', 'obst', '🍍', [55, 0.5, 12.4, 0.2, 1.4], { p: 1000 }),
  F('Kiwis', 'obst', '🥝', [61, 1, 10.3, 0.6, 2.1], { a: 'Kiwi', p: 75 }),
  F('Pfirsiche', 'obst', '🍑', [42, 0.8, 8.9, 0.1, 1.9], { a: 'Pfirsich, Nektarine, Nektarinen', p: 150, s: 'Jul–Sep' }),
  F('Kirschen', 'obst', '🍒', [63, 0.9, 13.3, 0.3, 1.3], { a: 'Kirsche', s: 'Jun–Aug' }),
  F('Avocados', 'obst', '🥑', [160, 2, 1.9, 14.7, 6.7], { a: 'Avocado', p: 170, t: 'Hart gekauft reift sie in 2–4 Tagen bei Zimmertemperatur – neben einem Apfel schneller.' }),
  F('Tomaten', 'obst', '🍅', [18, 0.9, 2.6, 0.2, 1.2], { a: 'Tomate, Rispentomaten, Strauchtomaten, Fleischtomate, Fleischtomaten', p: 100, s: 'Jul–Okt', t: 'Nicht in den Kühlschrank – dort verlieren Tomaten ihr Aroma.' }),
  F('Cherrytomaten', 'obst', '🍅', [22, 1, 3, 0.3, 1.3], { a: 'Kirschtomaten, Cocktailtomaten, Cherry Tomaten, Datteltomaten, Snacktomaten', p: 15, u: { packung: 250 }, s: 'Jul–Okt' }),
  F('Gurke', 'obst', '🥒', [13, 0.6, 1.8, 0.2, 0.5], { a: 'Gurken, Salatgurke, Salatgurken, Minigurken', p: 400, s: 'Jun–Sep' }),
  F('Paprika', 'obst', '🫑', [31, 1, 5, 0.3, 2], { a: 'Paprikaschote, Paprikaschoten, rote Paprika, gelbe Paprika, grüne Paprika, Spitzpaprika', p: 160, s: 'Jul–Okt' }),
  F('Möhren', 'obst', '🥕', [36, 0.9, 6.8, 0.2, 2.9], { a: 'Möhre, Karotte, Karotten, Mohrrübe, Mohrrüben, Rüebli', p: 80, t: 'Das Grün vor dem Lagern abschneiden – es zieht sonst Wasser aus der Möhre.' }),
  F('Kartoffeln', 'obst', '🥔', [72, 2, 14.8, 0.1, 1.6], { a: 'Kartoffel, festkochende Kartoffeln, mehligkochende Kartoffeln, Drillinge, Frühkartoffeln', p: 100, u: { packung: 1500 }, t: 'Dunkel und kühl lagern, aber nicht im Kühlschrank – Licht macht sie grün.' }),
  F('Süßkartoffeln', 'obst', '🍠', [86, 1.6, 17.6, 0.1, 3], { a: 'Süßkartoffel', p: 300, t: 'Lässt sich mit Schale backen – vorher nur gründlich abbürsten.' }),
  F('Zwiebeln', 'obst', '🧅', [40, 1.2, 7.6, 0.1, 1.7], { a: 'Zwiebel, Gemüsezwiebel, gelbe Zwiebeln', p: 80, u: { packung: 1000 }, t: 'Kühl, dunkel und trocken lagern – nicht neben Kartoffeln, sonst keimen beide schneller.' }),
  F('Rote Zwiebeln', 'obst', '🧅', [40, 1.2, 7.6, 0.1, 1.7], { a: 'rote Zwiebel', p: 80 }),
  F('Schalotten', 'obst', '🧅', [72, 2.5, 14.6, 0.1, 3.2], { a: 'Schalotte', p: 25 }),
  F('Frühlingszwiebeln', 'obst', '🧅', [32, 1.8, 4.7, 0.2, 2.6], { a: 'Frühlingszwiebel, Lauchzwiebel, Lauchzwiebeln', p: 15, u: { bund: 120 } }),
  F('Knoblauch', 'obst', '🧄', [149, 6.4, 30, 0.5, 2.1], { a: 'Knoblauchzehe, Knoblauchzehen, Knoblauchknolle', p: 4, u: { knolle: 50, zehe: 4 }, t: 'Der grüne Keim in der Mitte schmeckt bitter – einfach herausschneiden.' }),
  F('Ingwer', 'obst', '🫚', [80, 1.8, 15.8, 0.8, 2], { a: 'Ingwerwurzel, frischer Ingwer', p: 20, t: 'Die Schale lässt sich mit einem Teelöffel ganz einfach abschaben.' }),
  F('Brokkoli', 'obst', '🥦', [34, 3.5, 2.7, 0.4, 3], { a: 'Broccoli, Brokkoliröschen', p: 450, u: { kopf: 450 }, s: 'Jun–Okt' }),
  F('Blumenkohl', 'obst', '🥦', [25, 2, 2.3, 0.3, 2.5], { p: 800, u: { kopf: 800 }, s: 'Jun–Nov' }),
  F('Zucchini', 'obst', '🥒', [19, 1.6, 2, 0.4, 1.1], { p: 250, s: 'Jun–Sep' }),
  F('Aubergine', 'obst', '🍆', [24, 1.2, 2.5, 0.2, 2.8], { a: 'Auberginen', p: 300, s: 'Jul–Okt' }),
  F('Champignons', 'obst', '🍄‍🟫', [22, 2.9, 0.6, 0.3, 1.9], { a: 'Champignon, Pilze, braune Champignons, weiße Champignons', p: 20, u: { packung: 250 }, t: 'Nicht waschen, sondern mit Küchenpapier abreiben – sonst saugen sie sich mit Wasser voll.' }),
  F('Salat', 'obst', '🥗', [14, 1.2, 1.5, 0.2, 1.5], { a: 'Kopfsalat, Eisbergsalat, Eisberg, Römersalat, Blattsalat, Salatkopf, Lollo Rosso', p: 300, u: { kopf: 300 } }),
  F('Rucola', 'obst', '🥬', [25, 2.6, 2, 0.7, 1.6], { a: 'Rauke', u: { packung: 125, bund: 80 } }),
  F('Spinat', 'obst', '🥬', [23, 2.7, 0.6, 0.4, 2.6], { a: 'Blattspinat, Babyspinat, frischer Spinat', u: { packung: 250 } }),
  F('Feldsalat', 'obst', '🥬', [21, 1.8, 0.7, 0.4, 1.5], { u: { packung: 150 }, s: 'Okt–Mär' }),
  F('Lauch', 'obst', '🥬', [28, 2.2, 3.3, 0.3, 2.3], { a: 'Porree, Lauchstange, Lauchstangen', p: 200, s: 'Sep–Mär' }),
  F('Staudensellerie', 'obst', '🥬', [16, 1.2, 2.2, 0.2, 1.6], { a: 'Sellerie, Stangensellerie, Selleriestange, Selleriestangen', p: 40, u: { bund: 400 } }),
  F('Kohlrabi', 'obst', '🥬', [25, 2, 3.7, 0.1, 1.4], { p: 300, s: 'Mai–Okt' }),
  F('Rotkohl', 'obst', '🥬', [22, 1.5, 3.5, 0.2, 2.5], { a: 'Rotkraut, Blaukraut', p: 1000, u: { kopf: 1000 }, s: 'Sep–Mär' }),
  F('Rote Bete', 'obst', '🫜', [41, 1.5, 8.4, 0.1, 2.5], { a: 'Rote Beete, Rote Rübe', p: 150, u: { packung: 500 }, s: 'Sep–Mär' }),
  F('Radieschen', 'obst', '🫜', [15, 1, 2.1, 0.1, 1.6], { u: { bund: 150 }, s: 'Apr–Sep' }),
  F('Kürbis', 'obst', '🎃', [40, 1.2, 8, 0.2, 1.5], { a: 'Hokkaido, Hokkaidokürbis, Butternut, Butternutkürbis', p: 1200, s: 'Sep–Dez', t: 'Hokkaido musst du nicht schälen – die Schale wird beim Garen weich.' }),
  F('Spargel', 'obst', '🌱', [18, 1.9, 2, 0.1, 1.5], { a: 'weißer Spargel, grüner Spargel', u: { bund: 500 }, s: 'Apr–Jun', t: 'Die Saison endet traditionell am 24. Juni (Johannistag).' }),
  F('Grüne Bohnen', 'obst', '🫛', [32, 2.4, 5, 0.2, 1.9], { a: 'Bohnen, Prinzessbohnen, Brechbohnen, Buschbohnen', s: 'Jul–Sep', t: 'Nie roh essen – rohe Bohnen enthalten giftiges Phasin, das erst beim Kochen zerfällt.' }),
  F('Zuckerschoten', 'obst', '🫛', [42, 3, 6.5, 0.2, 2.6], { a: 'Zuckerschote, Kaiserschoten', u: { packung: 150 } }),
  F('Chili', 'obst', '🌶️', [40, 1.9, 7.3, 0.4, 1.5], { a: 'Chilischote, Chilischoten, Chilis, rote Chili, Peperoni, Jalapeños', p: 10 }),
  F('Petersilie', 'obst', '🌿', [50, 4.4, 7.4, 0.4, 4.3], { a: 'glatte Petersilie, krause Petersilie', u: { bund: 30 } }),
  F('Basilikum', 'obst', '🌿', [41, 3.1, 5.1, 0.8, 1.6], { a: 'frisches Basilikum', u: { topf: 30, bund: 20 } }),
  F('Schnittlauch', 'obst', '🌿', [27, 3.6, 1.6, 0.7, 6], { u: { bund: 30 } }),
  F('Koriander', 'obst', '🌿', [23, 2.1, 0.9, 0.5, 2.8], { a: 'Koriandergrün, frischer Koriander', u: { bund: 30, topf: 30 } }),
  F('Dill', 'obst', '🌿', [43, 3.5, 6.3, 1.1, 2.1], { u: { bund: 20 } }),
  F('Minze', 'obst', '🌿', [44, 3.8, 5.3, 0.7, 6.8], { a: 'Pfefferminze, frische Minze', u: { bund: 20, topf: 30 } }),

  // ---------- Brot & Backwaren ----------
  F('Brot', 'brot', '🍞', [225, 7, 42, 1.5, 6], { a: 'Mischbrot, Bauernbrot, Roggenbrot, Sauerteigbrot, Weißbrot', u: { scheibe: 50 }, p: 1000, t: 'Brot hält sich im Brottopf am besten – im Kühlschrank wird es schneller altbacken.' }),
  F('Vollkornbrot', 'brot', '🍞', [205, 7, 37, 1.5, 8], { a: 'Körnerbrot, Dinkelvollkornbrot', u: { scheibe: 50 }, p: 750 }),
  F('Toastbrot', 'brot', '🍞', [265, 8, 48, 4, 3], { a: 'Toast, Sandwichtoast, Vollkorntoast, Buttertoast', u: { scheibe: 25, packung: 500 } }),
  F('Brötchen', 'brot', '', [270, 9, 52, 1.5, 3], { a: 'Semmel, Semmeln, Schrippe, Schrippen, Weizenbrötchen, Aufbackbrötchen, Vollkornbrötchen, Brötchen zum Aufbacken', p: 55 }),
  F('Baguette', 'brot', '🥖', [270, 9, 53, 1.5, 2.5], { a: 'Baguettes, Ciabatta', p: 250 }),
  F('Croissants', 'brot', '🥐', [410, 8, 43, 23, 2], { a: 'Croissant, Hörnchen', p: 60 }),
  F('Laugenbrezeln', 'brot', '🥨', [265, 8, 52, 2, 2], { a: 'Brezel, Brezeln, Laugenbrezel, Laugenstange, Laugenstangen, Laugenbrötchen', p: 85 }),
  F('Wraps', 'brot', '🌯', [300, 8, 50, 7, 3], { a: 'Wrap, Tortilla, Tortillas, Tortilla Wraps, Weizentortillas', p: 60, u: { packung: 370 } }),
  F('Fladenbrot', 'brot', '🫓', [250, 8, 50, 1.5, 2.5], { a: 'Pide, Naan, Pita', p: 400 }),
  F('Knäckebrot', 'brot', '🫓', [340, 10, 60, 2, 15], { p: 10, u: { scheibe: 10 } }),
  F('Burgerbrötchen', 'brot', '🍔', [270, 9, 48, 4.5, 2.5], { a: 'Burger Brötchen, Burger Buns, Buns, Hamburgerbrötchen', p: 60 }),
  F('Kuchen', 'brot', '🍰', [350, 5, 45, 17, 1], { a: 'Torte, Rührkuchen, Käsekuchen', p: 100 }),

  // ---------- Milch, Käse & Eier ----------
  F('Milch', 'milch', '🥛', [64, 3.4, 4.8, 3.6, 0], { a: 'Vollmilch, frische Milch, Frischmilch, H-Milch', d: 1.03, u: { packung: 1000, flasche: 1000 }, t: 'Geöffnet hält sie sich im Kühlschrank etwa 3–4 Tage.' }),
  F('Fettarme Milch', 'milch', '🥛', [47, 3.4, 4.9, 1.5, 0], { a: 'Halbfettmilch, fettarme H-Milch', d: 1.03, u: { packung: 1000 } }),
  F('Hafermilch', 'milch', '🥛', [45, 0.5, 6.5, 1.5, 0.8], { a: 'Haferdrink, Hafer Drink, Pflanzenmilch, Oatly', d: 1.03, u: { packung: 1000 } }),
  F('Sojamilch', 'milch', '🥛', [40, 3.3, 2, 1.8, 0.5], { a: 'Sojadrink', d: 1.03, u: { packung: 1000 } }),
  F('Sahne', 'milch', '🥛', [292, 2.4, 3.2, 30, 0], { a: 'Schlagsahne, süße Sahne, Rahm', u: { becher: 200 }, t: 'Gut gekühlt und in einer kalten Schüssel wird sie beim Schlagen schneller steif.' }),
  F('Kochsahne', 'milch', '🥛', [165, 3, 4, 15, 0], { a: 'Cremefine, Kochcreme, Cuisine, Sahne zum Kochen', u: { becher: 200, packung: 200 } }),
  F('Saure Sahne', 'milch', '🥣', [115, 3, 4, 10, 0], { u: { becher: 200 } }),
  F('Schmand', 'milch', '🥣', [240, 2.6, 3.6, 24, 0], { u: { becher: 200 } }),
  F('Crème fraîche', 'milch', '🥣', [292, 2.4, 2.6, 30, 0], { a: 'Creme fraiche, Crème fraiche, Creme fraîche', u: { becher: 200 } }),
  F('Joghurt', 'milch', '🥣', [66, 3.6, 4.4, 3.6, 0], { a: 'Naturjoghurt, Jogurt, Joghurt natur, Vollmilchjoghurt, Fruchtjoghurt', u: { becher: 150, glas: 500 } }),
  F('Griechischer Joghurt', 'milch', '🥣', [120, 4, 4.5, 10, 0], { a: 'griechischer Jogurt, Joghurt griechische Art, Greek Yogurt', u: { becher: 150 } }),
  F('Skyr', 'milch', '🥣', [63, 11, 4, 0.2, 0], { u: { becher: 450 } }),
  F('Quark', 'milch', '🥣', [67, 12, 4, 0.3, 0], { a: 'Magerquark, Speisequark, Sahnequark', u: { becher: 250, packung: 250 } }),
  F('Butter', 'milch', '🧈', [741, 0.7, 0.6, 83, 0], { a: 'Süßrahmbutter, Markenbutter, Sauerrahmbutter', u: { packung: 250 }, t: 'Lässt sich im Gefrierfach mehrere Monate aufbewahren.' }),
  F('Margarine', 'milch', '🧈', [720, 0.2, 0.5, 80, 0], { a: 'Pflanzenmargarine, Rama, vegane Butter', u: { packung: 500 } }),
  F('Eier', 'milch', '🥚', [137, 12.5, 1, 9.3, 0], { a: 'Ei, Freilandeier, Bio Eier, Bioeier', p: 60, u: { packung: 600 }, t: 'Frischetest: Ein frisches Ei sinkt im Wasserglas zu Boden und bleibt liegen.' }),
  F('Gouda', 'milch', '🧀', [356, 25, 0, 28, 0], { a: 'Käse, Käsescheiben, Scheibenkäse, Butterkäse, Edamer, Emmentaler, Bergkäse, Tilsiter', u: { scheibe: 20, packung: 400 } }),
  F('Mozzarella', 'milch', '🧀', [250, 18, 1, 19, 0], { a: 'Mozzarella Käse, Mozzarellakäse, Büffelmozzarella, Mini Mozzarella', p: 125, u: { kugel: 125, packung: 125 } }),
  F('Streukäse', 'milch', '🧀', [350, 26, 0, 27, 0], { a: 'geriebener Käse, Reibekäse, Pizzakäse, Gratinkäse, Mozzarella gerieben', u: { packung: 200 } }),
  F('Parmesan', 'milch', '🧀', [392, 33, 0, 28, 0], { a: 'Grana Padano, Parmigiano, Parmigiano Reggiano, Hartkäse' }),
  F('Pecorino', 'milch', '🧀', [387, 32, 0, 28, 0], { a: 'Pecorino Romano' }),
  F('Feta', 'milch', '🧀', [264, 17, 0.5, 21, 0], { a: 'Schafskäse, Hirtenkäse, Salatkäse, Fetakäse', u: { packung: 200 } }),
  F('Ricotta', 'milch', '🧀', [150, 9, 3, 11, 0], { u: { becher: 250, packung: 250 } }),
  F('Frischkäse', 'milch', '🧀', [230, 5.5, 4, 21.5, 0], { a: 'Doppelrahmfrischkäse, Philadelphia, Frischkäse natur', u: { packung: 175, becher: 175 } }),
  F('Hüttenkäse', 'milch', '🧀', [98, 12, 3, 4.3, 0], { a: 'körniger Frischkäse, Cottage Cheese', u: { becher: 200 } }),
  F('Halloumi', 'milch', '🧀', [320, 22, 2, 25, 0], { a: 'Grillkäse', u: { packung: 225 } }),
  F('Cheddar', 'milch', '🧀', [403, 25, 1, 33, 0], { u: { scheibe: 20 } }),
  F('Camembert', 'milch', '🧀', [300, 20, 0, 24, 0], { a: 'Brie', p: 125 }),

  // ---------- Fleisch & Fisch ----------
  F('Hähnchenbrust', 'fleisch', '🍗', [110, 23.5, 0, 1.5, 0], { a: 'Hähnchenbrustfilet, Hähnchenbrustfilets, Hühnerbrust, Hühnerbrustfilet, Hühnchenbrust, Hähnchenfilet, Hühnchenfilet, Hähnchen, Hühnchen, Huhn, Chicken', p: 180, u: { packung: 400 }, t: 'Immer vollständig durchgaren und für rohes Geflügel ein eigenes Brett benutzen.' }),
  F('Hähnchenschenkel', 'fleisch', '🍗', [190, 18, 0, 13, 0], { a: 'Hähnchenkeule, Hähnchenkeulen, Hühnerschenkel, Chicken Wings, Hähnchenflügel', p: 250 }),
  F('Putenbrust', 'fleisch', '🍗', [105, 24, 0, 1, 0], { a: 'Putenschnitzel, Pute, Putenfleisch, Putenbrustfilet', p: 150 }),
  F('Hackfleisch', 'fleisch', '🥩', [250, 18, 0, 20, 0], { a: 'Hack, Gehacktes, gemischtes Hack, Hackfleisch gemischt', u: { packung: 500 }, t: 'Am Kauftag verarbeiten oder direkt einfrieren.' }),
  F('Rinderhack', 'fleisch', '🥩', [210, 20, 0, 14, 0], { a: 'Rinderhackfleisch, Hackfleisch Rind', u: { packung: 500 } }),
  F('Mett', 'fleisch', '🥩', [260, 16, 0, 22, 0], { a: 'Schweinemett, Thüringer Mett, Hackepeter, Zwiebelmett, Schweinehack, Schweinehackfleisch, Bratwurstbrät' }),
  F('Steak', 'fleisch', '🥩', [125, 22, 0, 4, 0], { a: 'Rindersteak, Rumpsteak, Hüftsteak, Entrecote, Rinderhüfte, Rinderfilet', p: 200 }),
  F('Schweineschnitzel', 'fleisch', '🥩', [106, 22, 0, 2, 0], { a: 'Schnitzel, Schweinefilet, Schweinelachs, Schweinefleisch, Schweinenacken', p: 150 }),
  F('Gulasch', 'fleisch', '🥩', [140, 21, 0, 6, 0], { a: 'Rindergulasch, Gulaschfleisch' }),
  F('Speck', 'fleisch', '🥓', [300, 15, 0, 27, 0], { a: 'Bacon, Speckwürfel, Schinkenwürfel, Frühstücksspeck, Bauchspeck, Pancetta', u: { packung: 125, scheibe: 10 } }),
  F('Kochschinken', 'fleisch', '🍖', [110, 19, 1, 3.5, 0], { a: 'Schinken, gekochter Schinken, Hinterschinken', u: { scheibe: 20, packung: 200 } }),
  F('Salami', 'fleisch', '🍖', [380, 21, 1, 33, 0], { u: { scheibe: 8, packung: 100 } }),
  F('Würstchen', 'fleisch', '🌭', [270, 13, 1, 24, 0], { a: 'Wiener, Wiener Würstchen, Wienerle, Frankfurter, Wurst, Würste', p: 50 }),
  F('Bratwurst', 'fleisch', '🌭', [290, 14, 1, 26, 0], { a: 'Bratwürste, Rostbratwurst, Grillwurst, Grillwürstchen', p: 110 }),
  F('Lachs', 'fleisch', '🐟', [200, 20, 0, 13, 0], { a: 'Lachsfilet, Lachsfilets', p: 125 }),
  F('Räucherlachs', 'fleisch', '🐟', [180, 22, 0, 10, 0], { a: 'geräucherter Lachs, Stremellachs', u: { packung: 100 } }),
  F('Fischfilet', 'fleisch', '🐟', [80, 18, 0, 0.8, 0], { a: 'Kabeljau, Seelachs, Alaska Seelachs, Pangasius, Dorsch, Weißfisch, Fisch', p: 125 }),
  F('Garnelen', 'fleisch', '🦐', [80, 18, 0, 1, 0], { a: 'Shrimps, Shrimp, Crevetten, Gambas, Riesengarnelen, Scampi', u: { packung: 225 } }),

  // ---------- Kühlregal & Veggie ----------
  F('Tofu', 'kuehl', '🧈', [125, 13, 1, 7.5, 0.5], { a: 'Räuchertofu, Seidentofu, Naturtofu', u: { packung: 200 }, t: 'Vor dem Braten gut auspressen – dann wird er knuspriger.' }),
  F('Veganes Geschnetzeltes', 'kuehl', '🌱', [180, 18, 6, 9, 4], { a: 'vegan Geschnetzeltes, veganes Hähnchen, Sojageschnetzeltes, vegetarisches Geschnetzeltes, Veggie Geschnetzeltes, vegane Hähnchenstreifen, Vegan Chicken', u: { packung: 180 } }),
  F('Veggie Hack', 'kuehl', '🌱', [200, 17, 5, 12, 4], { a: 'veganes Hack, vegetarisches Hack, Vegan Hack, Sojahack, Hack vegan', u: { packung: 180 } }),
  F('Hummus', 'kuehl', '🫘', [270, 7, 12, 21, 6], { a: 'Humus, Hommus', u: { becher: 200, packung: 200 } }),
  F('Pesto', 'kuehl', '🌿', [450, 5, 6, 45, 2], { a: 'Pesto Genovese, grünes Pesto, rotes Pesto, Pesto Rosso, Basilikumpesto', u: { glas: 190 } }),
  F('Pizzateig', 'kuehl', '🍕', [270, 7, 46, 6, 2], { a: 'Pizza Teig, frischer Pizzateig', u: { packung: 400, rolle: 400 } }),
  F('Blätterteig', 'kuehl', '🥐', [400, 6, 35, 26, 1.5], { u: { packung: 275, rolle: 275 } }),
  F('Gnocchi', 'kuehl', '🥟', [150, 3.5, 33, 0.4, 1.6], { u: { packung: 500 } }),
  F('Tortellini', 'kuehl', '🥟', [280, 11, 44, 6, 2.5], { a: 'Ravioli, Tortelloni, frische Pasta', u: { packung: 250 } }),
  F('Maultaschen', 'kuehl', '', [210, 9, 25, 8, 1.5], { a: 'Maultasche', p: 60, u: { packung: 360 } }),
  F('Pudding', 'kuehl', '🍮', [100, 3.3, 16, 2.5, 0], { a: 'Schokopudding, Vanillepudding, Grießpudding', u: { becher: 125 } }),

  // ---------- Tiefkühl ----------
  F('Erbsen', 'tk', '🫛', [81, 5.4, 10, 0.4, 5.5], { a: 'Erbse, TK Erbsen, Tiefkühlerbsen, junge Erbsen', u: { packung: 450 } }),
  F('Pommes', 'tk', '🍟', [150, 2.5, 23, 4.5, 2.5], { a: 'Pommes frites, TK Pommes, Ofenpommes, Fritten', u: { packung: 750 } }),
  F('Tiefkühlpizza', 'tk', '🍕', [240, 10, 28, 9, 2], { a: 'TK Pizza, TK-Pizza, Pizza, Steinofenpizza', p: 350 }),
  F('Fischstäbchen', 'tk', '🐟', [200, 13, 17, 9, 0.8], { p: 30, u: { packung: 450 } }),
  F('Eis', 'tk', '🍨', [210, 3.5, 24, 11, 0], { a: 'Eiscreme, Speiseeis, Vanilleeis, Schokoeis', u: { packung: 500 } }),
  F('Beerenmischung', 'tk', '🫐', [45, 1, 7, 0.4, 4], { a: 'TK Beeren, Tiefkühlbeeren, Beerenmix, gemischte Beeren, Waldbeeren', u: { packung: 300 } }),
  F('Gemüsemischung', 'tk', '🥦', [35, 2, 4, 0.3, 3], { a: 'TK Gemüse, Tiefkühlgemüse, Kaisergemüse, Pfannengemüse, Wokgemüse, Buttergemüse, Asia Gemüse', u: { packung: 450 } }),
  F('Rahmspinat', 'tk', '🥬', [60, 2.8, 3, 4, 2], { a: 'TK Spinat, Tiefkühlspinat', u: { packung: 450 } }),

  // ---------- Nudeln, Reis & Getreide ----------
  F('Nudeln', 'nudeln', '🍝', [355, 12.5, 70, 1.5, 3], { a: 'Pasta, Fusilli, Farfalle, Rigatoni, Tagliatelle, Makkaroni, Hörnchennudeln, Bandnudeln, Vollkornnudeln, Spirelli', u: { packung: 500 }, t: 'Pro Person rechnet man etwa 100–125 g trockene Nudeln.' }),
  F('Spaghetti', 'nudeln', '🍝', [355, 12.5, 70, 1.5, 3], { a: 'Spaghettini, Linguine', u: { packung: 500 } }),
  F('Penne', 'nudeln', '🍝', [355, 12.5, 70, 1.5, 3], { a: 'Penne Rigate', u: { packung: 500 } }),
  F('Lasagneplatten', 'nudeln', '🍝', [355, 12, 70, 1.5, 3], { a: 'Lasagne Nudeln, Lasagnenudeln, Lasagneblätter, Lasagne Platten', u: { packung: 500, platte: 20 } }),
  F('Kritharaki', 'nudeln', '🍝', [355, 12, 70, 1.5, 3], { a: 'Orzo, Kritharaki Nudeln, Reisnudeln griechisch', u: { packung: 500 } }),
  F('Reis', 'nudeln', '🍚', [350, 7, 77, 0.6, 1.4], { a: 'Langkornreis, Basmati, Basmatireis, Jasminreis, Parboiled Reis, Duftreis, Vollkornreis, Naturreis', d: 0.85, u: { packung: 1000 }, t: 'Vor dem Kochen in einem Sieb waschen, bis das Wasser klar ist – dann klebt er weniger.' }),
  F('Risottoreis', 'nudeln', '🍚', [350, 7, 78, 0.6, 1], { a: 'Arborio, Arborioreis, Carnaroli', d: 0.85, u: { packung: 500 } }),
  F('Mie-Nudeln', 'nudeln', '🍜', [360, 12, 70, 2.5, 3], { a: 'Mienudeln, Asia Nudeln, Asianudeln, Ramen Nudeln, Udon, Eiernudeln', u: { packung: 250 } }),
  F('Reisnudeln', 'nudeln', '🍜', [360, 6, 80, 0.6, 1.6], { a: 'Glasnudeln, Reisbandnudeln', u: { packung: 250 } }),
  F('Couscous', 'nudeln', '🌾', [360, 12, 70, 1.5, 5], { a: 'Cous Cous', d: 0.75 }),
  F('Bulgur', 'nudeln', '🌾', [342, 12, 63, 1.5, 10], { d: 0.8 }),
  F('Quinoa', 'nudeln', '🌾', [370, 14, 58, 6, 7], { d: 0.8 }),
  F('Linsen', 'nudeln', '🫘', [340, 24, 48, 1.5, 11], { a: 'rote Linsen, Berglinsen, Tellerlinsen, Belugalinsen', d: 0.85, u: { packung: 500 } }),

  // ---------- Konserven & Brühe ----------
  F('Gehackte Tomaten', 'konserven', '🥫', [22, 1.2, 3.5, 0.2, 1], { a: 'stückige Tomaten, Tomaten stückig, Dosentomaten, Tomaten aus der Dose, Pizzatomaten, Tomatenstücke, Mutti Tomaten, Polpa', u: { dose: 400, packung: 400 } }),
  F('Geschälte Tomaten', 'konserven', '🥫', [20, 1.1, 3, 0.2, 1], { a: 'Pelati, ganze Tomaten', u: { dose: 400 } }),
  F('Passierte Tomaten', 'konserven', '🥫', [30, 1.4, 4.5, 0.2, 1], { a: 'Passata, Tomatenpassata', u: { packung: 500, flasche: 700, glas: 700 } }),
  F('Tomatenmark', 'konserven', '🥫', [85, 4.3, 13, 0.4, 4], { a: 'Tomatenpaste, Tomaten Mark', u: { tube: 200, dose: 70 } }),
  F('Kokosmilch', 'konserven', '🥥', [180, 1.6, 2.5, 18, 0], { a: 'Kokosnussmilch, Coconut Milk', u: { dose: 400 }, t: 'Ungeschüttelt öffnen: Oben sitzt die feste Kokoscreme, unten das Kokoswasser.' }),
  F('Kidneybohnen', 'konserven', '🫘', [105, 7.5, 14, 0.6, 6.5], { a: 'Kidney Bohnen, rote Bohnen, Chilibohnen', u: { dose: 250 } }),
  F('Kichererbsen', 'konserven', '🫘', [120, 7, 15, 2.6, 5], { a: 'Kichererbse', u: { dose: 240, glas: 240 } }),
  F('Weiße Bohnen', 'konserven', '🫘', [95, 6.5, 13, 0.5, 6], { a: 'Cannellini, Cannellini Bohnen', u: { dose: 250 } }),
  F('Mais', 'konserven', '🌽', [80, 2.7, 13, 1.3, 3], { a: 'Zuckermais, Maiskörner, Mais aus der Dose', u: { dose: 285 } }),
  F('Thunfisch', 'konserven', '🐟', [110, 25, 0, 1, 0], { a: 'Thunfisch in Wasser, Thunfisch im eigenen Saft, Thunfischdose', u: { dose: 150 } }),
  F('Oliven', 'konserven', '🫒', [145, 1, 3, 14, 3], { a: 'schwarze Oliven, grüne Oliven, Kalamata Oliven', u: { glas: 150 } }),
  F('Gewürzgurken', 'konserven', '🥒', [25, 0.4, 4, 0.2, 1], { a: 'saure Gurken, Essiggurken, Cornichons', u: { glas: 360 } }),
  F('Sauerkraut', 'konserven', '🥬', [20, 1.5, 1, 0.3, 2.5], { u: { dose: 500, packung: 500 } }),
  // Brühe: Werte für das Pulver. Bei ml/l wird mit ca. 5 g Pulver pro 250 ml gerechnet.
  F('Brühe', 'konserven', '🍲', [230, 8, 26, 10, 1], { a: 'Gemüsebrühe, Hühnerbrühe, Rinderbrühe, Brühwürfel, Bouillon, Fond, Gemüsefond, Hühnerfond, Instantbrühe, Brühpulver', u: { ml: 0.02, wuerfel: 10, tl: 5, el: 15, glas: 200 }, t: 'Faustregel: 1 TL Pulver auf 250 ml Wasser.' }),

  // ---------- Backen & Nüsse ----------
  F('Mehl', 'backen', '🌾', [345, 10, 71, 1, 4], { a: 'Weizenmehl, Mehl Type 405, Type 405, Weizenmehl 405, Weizenmehl 550, Dinkelmehl', u: { tasse: 120, el: 10, tl: 3, packung: 1000 } }),
  F('Zucker', 'backen', '🧊', [400, 0, 100, 0, 0], { a: 'Haushaltszucker, Kristallzucker, weißer Zucker, brauner Zucker, Rohrzucker, Puderzucker, Würfelzucker', u: { el: 15, tl: 5, packung: 1000, wuerfel: 3 } }),
  F('Vanillezucker', 'backen', '🧊', [400, 0, 98, 0, 0], { a: 'Vanillinzucker, Bourbon Vanillezucker', u: { packung: 8 } }),
  F('Backpulver', 'backen', '🧁', [100, 0, 25, 0, 0], { u: { packung: 15 } }),
  F('Hefe', 'backen', '🍞', [100, 12, 10, 1, 7], { a: 'Trockenhefe, frische Hefe, Hefewürfel', u: { wuerfel: 42, packung: 7 } }),
  F('Speisestärke', 'backen', '🌾', [350, 0.4, 85, 0.1, 0.5], { a: 'Stärke, Maisstärke, Kartoffelstärke, Mondamin', u: { el: 10, tl: 3 } }),
  F('Kakao', 'backen', '🍫', [360, 20, 11, 21, 30], { a: 'Backkakao, Kakaopulver', u: { el: 7, tl: 3 } }),
  F('Rosinen', 'backen', '🍇', [300, 2.5, 66, 0.6, 5], { a: 'Sultaninen' }),
  F('Mandeln', 'backen', '🌰', [580, 21, 7, 50, 12], { a: 'Mandel, gemahlene Mandeln, Mandelblättchen, Mandelstifte' }),
  F('Haselnüsse', 'backen', '🌰', [640, 15, 10, 61, 8], { a: 'Haselnuss, gemahlene Haselnüsse, Haselnusskerne' }),
  F('Walnüsse', 'backen', '🌰', [660, 15, 7, 65, 6], { a: 'Walnuss, Walnusskerne' }),
  F('Cashewkerne', 'backen', '🥜', [580, 18, 27, 44, 3], { a: 'Cashews, Cashew, Cashewnüsse, Cashew Kerne, Cashewnuss', t: 'Ohne Öl in der Pfanne anrösten, bis sie duften – dabei nicht aus den Augen lassen.' }),
  F('Erdnüsse', 'backen', '🥜', [590, 26, 9, 49, 8], { a: 'Erdnuss, Erdnusskerne, geröstete Erdnüsse' }),
  F('Kokosraspeln', 'backen', '🥥', [660, 6, 7, 62, 15], { a: 'Kokosflocken' }),
  F('Sesam', 'backen', '🌾', [570, 18, 10, 50, 12], { a: 'Sesamsaat' }),

  // ---------- Gewürze, Öl & Saucen ----------
  F('Salz', 'gewuerze', '🧂', Z, { z: 1, a: 'Meersalz, Jodsalz, Speisesalz, Salz und Pfeffer, Fleur de Sel, Steinsalz' }),
  F('Pfeffer', 'gewuerze', '🧂', Z, { z: 1, a: 'schwarzer Pfeffer, Pfeffer gemahlen, Pfefferkörner' }),
  F('Paprikapulver', 'gewuerze', '🌶️', Z, { z: 1, a: 'Paprika edelsüß, Paprika rosenscharf, Paprika Gewürz, Paprika Pulver, Paprikagewürz, Paprika geräuchert, geräuchertes Paprikapulver' }),
  F('Currypulver', 'gewuerze', '🍛', Z, { z: 1, a: 'Curry, Curry Pulver, Curry Gewürz, Currygewürz' }),
  F('Currypaste', 'gewuerze', '🍛', [130, 2.5, 12, 7, 4], { a: 'Curry Paste, rote Currypaste, grüne Currypaste, gelbe Currypaste, Thai Currypaste, Red Curry Paste', u: { glas: 110 }, t: 'Zuerst einige Minuten in Öl anbraten – so entfaltet sich das Aroma.' }),
  F('Italienische Kräuter', 'gewuerze', '🌿', Z, { z: 1, a: 'Kräuter der Provence, Pizzagewürz, getrocknete Kräuter, Kräutermischung' }),
  F('Oregano', 'gewuerze', '🌿', Z, { z: 1 }),
  F('Thymian', 'gewuerze', '🌿', Z, { z: 1 }),
  F('Rosmarin', 'gewuerze', '🌿', Z, { z: 1, a: 'Rosmarinzweig' }),
  F('Zimt', 'gewuerze', '🧂', Z, { z: 1, a: 'Zimtpulver, Zimtstange' }),
  F('Kreuzkümmel', 'gewuerze', '🧂', Z, { z: 1, a: 'Cumin, Kumin' }),
  F('Muskatnuss', 'gewuerze', '🌰', Z, { z: 1, a: 'Muskat' }),
  F('Chiliflocken', 'gewuerze', '🌶️', Z, { z: 1, a: 'Chili Flocken, Chilipulver, Cayennepfeffer, Cayenne' }),
  F('Lorbeerblätter', 'gewuerze', '🌿', Z, { z: 1, a: 'Lorbeer, Lorbeerblatt' }),
  F('Knoblauchpulver', 'gewuerze', '🧄', Z, { z: 1, a: 'Knoblauchgranulat' }),
  F('Olivenöl', 'gewuerze', '🫒', [884, 0, 0, 100, 0], { a: 'natives Olivenöl, Olivenöl extra vergine', d: 0.91, u: { flasche: 460 }, t: 'Lichtgeschützt und nicht direkt neben dem Herd lagern – Wärme macht Öl schneller ranzig.' }),
  F('Speiseöl', 'gewuerze', '🫗', [884, 0, 0, 100, 0], { a: 'Öl, Rapsöl, Sonnenblumenöl, Pflanzenöl, Bratöl, Erdnussöl, Sesamöl, Kokosöl, neutrales Öl', d: 0.92, u: { flasche: 920 } }),
  F('Essig', 'gewuerze', '🫗', [20, 0, 0.5, 0, 0], { a: 'Weißweinessig, Apfelessig, Kräuteressig, Branntweinessig, Rotweinessig, Reisessig' }),
  F('Balsamico', 'gewuerze', '🫗', [100, 0.5, 20, 0, 0], { a: 'Aceto Balsamico, Balsamicoessig, Balsamessig, Balsamico Creme, Balsamicocreme', d: 1.1 }),
  F('Sojasauce', 'gewuerze', '🥢', [60, 8, 5, 0.5, 0], { a: 'Sojasoße, Soja Sauce, Soja Soße, Shoyu, Soy Sauce', d: 1.15 }),
  F('Fischsauce', 'gewuerze', '🐟', [35, 5, 3.5, 0, 0], { a: 'Fischsoße, Fisch Sauce, Fish Sauce', d: 1.2 }),
  F('Ketchup', 'gewuerze', '🍅', [100, 1.2, 23, 0.2, 0.5], { a: 'Tomatenketchup, Curry Ketchup, Currysauce' }),
  F('Senf', 'gewuerze', '🫙', [85, 6, 4, 4.5, 3], { a: 'mittelscharfer Senf, Dijon Senf, Dijonsenf, süßer Senf', u: { tube: 200, glas: 250 } }),
  F('Mayonnaise', 'gewuerze', '🥚', [680, 1.1, 1.5, 75, 0], { a: 'Mayo, Majo, Remoulade, Salatmayonnaise', u: { tube: 250, glas: 500 } }),
  F('Zitronensaft', 'gewuerze', '🍋', [25, 0.4, 6.5, 0.1, 0.1], { a: 'Limettensaft' }),

  // ---------- Frühstück & Aufstrich ----------
  F('Haferflocken', 'fruehstueck', '🥣', [370, 13.5, 59, 7, 10], { a: 'zarte Haferflocken, kernige Haferflocken, Hafer Flocken, Porridge, Overnight Oats', d: 0.45, u: { el: 8, packung: 500 } }),
  F('Müsli', 'fruehstueck', '🥣', [370, 10, 60, 8, 8], { a: 'Früchtemüsli, Knuspermüsli, Granola, Crunchy', u: { el: 10, packung: 750 } }),
  F('Cornflakes', 'fruehstueck', '🥣', [380, 7, 84, 0.9, 3], { a: 'Corn Flakes, Cerealien, Frühstücksflocken' }),
  F('Marmelade', 'fruehstueck', '🫙', [250, 0.3, 60, 0.1, 1], { a: 'Konfitüre, Fruchtaufstrich, Erdbeermarmelade, Gelee', u: { glas: 450, tl: 10, el: 25 } }),
  F('Honig', 'fruehstueck', '🍯', [310, 0.4, 77, 0, 0], { a: 'Blütenhonig, Waldhonig', u: { el: 20, tl: 7, glas: 500 } }),
  F('Nuss-Nougat-Creme', 'fruehstueck', '🌰', [540, 6.3, 57, 31, 3.4], { a: 'Nutella, Nussnougatcreme, Schokocreme, Schokoaufstrich', u: { glas: 450, tl: 10, el: 25 } }),
  F('Erdnussbutter', 'fruehstueck', '🥜', [600, 25, 13, 50, 6], { a: 'Erdnussmus, Erdnusscreme, Peanut Butter', u: { glas: 350, tl: 10, el: 20 } }),
  F('Kaffee', 'fruehstueck', '', Z, { z: 1, a: 'Kaffeebohnen, Kaffeepulver, Espresso, Espressobohnen, Kaffeepads, Kaffeekapseln, gemahlener Kaffee, Filterkaffee', u: { packung: 500 } }),
  F('Tee', 'fruehstueck', '🍵', Z, { z: 1, a: 'grüner Tee, schwarzer Tee, Kräutertee, Pfefferminztee, Früchtetee, Kamillentee, Teebeutel' }),

  // ---------- Süßes & Snacks ----------
  F('Schokolade', 'snacks', '🍫', [535, 7, 56, 31, 2], { a: 'Milchschokolade, Vollmilchschokolade, Tafel Schokolade', u: { tafel: 100 } }),
  F('Zartbitterschokolade', 'snacks', '🍫', [560, 8, 32, 42, 10], { a: 'Bitterschokolade, dunkle Schokolade, Kuvertüre, Zartbitter Kuvertüre', u: { tafel: 100 } }),
  F('Kekse', 'snacks', '🍪', [450, 7, 70, 15, 2], { a: 'Keks, Butterkekse, Cookies, Plätzchen', u: { packung: 200 } }),
  F('Chips', 'snacks', '🥔', [540, 6, 50, 34, 4], { a: 'Kartoffelchips, Paprikachips, Tortilla Chips, Nachos', u: { packung: 175 } }),
  F('Gummibärchen', 'snacks', '🍬', [340, 6.5, 77, 0.5, 0], { a: 'Fruchtgummi, Gummibären, Weingummi, Haribo', u: { packung: 200 } }),
  F('Salzstangen', 'snacks', '🥨', [370, 10, 74, 3, 3.5], { a: 'Salzbrezeln, Knabbergebäck', u: { packung: 250 } }),
  F('Popcorn', 'snacks', '🍿', [430, 8, 57, 18, 9], { a: 'Popcornmais' }),
  F('Studentenfutter', 'snacks', '🥜', [470, 13, 38, 29, 7], { a: 'Nussmischung, Trail Mix', u: { packung: 200 } }),
  F('Müsliriegel', 'snacks', '🍫', [400, 6, 60, 14, 5], { a: 'Müsli Riegel, Getreideriegel, Energieriegel', p: 25 }),
  F('Proteinriegel', 'snacks', '🍫', [360, 30, 30, 12, 8], { a: 'Protein Riegel, Eiweißriegel', p: 45 }),

  // ---------- Getränke ----------
  F('Wasser', 'getraenke', '', Z, { z: 1, a: 'Mineralwasser, Sprudelwasser, Sprudel, stilles Wasser, Leitungswasser, Medium Wasser, Selters, warmes Wasser, kaltes Wasser', t: 'Leitungswasser ist in Deutschland streng kontrolliert und deutlich günstiger.' }),
  F('Saft', 'getraenke', '🧃', [45, 0.3, 10, 0.1, 0.2], { a: 'Apfelsaft, Orangensaft, O-Saft, Multivitaminsaft, Fruchtsaft, Traubensaft, Apfelschorle, Schorle', d: 1.04, u: { flasche: 1000, packung: 1000 } }),
  F('Cola', 'getraenke', '🥤', [42, 0, 10.6, 0, 0], { a: 'Coca Cola, Coke, Pepsi, Limo, Limonade, Fanta, Sprite, Spezi, Mezzo Mix', u: { flasche: 1000, dose: 330 } }),
  F('Cola Zero', 'getraenke', '🥤', Z, { z: 1, a: 'Coke Zero, Cola light, Pepsi Max' }),
  F('Eistee', 'getraenke', '🧋', [28, 0, 7, 0, 0], { a: 'Ice Tea, Icetea', u: { flasche: 1500, packung: 500 } }),
  F('Bier', 'getraenke', '🍺', [42, 0.5, 3, 0, 0], { a: 'Pils, Pilsener, Helles, Weizen, Weizenbier, Radler, Alster', u: { flasche: 500, dose: 500 } }),
  F('Alkoholfreies Bier', 'getraenke', '🍺', [25, 0.4, 5, 0, 0], { a: 'Bier alkoholfrei, alkoholfreies Weizen', u: { flasche: 500, dose: 500 } }),
  F('Wein', 'getraenke', '🍷', [72, 0.1, 2.5, 0, 0], { a: 'Weißwein, Rotwein, Rosé, Roséwein, trockener Weißwein, Kochwein', u: { flasche: 750, glas: 150 } }),
  F('Sekt', 'getraenke', '🍾', [80, 0.2, 4, 0, 0], { a: 'Prosecco, Champagner, Crémant', u: { flasche: 750 } }),
  F('Eiswürfel', 'getraenke', '🧊', Z, { z: 1, a: 'Crushed Ice' }),

  // ---------- Drogerie & Haushalt ----------
  F('Toilettenpapier', 'drogerie', '🧻', null, { a: 'Klopapier, WC Papier, Klorolle' }),
  F('Küchenrolle', 'drogerie', '🧻', null, { a: 'Küchenpapier, Haushaltsrolle, Zewa' }),
  F('Taschentücher', 'drogerie', '🧻', null, { a: 'Papiertaschentücher, Tempo' }),
  F('Spülmittel', 'drogerie', '🧴', null, { a: 'Spüli, Geschirrspülmittel' }),
  F('Spülmaschinentabs', 'drogerie', '🧼', null, { a: 'Geschirrspültabs, Spülmaschinen Tabs, Tabs, Klarspüler, Spülmaschinensalz' }),
  F('Waschmittel', 'drogerie', '🧺', null, { a: 'Flüssigwaschmittel, Colorwaschmittel, Vollwaschmittel, Waschpulver, Weichspüler' }),
  F('Putzmittel', 'drogerie', '🧴', null, { a: 'Allzweckreiniger, Badreiniger, WC Reiniger, Glasreiniger, Reiniger, Essigreiniger' }),
  F('Schwämme', 'drogerie', '🧽', null, { a: 'Schwamm, Spülschwamm, Spülschwämme, Putzschwamm, Spültuch, Spültücher' }),
  F('Müllbeutel', 'drogerie', '🗑️', null, { a: 'Mülltüten, Mülltüte, Müllsäcke, Biobeutel, Gelbe Säcke' }),
  F('Backpapier', 'drogerie', '📜', null, { a: 'Backpapierrolle' }),
  F('Alufolie', 'drogerie', '📜', null, { a: 'Aluminiumfolie, Frischhaltefolie, Gefrierbeutel' }),
  F('Duschgel', 'drogerie', '🧴', null, { a: 'Duschbad, Shower Gel' }),
  F('Shampoo', 'drogerie', '🧴', null, { a: 'Haarshampoo, Spülung, Conditioner' }),
  F('Deo', 'drogerie', '🧴', null, { a: 'Deodorant, Deoroller, Deospray' }),
  F('Seife', 'drogerie', '🧼', null, { a: 'Handseife, Flüssigseife' }),
  F('Zahnpasta', 'drogerie', '🪥', null, { a: 'Zahncreme' }),
  F('Zahnbürste', 'drogerie', '🪥', null, { a: 'Zahnbürsten, Aufsteckbürsten' }),
  F('Rasierer', 'drogerie', '🪒', null, { a: 'Rasierklingen, Klingen, Rasierschaum' }),
  F('Pflaster', 'drogerie', '🩹', null, { a: 'Wundpflaster' }),
  F('Batterien', 'drogerie', '🔋', null, { a: 'Batterie, AA Batterien, AAA Batterien' }),

  // ---------- Sonstiges ----------
  F('Blumen', 'sonstiges', '💐', null, { a: 'Blumenstrauß, Strauß Blumen' }),
];

export const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
export const FOOD_BY_ID = new Map(FOODS.map(f => [f.id, f]));
