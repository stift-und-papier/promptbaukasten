/*
 * Prompt-Baukasten – reine Funktionen: aus Zustand + Konfiguration (PB_DATA) wird der Prompt-Text.
 * Kein DOM-Zugriff, damit die Funktionen auch in Node getestet werden können.
 */
var PB = (function () {
  function isEmpty(v) {
    return v === undefined || v === null || v === false || (typeof v === 'string' && v.trim() === '') ||
      (Array.isArray(v) && v.length === 0) || (typeof v === 'number' && isNaN(v));
  }

  function clone(v) { return v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; }

  function getMode(data, id) {
    for (var i = 0; i < data.modes.length; i++) if (data.modes[i].id === id) return data.modes[i];
    return data.modes[0];
  }

  // Alle Feld-IDs eines Modus in Formular-Reihenfolge (Modus-Felder an Stelle der Karte „modus“).
  function fieldIdsForMode(data, modeId) {
    var mode = getMode(data, modeId), ids = [];
    data.cards.forEach(function (c) { ids = ids.concat(c.fields || mode.fields); });
    return ids;
  }

  function isVisible(f, s) {
    if (f.hideIn && f.hideIn.indexOf(s.mode) !== -1) return false;
    return !f.showIf || !!f.showIf(s);
  }

  function defaultState(data) {
    var s = { mode: data.modes[0].id, uploads: [] };
    Object.keys(data.fields).forEach(function (k) {
      var f = data.fields[k];
      if (f.type !== 'action') s[k] = clone(f.def);
    });
    return s;
  }

  // Übernimmt nur bekannte Schlüssel mit passendem Typ (z. B. beim Import von Profilen).
  function sanitizeState(obj, data) {
    var s = defaultState(data);
    if (!obj || typeof obj !== 'object') return s;
    Object.keys(s).forEach(function (k) {
      var v = obj[k], d = s[k];
      if (v === undefined || v === null) return;
      if (Array.isArray(d)) { if (Array.isArray(v)) s[k] = v.filter(function (x) { return typeof x === 'string'; }); }
      else if (d && typeof d === 'object') {
        if (typeof v === 'object') Object.keys(d).forEach(function (kk) { if (typeof v[kk] === 'number') s[k][kk] = v[kk]; });
      }
      else if (typeof v === typeof d) s[k] = v;
    });
    if (!data.modes.some(function (m) { return m.id === s.mode; })) s.mode = data.modes[0].id;
    return s;
  }

  function render(tpl, v, s) {
    var out = typeof tpl === 'function' ? tpl(v, s) : tpl.split('{v}').join(Array.isArray(v) ? v.join(', ') : String(v));
    return (Array.isArray(out) ? out : [out]).filter(function (x) { return !isEmpty(x); });
  }

  function uploadIdsForMode(data, mode) { return data.uploadsBase.concat(mode.uploads || []); }

  function buildPrompt(s, data) {
    var mode = getMode(data, s.mode), T = data.texte, detail = s.promptStil !== 'kompakt';
    var fach = s.fach === 'Anderes' ? (s.fachAnders || '').trim() : s.fach;
    var h = {
      fach: fach || '', fachKlammer: fach ? ' (' + fach + ')' : '',
      thema: (s.thema || '').trim() || '[Thema ergänzen]'
    };

    var b = { kontext: [], aufgabe: [], methodik: [], diff: [], einsatz: [], format: [] };
    fieldIdsForMode(data, s.mode).forEach(function (id) {
      var f = data.fields[id];
      if (!f || !f.section || !f.tpl || !isVisible(f, s) || isEmpty(s[id])) return;
      b[f.section] = b[f.section].concat(render(f.tpl, s[id], s));
    });

    var upIds = uploadIdsForMode(data, mode);
    var checked = upIds.filter(function (id) { return (s.uploads || []).indexOf(id) !== -1; });
    if (checked.length) b.kontext.push(T.uploadsSatz.replace('{v}', checked.map(function (id) { return data.uploadCatalog[id]; }).join('; ')));

    var aufgabe = typeof mode.aufgabe === 'function' ? mode.aufgabe(s, h)
      : mode.aufgabe.replace('{fachKlammer}', h.fachKlammer).replace('{thema}', h.thema);

    var out = [];
    function sec(title, lines, bullets) {
      lines = lines.filter(function (x) { return !isEmpty(x); });
      if (!lines.length) return;
      out.push('## ' + title + '\n' + lines.map(function (l) { return bullets ? '- ' + l : l; }).join('\n'));
    }

    sec('Rolle', [[T.rolleBasis.replace('{fach}', fach ? ' für ' + fach : ''), mode.rolle, detail ? T.rolleDetail : ''].filter(Boolean).join(' ')]);
    sec('Kontext', b.kontext, true);
    sec('Aufgabe', [aufgabe].concat(b.aufgabe.map(function (l) { return '- ' + l; }), detail ? (mode.detail || []).map(function (l) { return '- ' + l; }) : []));

    var anf = [];
    [['Methodik', b.methodik], ['Differenzierung', b.diff], ['Einsatz (digital/analog)', b.einsatz]].forEach(function (p) {
      if (p[1].length) anf.push('### ' + p[0] + '\n' + p[1].map(function (l) { return '- ' + l; }).join('\n'));
    });
    if (anf.length) out.push('## Anforderungen\n' + anf.join('\n\n'));

    sec('Ausgabeformat', b.format.concat(mode.ausgabe || []), true);

    var q = T.qualitaet.slice();
    if (mode.pruefen) q.push(T.pruefenRegel);
    if (detail) q = q.concat(T.qualitaetDetail);
    if (s.rueckfragen) q.push(T.rueckfragen);
    sec('Qualitätsregeln', q, true);

    var beispiele = upIds.filter(function (id) { return checked.indexOf(id) === -1; })
      .map(function (id) { return data.uploadCatalog[id]; });
    if (!beispiele.length) beispiele = ['weitere Unterlagen, die du für hilfreich hältst'];
    sec('Für ein noch besseres Ergebnis', T.optimierung.map(function (l) { return l.replace('{beispiele}', beispiele.join('; ')); }));

    return out.join('\n\n') + '\n';
  }

  function quality(s, data) {
    var res = { done: 0, total: 0, missingRequired: [], missingRec: [] };
    fieldIdsForMode(data, s.mode).forEach(function (id) {
      var f = data.fields[id];
      if (!f || !(f.required || f.rec) || !isVisible(f, s)) return;
      res.total++;
      if (!isEmpty(s[id])) res.done++;
      else (f.required ? res.missingRequired : res.missingRec).push(f.label);
    });
    return res;
  }

  // Einfache, nicht blockierende Prüfung auf personenbezogene Muster.
  function findPII(text) {
    var hits = [];
    if (!text) return hits;
    if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text)) hits.push('E-Mail-Adresse');
    var phones = text.match(/(?:\+|\b0)\d[\d\s\/\-()]{5,}\d/g) || [];
    if (phones.some(function (p) { return p.replace(/\D/g, '').length >= 7; })) hits.push('Telefonnummer');
    if (/\b(0?[1-9]|[12]\d|3[01])\.\s?(0?[1-9]|1[0-2])\.\s?(19|20)?\d{2}\b/.test(text) || /\bgeb(\.|oren)\s/i.test(text)) hits.push('Geburtsdatum');
    return hits;
  }

  return {
    isEmpty: isEmpty, getMode: getMode, fieldIdsForMode: fieldIdsForMode, isVisible: isVisible,
    defaultState: defaultState, sanitizeState: sanitizeState, buildPrompt: buildPrompt,
    quality: quality, findPII: findPII, uploadIdsForMode: uploadIdsForMode
  };
})();

if (typeof module !== 'undefined') module.exports = PB;
