// Ausführen: node tests/builder.test.js
var assert = require('assert');
var D = require('../js/data.js');
var PB = require('../js/prompt-builder.js');

var passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok  ' + name); }
function example(modeId) {
  var m = PB.getMode(D, modeId), s = PB.defaultState(D);
  s.mode = modeId; Object.assign(s, m.defaults || {}, JSON.parse(JSON.stringify(m.example)));
  return s;
}
var SECTIONS = ['## Rolle', '## Kontext', '## Aufgabe', '## Ausgabeformat', '## Qualitätsregeln', '## Für ein noch besseres Ergebnis'];

D.modes.forEach(function (m) {
  test('Beispiel ' + m.id + ' ergibt vollständigen Prompt', function () {
    var p = PB.buildPrompt(example(m.id), D);
    SECTIONS.forEach(function (h) { assert.ok(p.indexOf(h) !== -1, m.id + ' fehlt ' + h); });
    assert.ok(p.indexOf(m.example.thema) !== -1, 'Thema fehlt');
    assert.ok(/fehlen.*\n.*„wichtig“ und „optional“/.test(p), 'Optimierungsauftrag fehlt');
    assert.ok(p.indexOf('Biete an, das Ergebnis zu überarbeiten') !== -1);
    assert.ok(p.indexOf('Erfinde keine Quellen oder Fakten.') !== -1);
    assert.ok(p.indexOf('[unsicher]') !== -1 && p.indexOf('Das solltest du prüfen') !== -1);
    assert.ok(p.indexOf('[Thema ergänzen]') === -1);
    assert.ok(p.indexOf('undefined') === -1 && p.indexOf('NaN') === -1 && !/\{[a-zA-Z]+\}/.test(p), 'Platzhalter-Reste');
    // Sections appear in order
    var pos = SECTIONS.map(function (h) { return p.indexOf(h); });
    assert.deepStrictEqual(pos.slice().sort(function (a, b) { return a - b; }), pos);
  });
});

test('Leere Felder erzeugen keine Zeilen und keine leeren Labels', function () {
  var s = PB.defaultState(D); s.thema = 'Testthema';
  var p = PB.buildPrompt(s, D);
  ['Fach:', 'Jahrgang:', 'Lerngruppe:', 'Lernziel', 'Vorwissen', 'Schulform', 'interaktiven', 'kritisches Denken', 'Differenzier', 'Geräte:', 'Tool:', 'Ich lade zusätzlich']
    .forEach(function (x) { assert.ok(p.indexOf(x) === -1, 'unerwartet: ' + x); });
  assert.ok(!/:\s*$/m.test(p.replace(/Darin:$/m, '')), 'Label ohne Wert');
  assert.ok(!/^- \s*$/m.test(p), 'leerer Spiegelstrich');
  assert.ok(p.indexOf('Erstelle') !== -1 || p.indexOf('Entwickle') !== -1);
  assert.ok(p.indexOf('Stundeneinstieg zum Thema') !== -1, 'leere Fach-Klammer');
});

test('Fehlendes Thema wird markiert', function () {
  assert.ok(PB.buildPrompt(PB.defaultState(D), D).indexOf('[Thema ergänzen]') !== -1);
});

test('Digital / analog / hybrid', function () {
  var s = example('material');
  s.einsatz = 'analog'; s.geraet = ['iPad']; s.tool = 'Taskcards';
  var p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('Einsatz: analog') !== -1 && p.indexOf('iPad') === -1 && p.indexOf('Taskcards') === -1);
  s.einsatz = 'digital'; p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('Einsatz: digital. Geräte: iPad. Tool: Taskcards.') !== -1);
  s.einsatz = 'hybrid'; p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('Einsatz: hybrid') !== -1);
});

test('Zweig und Differenzierung', function () {
  var s = example('material'); var p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('Schulform / Zweig: Realschule, Hauptschule') !== -1);
  assert.ok(p.indexOf('### Differenzierung') !== -1 && p.indexOf('drei Niveaustufen') !== -1 && p.indexOf('sprachsensibel') !== -1);
  assert.ok(p.indexOf('Differenziere auf diese Zweige: Realschule, Hauptschule.') !== -1);
  s.diff = 'Nein'; p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('### Differenzierung') === -1 && p.indexOf('Niveaustufen') === -1);
});

