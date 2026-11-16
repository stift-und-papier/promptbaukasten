/*
 * Prompt-Baukasten – Konfiguration.
 * Alle Optionen, Feldtexte und Prompt-Bausteine stehen hier.
 * Felder: type = select | seg (Einzelauswahl) | chips (Mehrfachauswahl) | text | textarea
 *         | stepper | toggle | range | afbVert | action
 * tpl:    Text für den Prompt. "{v}" wird durch den Wert ersetzt (Listen mit Komma).
 *         Alternativ eine Funktion (wert, zustand) => Text oder Liste von Texten.
 * section: wohin die Zeile im Prompt kommt (kontext, aufgabe, methodik, diff, einsatz, format).
 * hideIn: Modi, in denen das Feld ausgeblendet ist. showIf: Funktion (zustand) => true/false.
 * rec:    empfohlenes Feld (zählt für die Anzeige „Prompt-Qualität“).
 */
var PB_DATA = (function () {
  function list(a) { return (a || []).join(', '); }

  var ZWEIGE = ['Hauptschule', 'Realschule', 'Gymnasium', 'Gemischte Lerngruppe (KGS)'];

  var fields = {
    // ---------- Grundlagen ----------
    fach: {
      type: 'select', label: 'Fach', def: '', rec: true, section: 'kontext',
      options: ['Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Latein', 'Mathematik', 'Biologie', 'Chemie',
        'Physik', 'Informatik', 'Naturwissenschaften', 'Geschichte', 'Politik-Wirtschaft', 'Erdkunde',
        'Gesellschaftslehre', 'Wirtschaft', 'Religion', 'Werte und Normen', 'Kunst', 'Musik', 'Sport',
        'Technik', 'Anderes'],
      tpl: function (v, s) { return 'Fach: ' + (v === 'Anderes' ? (s.fachAnders || '') : v); }
    },
    fachAnders: {
      type: 'text', label: 'Anderes Fach', def: '', placeholder: 'z. B. Darstellendes Spiel',
      showIf: function (s) { return s.fach === 'Anderes'; }
    },
    jahrgang: {
      type: 'seg', label: 'Jahrgang', def: '', rec: true, section: 'kontext',
      options: ['5', '6', '7', '8', '9', '10', '11', '12', '13'],
      // Die Oberstufe ergibt sich aus dem Jahrgang, ein eigener Zweig-Button ist überflüssig.
      tpl: function (v) { return 'Jahrgang: ' + v + (Number(v) >= 11 ? ' (Oberstufe)' : ''); }
    },
    thema: {
      type: 'text', label: 'Thema', def: '', required: true, pii: true,
      placeholder: 'z. B. Photosynthese, Kurzgeschichte, lineare Funktionen'
    },
    bundesland: {
      type: 'select', label: 'Bundesland', def: 'Niedersachsen', section: 'kontext',
      options: ['Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen',
        'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland',
        'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'],
      // Der Kerncurriculum-Bezug gehört immer dazu, deshalb hängt er am Bundesland statt an einem eigenen Schalter.
      tpl: function (v) {
        return ['Bundesland: ' + v, 'Orientiere dich am Kerncurriculum bzw. Lehrplan des Landes ' + v +
          ' für dieses Fach und diesen Jahrgang. Erfinde keine Kompetenzformulierungen; markiere Zuordnungen, die du nicht sicher weißt, mit [unsicher].'];
      }
    },
    zweige: {
      type: 'chips', label: 'Schulform / Zweig', hint: 'Mehrfachauswahl möglich', def: [], rec: true,
      section: 'kontext', options: ZWEIGE, tpl: 'Schulform / Zweig: {v}'
    },
    recherche: {
      type: 'toggle', label: 'Recherche im Internet', def: false, section: 'recherche', hideIn: ['ewh'],
      hint: 'Die KI sucht aktuelle Quellen und belegt ihre Angaben. Klappt nur, wenn die KI Zugriff auf das Internet hat.',
      tpl: function (v, s) {
        var z = s.rechercheZeitraum;
        return [
          'Recherchiere zum Thema im Internet und stütze Fakten, Zahlen und Beispiele auf verlässliche Quellen (z. B. Behörden, wissenschaftliche Einrichtungen, Bildungsserver, Qualitätsmedien).',
          // „letzte 30 Tage“ → „in den letzten 30 Tagen“ (Dativ Plural)
          z && z !== 'beliebig' ? 'Verwende nur Quellen, die in den ' + z.replace('letzte', 'letzten') + 'n (gerechnet ab heute) veröffentlicht oder aktualisiert wurden. Findest du dazu nichts Verlässliches, sage das, statt auf ältere Quellen auszuweichen.' : '',
          'Belege jede recherchierte Angabe mit Titel, Herausgeber, Datum und Link und gib am Ende ein Quellenverzeichnis aus. Erfinde keine Quellen oder Links.',
          'Hast du keinen Internetzugriff, sage das gleich zu Beginn und kennzeichne zeitkritische Angaben mit [unsicher].'
        ];
      }
    },
    rechercheZeitraum: {
      type: 'seg', label: 'Wie aktuell sollen die Quellen sein?', def: 'beliebig', hideIn: ['ewh'],
      options: ['beliebig', 'letzte 7 Tage', 'letzte 30 Tage', 'letzte 12 Monate', 'letzte 5 Jahre'],
      showIf: function (s) { return s.recherche; }
    },

    // ---------- Lerngruppe ----------
    dauer: {
      type: 'stepper', label: 'Dauer', unit: 'Minuten', def: 45, min: 5, max: 360, step: 5, quick: [15, 45, 90],
      section: 'kontext', hideIn: ['einstieg', 'klassenarbeit', 'ewh'],
      labelByMode: { reihe: 'Dauer je Stunde' },
      tpl: function (v, s) { return (s.mode === 'reihe' ? 'Dauer je Stunde: ' : 'Zeitrahmen: ') + v + ' Minuten'; }
    },
    lerngruppe: {
      type: 'textarea', label: 'Lerngruppe', def: '', rec: true, pii: true, section: 'kontext',
      placeholder: 'z. B. lebhaft, viele Sprachanfänger; KEINE Namen', tpl: 'Lerngruppe: {v}'
    },
    lernziel: {
      type: 'textarea', label: 'Lernziel / Kompetenz', optional: true, def: '', rec: true, pii: true, section: 'kontext',
      placeholder: 'z. B. Die Lernenden erklären …', tpl: 'Lernziel / Kompetenz: {v}'
    },
    vorwissen: {
      type: 'textarea', label: 'Vorwissen bzw. bisher behandelte Themen', optional: true, def: '', rec: true, pii: true,
      section: 'kontext', placeholder: 'z. B. Grundbegriffe bekannt, letzte Stunde: …', tpl: 'Vorwissen / bisher behandelt: {v}'
    },

    // ---------- Differenzierung ----------
    // Keine Auswahl = keine Differenzierung; ein eigener Ja/Nein-Schalter wäre ein überflüssiger Klick.
    diffArt: {
      type: 'chips', label: 'Art der Differenzierung', hint: 'Leer lassen, wenn nicht differenziert werden soll', def: [], section: 'diff',
      options: ['Drei Niveaustufen', 'Hilfekarten', 'Wahlaufgaben', 'Sprachsensibel', 'Zusatzaufgaben für Schnelle'],
      tpl: function (v) {
        var map = {
          'Drei Niveaustufen': 'Differenziere in drei Niveaustufen (grundlegend, mittel, erweitert) und kennzeichne sie deutlich, ohne schwächere Lernende bloßzustellen (z. B. Symbole statt „leicht/schwer“).',
          'Hilfekarten': 'Ergänze gestufte Hilfekarten (Tipp 1: Denkanstoß, Tipp 2: Teilschritt, Tipp 3: Lösungsweg).',
          'Wahlaufgaben': 'Biete Wahlaufgaben an, die zum selben Lernziel führen.',
          'Sprachsensibel': 'Gestalte sprachsensibel: Wortspeicher mit Artikeln, Satzanfänge, kurze Sätze, Fachbegriffe erklärt.',
          'Zusatzaufgaben für Schnelle': 'Ergänze Zusatzaufgaben für schnelle Lernende, die vertiefen statt nur mehr vom Gleichen zu verlangen.'
        };
        return v.map(function (a) { return map[a] || a; });
      }
    },
    diffZweige: {
      type: 'chips', label: 'Differenzieren auf Zweige', def: [], options: ZWEIGE, optionsFrom: 'zweige', section: 'diff',
      showIf: function (s) { return (s.zweige || []).length !== 1; },
      tpl: 'Differenziere auf diese Zweige und mache die Unterschiede in Anspruch, Hilfen und Umfang sichtbar: {v}.'
    },

    // ---------- Methodik und Einsatz ----------
    einsatz: {
      type: 'seg', label: 'Einsatz', def: 'analog', options: ['analog', 'digital', 'hybrid'], section: 'einsatz',
      hideIn: ['ewh'],
      tpl: function (v, s) {
        var dev = (s.geraet || []).length ? ' Geräte: ' + list(s.geraet) + '.' : '';
        var tool = s.tool ? ' Tool: ' + s.tool + '.' : '';
        if (v === 'analog') return 'Einsatz: analog (Papier, Heft, Tafel). Plane ohne digitale Endgeräte.';
        var line = v === 'digital'
          ? 'Einsatz: digital.' + dev + tool + ' Gestalte alles so, dass es am Gerät gut bearbeitet bzw. gezeigt werden kann.'
          : 'Einsatz: hybrid – verbinde analoge und digitale Phasen sinnvoll.' + dev + tool;
        if ((s.geraet || []).indexOf('iPad') === -1) return line;
        return [line, texte.ipadRegel, s.ipadDigitalSchreiben ? texte.ipadAusnahme : texte.ipadLangeAufgaben];
      }
    },
    geraet: {
      type: 'chips', label: 'Gerät', def: [], options: ['iPad', 'Laptop', 'Smartboard'], hideIn: ['ewh'],
      showIf: function (s) { return s.einsatz !== 'analog'; }
    },
    tool: {
      type: 'text', label: 'Tool', optional: true, def: '', placeholder: 'z. B. Taskcards, GoodNotes, Moodle',
      hideIn: ['ewh'], showIf: function (s) { return s.einsatz !== 'analog'; }
    },
    ipadDigitalSchreiben: {
      type: 'toggle', label: 'Ausnahme: längere Texte digital schreiben', def: false, hideIn: ['ewh'],
      hint: 'Schulregel: Geschrieben wird auf Papier und für die Mappe in OneNote abfotografiert. Einschalten z. B. für ein gemeinsames Textdokument auf IServ.',
      showIf: function (s) { return s.einsatz !== 'analog' && (s.geraet || []).indexOf('iPad') !== -1; }
    },
    interaktiv: {
      type: 'chips', label: 'Interaktives Lernen fördern', def: [], section: 'methodik', hideIn: ['klassenarbeit', 'ewh'],
      options: ['Think-Pair-Share', 'Gruppenpuzzle', 'Stationenlernen', 'Rollenspiel', 'Diskussion', 'Gamification', 'Lerntagebuch'],
      tpl: 'Baue diese interaktiven Methoden sinnvoll ein: {v}.'
    },
    kritisch: {
      type: 'chips', label: 'Kritisches Denken fördern', def: [], section: 'methodik', hideIn: ['ewh'],
      options: ['Quellenkritik', 'Perspektivwechsel', 'Pro und Contra', 'Fehlersuche', 'Annahmen hinterfragen', 'Fakten vs. Meinung', 'Transferfrage'],
      tpl: 'Fördere kritisches Denken durch: {v}.'
    },
    afb: {
      type: 'range', label: 'Anforderungsbereich (Schwerpunkt)', def: 2, min: 1, max: 3, section: 'methodik',
      hideIn: ['klassenarbeit', 'ewh'], valueLabels: ['I – Reproduktion', 'II – Reorganisation und Transfer', 'III – Reflexion und Problemlösung'],
      tpl: function (v) {
        var t = ['I (Wiedergeben, Beschreiben)', 'II (Erklären, Anwenden, Zusammenhänge herstellen)', 'III (Beurteilen, Bewerten, Probleme lösen)'];
        return 'Schwerpunkt der Aufgaben im Anforderungsbereich ' + t[v - 1] + '; berücksichtige die anderen Bereiche angemessen.';
      }
    },

    // ---------- Ausgabe ----------
    // Die Form des Ergebnisses legt jeder Modus selbst fest (mode.ausgabe); ein freies „Format“ widersprach dem oft.
    laenge: {
      type: 'seg', label: 'Länge des Ergebnisses', def: 'mittel', options: ['kurz', 'mittel', 'ausführlich'], section: 'format',
      hint: 'kurz ≈ 1 Seite · mittel ≈ 1–2 Seiten · ausführlich ≈ 2–4 Seiten (DIN A4, ohne Lösungen)',
      // Bei Einstieg, Slides und Prüfungen bestimmen Dauer, Folien oder Punkte den Umfang, beim Arbeitsblatt die Aufgabenzahl.
      hideIn: ['einstieg', 'slides', 'klassenarbeit', 'ewh'],
      showIf: function (s) { return !arbeitsblatt.aktiv(s); },
      tpl: function (v) {
        return 'Länge: ' + ({
          kurz: 'kurz – höchstens etwa 1 DIN-A4-Seite (rund 300 Wörter), nur das Wesentliche',
          mittel: 'mittel – etwa 1–2 DIN-A4-Seiten (rund 300–700 Wörter)',
          'ausführlich': 'ausführlich – etwa 2–4 DIN-A4-Seiten (rund 700–1500 Wörter), mit Erläuterungen und Beispielen'
        })[v] + '; Lösungen und Hinweise für die Lehrkraft zählen nicht mit.';
      }
    },
    sprache: { type: 'seg', label: 'Sprache des Ergebnisses', def: 'Deutsch', options: ['Deutsch', 'Englisch'], section: 'format', tpl: 'Sprache des Ergebnisses: {v}' },

    // ---------- Modus: Stundeneinstieg ----------
    einstiegTyp: {
      type: 'chips', label: 'Einstiegstyp', def: [], rec: true, section: 'aufgabe',
      options: ['Bild', 'Rätsel', 'Provokation', 'Alltagsbezug', 'Hypothese'],
      tpl: 'Gewünschte Art des Einstiegs: {v}.'
    },
    einstiegDauer: {
      type: 'stepper', label: 'Dauer des Einstiegs', unit: 'Minuten', def: 10, min: 5, max: 10, step: 1, quick: [5, 10],
      section: 'aufgabe', tpl: 'Dauer des Einstiegs: {v} Minuten.'
    },

    // ---------- Modus: Reihenplanung ----------
    stundenAnzahl: {
      type: 'stepper', label: 'Anzahl der Stunden', unit: 'Stunden', def: 8, min: 2, max: 40, step: 1, quick: [4, 8, 12],
      section: 'aufgabe', tpl: 'Umfang der Reihe: {v} Unterrichtsstunden.'
    },
    leistungsnachweis: {
      type: 'select', label: 'Leistungsnachweis', def: '', rec: true, section: 'aufgabe',
      options: ['Klassenarbeit', 'Test', 'Präsentation', 'Portfolio', 'Projektergebnis', 'Mündliche Überprüfung', 'Keiner'],
      tpl: function (v) { return v === 'Keiner' ? 'Ein Leistungsnachweis ist nicht vorgesehen.' : 'Die Reihe endet mit diesem Leistungsnachweis: ' + v + '. Plane die Vorbereitung darauf ein.'; }
    },

    // ---------- Modus: Unterrichtsstunde ----------
    phasen: {
      type: 'chips', label: 'Phasenmodell', def: ['Einstieg', 'Erarbeitung', 'Sicherung', 'Transfer'], section: 'aufgabe',
      options: ['Einstieg', 'Erarbeitung', 'Sicherung', 'Transfer'], tpl: 'Phasen der Stunde: {v}.'
    },
    sozialformen: {
      type: 'chips', label: 'Sozialformen', def: [], rec: true, section: 'methodik',
      options: ['Einzelarbeit', 'Partnerarbeit', 'Gruppenarbeit', 'Plenum'], tpl: 'Sozialformen: {v}.'
    },
    stundenMaterial: {
      type: 'chips', label: 'Passende Materialien mit erstellen', optional: true, def: [], section: 'aufgabe',
      options: ['Arbeitsblatt', 'Sachtext', 'Aufgaben mit Lösungen', 'Tafelbild', 'Quiz', 'Hilfekarten', 'Folien'],
      tpl: 'Erstelle zusätzlich zum Verlaufsplan diese Materialien vollständig ausformuliert und direkt einsetzbar: {v}. Ordne jedes Material der Phase zu, in der es eingesetzt wird, und füge Lösungen für die Lehrkraft getrennt an.'
    },

    // ---------- Modus: Material ----------
    materialTyp: {
      type: 'seg', label: 'Materialtyp', def: 'Arbeitsblatt', section: 'aufgabe',
      options: ['Arbeitsblatt', 'Sachtext', 'Aufgabenset', 'Tafelbild', 'Quiz', 'Lernstationen'],
      // Arbeitsblatt: die Vorgaben stehen ausführlich im Abschnitt „Gestaltung des Arbeitsblatts“.
      tpl: function (v) {
        return ({
          Sachtext: 'Schreibe einen sachlich korrekten, altersgerechten Sachtext mit Überschrift, Zwischenüberschriften, Zeilennummern (alle fünf Zeilen) und Worterklärungen zu schwierigen Begriffen. Ergänze 3–5 Aufgaben zum Textverständnis mit steigendem Anspruch.',
          Aufgabenset: 'Ordne die Aufgaben mit steigendem Anspruch an (Wiedergeben → Anwenden → Beurteilen), beginne jede mit einem Operator und füge Lösungen getrennt an.',
          Tafelbild: 'Entwirf ein strukturiertes Tafelbild (Überschrift, Kernbegriffe, Pfeile und Beziehungen), das auf eine Tafelhälfte passt. Stelle es als Text-Skizze dar und beschreibe kurz, in welcher Reihenfolge es im Unterricht entsteht.',
          Quiz: 'Formuliere eindeutige Fragen mit plausiblen Falschantworten (keine offensichtlich absurden Distraktoren) und liefere einen Lösungsschlüssel mit kurzer Begründung je Frage.',
          Lernstationen: 'Plane Pflicht- und Wahlstationen; nenne je Station Ziel, Arbeitsauftrag, Material, Zeitbedarf und Selbstkontrolle und füge einen Laufzettel bei.'
        })[v] || '';
      }
    },

    // ---------- Modus: Slides ----------
    folienAnzahl: {
      type: 'stepper', label: 'Folienanzahl', unit: 'Folien', def: 10, min: 3, max: 40, step: 1, quick: [5, 10, 15],
      section: 'aufgabe', tpl: 'Umfang: etwa {v} Folien.'
    },
    slideStil: {
      type: 'seg', label: 'Stil', def: 'Schlicht und sachlich', section: 'format',
      options: ['Schlicht und sachlich', 'Bildstark', 'Textarm (Stichworte)', 'Interaktiv mit Fragen'],
      tpl: 'Stil der Folien: {v}.'
    },

    // ---------- Modus: Klassenarbeit ----------
    kaArt: { type: 'seg', label: 'Art', def: 'Klassenarbeit', options: ['Klassenarbeit', 'Klausur', 'Test', 'Lernstandserhebung'] },
    bearbeitungszeit: {
      type: 'stepper', label: 'Bearbeitungszeit', unit: 'Minuten', def: 45, min: 10, max: 300, step: 5, quick: [45, 90, 135],
      section: 'aufgabe', tpl: 'Bearbeitungszeit: {v} Minuten. Der Umfang muss in dieser Zeit realistisch zu schaffen sein.'
    },
    punkte: {
      type: 'stepper', label: 'Gesamtpunktzahl', unit: 'Punkte', def: 50, min: 5, max: 200, step: 1, quick: [30, 50, 100],
      section: 'aufgabe', tpl: 'Gesamtpunktzahl: {v}. Gib bei jeder Aufgabe die Punkte an; die Summe muss genau {v} ergeben.'
    },
    afbVert: {
      type: 'afbVert', label: 'Verteilung der Anforderungsbereiche', def: { I: 40, II: 40, III: 20 }, section: 'aufgabe',
      tpl: function (v, s) {
        var p = s.punkte, a = Math.round(p * v.I / 100), b = Math.round(p * v.II / 100);
        // AFB III bekommt den Rest, damit die Summe exakt stimmt
        var pts = p && v.I + v.II + v.III === 100 ? ' (bei ' + p + ' Punkten etwa ' + a + ' / ' + b + ' / ' + (p - a - b) + ' Punkte)' : '';
        return 'Verteilung der Anforderungsbereiche: AFB I ' + v.I + ' %, AFB II ' + v.II + ' %, AFB III ' + v.III + ' %' + pts + '.';
      }
    },
    aufgabenformate: {
      type: 'chips', label: 'Aufgabenformate', def: [], rec: true, section: 'aufgabe',
      options: ['Offene Aufgaben', 'Multiple Choice', 'Lückentext', 'Zuordnung', 'Materialaufgabe', 'Textproduktion'],
      tpl: 'Aufgabenformate: {v}.'
    },
    hilfsmittel: {
      type: 'chips', label: 'Hilfsmittel', def: [], section: 'aufgabe',
      options: ['Keine', 'Wörterbuch', 'Formelsammlung', 'Taschenrechner', 'Material'],
      tpl: 'Erlaubte Hilfsmittel: {v}.'
    },
    zweigFassungen: {
      type: 'toggle', label: 'Je Zweig eine eigene Fassung', def: true, section: 'aufgabe',
      hint: 'Erscheint, wenn mehrere Zweige gewählt sind.',
      showIf: function (s) { return (s.zweige || []).length > 1; },
      tpl: function (v, s) {
        return ['Erstelle für jeden Zweig eine eigene Fassung mit abgestuften Anforderungen: ' +
          s.zweige.map(function (z) { return '„Fassung ' + z + '“'; }).join(', ') + '.',
          'Alle Fassungen behandeln dasselbe Thema mit vergleichbarer Struktur; passe Komplexität, Materialumfang, Hilfen und Gewichtung der Anforderungsbereiche an den jeweiligen Zweig an. Gib jeder Fassung eine eigene Überschrift.'];
      }
    },
    lesbarkeit: {
      type: 'chips', label: 'Lesbarkeit und Aufgabenstellung', def: [], section: 'aufgabe',
      options: ['Einfache Sprache', 'Kurze Sätze', 'Operatoren hervorheben', 'Hilfen / Tipps', 'Beispielaufgabe', 'Übersichtliches Layout'],
      tpl: 'Lesbarkeit der Aufgabenstellungen: {v}.'
    },

    // ---------- Visualisierung (Material, Slides, Klassenarbeit) ----------
    visualisierung: {
      type: 'chips', label: 'Visualisierung', optional: true, def: [], section: 'format', always: true,
      hint: 'Ohne „Icons / Piktogramme“ nutzt die KI nur Symbole, die Word bzw. PowerPoint selbst bereitstellen.',
      options: ['Diagramme', 'Tabellen', 'Bildvorschläge', 'Icons / Piktogramme', 'Farbcodierung', 'Mindmap / Strukturbild', 'Zeitleiste'],
      tpl: function (v, s) {
        return [
          v.length ? 'Gewünschte Visualisierungen: ' + list(v) + '. Beschreibe Bilder und Grafiken als Vorschlag (Inhalt, Beschriftung) und erfinde keine Bildquellen.' : '',
          // Beim Arbeitsblatt steht die Regel ausführlich unter „Bildsprache“.
          v.indexOf('Icons / Piktogramme') === -1 && !arbeitsblatt.aktiv(s)
            ? 'Zeichne keine eigenen Icons. Verwende nur Symbole, die Word bzw. PowerPoint selbst erzeugen können (Einfügen → Symbol, Formen oder Piktogramme), einfarbig und mit Textlabel.' : ''
        ];
      }
    },
    visualWunsch: {
      type: 'textarea', label: 'Weitere Wünsche zur Visualisierung', optional: true, def: '', pii: true, section: 'format',
      placeholder: 'z. B. Säulendiagramm zur Wahlbeteiligung, Farbe je Niveaustufe, viel Weißraum',
      tpl: 'Wünsche zur Visualisierung: {v}'
    },

    ewhButton: { type: 'action', label: 'Erwartungshorizont dazu erstellen', action: 'toEwh', hint: 'Wechselt zum Erwartungshorizont; Fach, Thema, Zweige, Punkte und Anforderungsbereiche bleiben erhalten.' },

    // ---------- Modus: Erwartungshorizont ----------
    bezug: {
      type: 'seg', label: 'Bezug', def: 'Zur oben geplanten Klassenarbeit',
      options: ['Zur oben geplanten Klassenarbeit', 'Aufgaben füge ich unten im Chat ein']
    },
    ewhForm: {
      type: 'seg', label: 'Form', def: 'Tabelle', section: 'format', options: ['Tabelle', 'Fließtext-Kriterien'],
      tpl: function (v) {
        return v === 'Tabelle'
          ? 'Format: Tabelle mit den Spalten Aufgabe | erwartete Leistung | Punkte | Anforderungsbereich.'
          : 'Format: Bewertungskriterien als gegliederter Fließtext je Aufgabe, jeweils mit Punkten und Anforderungsbereich.';
      }
    },
    // Leer = Standardschlüssel vorschlagen lassen (always: Zeile erscheint auch ohne Eingabe).
    notenschluessel: {
      type: 'text', label: 'Eigener Notenschlüssel', optional: true, def: '', section: 'aufgabe', always: true,
      placeholder: 'z. B. 1 ab 87 %, 2 ab 73 %, 3 ab 59 %, 4 ab 45 %, 5 ab 20 %',
      hint: 'Leer lassen, dann schlägt die KI einen üblichen Schlüssel vor.',
      tpl: function (v, s) {
        return (v || '').trim()
          ? 'Verwende diesen Notenschlüssel und rechne ihn in Punkte um (Gesamtpunktzahl ' + s.punkte + '): ' + v.trim()
          : 'Schlage einen üblichen Notenschlüssel vor (Prozent und Punkte je Note bei ' + s.punkte + ' Punkten) und kennzeichne ihn als anpassbar an die Vorgaben des Fachbereichs.';
      }
    },
    loesungswege: {
      type: 'chips', label: 'Alternative Lösungswege und Teilpunkte', def: ['Alternative Lösungswege anerkennen', 'Teilpunkte vergeben'],
      section: 'aufgabe', options: ['Alternative Lösungswege anerkennen', 'Teilpunkte vergeben', 'Folgefehler berücksichtigen'],
      tpl: function (v) {
        var m = {
          'Alternative Lösungswege anerkennen': 'Nenne bei offenen Aufgaben, welche alternativen Lösungswege gleichwertig anerkannt werden.',
          'Teilpunkte vergeben': 'Lege fest, wofür Teilpunkte vergeben werden.',
          'Folgefehler berücksichtigen': 'Erläutere, wie Folgefehler bewertet werden.'
        };
        return v.map(function (x) { return m[x] || x; });
      }
    },
    sprachAnteil: {
      type: 'stepper', label: 'Sprachliche Richtigkeit (Anteil an der Gesamtleistung)', unit: '%', def: 0, min: 0, max: 50, step: 5, quick: [0, 10, 20],
      hint: '0 % = nicht gesondert bewerten', section: 'aufgabe',
      tpl: function (v) { return v > 0 ? 'Bewerte die sprachliche Richtigkeit mit einem Anteil von ' + v + ' % der Gesamtleistung und beschreibe die Kriterien in Stufen (z. B. Rechtschreibung, Grammatik, Ausdruck, Fachsprache).' : ''; }
    },
    zweigErwartungen: {
      type: 'toggle', label: 'Zweig-spezifische Erwartungen', def: true, section: 'aufgabe',
      showIf: function (s) { return (s.zweige || []).length > 1; },
      tpl: function (v, s) { return 'Formuliere die Erwartungen getrennt je Zweig: ' + list(s.zweige) + '. Mache sichtbar, worin sich die erwarteten Leistungen unterscheiden.'; }
    }
  };

  // Katalog für „Das hilft der KI zusätzlich“ (UI-Chips) und die Beispiele in den Optimierungshinweisen.
  var uploadCatalog = {
    verlauf: 'Bisher behandelte Themen und Unterrichtsverlauf',
    material: 'Bereits eingesetzte Arbeitsblätter oder Beispielmaterial',
    kc: 'Auszüge aus dem Kerncurriculum',
    arbeitsplan: 'Schulinterner Arbeitsplan',
    fachbereich: 'Regelungen und Beschlüsse des Fachbereichs (Bewertungsrichtlinien, Operatorenliste, Notenschlüssel, Vorgaben zu Klassenarbeiten)',
    lehrwerk: 'Lehrwerkseiten',
    alteKa: 'Frühere Klassenarbeiten als Stilvorlage',
    kaRegeln: 'Fachbereichsregelungen zu Anzahl und Gewichtung der Aufgaben',
    notenschluessel: 'Notenschlüssel des Fachbereichs',
    operatoren: 'Operatorenliste',
    uebung: 'Übungsmaterial der Reihe',
    fertigeKa: 'Die fertige Klassenarbeit',
    raster: 'Bewertungsraster des Fachbereichs',
    folien: 'Vorhandene Folien oder Präsentationsvorlage',
    stundenplan: 'Verlaufsplan der vorherigen Stunde',
    medien: 'Verfügbare Bilder, Texte oder Medien'
  };
  var uploadsBase = ['verlauf', 'material', 'kc', 'arbeitsplan', 'fachbereich', 'lehrwerk'];

  var icons = {
    einstieg: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>',
    reihe: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
    stunde: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    material: '<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h4"/>',
    slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8.5 20h7M7 8.5h6M7 11.5h4"/>',
    klassenarbeit: '<path d="M5 20.5h14"/><path d="M15.5 4.5l3 3L9 17l-4 1 1-4z"/>',
    ewh: '<path d="M4 6.5l1.5 1.5L8 5.5M4 12.5l1.5 1.5L8 11.5M4 18.5l1.5 1.5L8 17.5M11 7h9M11 13h9M11 19h9"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
    save: '<path d="M6 4h9l4 4v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5"/><path d="M3.5 4v4.5H8M12 8v4l3 2"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.7"/><path d="M4 4v4.7h4.7"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.3v.2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    upload: '<path d="M12 20V9M7.5 13.5L12 9l4.5 4.5M5 4.5h14"/>',
    book: '<path d="M12 6.5C10.3 5.2 8 4.5 4.5 4.5v14c3.5 0 5.8.7 7.5 2 1.7-1.3 4-2 7.5-2v-14c-3.5 0-5.8.7-7.5 2zM12 6.5v14"/>',
    people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M15.8 14.8c2.4.1 4.1 1.7 4.7 4.2"/>',
    layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    wand: '<path d="M4 20L15 9M13 7l4 4"/><path d="M18 3v3M16.5 4.5h3M20 9v2M19 10h2"/>'
  };

  var modes = [
    {
      id: 'einstieg', label: 'Stundeneinstieg', short: 'Einstieg', group: 'Planen',
      fields: ['einstiegTyp', 'einstiegDauer'],
      uploads: ['stundenplan', 'medien'],
      rolle: 'Du entwickelst motivierende, kognitiv aktivierende Stundeneinstiege.',
      aufgabe: 'Entwickle einen Stundeneinstieg{fachKlammer} zum Thema „{thema}“, der die Lernenden aktiviert, neugierig macht und zu einer Problemfrage führt.',
      detail: [
        'Gib die Impulse und Impulsfragen im Wortlaut an und nenne erwartete Antworten der Lernenden, auch mögliche Fehlvorstellungen.',
        'Beschreibe benötigtes Material (Bild, Gegenstand, Zitat) so konkret, dass ich es selbst beschaffen oder erstellen kann; erfinde keine realen Bildquellen.',
        'Zeige, wie der Einstieg zur Erarbeitung überleitet.',
        'Schlage zusätzlich zwei kurze Alternativen vor.'
      ],
      ausgabe: ['Beschreibe den Einstieg Schritt für Schritt mit Minutenangaben (Lehrkraft / Lernende) und formuliere am Ende die Problemfrage wörtlich, so wie sie an der Tafel steht.'],
      example: {
        fach: 'Geschichte', jahrgang: '7', thema: 'Die Händlergilden des Fantasiereichs Aurelon',
        zweige: ['Realschule'], lerngruppe: 'Neugierig, arbeitet gern mit Bildern, einige Lernende mit Deutsch als Zweitsprache',
        lernziel: 'Die Lernenden formulieren Vermutungen, warum sich Händler zu Gilden zusammenschließen.',
        einstiegTyp: ['Bild', 'Provokation'], einstiegDauer: 8, kritisch: ['Perspektivwechsel'], afb: 1
      }
    },
    {
      id: 'stunde', label: 'Unterrichtsstunde', short: 'Stunde', group: 'Planen',
      fields: ['phasen', 'sozialformen', 'stundenMaterial', 'aufgabenAnzahl', 'abZweige', 'abFormat'],
      uploads: ['stundenplan'],
      rolle: 'Du erstellst durchdachte Verlaufspläne für einzelne Unterrichtsstunden.',
      aufgabe: 'Erstelle einen Verlaufsplan für eine Unterrichtsstunde{fachKlammer} zum Thema „{thema}“.',
      detail: [
        'Formuliere ein überprüfbares Stundenziel, falls keines angegeben ist, und richte jede Phase darauf aus.',
        'Plane realistische Zeiten, die zusammen genau den Zeitrahmen ergeben, und nenne eine Reserve bzw. Kürzungsmöglichkeit.',
        'Formuliere zentrale Arbeitsaufträge, Impulsfragen und das Ergebnis der Sicherung (z. B. Tafelbild) im Wortlaut.'
      ],
      ausgabe: ['Verlaufsplan als Tabelle mit den Spalten: Phase, Zeit, Unterrichtsgeschehen, Sozialform, Medien und Material, didaktischer Kommentar.'],
      example: {
        fach: 'Deutsch', jahrgang: '8', thema: 'Das Märchen vom gläsernen Leuchtturm – eine eigene Fortsetzung schreiben',
        zweige: ['Gymnasium'], dauer: 90, lerngruppe: 'Lebhaft, schreibfreudig, braucht klare Strukturen',
        lernziel: 'Die Lernenden schreiben eine stimmige Fortsetzung, die Merkmale des Märchens aufgreift.',
        sozialformen: ['Einzelarbeit', 'Partnerarbeit', 'Plenum'], stundenMaterial: ['Arbeitsblatt', 'Tafelbild'], interaktiv: ['Think-Pair-Share'], afb: 3
      }
    },
    {
      id: 'reihe', label: 'Reihenplanung', short: 'Reihe', group: 'Planen',
      fields: ['stundenAnzahl', 'leistungsnachweis'],
      uploads: ['uebung'],
      rolle: 'Du planst stimmige Unterrichtsreihen mit klarer Progression.',
      aufgabe: 'Plane eine Unterrichtsreihe{fachKlammer} zum Thema „{thema}“ mit einer klaren Lernprogression von Stunde zu Stunde.',
      detail: [
        'Stelle der Übersicht die übergeordneten Kompetenzen der Reihe voran.',
        'Gib für jede Stunde ein überprüfbares Lernziel an; jede Stunde baut erkennbar auf der vorherigen auf.',
        'Begründe die Abfolge der Stunden kurz didaktisch.',
        'Plane Übungs- und Wiederholungsphasen vor dem Leistungsnachweis ein.'
      ],
      ausgabe: ['Stelle die Reihe als Tabelle dar, eine Zeile pro Stunde: Stunde, Thema, Lernziel, zentrale Methode und Material, Sicherung bzw. Hausaufgabe.'],
      example: {
        fach: 'Biologie', jahrgang: '6', thema: 'Lebewesen des erfundenen Moorplaneten Velda – Angepasstheit an Lebensräume',
        zweige: ['Gymnasium'], stundenAnzahl: 6, leistungsnachweis: 'Test', dauer: 45,
        vorwissen: 'Kennzeichen des Lebendigen, einfache Nahrungsketten',
        interaktiv: ['Gruppenpuzzle', 'Stationenlernen'], kritisch: ['Annahmen hinterfragen'], einsatz: 'hybrid', geraet: ['iPad']
      }
    },
    {
      id: 'material', label: 'Material', short: 'Material', group: 'Material',
      fields: ['materialTyp', 'aufgabenAnzahl', 'abZweige', 'abFormat', 'visualisierung', 'visualWunsch'],
      uploads: ['medien'],
      rolle: 'Du erstellst klar strukturiertes, sofort einsetzbares Unterrichtsmaterial.',
      aufgabe: function (s, h) {
        var typ = { Arbeitsblatt: 'ein Arbeitsblatt', Sachtext: 'einen Sachtext', Aufgabenset: 'ein Aufgabenset', Tafelbild: 'ein Tafelbild', Quiz: 'ein Quiz', Lernstationen: 'Lernstationen' }[s.materialTyp] || 'Unterrichtsmaterial';
        return 'Erstelle ' + typ + h.fachKlammer + ' zum Thema „' + h.thema + '“, das ohne weitere Bearbeitung im Unterricht eingesetzt werden kann.';
      },
      detail: ['Füge eine Lösung bzw. einen Erwartungshorizont für die Lehrkraft getrennt vom Material an.'],
      ausgabe: ['Gib das Material so aus, dass es direkt übernommen werden kann: klare Überschrift, nummerierte Aufgaben mit Operatoren, genug Platz für Antworten.'],
      example: {
        fach: 'Mathematik', jahrgang: '7', thema: 'Prozentrechnung am Marktstand des Zauberdorfs Kerbelstein',
        zweige: ['Realschule', 'Hauptschule'], materialTyp: 'Arbeitsblatt',
        diffArt: ['Drei Niveaustufen', 'Sprachsensibel'], diffZweige: ['Realschule', 'Hauptschule'],
        kritisch: ['Fehlersuche'], afb: 2
      }
    },
    {
      id: 'slides', label: 'Slides', short: 'Slides', group: 'Material',
      fields: ['folienAnzahl', 'slideStil', 'visualisierung', 'visualWunsch'],
      uploads: ['folien', 'medien'],
      rolle: 'Du gestaltest klare, gut lesbare Präsentationen für den Unterricht.',
      aufgabe: 'Erstelle eine Präsentation{fachKlammer} zum Thema „{thema}“ mit vollständig ausformulierten Folieninhalten.',
      detail: [
        'Eine Idee pro Folie, höchstens etwa 30 Wörter Folientext; Details gehören in die Sprechernotizen.',
        'Plane eine Titelfolie, eine Folie mit Leitfrage oder Ablauf und eine Abschlussfolie mit Zusammenfassung oder Aufgabe.'
      ],
      ausgabe: ['Gib für jede Folie aus: Folientitel, 3–5 Stichpunkte und Sprechernotizen (2–4 Sätze). Ergänze bei Bedarf einen Bildvorschlag ohne erfundene Quellenangaben.'],
      example: {
        fach: 'Erdkunde', jahrgang: '9', thema: 'Die Klimazonen der Fantasie-Insel Tamaru',
        zweige: ['Gymnasium'], folienAnzahl: 10, slideStil: 'Bildstark', visualisierung: ['Bildvorschläge', 'Diagramme'], einsatz: 'digital', geraet: ['Smartboard'],
        kritisch: ['Transferfrage']
      }
    },
    {
      id: 'klassenarbeit', label: 'Klassenarbeit', short: 'Klassenarbeit', group: 'Prüfen',
      fields: ['kaArt', 'bearbeitungszeit', 'punkte', 'afbVert', 'aufgabenformate', 'hilfsmittel', 'zweigFassungen', 'lesbarkeit', 'visualisierung', 'visualWunsch', 'ewhButton'],
      pruefen: true,
      uploads: ['alteKa', 'kaRegeln', 'notenschluessel', 'operatoren', 'uebung'],
      rolle: 'Du konzipierst faire, valide Leistungsüberprüfungen mit passenden Operatoren.',
      aufgabe: function (s, h) { return 'Erstelle ' + (s.kaArt === 'Test' ? 'einen ' : 'eine ') + (s.kaArt || 'Klassenarbeit') + h.fachKlammer + ' zum Thema „' + h.thema + '“.'; },
      detail: [
        'Formuliere alle Aufgaben mit den Operatoren des Fachs (gemäß der Operatorenliste des Landes) und ordne jeder Aufgabe einen Anforderungsbereich zu.',
        'Steigere die Schwierigkeit innerhalb der Arbeit und vermeide Aufgaben, die nur mit Vorwissen außerhalb des Unterrichts lösbar sind.',
        'Liefere alle Materialien (Texte, Tabellen, Abbildungsbeschreibungen) vollständig mit, damit die Arbeit ohne weitere Unterlagen bearbeitet werden kann.',
        'Jede Aufgabe muss ohne Rückfrage verständlich sein; Teilaufgaben werden mit a), b), c) gekennzeichnet und einzeln bepunktet.'
      ],
      ausgabe: ['Gliedere: Kopf (Bearbeitungszeit, Hilfsmittel, Gesamtpunkte), Aufgaben mit Operator und Punkten, Punkteübersicht. Gib die Zuordnung zu den Anforderungsbereichen in einer separaten Übersicht für die Lehrkraft an.'],
      example: {
        fach: 'Politik-Wirtschaft', jahrgang: '9', thema: 'Wahlen und Mitbestimmung im Inselstaat Nordhavn',
        zweige: ['Hauptschule', 'Realschule', 'Gymnasium'], kaArt: 'Klassenarbeit', bearbeitungszeit: 90, punkte: 50,
        afbVert: { I: 30, II: 45, III: 25 }, aufgabenformate: ['Materialaufgabe', 'Offene Aufgaben', 'Zuordnung'],
        hilfsmittel: ['Material'], lesbarkeit: ['Operatoren hervorheben', 'Übersichtliches Layout'], kritisch: ['Pro und Contra']
      }
    },
    {
      id: 'ewh', label: 'Erwartungshorizont', short: 'Erwartungshorizont', group: 'Prüfen',
      fields: ['bezug', 'ewhForm', 'punkte', 'afbVert', 'notenschluessel', 'loesungswege', 'sprachAnteil', 'zweigErwartungen'],
      pruefen: true, uploads: ['fertigeKa', 'raster', 'notenschluessel', 'operatoren'],
      rolle: 'Du erstellst transparente, faire Erwartungshorizonte und Bewertungsraster.',
      aufgabe: function (s, h) {
        return s.bezug === 'Aufgaben füge ich unten im Chat ein'
          ? 'Erstelle einen Erwartungshorizont' + h.fachKlammer + ' zum Thema „' + h.thema + '“ für die Aufgaben, die ich unten im Chat einfüge. Beginne erst, wenn die Aufgaben vorliegen.'
          : 'Erstelle einen Erwartungshorizont zur oben in diesem Chat erstellten Klassenarbeit' + h.fachKlammer + ' zum Thema „' + h.thema + '“. Beziehe dich auf jede Aufgabe genau in der dort verwendeten Nummerierung.';
      },
      detail: ['Beschreibe die erwartete Leistung so konkret, dass auch eine andere Lehrkraft danach einheitlich bewerten kann.'],
      ausgabe: [],
      example: {
        fach: 'Politik-Wirtschaft', jahrgang: '9', thema: 'Wahlen und Mitbestimmung im Inselstaat Nordhavn',
        zweige: ['Hauptschule', 'Realschule', 'Gymnasium'], punkte: 50, afbVert: { I: 30, II: 45, III: 25 },
        bezug: 'Zur oben geplanten Klassenarbeit', ewhForm: 'Tabelle', sprachAnteil: 10
      }
    }
  ];

  var cards = [
    { id: 'grund', title: 'Grundlagen', icon: 'book', fields: ['fach', 'fachAnders', 'jahrgang', 'thema', 'bundesland', 'zweige', 'recherche', 'rechercheZeitraum'] },
    { id: 'modus', title: null, fields: null },
    { id: 'gruppe', title: 'Lerngruppe und Ziele', icon: 'people', fields: ['dauer', 'lerngruppe', 'lernziel', 'vorwissen'] },
    { id: 'diff', title: 'Differenzierung', icon: 'layers', fields: ['diffArt', 'diffZweige'] },
    { id: 'methodik', title: 'Methodik und Einsatz', icon: 'wand', fields: ['einsatz', 'geraet', 'tool', 'ipadDigitalSchreiben', 'interaktiv', 'kritisch', 'afb'] },
    { id: 'ausgabe', title: 'Ausgabe', icon: 'sliders', fields: ['laenge', 'sprache'] }
  ];

  var texte = {
    rolleBasis: 'Du bist eine erfahrene Lehrkraft{fach} mit fundierter fachdidaktischer Expertise.',
    rolleDetail: 'Du arbeitest praxisnah, schülerorientiert und achtest auf fachliche Korrektheit und ein dem Jahrgang angemessenes Niveau.',
    uploadsSatz: 'Ich lade zusätzlich hoch bzw. füge ein: {v}. Frage diese Unterlagen nicht erneut ab, sondern nutze sie.',
    qualitaet: [
      'Erfinde keine Quellen, Zitate, Zahlen oder Fakten. Kennzeichne Unsicheres mit [unsicher].',
      'Fehlt eine Kleinigkeit, die keine Rückfrage wert ist, triff eine sinnvolle Annahme und nenne sie kurz zu Beginn des Ergebnisses.',
      'Verwende fachlich korrekte Begriffe und eine dem Jahrgang angemessene Sprache.',
      'Ergänze nach dem Ergebnis eine kurze Liste „Das solltest du prüfen“.'
    ],
    rueckfragen: 'Kläre Unklarheiten immer zuerst: Prüfe vor dem Erstellen, ob Angaben fehlen, widersprüchlich oder mehrdeutig sind. Wenn ja, stelle gebündelt höchstens drei Rückfragen und warte auf meine Antworten, bevor du das Ergebnis erstellst.',
    pruefenRegel: 'Prüfe Aufgaben, Punktsummen und Zuordnung der Anforderungsbereiche selbst auf Stimmigkeit, bevor du antwortest.',
    // Steht in jedem Prompt (Wortlaut der Lehrkraft); die zweite Zeile legt fest, was am Ende ausgegeben wird.
    kritik: [
      'Du bist ein harter Kritiker. Deine Aufgabe ist es, deine Antwort zu kritisieren. Erkläre mir, warum sie schlecht ist. Lies es in Ruhe durch und durchdenke deine Antwort Schritt für Schritt, bevor du etwas erstellst. Nutze anschließend diese Kritik und liefere ein optimiertes Ergebnis.',
      'Ablauf: Kläre zuerst offene Fragen (siehe Qualitätsregeln). Erstelle dann einen Entwurf, gib deine Kritik daran als knappe, konkrete Liste mit höchstens fünf Punkten aus (was ist fachlich, didaktisch oder sprachlich schwach, was fehlt) und liefere danach das vollständige optimierte Ergebnis. Gib den Entwurf selbst nicht aus. Erzeugst du eine Datei, enthält sie nur das optimierte Ergebnis.'
    ],
    optimierung: [
      'Gib ganz am Ende, nach dem optimierten Ergebnis, einen eigenen Abschnitt mit der Überschrift „Für ein noch besseres Ergebnis“ aus. Darin:',
      '1. Nenne, welche Informationen oder Unterlagen noch fehlen, um das Ergebnis zu verbessern.',
      '2. Teile sie in „wichtig“ und „optional“ ein und begründe jeden Punkt in einem Satz.',
      '3. Sage konkret, was ich hochladen oder einfügen kann, zum Beispiel: {beispiele}.',
      '4. Biete an, das Ergebnis zu überarbeiten, sobald ich die Unterlagen hochgeladen oder eingefügt habe.'
    ],
    hinweise: [
      'Gib in einem Prompt keine personenbezogenen Daten ein.',
      'Die von der KI gemachten Vorschläge eignen sich oft als erster Entwurf, aber selten als fertiges Produkt. Überprüfe stets die Inhalte und ergänze sie gegebenenfalls, bevor du diese im Unterricht einsetzt!'
    ],
    pruefenHinweis: 'Prüfe Aufgaben, Punkte und Bewertung immer gegen die Vorgaben deines Fachbereichs.',
    uploadDatenschutz: 'Schülerarbeiten und Dokumente vor dem Hochladen anonymisieren (Namen, Klassen, Kontaktdaten entfernen).',
    // Schulregel für iPads (erscheint im Prompt, sobald iPad als Gerät gewählt ist)
    ipadRegel: 'Schulregel für iPads: Geschrieben wird grundsätzlich auf Papier; die Ergebnisse werden anschließend für die Mappe in OneNote abfotografiert. Bei Arbeitsblättern darf davon abgewichen werden, z. B. bei Lückentexten, die direkt auf dem iPad ausgefüllt werden.',
    ipadLangeAufgaben: 'Plane längere Schreibaufgaben deshalb auf Papier und weise im Material darauf hin (z. B. „Schreibe auf Papier und fotografiere dein Ergebnis für OneNote ab.“).',
    ipadAusnahme: 'Ausnahme in diesem Fall: Längere Texte werden digital geschrieben (z. B. in einem gemeinsamen Textdokument auf IServ). Gestalte die entsprechenden Aufgaben dafür.',
    kopierHinweis: 'Kopiert. Denk daran: Das Ergebnis der KI ist ein Entwurf – prüfe es, bevor du es im Unterricht einsetzt.'
  };

  var nachschaerfen = [
    { label: 'Kürzer', text: 'Kürze das Ergebnis auf etwa die Hälfte. Behalte die wichtigsten Inhalte und die Struktur bei.' },
    { label: 'Einfacher', text: 'Formuliere das Ergebnis in einfacherer Sprache: kurze Sätze, bekannte Wörter, Fachbegriffe kurz erklärt.' },
    { label: 'Mehr Aufgaben', text: 'Ergänze drei weitere Aufgaben in derselben Form, mit steigendem Anspruch, passend zu den bisherigen.' },
    { label: 'Stärker differenzieren', text: 'Differenziere das Ergebnis stärker: drei klar gekennzeichnete Niveaustufen, gestufte Hilfen und eine Zusatzaufgabe für Schnelle.' },
    { label: 'Erwartungshorizont ergänzen', text: 'Ergänze zu allen Aufgaben einen Erwartungshorizont als Tabelle: Aufgabe | erwartete Leistung | Punkte | Anforderungsbereich.' },
    { label: 'Unterlagen hochgeladen', text: 'Ich habe die empfohlenen Unterlagen hochgeladen. Bitte überarbeite dein Ergebnis auf dieser Grundlage und nenne kurz, was du geändert hast.' }
  ];

  // Gestaltungsvorlage für Arbeitsblätter. Wird automatisch angehängt, sobald ein Arbeitsblatt angefordert ist.
  // Lücken ([Fach], [Stufe], [Thema], [Lernziel], [Anzahl]) werden aus den Formularangaben gefüllt.
  var arbeitsblatt = {
    titel: 'Gestaltung des Arbeitsblatts',
    aktiv: function (s) {
      return (s.mode === 'material' && s.materialTyp === 'Arbeitsblatt') ||
        (s.mode === 'stunde' && (s.stundenMaterial || []).indexOf('Arbeitsblatt') !== -1);
    },
    text: function (s, h) {
      var j = parseInt(s.jahrgang, 10);
      var stufe = !j ? 'Sekundarstufe I (Klassen 5–10)'
        : j <= 10 ? 'Klasse ' + j + ' der Sekundarstufe I (Klassen 5–10)' : 'Klasse ' + j + ' der Sekundarstufe II';
      var lernziel = (s.lernziel || '').trim()
        ? '„' + s.lernziel.trim() + '“'
        : 'einem klar formulierten, überprüfbaren Lernziel, das du passend zum Thema festlegst';
      var icons = iconsErlaubt(s);
      var zweige = (s.zweige || []).length > 1;
      var jeZweig = zweige && s.abZweige === 'Je Zweig ein eigenes Blatt';
      var niveau = (s.diffArt || []).indexOf('Drei Niveaustufen') !== -1;
      // Kombination: Aussehen nach dem Designsheet der Schule, Didaktik aus der Aufgabenblatt-Vorlage.
      return [
        'Erstelle ein vollständiges, druckfähiges Aufgabenblatt für ' + (h.fach || 'das Fach') + ', ' + stufe + ', zum Thema „' + h.thema + '“, mit dem Lernziel ' + lernziel + ' und ' + s.aufgabenAnzahl + ' Aufgaben ' + (jeZweig ? '(je Zweig)' : '(insgesamt' + (niveau || zweige ? ', über alle ' + [niveau ? 'Niveaustufen' : '', zweige ? 'Zweige' : ''].filter(Boolean).join(' und ') + ' hinweg' : '') + ')') + '. Gestalte es nach dem Designsheet der Schule (Regeln unten): klar, ruhig, strukturiert und altersgerecht; jeder Arbeitsschritt ist sofort verständlich; Material, Auftrag und Antwortbereich sind sichtbar getrennt. Jedes Blatt ist genau eine A4-Seite und enthält höchstens vier Aufgaben (höchstens drei, wenn ein Merkkasten darauf steht), höchstens einen Merkkasten, höchstens zwei Tippkästen' + (icons ? ' und höchstens zwei Illustrationen' : '') + '; kein Baustein ist Pflicht. Das Arbeitsblatt darf mehrere Blätter umfassen; jedes weitere Blatt bekommt einen eigenen Kopf. Lass keinen Baustein über einen Seitenumbruch laufen und lege lieber ein Blatt mehr an, als Antwortflächen zu verkleinern oder Inhalte abzuschneiden. Erstelle außerdem eine separate Lösungsübersicht, nicht auf dem Schülerblatt; sie nennt je Aufgabe die Lösung, den Anforderungsbereich' + (niveau ? ', die Niveaustufe' : '') + (zweige && !jeZweig ? ' und für welchen Zweig sie Pflicht oder Wahl ist' : '') + '.',
        'Farben: Petrol #06344A für Text, Überschriften und Rahmen der Aufgabenbox; Petrol ruhig #3D5F70 für Beschriftungen und Trennlinien; #9DB0B8 nur für Schreiblinien. Akzentfarben nur für Formen, Rahmen, Ziffern und Icons, nie für Fließtext: Gelb #F5A742 (Rahmen des Merkkastens, Unterstreichung der Blattüberschrift, Icons), Orange #FF7F0A sehr sparsam, Salbei #719C7B, Salbei dunkel #4E7A5A (Rahmen und Titel des Tippkastens), Rost #B8512A (Aufgabenziffern). Hintergrund immer Weiß; Flächen nur in den hellen Tönungen Gelb hell #FDF0DA (Merkkasten), Salbei hell #E3EEE5 (Tippkasten) und Pfirsich hell #FDEEE2 (z. B. Tabellenkopf), keine Vollflächen. Keine Fach- oder Jahrgangsfarben. Textkontrast mindestens 4,5:1. Farbe darf Bedeutung niemals allein vermitteln: ergänze Beschriftungen, Rahmenarten, Formen oder Icons.',
        'Typografie: Patrick Hand (nur eine Stärke, keine Fettung) für Blattüberschrift 30 pt, Zwischenüberschriften 18 pt und Kastentitel 16 pt. Ist Patrick Hand nicht verfügbar, nimm eine sachliche Ersatzschrift (Verdana bzw. Segoe UI), niemals Comic Sans oder eine andere verspielte Schrift. Zahlen nie in Handschrift: Aufgabenziffern in Verdana Bold, etwa 17 pt, in Rost #B8512A, zentriert in einem Kreis von etwa 9 mm mit Gelb hell und dünnem gelbem Rand. Verdana für Fließtext, Arbeitsaufträge, Tabellen und alle Zahlen, 11 pt (nie kleiner), Zeilenabstand 1,4; die Null wird als normale 0 geschrieben, ohne Schrägstrich oder Punkt, verwende also keine Schrift mit durchgestrichener oder gepunkteter Null; zwischen Zahl und Einheit oder Prozentzeichen steht ein geschütztes Leerzeichen, damit „10 %“ nicht getrennt wird; Bold nur für Operatoren, Italic für Zitate; Feldnamen im Kopf (Jahrgang, Fach, Name, Datum) 9 pt in Versalien. Überschriften niemals mit einer Wellenlinie unterstreichen: Die Blattüberschrift bekommt höchstens eine gerade gelbe Linie, Zwischen- und Kastenüberschriften gar keine Unterstreichung. Die Blattüberschrift hat höchstens eine Zeile (etwa 35 Zeichen). Beginne jeden Auftrag mit einem eindeutigen, fett gesetzten Operator (z. B. Vergleiche, Berechne, Begründe); verwende altersgerechte, kurze Sätze. Maximal drei sichtbare Schriftebenen pro Blatt; linksbündig setzen, sparsame Silbentrennung, kein durchgängiger Versalsatz außer bei den Feldnamen.',
        'Seitenaufbau: DIN A4 hoch, Seitenränder 12 mm (Nutzfläche 186 × 273 mm); nichts ragt in den Rand. Oben auf jedem Blatt der Kopf: links Jahrgang und Fach, rechts oben Name und daneben Datum, beide als leere Linie zum Ausfüllen (Name etwa 60 mm, Datum etwa 30 mm lang); darunter die Blattüberschrift und eine gepunktete Linie in Petrol ruhig. Danach kurzer Kontext, Merkkasten, nummerierte Aufgabenboxen mit zugehöriger Hilfe und ausreichend Antwortfläche. Standardmäßig eine Lesespalte; zwei Spalten nur für kurze unabhängige Aufgaben oder direkt vergleichbare Materialien. Abstände im Raster 1,5 mm (Titel zu Text), 3 mm (Auftrag zu Linien), 4,5 mm (zwischen Bausteinen), 6 mm (Innenabstand seitlich), 9 mm (großer Abstand, gleich der Zeilenhöhe). Eine gepunktete Trennlinie nur zwischen Themenblöcken, nicht zwischen jeder Aufgabe. Fließtext pro Blatt: Jahrgang 5–6 höchstens etwa 150 Wörter, Jahrgang 7–10 höchstens etwa 250, Oberstufe höchstens etwa 350. Mindestens ein Drittel des Blatts bleibt Schreibfläche oder Weißraum. Bei mehreren Blättern steht unten die Seitenzahl, bei Material aus fremden Quellen eine kurze Quellenangabe.',
        'Platzbudget: Du kannst die Seite nicht nachmessen, also rechne vorher. Plane jedes Blatt mit diesen Richtwerten und addiere die Höhen: Kopf mit Titel etwa 35 mm, Kontext etwa 6 mm je Textzeile, Merkkasten etwa 25 mm, Wortspeicher etwa 18 mm, Tippkasten etwa 18 mm, Aufgabenbox etwa 12 mm plus Antwortfläche (9 mm je Schreiblinie, 9 mm je Tabellenzeile einschließlich Kopfzeile, Rechenkästchen nach Bedarf), dazu 4,5 mm Abstand je Baustein und 6 mm für die Seitenzahl. Liegt die Summe über 273 mm, verschiebe die letzte Aufgabe samt Tipp auf ein neues Blatt. Nenne die Summe je Blatt kurz in deiner Abschlussprüfung.',
        niveau ? 'Niveaustufen: Kennzeichne jede Aufgabe mit ● (grundlegend), ●● (mittel) oder ●●● (erweitert) in Petrol ruhig, 11 pt, direkt unter der Aufgabenziffer. Erkläre die Symbole einmal in einer einzeiligen Legende unter dem Kopf von Blatt 1. Verwende keine Wörter wie „leicht“ oder „schwer“.' : '',
        zweige ? (jeZweig
          ? 'Zweige: Erstelle für jeden Zweig (' + list(s.zweige) + ') ein eigenes, vollständiges Arbeitsblatt mit gleichem Thema und vergleichbarer Struktur, aber angepasstem Anspruch, Hilfen und Umfang. Nenne den Zweig im Kopf als Feld „Zweig“ neben dem Fach. Die Lösungsübersicht ist nach Zweigen gegliedert.'
          : 'Zweige: Alle Zweige (' + list(s.zweige) + ') arbeiten mit einem gemeinsamen Blatt. Kennzeichne bei jeder Aufgabe in einer eigenen kurzen Zeile über dem Arbeitsauftrag, für welchen Zweig sie Pflicht oder Wahl ist (z. B. „Pflicht: alle“ oder „Wahl: ' + s.zweige[0] + '“), als kleines Etikett wie die Feldnamen im Kopf (9 pt, Versalien, Petrol ruhig).') : '',
        'Bausteine: Merkkasten („Merke“, „Info“, „Regel“ oder „Definition“): Gelb hell mit durchgezogenem gelbem Rahmen, abgerundeten Ecken und Info-Symbol, 2–4 Sätze, höchstens einer pro Blatt. Aufgabenbox: weiße Box mit durchgezogenem Petrol-Rahmen und abgerundeten Ecken, Ziffer wie unter Typografie beschrieben; ein Arbeitsauftrag pro Box, höchstens zwei Sätze, durchgehend nummeriert, nicht verschachtelt. Jede Box folgt der Reihenfolge Ziffer + fett gesetzter Operator + konkreter Materialbezug + erwartetes Ergebnis + passende Antwortfläche; Sozialform und Zeit stehen, falls nötig, stets an derselben Stelle. Tipp- oder Hilfekasten: Salbei hell mit gestricheltem Rahmen in Salbei dunkel und Tipp-Symbol, 1–3 Sätze, direkt unter der Aufgabe, zu der er gehört. Wortspeicher (bei sprachsensibler Gestaltung): weißer Kasten mit 1 mm breitem linkem Rand in Petrol ruhig und dem Titel „Wortspeicher“ wie ein Kastentitel; Nomen immer mit Artikel, dazu passende Satzanfänge; er steht unter dem Merkkasten oder direkt vor der Aufgabe, für die er gebraucht wird. „Weiterdenken“ als Variante „Zusatzaufgabe“ mit Stern-Symbol am Ende des Blatts, ohne die Kernaufgaben zu unterbrechen.',
        'Antwortflächen: Plane sie nach Aufwand und nur so groß, wie die Antwort braucht. Schreiblinien im Abstand von 9 mm: eine Linie für einen Begriff, drei bis fünf für eine Begründung, höchstens etwa acht pro Aufgabe; Rechenkästchen im 5-mm-Karo für Skizzen und Rechenwege, Ergebnisfelder bei Rechnungen separat; Lücken als Linie von etwa 30 mm (länger für längere Antworten). Übriger Platz am Blattende bleibt Weißraum oder nimmt die Zusatzaufgabe auf. Tabellen erhalten klare Spaltenüberschriften (Kopfzeile ggf. Pfirsich hell), ausreichend Zellraum, dezente Linien und Einheiten; Diagramme gut lesbare Achsen, Skalen, Legenden und Einheiten sowie Beschriftungen, die auch in Graustufen funktionieren.',
        icons
          ? 'Bildsprache: Höchstens zwei Illustrationen pro Blatt, nur im Flat-Stil in Gelb und Schwarz, rein dekorativ (alt="") und etwa 30 mm breit neben einem Kasten oder der Überschrift; keine Fotos, keine fremden Clipart-Grafiken. Fachliche Abbildungen und Diagramme sind reduziert, mit klaren Konturen, erklären Prozesse durch Pfeile und Beschriftungen und enthalten keine KI-typischen Fantasiedetails. Icons nur zur Kennzeichnung einer Arbeitsweise, immer mit Textlabel, als einheitliches lineares Set.'
          : 'Bildsprache: Zeichne keine eigenen Icons und keine dekorativen Illustrationen. Verwende nur Symbole, die Word selbst erzeugen kann: Zeichen aus Einfügen → Symbol (z. B. ℹ ★ ✓ ✎ ☞ ➜ in der Schrift „Segoe UI Symbol“), einfache Formen (Kreis, Rechteck, Pfeil) oder Piktogramme aus Einfügen → Piktogramme. In einer HTML-Datei nur die genannten Unicode-Zeichen und einfache Formen, keine selbst gezeichneten SVG-Bilder. Symbole sind einfarbig (Petrol oder Gelb) und stehen immer mit Textlabel. Fachliche Diagramme und Tabellen sind erlaubt, wenn die Aufgabe sie braucht; sie sind reduziert und klar beschriftet. Wo sonst eine Illustration stünde, bleibt Weißraum.',
        'Abschlussprüfung: Prüfe fachliche Korrektheit, Zahlen, Einheiten, Quellen, eindeutige Operatoren, angemessene Antwortflächen, das Platzbudget je Blatt, Farben laut Designsheet, Nummerierung und Textlabels. Das Blatt muss barrierearm und drucktauglich sein: gut lesbare Schrift und Linien, ausreichend Kontrast, kein Beschnitt wichtiger Inhalte, keine Vollflächen und auch als Schwarzweißdruck verständlich, weil Merk-, Aufgaben- und Tippkasten sich durch Rahmenart (durchgezogen, dunkel, gestrichelt) und Symbol unterscheiden. Vermeide überladene Seiten, dekorative Elemente ohne Lernfunktion, winzige Schrift, Text auf unruhigen Bildern, reine Farbcodierung, uneinheitliche Symbole und zu wenig Platz für Antworten.',
        vorrang(s),
        abAusgabe[s.abFormat] || abAusgabe['Druckfertige HTML-Datei']
      ];
    }
  };
  // Nur mit der Auswahl „Icons / Piktogramme“ darf die KI eigene Icons und Illustrationen zeichnen.
  function iconsErlaubt(s) {
    return ['material', 'slides', 'klassenarbeit'].indexOf(s.mode) !== -1 && (s.visualisierung || []).indexOf('Icons / Piktogramme') !== -1;
  }
  // Was die Lehrkraft unter „Visualisierung“ selbst angibt, gilt vor dem Designsheet.
  function vorrang(s) {
    var hat = s.mode === 'material' && ((s.visualisierung || []).length || (s.visualWunsch || '').trim());
    return hat ? 'Vorrang: Meine Wünsche zur Visualisierung (siehe Ausgabeformat) gelten vor diesen Gestaltungsregeln. Widerspricht ein Wunsch einer Regel, setze den Wunsch um und nenne die Abweichung kurz am Ende.' : '';
  }
  // Ohne Datei gehen Schriften, Farben und A4-Aufbau verloren – deshalb wird das Ausgabeformat ausdrücklich genannt.
  var abAusgabe = {
    'Druckfertige HTML-Datei': 'Ausgabe: Gib das Arbeitsblatt als eine einzige, eigenständige, druckfertige HTML-Datei aus, die keine externen Dateien, Schriften oder Bilder lädt; schreibe alle Regeln in ein <style>-Element. @page { size: A4 portrait; margin: 12mm; }, jedes Blatt als eigenes <main class="ab-blatt"> mit page-break-after: always. Gib den Blättern keine feste Höhe mit overflow: hidden, damit zu langer Inhalt sichtbar auf die nächste Seite rutscht statt still abgeschnitten zu werden. Verwende sprechende Klassennamen (z. B. ab-kopf, ab-info, ab-aufgabe, ab-aufgabe__nr, ab-auftrag, ab-linien, ab-luecke, ab-tipp, ab-wortspeicher). Schriften mit sachlichen Ersatzschriften angeben: „Patrick Hand“, Verdana, „Segoe UI“, sans-serif für Überschriften und Verdana, „Segoe UI“, Tahoma, sans-serif für Text. Die Lösungsübersicht steht auf einem eigenen Blatt am Ende. Weise darauf hin, dass beim Drucken „Hintergrundgrafiken“ aktiviert sein muss. Kannst du keine Dateien erzeugen, gib den vollständigen HTML-Code in einem einzigen Codeblock aus.',
    'Word-Datei (DOCX)': 'Ausgabe: Erstelle das Arbeitsblatt als Word-Datei (DOCX) im Format DIN A4 mit 12 mm Rand und den genannten Schriften, Farben und Abständen als Formatvorlagen (Kästen als Tabellenzellen mit Rahmen und heller Tönung, Überschriften in Patrick Hand mit Verdana als Ersatz); die Lösungsübersicht beginnt auf einer neuen Seite. Kannst du keine Dateien erzeugen, sage das zu Beginn und gib stattdessen eine druckfertige HTML-Datei in einem Codeblock aus.',
    'Nur Text': 'Ausgabe: Gib das Arbeitsblatt als gut gegliederten Text aus (Überschriften, nummerierte Aufgaben, Antwortlinien als „________“). Setze die Gestaltungsvorgaben um, soweit es im Text möglich ist, und nenne die übrigen am Ende als kurze Layout-Hinweise zum Übertragen in ein Textprogramm.'
  };
  fields.abFormat = {
    type: 'seg', label: 'Arbeitsblatt ausgeben als', def: 'Druckfertige HTML-Datei',
    options: Object.keys(abAusgabe), hint: 'Schriften, Farben und A4-Layout wirken nur, wenn die KI eine Datei erzeugt.',
    showIf: arbeitsblatt.aktiv
  };
  fields.aufgabenAnzahl = {
    type: 'stepper', label: 'Anzahl der Aufgaben auf dem Arbeitsblatt', unit: 'Aufgaben', def: 5, min: 1, max: 20, step: 1, quick: [3, 5, 8],
    hint: 'Das Arbeitsblatt bekommt automatisch die Gestaltungsvorgaben des Designsheets (Farben, Schriften, Kästen, Seitenaufbau, Lösungsübersicht) und darf mehrere Blätter haben.',
    showIf: arbeitsblatt.aktiv
  };
  fields.abZweige = {
    type: 'seg', label: 'Arbeitsblatt für mehrere Zweige', def: 'Ein gemeinsames Blatt', options: ['Ein gemeinsames Blatt', 'Je Zweig ein eigenes Blatt'],
    hint: 'Gemeinsames Blatt: Jede Aufgabe zeigt, für welchen Zweig sie Pflicht oder Wahl ist.',
    showIf: function (s) { return arbeitsblatt.aktiv(s) && (s.zweige || []).length > 1; }
  };

  var data = {
    fields: fields, modes: modes, cards: cards, groups: ['Planen', 'Material', 'Prüfen'],
    uploadCatalog: uploadCatalog, uploadsBase: uploadsBase, icons: icons, texte: texte, nachschaerfen: nachschaerfen,
    arbeitsblatt: arbeitsblatt
  };
  // Feld-IDs in die Definitionen schreiben (praktisch für Builder und UI)
  Object.keys(fields).forEach(function (k) { fields[k].id = k; });
  return data;
})();

if (typeof module !== 'undefined') module.exports = PB_DATA;
