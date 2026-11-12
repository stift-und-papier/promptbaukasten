# Prompt-Baukasten für Lehrkräfte

Eine kleine Web-App. Du klickst Felder an und erhältst einen fertigen, kopierbaren Prompt. Damit erstellst du in einer beliebigen KI Unterrichtsinhalte, Klassenarbeiten und Erwartungshorizonte.
Die App ruft selbst keine KI auf. Sie stellt keine Netzwerkanfragen. Alle Daten bleiben im Browser (localStorage).

## Starten

- **Offline:** `index.html` doppelklicken. Es braucht weder Installation noch Internet.
- **Tests der Prompt-Logik** (Node.js nötig):

  ```bash
  node tests/builder.test.js
  ```

## Bedienung

1. Oben einen **Modus** wählen: Planen (Stundeneinstieg, Unterrichtsstunde, Reihenplanung), Material (Material, Slides) oder Prüfen (Klassenarbeit, Erwartungshorizont).
2. Felder ausfüllen. Pflicht ist nur das **Thema**. Die Anzeige „Prompt-Qualität“ zeigt, welche Angaben das Ergebnis noch verbessern würden.
3. Unter **„Das hilft der KI zusätzlich“** abhaken, was du zusammen mit dem Prompt hochlädst. Die KI fragt diese Unterlagen dann nicht erneut ab. Anonymisiere Dokumente vorher.
4. Den Prompt **kopieren** oder als **.txt / .md** herunterladen und in die KI deiner Wahl einfügen.
5. Unter **„Nachschärfen“** stehen Folgeprompts für denselben Chat (kürzer, einfacher, mehr Aufgaben …).

Weitere Funktionen:

| Funktion | Wo |
|---|---|
| Beispiel laden (Fantasie-Thema je Modus) | Kopfleiste |
| Profile speichern, laden, als JSON exportieren und importieren | Kopfleiste → Profile |
| Verlauf der letzten 10 kopierten oder heruntergeladenen Prompts | Kopfleiste → Verlauf |
| Zurücksetzen (mit „Rückgängig“) | Kopfleiste |
| Erwartungshorizont zur Klassenarbeit | Modus Klassenarbeit → „Erwartungshorizont dazu erstellen“ |
| Prompt kompakt oder ausführlich | Karte „Ausgabe“ |
| Passende Arbeitsblätter und Materialien zur Stunde mit anfordern | Modus Unterrichtsstunde |
| iPad-Schulregel (Papier, Foto in OneNote; Ausnahme z. B. gemeinsames Dokument auf IServ) | erscheint automatisch, wenn „digital“/„hybrid“ und Gerät „iPad“ gewählt sind; Texte in `texte.ipadRegel` |
| Gestaltungsvorlage für Arbeitsblätter nach dem Designsheet der Schule (Farben, Patrick Hand + Verdana, Kästen, 12 mm Rand, höchstens 4 Aufgaben pro Blatt, Lösungsübersicht; mehrere Blätter erlaubt). Eigene Visualisierungswünsche haben Vorrang. | wird automatisch angehängt bei Material → „Arbeitsblatt“ oder Unterrichtsstunde → Material „Arbeitsblatt“; Text in `arbeitsblatt`. Ausgabe wählbar als druckfertige HTML-Datei (Standard), Word-Datei oder nur Text (`abAusgabe`) |
| Wünsche zur Visualisierung (optional) | Modi Material, Slides, Klassenarbeit |
| Dunkelmodus ein/aus | Schalter in der Kopfleiste. Ohne eigene Wahl folgt die App der Systemeinstellung; die Wahl wird im Browser gespeichert. |

Laden, Zurücksetzen, Wiederherstellen und Löschen lassen sich über den Toast „Rückgängig“ zurücknehmen.

**Tastenkürzel:** `⌘/Strg + Enter` kopiert den Prompt. `Alt + 1` bis `Alt + 7` wechselt den Modus. Alle Felder lassen sich mit Tab und den Pfeiltasten bedienen.

## Hosting auf GitHub Pages

1. Neues Repository anlegen und den Ordnerinhalt hochladen (`index.html` liegt im Wurzelverzeichnis).
2. Im Repository: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“**, Branch `main`, Ordner `/ (root)`.
3. Nach etwa einer Minute ist die App unter `https://<nutzername>.github.io/<repository>/` erreichbar.

Einen Build-Schritt gibt es nicht. Die App nutzt klassische `<script>`-Tags und läuft deshalb unter `file://` und auf GitHub Pages gleich.

## Optionen anpassen (`js/data.js`)

Alle Texte und Auswahlmöglichkeiten stehen in `js/data.js`. Die Logik bleibt dabei unverändert.

- **Option ergänzen**, z. B. ein Fach: Im Feld `fach` den Namen zur Liste `options` hinzufügen.
- **Feldtext im Prompt ändern:** `tpl` des Feldes bearbeiten. `{v}` steht für den gewählten Wert. Für Sonderfälle kann `tpl` auch eine Funktion `(wert, zustand) => Text` sein.
- **Neues Feld:** Eintrag in `fields` anlegen (`type`, `label`, `def`, `section`, `tpl`). Dann die ID in eine Karte (`cards`) oder in die `fields` eines Modus eintragen.
  - Typen: `select`, `seg` (Einzelauswahl), `chips` (Mehrfachauswahl), `text`, `textarea`, `stepper`, `toggle`, `range`, `afbVert`, `action`.
  - `section` legt fest, wo die Zeile im Prompt landet: `kontext`, `aufgabe`, `methodik`, `diff`, `einsatz` oder `format`.
  - `hideIn: ['ewh']` blendet das Feld in einem Modus aus. `showIf: function (s) { … }` blendet es abhängig von anderen Feldern ein.
  - `rec: true` zählt das Feld für die Anzeige „Prompt-Qualität“. `pii: true` aktiviert die Datenschutz-Warnung.
- **Modus anpassen:** In `modes` stehen je Modus Rolle, Aufgabe, Detailhinweise, Ausgabeformat, zusätzliche Upload-Vorschläge (`uploads`) und das Beispiel.
- **Upload-Vorschläge:** Der Katalog steht in `uploadCatalog`. `uploadsBase` gilt für alle Modi.
- **Feste Texte** (Qualitätsregeln, Abschnitt „Für ein noch besseres Ergebnis“, Hinweise): `texte`.
- **Nachschärfen-Bausteine:** `nachschaerfen`.

Nach Änderungen `node tests/builder.test.js` ausführen.

## Dateien

```
index.html             Grundgerüst der Seite
css/style.css          Gestaltung (hell/dunkel automatisch)
js/data.js             alle Optionen und Texte
js/prompt-builder.js   reine Funktionen: Zustand → Prompt-Text
js/app.js              Oberfläche, Zustand, localStorage
tests/builder.test.js  Node-Tests für den Prompt-Builder
```

## Datenschutz

- Die App sendet nichts. Eine Content-Security-Policy verbietet zusätzlich Netzwerkverbindungen.
- Gespeichert werden nur deine Eingaben, Profile und der Verlauf, und zwar nur im localStorage dieses Browsers. Wer die Browserdaten löscht, löscht auch diese.
- Freitextfelder warnen bei E-Mail-Adressen, Telefonnummern und Datumsangaben, die wie Geburtsdaten aussehen. Die Prüfung ist bewusst einfach und ersetzt keine eigene Kontrolle.