test('Ausgabeformat, Länge, Sprache', function () {
  var s = example('stunde'); s.stundenMaterial = []; s.format = 'Checkliste'; s.laenge = 'kurz'; s.sprache = 'Englisch';
  var p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('- Format: Checkliste') !== -1 && p.indexOf('Länge: kurz – höchstens etwa 1 DIN-A4-Seite') !== -1 && p.indexOf('Sprache des Ergebnisses: Englisch') !== -1);
});

test('Klassenarbeit: je Zweig eine Fassung', function () {
  var p = PB.buildPrompt(example('klassenarbeit'), D);
  ['Hauptschule', 'Realschule', 'Gymnasium'].forEach(function (z) { assert.ok(p.indexOf('„Fassung ' + z + '“') !== -1, z); });
  assert.ok(p.indexOf('die Summe muss genau 50 ergeben') !== -1);
  assert.ok(p.indexOf('AFB I 30 %, AFB II 45 %, AFB III 25 %') !== -1);
  var s = example('klassenarbeit'); s.zweige = ['Realschule'];
  assert.ok(PB.buildPrompt(s, D).indexOf('Fassung') === -1, 'bei einem Zweig keine Fassungen');
  s.kaArt = 'Test'; assert.ok(PB.buildPrompt(s, D).indexOf('Erstelle einen Test') !== -1);
});

test('Erwartungshorizont: Bezug und Zweig-Erwartungen', function () {
  var s = example('ewh'); var p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('oben in diesem Chat erstellten Klassenarbeit') !== -1);
  assert.ok(p.indexOf('Aufgabe | erwartete Leistung | Punkte | Anforderungsbereich') !== -1);
  assert.ok(p.indexOf('getrennt je Zweig') !== -1 && p.indexOf('Anteil von 10 %') !== -1);
  s.bezug = 'Aufgaben füge ich unten im Chat ein';
  assert.ok(PB.buildPrompt(s, D).indexOf('unten im Chat einfüge') !== -1);
});

test('Abgehakte Upload-Punkte erscheinen im Prompt und nicht mehr als Beispiel', function () {
  var s = example('klassenarbeit'); s.uploads = ['operatoren', 'kc', 'raster' /* nicht in diesem Modus */];
  var p = PB.buildPrompt(s, D);
  var ctx = p.split('## Aufgabe')[0], opt = p.split('## Für ein noch besseres Ergebnis')[1];
  assert.ok(ctx.indexOf('Ich lade zusätzlich hoch bzw. füge ein: Auszüge aus dem Kerncurriculum; Operatorenliste.') !== -1);
  assert.ok(!/[:;] Operatorenliste[;.]/.test(opt) && opt.indexOf('Auszüge aus dem Kerncurriculum') === -1);
  assert.ok(opt.indexOf('Notenschlüssel des Fachbereichs') !== -1, 'modusspezifisches Beispiel');
  assert.ok(p.indexOf('Bewertungsraster') === -1);
});

test('Rückfragen immer zuerst, kompakt/ausführlich', function () {
  var s = example('reihe');
  D.modes.forEach(function (m) {
    var q = PB.buildPrompt(example(m.id), D).split('## Qualitätsregeln')[1];
    assert.ok(q.indexOf('- Kläre Unklarheiten immer zuerst') === 1, m.id + ': Rückfragen als erste Regel');
  });
  assert.ok(!('rueckfragen' in PB.defaultState(D)), 'kein Schalter mehr');
  var lang = PB.buildPrompt(s, D); s.promptStil = 'kompakt'; var kurz = PB.buildPrompt(s, D);
  assert.ok(kurz.length < lang.length && kurz.indexOf('Für ein noch besseres Ergebnis') !== -1);
});

test('Reihenfolge Planen: Einstieg, Stunde, Reihe', function () {
  assert.deepStrictEqual(D.modes.filter(function (m) { return m.group === 'Planen'; }).map(function (m) { return m.id; }), ['einstieg', 'stunde', 'reihe']);
});

test('Unterrichtsstunde: passende Materialien anfordern', function () {
  var s = example('stunde'); var p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('diese Materialien vollständig ausformuliert und direkt einsetzbar: Arbeitsblatt, Tafelbild.') !== -1);
  s.stundenMaterial = []; assert.ok(PB.buildPrompt(s, D).indexOf('Materialien vollständig') === -1);
});

