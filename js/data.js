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

  var ZWEIGE = ['Hauptschule', 'Realschule', 'Gymnasium', 'Oberstufe (Q-Phase)', 'Gemischte Lerngruppe (KGS)'];

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
      options: ['5', '6', '7', '8', '9', '10', '11', '12', '13'], tpl: 'Jahrgang: {v}'
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
      tpl: 'Bundesland: {v}'
    },
    kc: {
      type: 'toggle', label: 'Kerncurriculum berücksichtigen', def: true, section: 'kontext',
      tpl: function (v, s) {
        return 'Orientiere dich am Kerncurriculum bzw. Lehrplan ' + (s.bundesland ? 'des Landes ' + s.bundesland + ' ' : '') +
          'für dieses Fach und diesen Jahrgang. Erfinde keine Kompetenzformulierungen; markiere Zuordnungen, die du nicht sicher weißt, mit [unsicher].';
      }
    },
    zweige: {
      type: 'chips', label: 'Schulform / Zweig', hint: 'Mehrfachauswahl möglich', def: [], rec: true,
      section: 'kontext', options: ZWEIGE, tpl: 'Schulform / Zweig: {v}'
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
    diff: {
      type: 'seg', label: 'Differenzierung', def: 'Nein', options: ['Nein', 'Ja'], section: 'diff',
      tpl: function (v, s) {
        if (v !== 'Ja') return '';
        var lines = ['Differenziere das Ergebnis für eine heterogene Lerngruppe.'];
        var map = {
          'Drei Niveaustufen': 'in drei Niveaustufen (grundlegend, mittel, erweitert), deutlich gekennzeichnet',
          'Hilfekarten': 'mit gestuften Hilfekarten (Tipp 1, Tipp 2, Lösungsweg)',
          'Wahlaufgaben': 'mit Wahlaufgaben, zwischen denen die Lernenden wählen können',
          'Sprachsensibel': 'sprachsensibel (Wortspeicher, Satzanfänge, einfache Satzstrukturen)',
          'Zusatzaufgaben für Schnelle': 'mit Zusatzaufgaben für schnelle Lernende'
        };
        (s.diffArt || []).forEach(function (a) { lines.push('Differenzierung ' + (map[a] || a) + '.'); });
        if ((s.diffZweige || []).length) lines.push('Differenziere auf diese Zweige: ' + list(s.diffZweige) + '.');
        return lines;
      }
    },
    diffArt: {
      type: 'chips', label: 'Art der Differenzierung', def: [],
      options: ['Drei Niveaustufen', 'Hilfekarten', 'Wahlaufgaben', 'Sprachsensibel', 'Zusatzaufgaben für Schnelle'],
      showIf: function (s) { return s.diff === 'Ja'; }
    },
    diffZweige: {
      type: 'chips', label: 'Differenzieren auf Zweige', def: [], options: ZWEIGE, optionsFrom: 'zweige',
      showIf: function (s) { return s.diff === 'Ja'; }
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
    format: {
      type: 'seg', label: 'Ausgabeformat', def: 'Stichpunkte', section: 'format', hideIn: ['ewh'],
      options: ['Tabelle', 'Stichpunkte', 'Fließtext', 'Arbeitsblatt-Layout', 'Folienliste', 'Checkliste'],
      tpl: 'Format: {v}'
    },
    laenge: {
      type: 'seg', label: 'Länge', def: 'mittel', options: ['kurz', 'mittel', 'ausführlich'], section: 'format',
      tpl: function (v) {
        return 'Länge: ' + ({ kurz: 'kurz – auf das Wesentliche beschränkt', mittel: 'mittel', 'ausführlich': 'ausführlich – mit Erläuterungen und Beispielen' })[v];
      }
    },
    sprache: { type: 'seg', label: 'Sprache des Ergebnisses', def: 'Deutsch', options: ['Deutsch', 'Englisch'], section: 'format', tpl: 'Sprache des Ergebnisses: {v}' },
    promptStil: { type: 'seg', label: 'Prompt-Umfang', def: 'ausführlich', options: ['kompakt', 'ausführlich'], hint: 'Kompakt lässt erläuternde Zusätze weg.' },
    rueckfragen: { type: 'toggle', label: 'Rückfragen zuerst', def: false, hint: 'Die KI stellt erst höchstens 3 Rückfragen, falls Angaben fehlen.' },

    // ---------- Modus: Stundeneinstieg ----------
    einstiegTyp: {
      type: 'chips', label: 'Einstiegstyp', def: [], rec: true, section: 'aufgabe',
      options: ['Bild', 'Rätsel', 'Provokation', 'Alltagsbezug', 'Hypothese'],
      tpl: 'Gewünschte Art des Einstiegs: {v}. Er soll zu einer klaren Problemfrage für die Stunde führen.'
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
      tpl: 'Materialtyp: {v}.'
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
    operatoren: {
      type: 'toggle', label: 'Operatoren des Fachs verwenden', def: true, section: 'aufgabe',
      tpl: 'Formuliere alle Aufgaben mit den Operatoren des Fachs (gemäß der Operatorenliste des Landes) und ordne jeder Aufgabe einen Anforderungsbereich zu.'
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
      type: 'chips', label: 'Visualisierung', optional: true, def: [], section: 'format',
      options: ['Diagramme', 'Tabellen', 'Bildvorschläge', 'Icons / Piktogramme', 'Farbcodierung', 'Mindmap / Strukturbild', 'Zeitleiste'],
      tpl: 'Gewünschte Visualisierungen: {v}. Beschreibe Bilder und Grafiken als Vorschlag (Inhalt, Beschriftung) und erfinde keine Bildquellen.'
    },
    visualWunsch: {
      type: 'textarea', label: 'Weitere Wünsche zur Visualisierung', optional: true, def: '', pii: true, section: 'format',
      placeholder: 'z. B. Säulendiagramm zur Wahlbeteiligung, Farbe je Niveaustufe, viel Weißraum',
      tpl: 'Wünsche zur Visualisierung: {v}'
    },

    ewhButton: { type: 'action', label: 'Erwartungshorizont dazu erstellen', action: 'toEwh', hint: 'Wechselt den Modus und übernimmt Fach, Jahrgang, Thema, Zweige, Punkte und Anforderungsbereiche.' },

    // ---------- Modus: Erwartungshorizont ----------
    bezug: {
      type: 'seg', label: 'Bezug', def: 'Zur oben geplanten Klassenarbeit',
      options: ['Zur oben geplanten Klassenarbeit', 'Aufgaben füge ich unten im Chat ein']
    },
    kaUebernehmen: {
      type: 'action', label: 'Felder der Klassenarbeit übernehmen', action: 'takeKa',
      showIf: function (s) { return s.bezug === 'Zur oben geplanten Klassenarbeit'; }
    },
    ewhForm: {
      type: 'seg', label: 'Form', def: 'Tabelle', section: 'format', options: ['Tabelle', 'Fließtext-Kriterien'],
      tpl: function (v) {
        return v === 'Tabelle'
          ? 'Format: Tabelle mit den Spalten Aufgabe | erwartete Leistung | Punkte | Anforderungsbereich.'
          : 'Format: Bewertungskriterien als gegliederter Fließtext je Aufgabe, jeweils mit Punkten und Anforderungsbereich.';
      }
    },
    notenschluessel: {
      type: 'seg', label: 'Notenschlüssel', def: 'Standard', options: ['Standard', 'Eigener'], section: 'aufgabe',
      tpl: function (v, s) {
        if (v === 'Eigener') return s.notenEigen ? 'Verwende diesen Notenschlüssel: ' + s.notenEigen : '';
        return 'Schlage einen üblichen Notenschlüssel (Prozent und Punkte je Note) vor und kennzeichne ihn als anpassbar an die Vorgaben des Fachbereichs.';
      }
    },
    notenEigen: {
      type: 'text', label: 'Eigener Notenschlüssel', def: '', placeholder: 'z. B. 1 ab 87 %, 2 ab 73 %, 3 ab 59 %, 4 ab 45 %, 5 ab 20 %',
      showIf: function (s) { return s.notenschluessel === 'Eigener'; }
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
    sprachRichtigkeit: {
      type: 'seg', label: 'Sprachliche Richtigkeit bewerten', def: 'Nein', options: ['Nein', 'Ja'], section: 'aufgabe',
      tpl: function (v, s) { return v === 'Ja' ? 'Bewerte die sprachliche Richtigkeit mit einem Anteil von ' + s.sprachAnteil + ' % der Gesamtleistung und beschreibe die Kriterien.' : ''; }
    },
    sprachAnteil: {
      type: 'stepper', label: 'Anteil sprachliche Richtigkeit', unit: '%', def: 10, min: 5, max: 50, step: 5, quick: [10, 20],
      showIf: function (s) { return s.sprachRichtigkeit === 'Ja'; }
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
      fields: ['einstiegTyp', 'einstiegDauer'], defaults: { format: 'Stichpunkte' },
      uploads: ['stundenplan', 'medien'],
      rolle: 'Du entwickelst motivierende, kognitiv aktivierende Stundeneinstiege.',
      aufgabe: 'Entwickle einen Stundeneinstieg{fachKlammer} zum Thema „{thema}“, der die Lernenden aktiviert, neugierig macht und zu einer Problemfrage führt.',
      detail: ['Gib die Impulsfragen im Wortlaut an und nenne erwartete Antworten der Lernenden.', 'Schlage zusätzlich zwei kurze Alternativen vor.'],
      ausgabe: ['Beschreibe den Einstieg Schritt für Schritt mit Zeitangaben und formuliere am Ende die Problemfrage für die Tafel.'],
      example: {
        fach: 'Geschichte', jahrgang: '7', thema: 'Die Händlergilden des Fantasiereichs Aurelon',
        zweige: ['Realschule'], lerngruppe: 'Neugierig, arbeitet gern mit Bildern, einige Lernende mit Deutsch als Zweitsprache',
        lernziel: 'Die Lernenden formulieren Vermutungen, warum sich Händler zu Gilden zusammenschließen.',
        einstiegTyp: ['Bild', 'Provokation'], einstiegDauer: 8, kritisch: ['Perspektivwechsel'], afb: 1
      }
    },
    {
      id: 'stunde', label: 'Unterrichtsstunde', short: 'Stunde', group: 'Planen',
      fields: ['phasen', 'sozialformen', 'stundenMaterial', 'aufgabenAnzahl', 'abFormat'], defaults: { format: 'Tabelle' },
      uploads: ['stundenplan'],
      rolle: 'Du erstellst durchdachte Verlaufspläne für einzelne Unterrichtsstunden.',
      aufgabe: 'Erstelle einen Verlaufsplan für eine Unterrichtsstunde{fachKlammer} zum Thema „{thema}“.',
      detail: ['Plane realistische Zeiten und eine Reserve bzw. Kürzungsmöglichkeit ein.', 'Formuliere zentrale Arbeitsaufträge im Wortlaut.'],
      ausgabe: ['Verlaufsplan mit den Spalten: Phase, Zeit, Unterrichtsgeschehen, Sozialform, Medien und Material, didaktischer Kommentar.'],
      example: {
        fach: 'Deutsch', jahrgang: '8', thema: 'Das Märchen vom gläsernen Leuchtturm – eine eigene Fortsetzung schreiben',
        zweige: ['Gymnasium'], dauer: 90, lerngruppe: 'Lebhaft, schreibfreudig, braucht klare Strukturen',
        lernziel: 'Die Lernenden schreiben eine stimmige Fortsetzung, die Merkmale des Märchens aufgreift.',
        sozialformen: ['Einzelarbeit', 'Partnerarbeit', 'Plenum'], stundenMaterial: ['Arbeitsblatt', 'Tafelbild'], interaktiv: ['Think-Pair-Share'], afb: 3
      }
    },
    {
      id: 'reihe', label: 'Reihenplanung', short: 'Reihe', group: 'Planen',
      fields: ['stundenAnzahl', 'leistungsnachweis'], defaults: { format: 'Tabelle' },
      uploads: ['uebung'],
      rolle: 'Du planst stimmige Unterrichtsreihen mit klarer Progression.',
      aufgabe: 'Plane eine Unterrichtsreihe{fachKlammer} zum Thema „{thema}“ mit einer klaren Lernprogression von Stunde zu Stunde.',
      detail: ['Begründe die Abfolge der Stunden kurz didaktisch.', 'Achte auf Wiederholungs- und Übungsphasen vor dem Leistungsnachweis.'],
      ausgabe: ['Stelle die Reihe als Übersicht dar, eine Zeile pro Stunde: Stunde, Thema, Lernziel, zentrale Methode und Material, Sicherung bzw. Hausaufgabe.'],
      example: {
        fach: 'Biologie', jahrgang: '6', thema: 'Lebewesen des erfundenen Moorplaneten Velda – Angepasstheit an Lebensräume',
        zweige: ['Gymnasium'], stundenAnzahl: 6, leistungsnachweis: 'Test', dauer: 45,
        vorwissen: 'Kennzeichen des Lebendigen, einfache Nahrungsketten',
        interaktiv: ['Gruppenpuzzle', 'Stationenlernen'], kritisch: ['Annahmen hinterfragen'], einsatz: 'hybrid', geraet: ['iPad']
      }
    },
    {
      id: 'material', label: 'Material', short: 'Material', group: 'Material',
      fields: ['materialTyp', 'aufgabenAnzahl', 'abFormat', 'visualisierung', 'visualWunsch'], defaults: { format: 'Arbeitsblatt-Layout' },
      uploads: ['medien'],
      rolle: 'Du erstellst klar strukturiertes, sofort einsetzbares Unterrichtsmaterial.',
      aufgabe: 'Erstelle Unterrichtsmaterial{fachKlammer} zum Thema „{thema}“.',
      detail: ['Füge eine Lösung bzw. einen Erwartungshorizont für die Lehrkraft getrennt vom Material an.'],
      ausgabe: ['Gib das Material so aus, dass es direkt übernommen werden kann: klare Überschrift, nummerierte Aufgaben mit Operatoren, ausreichend Platzhinweise.'],
      example: {
        fach: 'Mathematik', jahrgang: '7', thema: 'Prozentrechnung am Marktstand des Zauberdorfs Kerbelstein',
        zweige: ['Realschule', 'Hauptschule'], materialTyp: 'Arbeitsblatt',
        diff: 'Ja', diffArt: ['Drei Niveaustufen', 'Sprachsensibel'], diffZweige: ['Realschule', 'Hauptschule'],
        kritisch: ['Fehlersuche'], afb: 2
      }
    },
    {
      id: 'slides', label: 'Slides', short: 'Slides', group: 'Material',
      fields: ['folienAnzahl', 'slideStil', 'visualisierung', 'visualWunsch'], defaults: { format: 'Folienliste' },
      uploads: ['folien', 'medien'],
      rolle: 'Du gestaltest klare, gut lesbare Präsentationen für den Unterricht.',
      aufgabe: 'Erstelle die Struktur einer Präsentation{fachKlammer} zum Thema „{thema}“.',
      detail: ['Achte auf eine Idee pro Folie und gut lesbare, kurze Stichpunkte.'],
      ausgabe: ['Gib für jede Folie aus: Folientitel, 3–5 Stichpunkte und Sprechernotizen (2–4 Sätze). Ergänze bei Bedarf einen Bildvorschlag ohne erfundene Quellenangaben.'],
      example: {
        fach: 'Erdkunde', jahrgang: '9', thema: 'Die Klimazonen der Fantasie-Insel Tamaru',
        zweige: ['Gymnasium'], folienAnzahl: 10, slideStil: 'Bildstark', visualisierung: ['Bildvorschläge', 'Diagramme'], einsatz: 'digital', geraet: ['Smartboard'],
        kritisch: ['Transferfrage']
      }
    },
    {
      id: 'klassenarbeit', label: 'Klassenarbeit', short: 'Klassenarbeit', group: 'Prüfen',
      fields: ['kaArt', 'bearbeitungszeit', 'punkte', 'afbVert', 'aufgabenformate', 'operatoren', 'hilfsmittel', 'zweigFassungen', 'lesbarkeit', 'visualisierung', 'visualWunsch', 'ewhButton'],
      defaults: { format: 'Arbeitsblatt-Layout' }, pruefen: true,
      uploads: ['alteKa', 'kaRegeln', 'notenschluessel', 'operatoren', 'uebung'],
      rolle: 'Du konzipierst faire, valide Leistungsüberprüfungen mit passenden Operatoren.',
      aufgabe: function (s, h) { return 'Erstelle ' + (s.kaArt === 'Test' ? 'einen ' : 'eine ') + (s.kaArt || 'Klassenarbeit') + h.fachKlammer + ' zum Thema „' + h.thema + '“.'; },
      detail: ['Steigere die Schwierigkeit innerhalb der Arbeit und vermeide Aufgaben, die nur bei Vorwissen außerhalb des Unterrichts lösbar sind.'],
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
      fields: ['bezug', 'kaUebernehmen', 'ewhForm', 'punkte', 'afbVert', 'notenschluessel', 'notenEigen', 'loesungswege', 'sprachRichtigkeit', 'sprachAnteil', 'zweigErwartungen'],
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
        bezug: 'Zur oben geplanten Klassenarbeit', ewhForm: 'Tabelle', sprachRichtigkeit: 'Ja', sprachAnteil: 10
      }
    }
  ];

  var cards = [
    { id: 'grund', title: 'Grundlagen', icon: 'book', fields: ['fach', 'fachAnders', 'jahrgang', 'thema', 'bundesland', 'kc', 'zweige'] },
    { id: 'modus', title: null, fields: null },
    { id: 'gruppe', title: 'Lerngruppe und Ziele', icon: 'people', fields: ['dauer', 'lerngruppe', 'lernziel', 'vorwissen'] },
    { id: 'diff', title: 'Differenzierung', icon: 'layers', fields: ['diff', 'diffArt', 'diffZweige'] },
    { id: 'methodik', title: 'Methodik und Einsatz', icon: 'wand', fields: ['einsatz', 'geraet', 'tool', 'ipadDigitalSchreiben', 'interaktiv', 'kritisch', 'afb'] },
    { id: 'ausgabe', title: 'Ausgabe', icon: 'sliders', fields: ['format', 'laenge', 'sprache', 'promptStil', 'rueckfragen'] }
  ];

  var texte = {
    rolleBasis: 'Du bist eine erfahrene Lehrkraft{fach} mit fundierter fachdidaktischer Expertise.',
    rolleDetail: 'Du arbeitest praxisnah, schülerorientiert und achtest auf fachliche Korrektheit und ein dem Jahrgang angemessenes Niveau.',
    uploadsSatz: 'Ich lade zusätzlich hoch bzw. füge ein: {v}. Frage diese Unterlagen nicht erneut ab, sondern nutze sie.',
    qualitaet: [
      'Erfinde keine Quellen oder Fakten.',
      'Kennzeichne Unsicheres mit [unsicher].',
      'Ergänze am Ende eine kurze Liste „Das solltest du prüfen“.'
    ],
    qualitaetDetail: ['Verwende fachlich korrekte Begriffe und eine dem Jahrgang angemessene Sprache.'],
    rueckfragen: 'Stelle zuerst höchstens 3 Rückfragen, falls wichtige Angaben fehlen, und warte auf meine Antworten, bevor du das Ergebnis erstellst.',
    pruefenRegel: 'Prüfe Aufgaben, Punktsummen und Zuordnung der Anforderungsbereiche selbst auf Stimmigkeit, bevor du antwortest.',
    optimierung: [
      'Gib ganz am Ende einen eigenen Abschnitt mit der Überschrift „Für ein noch besseres Ergebnis“ aus. Darin:',
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
  // Lücken ([Fach], [Stufe], [Thema], [Lernziel], [Anzahl], Mappenfarbe) werden aus den Formularangaben gefüllt.
  var mappenfarben = {
    'Mathematik': 'Blau #466BB0', 'Deutsch': 'Rot #BD3D42', 'Englisch': 'Gelb #E5B928', 'Biologie': 'Grün #438153',
    'Chemie': 'Hellblau #77BBD4', 'Physik': 'Hellblau #77BBD4', 'Geschichte': 'Orange #DD8738',
    'Erdkunde': 'Braun #96694B', 'Religion': 'Violett #8A65A8', 'Werte und Normen': 'Violett #8A65A8'
  };
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
      var farbe = mappenfarben[h.fach]
        ? 'Farbe: Verwende genau die Mappenfarbe für ' + h.fach + ', ' + mappenfarben[h.fach] + ', als sparsame Fachfarbe für Fachlabel, feine Linien und Aufgabennummern.'
        : 'Farbe: Wähle genau die passende Mappenfarbe als sparsame Fachfarbe für Fachlabel, feine Linien und Aufgabennummern: Mathematik Blau #466BB0; Deutsch Rot #BD3D42; Englisch Gelb #E5B928; Biologie Grün #438153; Chemie und Physik Hellblau #77BBD4; Geschichte häufig Orange #DD8738; Erdkunde / Geografie Braun #96694B; Religion / Werte & Normen Violett #8A65A8.';
      return [
        'Erstelle ein vollständiges, druckfähiges Aufgabenblatt für ' + (h.fach || 'das Fach') + ', ' + stufe + ', zum Thema „' + h.thema + '“, mit dem Lernziel ' + lernziel + ' und ' + s.aufgabenAnzahl + ' Aufgaben. Das Aufgabenblatt darf mehrere Seiten umfassen, wenn Aufgaben, Material und Antwortflächen das erfordern; wiederhole dann auf jeder Seite Fach und Thema in der Kopfzeile sowie die Seitenzahl. Lass keinen Aufgabenblock über einen Seitenumbruch laufen und plane lieber eine Seite mehr, als Antwortflächen zu verkleinern oder Inhalte abzuschneiden. Gestalte es klar, ruhig, strukturiert und altersgerecht: Jeder Arbeitsschritt soll sofort verständlich sein; Material, Auftrag und Antwortbereich sind sichtbar getrennt. Erstelle außerdem eine separate Lösungsübersicht, nicht auf dem Schülerblatt.',
        farbe + ' Verwende Petrol #176E70 nur als zurückhaltende Strukturfarbe und Terrakotta #D77742 für fächerübergreifende Tipps oder wichtige Hinweise; mische nicht mehrere Fachfarben auf einem Blatt. Nutze überwiegend Weiß #FFFFFF als Hintergrund, Tinte #183132 für Haupttext und gedecktes Grau für Nebeninformationen und Trennlinien. Setze Text auf hellen Farbflächen stets dunkel; bei Gelb und Hellblau niemals weißen Text verwenden. Textkontrast mindestens 4,5:1; längere Texte nie in Akzentfarben. Farbe darf Bedeutung niemals allein vermitteln: ergänze Beschriftungen, Formen oder Linienmuster.',
        'Typografie: Titel in Source Serif 4, 22–26 pt, Gewicht 600; Zwischenüberschriften 15–17 pt. Arbeitsaufträge in DM Sans 11–12 pt, Fließ- und Zusatztext in DM Sans 10–11 pt, Zeilenabstand mindestens 1,4. Beginne jeden Auftrag mit einem eindeutigen, fett gesetzten Operator (z. B. Vergleiche, Berechne, Begründe); verwende altersgerechte, kurze Sätze. Merksätze in einem dezent umrandeten, eindeutig mit „Merke“ beschrifteten Kasten, nicht nur farbig hervorgehoben. Lösungen separat mit derselben Aufgabennummerierung, gut lesbarer DM Sans und klar erkennbaren Ergebnissen sowie bei Bedarf kurzen Rechenwegen oder Begründungen. Maximal drei sichtbare Schriftebenen pro Blatt; linksbündig setzen, sparsame Silbentrennung, kein durchgängiger Versalsatz.',
        'Seitenaufbau: DIN A4 hoch, Seitenränder 16–20 mm; Querformat nur bei umfangreichen Bildern oder Tabellen. Standardmäßig eine Lesespalte; zwei Spalten nur für kurze unabhängige Aufgaben oder direkt vergleichbare Materialien. Arbeite mit einem konsistenten 8-pt-Abstandssystem: etwa 8 mm zwischen Unterelementen und 12–16 mm zwischen Aufgabenblöcken. Oben Fach, Thema, Titel und optional Name/Datum; danach kurzer Kontext, nummerierte Aufgaben, zugehöriges Material oder Hilfe und ausreichend Antwortfläche. Unten Seitenzahl und kurze Quellenangaben. Nutze Weißraum als Arbeitsraum und eine eindeutige visuelle Hierarchie ohne unnötige Rahmen oder Dekoration.',
        'Aufgaben: Jeder Block folgt der Reihenfolge Nummer + fett gesetzter Operator + konkreter Materialbezug + erwartetes Ergebnis + passende Antwortfläche. Nummeriere durchgehend und einheitlich; Sozialform und Zeit stehen, falls nötig, stets an derselben Stelle. Halte Aufgabenblöcke optisch getrennt, aber ruhig. Plane Antwortfelder nach Aufwand: eine Zeile für einen Begriff, drei bis fünf Zeilen für eine Begründung, freie oder karierte Fläche für Skizzen und Rechenwege; Ergebnisfelder bei Rechnungen separat. Tabellen erhalten klare Spaltenüberschriften, ausreichend Zellraum, dezente Linien und Einheiten; Diagramme gut lesbare Achsen, Skalen, Legenden und Einheiten sowie Beschriftungen, die auch in Graustufen funktionieren. Platziere „Hilfe“ als kleine markierte Box nach dem Auftrag und „Weiterdenken“ als optionale Vertiefung am Ende, ohne die Kernaufgabe zu unterbrechen.',
        'Bildsprache: Verwende Icons nur zur Kennzeichnung einer Arbeitsweise und immer mit danebenstehendem Textlabel; ein einheitliches lineares Set mit abgerundeten Enden, 1,8–2 pt Strichstärke und 18–24 pt Größe. Illustrationen und fachliche Diagramme sind reduziert, mit klaren Konturen und maximal drei Akzentfarben; erkläre Prozesse durch Pfeile und Beschriftungen. Fotos nur bei didaktischem Nutzen für Beobachtung oder Analyse: ein klarer Bildgegenstand, ruhiger Hintergrund, natürliche Perspektive, altersgerechte vielfältige Darstellung; ergänze Bildunterschrift, Quelle und gegebenenfalls Maßstab. Vermeide Klischees und KI-typische Fantasiedetails in fachlichen Abbildungen.',
        'Abschlussprüfung: Prüfe fachliche Korrektheit, Zahlen, Einheiten, Quellen, eindeutige Operatoren, angemessene Antwortflächen, konsistente Fach- und Akzentfarben, Nummerierung und Textlabels. Das Blatt muss barrierearm und drucktauglich sein: gut lesbare Schrift und Linien, ausreichend Kontrast, kein Beschnitt wichtiger Inhalte, keine großflächigen Farbfüllungen und auch als Schwarzweißdruck verständlich. Vermeide überladene Seiten, dekorative Elemente ohne Lernfunktion, winzige Schrift, Text auf unruhigen Bildern, reine Farbcodierung, uneinheitliche Icons und zu wenig Platz für Antworten.',
        abAusgabe[s.abFormat] || abAusgabe['Druckfertige HTML-Datei']
      ];
    }
  };
  // Ohne Datei gehen Schriften, Farben und A4-Aufbau verloren – deshalb wird das Ausgabeformat ausdrücklich genannt.
  var abAusgabe = {
    'Druckfertige HTML-Datei': 'Ausgabe: Gib das Arbeitsblatt als eine vollständige, druckfertige HTML-Datei aus: DIN A4 über CSS @page, jede Seite als eigener Abschnitt mit festem Seitenumbruch, Schriften mit Ersatzschriften (z. B. Georgia, Arial), falls Source Serif 4 oder DM Sans nicht installiert sind. Die Lösungsübersicht steht auf einer eigenen Seite am Ende. Kannst du keine Dateien erzeugen, gib den vollständigen HTML-Code in einem einzigen Codeblock aus.',
    'Word-Datei (DOCX)': 'Ausgabe: Erstelle das Arbeitsblatt als Word-Datei (DOCX) im Format DIN A4 mit den genannten Schriften, Rändern und Abständen als Formatvorlagen; die Lösungsübersicht beginnt auf einer neuen Seite. Kannst du keine Dateien erzeugen, sage das zu Beginn und gib stattdessen eine druckfertige HTML-Datei in einem Codeblock aus.',
    'Nur Text': 'Ausgabe: Gib das Arbeitsblatt als gut gegliederten Text aus (Überschriften, nummerierte Aufgaben, Antwortlinien als „________“). Setze die Gestaltungsvorgaben um, soweit es im Text möglich ist, und nenne die übrigen am Ende als kurze Layout-Hinweise zum Übertragen in ein Textprogramm.'
  };
  fields.abFormat = {
    type: 'seg', label: 'Arbeitsblatt ausgeben als', def: 'Druckfertige HTML-Datei',
    options: Object.keys(abAusgabe), hint: 'Schriften, Farben und A4-Layout wirken nur, wenn die KI eine Datei erzeugt.',
    showIf: arbeitsblatt.aktiv
  };
  fields.aufgabenAnzahl = {
    type: 'stepper', label: 'Anzahl der Aufgaben auf dem Arbeitsblatt', unit: 'Aufgaben', def: 5, min: 1, max: 20, step: 1, quick: [3, 5, 8],
    hint: 'Das Arbeitsblatt bekommt automatisch die Gestaltungsvorgaben (Mappenfarbe, Typografie, Seitenaufbau, Lösungsübersicht) und darf mehrere Seiten haben.',
    showIf: arbeitsblatt.aktiv
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