test('Visualisierung nur bei Material, Slides, Klassenarbeit', function () {
  ['material', 'slides', 'klassenarbeit', 'stunde', 'reihe', 'einstieg', 'ewh'].forEach(function (id) {
    var s = example(id); s.visualisierung = ['Diagramme']; s.visualWunsch = 'Farbe je Niveau';
    var p = PB.buildPrompt(s, D), soll = ['material', 'slides', 'klassenarbeit'].indexOf(id) !== -1;
    var fmt = p.split('## Ausgabeformat')[1].split('## Qualitätsregeln')[0];
    assert.strictEqual(fmt.indexOf('Gewünschte Visualisierungen: Diagramme.') !== -1, soll, id);
    assert.strictEqual(fmt.indexOf('Wünsche zur Visualisierung: Farbe je Niveau') !== -1, soll, id);
  });
});

test('iPad-Schulregel nur bei iPad, Ausnahme per Schalter', function () {
  var s = example('material'); s.einsatz = 'digital'; s.geraet = ['Laptop'];
  assert.ok(PB.buildPrompt(s, D).indexOf('OneNote') === -1);
  s.geraet = ['iPad']; var p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('Schulregel für iPads: Geschrieben wird grundsätzlich auf Papier') !== -1);
  assert.ok(p.indexOf('Lückentexten') !== -1 && p.indexOf('längere Schreibaufgaben deshalb auf Papier') !== -1);
  s.ipadDigitalSchreiben = true; p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('IServ') !== -1 && p.indexOf('längere Schreibaufgaben deshalb auf Papier') === -1);
  s.einsatz = 'analog'; p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('OneNote') === -1, 'analog: keine iPad-Regel');
});

test('Arbeitsblatt-Vorlage: automatisch, Lücken gefüllt', function () {
  var s = example('material'); // Mathematik, Jg. 7, Arbeitsblatt, ohne Lernziel
  var p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('## Gestaltung des Arbeitsblatts') > p.indexOf('## Ausgabeformat'));
  assert.ok(p.indexOf('Aufgabenblatt für Mathematik, Klasse 7 der Sekundarstufe I (Klassen 5–10), zum Thema „Prozentrechnung am Marktstand des Zauberdorfs Kerbelstein“, mit dem Lernziel einem klar formulierten') !== -1);
  assert.ok(p.indexOf('und 5 Aufgaben.') !== -1 && p.indexOf('darf mehrere Blätter umfassen') !== -1);
  assert.ok(p.indexOf('Mappenfarbe') === -1 && p.indexOf('#466BB0') === -1 && p.indexOf('Keine Fach- oder Jahrgangsfarben') !== -1, 'keine Fachfarbe');
  assert.ok(p.indexOf('Zahlen nie in Handschrift: Aufgabenziffern in Verdana Bold') !== -1 && p.indexOf('Aufgabenziffern 32 pt') === -1, 'sachliche Ziffern');
  // Designsheet der Schule
  assert.ok(p.indexOf('Petrol #06344A') !== -1 && p.indexOf('Patrick Hand') !== -1 && p.indexOf('Verdana für Fließtext') !== -1 && p.indexOf('Atkinson') === -1);
  assert.ok(p.indexOf('die Null wird als normale 0 geschrieben') !== -1);
  var fmt = p.split('## Ausgabeformat')[1].split('## Gestaltung des Arbeitsblatts')[0];
  assert.ok(fmt.indexOf('Format:') === -1 && fmt.indexOf('Länge:') === -1, 'kein zweites Ausgabeformat beim Arbeitsblatt');
  assert.ok(p.indexOf('Vorrang:') === -1, 'ohne Visualisierungswünsche kein Vorrang-Satz');
  var v = example('material'); v.visualWunsch = 'Bunte Hintergrundflächen je Aufgabe';
  var pv = PB.buildPrompt(v, D);
  assert.ok(pv.indexOf('Wünsche zur Visualisierung: Bunte Hintergrundflächen je Aufgabe') !== -1 && pv.indexOf('Vorrang: Meine Wünsche zur Visualisierung') > pv.indexOf('## Gestaltung des Arbeitsblatts'));
  assert.ok(p.indexOf('Seitenränder 12 mm') !== -1 && p.indexOf('höchstens vier Aufgaben') !== -1);
  assert.ok(p.indexOf('niemals mit einer Wellenlinie unterstreichen') !== -1, 'keine gekringelte Unterstreichung');
  assert.ok(p.indexOf('Source Serif') === -1 && p.indexOf('DM Sans') === -1 && p.indexOf('16–20 mm') === -1, 'alte Vorgaben entfernt');
  assert.ok(p.indexOf('class="ab-blatt"') !== -1, 'HTML nutzt Klassen des Designsheets');
  assert.ok(!/\[(Fach|Stufe|Thema|Lernziel|Anzahl)\]/.test(p));
  s.lernziel = 'Die Lernenden berechnen Rabatte.'; s.aufgabenAnzahl = 8; s.jahrgang = '11'; s.fach = 'Politik-Wirtschaft';
  p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('Klasse 11 der Sekundarstufe II') !== -1 && p.indexOf('mit dem Lernziel „Die Lernenden berechnen Rabatte.“ und 8 Aufgaben') !== -1);
  assert.ok(p.indexOf('Lass keinen Baustein über einen Seitenumbruch laufen') !== -1);
  assert.ok(p.indexOf('Ausgabe: Gib das Arbeitsblatt als eine vollständige, druckfertige HTML-Datei aus') !== -1, 'Standard: HTML');
  s.abFormat = 'Word-Datei (DOCX)'; p = PB.buildPrompt(s, D);
  assert.ok(p.indexOf('als Word-Datei (DOCX)') !== -1 && p.indexOf('druckfertige HTML-Datei aus:') === -1);
  s.abFormat = 'Nur Text'; assert.ok(PB.buildPrompt(s, D).indexOf('als gut gegliederten Text aus') !== -1);
  assert.ok(PB.buildPrompt(s, D).trim().split('## Gestaltung des Arbeitsblatts')[1].indexOf('## Qualitätsregeln') !== -1, 'Abschnitt vor den Qualitätsregeln');
  s.materialTyp = 'Quiz'; assert.ok(PB.buildPrompt(s, D).indexOf('Gestaltung des Arbeitsblatts') === -1);
  var st = example('stunde'); // Deutsch, mit Arbeitsblatt
  assert.ok(PB.buildPrompt(st, D).indexOf('## Gestaltung des Arbeitsblatts') !== -1 && PB.buildPrompt(st, D).indexOf('#BD3D42') === -1);
  st.stundenMaterial = ['Tafelbild']; assert.ok(PB.buildPrompt(st, D).indexOf('Gestaltung des Arbeitsblatts') === -1);
  assert.ok(PB.buildPrompt(example('klassenarbeit'), D).indexOf('Gestaltung des Arbeitsblatts') === -1);
});

test('Anderes Fach', function () {
  var s = example('material'); s.fach = 'Anderes'; s.fachAnders = 'Darstellendes Spiel';
  assert.ok(PB.buildPrompt(s, D).indexOf('Fach: Darstellendes Spiel') !== -1);
});

test('PII-Erkennung', function () {
  assert.deepStrictEqual(PB.findPII('Kontakt: max@schule.de'), ['E-Mail-Adresse']);
  assert.deepStrictEqual(PB.findPII('Tel. 0511 123456'), ['Telefonnummer']);
  assert.deepStrictEqual(PB.findPII('geb. am 03.04.2011'), ['Geburtsdatum']);
  assert.deepStrictEqual(PB.findPII('Jahrgang 8, 45 Minuten, Kapitel 3.2, 90 Punkte'), []);
});

test('sanitizeState verwirft Fremdes und falsche Typen', function () {
  var s = PB.sanitizeState({ mode: 'gibtsnicht', thema: 42, fach: 'Physik', evil: '<x>', zweige: ['Gymnasium', 5], afbVert: { I: 50, II: 'x' } }, D);
  assert.strictEqual(s.mode, 'einstieg'); assert.strictEqual(s.thema, ''); assert.strictEqual(s.fach, 'Physik');
  assert.ok(!('evil' in s)); assert.deepStrictEqual(s.zweige, ['Gymnasium']); assert.deepStrictEqual(s.afbVert, { I: 50, II: 40, III: 20 });
});

test('Qualitätsanzeige zählt Pflicht- und empfohlene Felder', function () {
  var q = PB.quality(PB.defaultState(D), D);
  assert.ok(q.missingRequired.indexOf('Thema') !== -1 && q.done < q.total);
  q = PB.quality(example('klassenarbeit'), D);
  assert.strictEqual(q.missingRequired.length, 0);
});

console.log('\n' + passed + ' Tests grün');
