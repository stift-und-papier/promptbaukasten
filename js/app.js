/* Prompt-Baukasten – Oberfläche, Zustand und localStorage. Nutzt PB_DATA (data.js) und PB (prompt-builder.js). */
(function () {
  'use strict';
  var D = PB_DATA, F = D.fields, T = D.texte;
  var LS = { state: 'pb.state', profiles: 'pb.profiles', history: 'pb.history', ka: 'pb.ka', hint: 'pb.copyHintShown', theme: 'pb.theme' };
  var KA_KEYS = ['fach', 'fachAnders', 'jahrgang', 'thema', 'zweige', 'punkte', 'afbVert'];

  // localStorage kann gesperrt sein (privater Modus, file:// in manchen Browsern) – dann läuft die App ohne Speicherung.
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ohne Speicher weiterarbeiten */ } }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function $(id) { return document.getElementById(id); }

  var state = PB.sanitizeState(load(LS.state, null), D);

  function el(tag, props, kids) {
    var e = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'class') e.className = v;
      else e.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function icon(name) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + D.icons[name] + '</svg>';
  }

  // ---------------- Toast ----------------
  var toastTimer;
  function toast(msg, action) {
    var t = $('toast'), b = $('toastAction');
    $('toastText').textContent = msg;
    b.hidden = !action;
    b.onclick = action ? function () { hideToast(); action.fn(); } : null;
    if (action) b.textContent = action.label;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, action ? 9000 : 4500);
  }
  function hideToast() { $('toast').hidden = true; }
  function undoable(msg, prev) {
    toast(msg, { label: 'Rückgängig', fn: function () { state = prev; commit(); toast('Wiederhergestellt.'); } });
  }

  // ---------------- Zustand ----------------
  function commit() {
    save(LS.state, state);
    syncModebar();
    renderForm();
  }

  function afterChange(id) {
    if (id === 'zweige') {
      // Zweig-Auswahl für die Differenzierung an die gewählten Zweige anpassen
      if (state.zweige.length) state.diffZweige = state.diffZweige.filter(function (z) { return state.zweige.indexOf(z) !== -1; });
      var old = document.querySelector('[data-field="diffZweige"]');
      if (old) old.replaceWith(renderField(F.diffZweige));
    }
    save(LS.state, state);
    if (state.mode === 'klassenarbeit') saveKa();
    updateVisibility();
    updatePreview();
  }
  function set(id, v) { state[id] = v; afterChange(id); }

  function saveKa() {
    var snap = {};
    KA_KEYS.forEach(function (k) { snap[k] = clone(state[k]); });
    save(LS.ka, snap);
  }

  function setMode(id) {
    if (id === state.mode) return;
    var oldM = PB.getMode(D, state.mode), newM = PB.getMode(D, id);
    if (state.mode === 'klassenarbeit') saveKa();
    // Modus-Voreinstellungen nur übernehmen, wenn der Wert noch der alten Voreinstellung entspricht
    Object.keys(newM.defaults || {}).forEach(function (k) {
      if (PB.isEmpty(state[k]) || state[k] === (oldM.defaults || {})[k] || state[k] === F[k].def) state[k] = newM.defaults[k];
    });
    state.mode = id;
    commit();
  }

  // ---------------- Modusleiste ----------------
  function renderModebar() {
    var nav = $('modebar'), n = 0;
    nav.innerHTML = '';
    D.groups.forEach(function (g) {
      var seg = el('div', { class: 'seg mode-seg' });
      D.modes.filter(function (m) { return m.group === g; }).forEach(function (m) {
        n++;
        var input = el('input', { type: 'radio', name: 'mode', id: 'mode-' + m.id, value: m.id, class: 'sr-only' });
        input.addEventListener('change', function () { setMode(m.id); });
        seg.appendChild(input);
        seg.appendChild(el('label', { for: 'mode-' + m.id, title: m.label + ' (Alt+' + n + ')', html: icon(m.id) + '<span></span>' }));
        seg.lastChild.lastChild.textContent = m.label;
      });
      nav.appendChild(el('div', { class: 'mode-group', role: 'radiogroup', 'aria-label': g }, [
        el('span', { class: 'mode-group-label', text: g, 'aria-hidden': 'true' }), seg]));
    });
    syncModebar();
  }
  function syncModebar() {
    var r = $('mode-' + state.mode);
    if (r) { r.checked = true; if (r.nextSibling.scrollIntoView && document.readyState === 'complete') r.nextSibling.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }

  // ---------------- Felder ----------------
  function fieldLabel(f) { return (f.labelByMode && f.labelByMode[state.mode]) || f.label; }
  function labelKids(f) {
    return [fieldLabel(f), f.required ? el('span', { class: 'tag', text: 'Pflicht' }) : null,
      f.optional ? el('span', { class: 'tag muted', text: 'optional' }) : null];
  }

  function piiWarn(f, input) {
    if (!f.pii) return null;
    var w = el('p', { class: 'pii-warn', id: 'pii-' + f.id, role: 'status', hidden: true });
    input.setAttribute('aria-describedby', w.id);
    function check() {
      var hits = PB.findPII(input.value);
      w.hidden = !hits.length;
      w.innerHTML = hits.length ? icon('warn') + '<span></span>' : '';
      if (hits.length) w.lastChild.textContent = 'Das sieht nach ' + hits.join(', ') + ' aus. Bitte keine personenbezogenen Daten eingeben.';
    }
    input.addEventListener('input', check);
    setTimeout(check);
    return w;
  }

  function choiceGroup(f, multi) {
    var opts = f.options;
    if (f.optionsFrom && state[f.optionsFrom].length) opts = state[f.optionsFrom];
    var box = el('div', { class: multi ? 'chips' : 'seg' });
    opts.forEach(function (o, i) {
      var id = 'f-' + f.id + '-' + i;
      var input = el('input', { type: multi ? 'checkbox' : 'radio', name: 'f-' + f.id, id: id, value: o, class: 'sr-only' });
      input.checked = multi ? state[f.id].indexOf(o) !== -1 : state[f.id] === o;
      input.addEventListener('change', function () {
        if (!multi) return set(f.id, o);
        var cur = state[f.id].filter(function (x) { return x !== o; });
        if (input.checked) cur = opts.filter(function (x) { return x === o || cur.indexOf(x) !== -1; });
        set(f.id, cur);
      });
      box.appendChild(input);
      box.appendChild(el('label', { for: id, html: multi ? icon('check') + '<span></span>' : '<span></span>' }));
      box.lastChild.lastChild.textContent = o;
    });
    return el('fieldset', { class: 'field', 'data-field': f.id }, [
      el('legend', { class: 'label' }, labelKids(f).concat(f.hint ? [el('span', { class: 'hint-inline', text: f.hint })] : [])), box]);
  }

  function stepper(f, value, onSet, labelText) {
    var uid = 'f-' + f.id;
    var input = el('input', { type: 'number', id: uid, min: f.min, max: f.max, step: f.step, inputmode: 'numeric', value: value });
    function apply(v) {
      v = Math.max(f.min, Math.min(f.max, Math.round(Number(v))));
      if (isNaN(v)) v = f.def;
      input.value = v; onSet(v);
    }
    input.addEventListener('change', function () { apply(input.value); });
    var kids = [
      el('label', { for: uid, class: 'label' }, [labelText || fieldLabel(f)]),
      el('div', { class: 'stepper' }, [
        el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Weniger', html: icon('minus'), onclick: function () { apply(Number(input.value) - f.step); } }),
        input,
        el('span', { class: 'unit', text: f.unit }),
        el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Mehr', html: icon('plus'), onclick: function () { apply(Number(input.value) + f.step); } })
      ].concat((f.quick || []).map(function (q) {
        return el('button', { type: 'button', class: 'btn quick', text: String(q), 'aria-label': q + ' ' + f.unit, onclick: function () { apply(q); } });
      })))
    ];
    return el('div', { class: 'field', 'data-field': f.id }, kids);
  }

  function renderField(f) {
    var uid = 'f-' + f.id, v = state[f.id], wrap, input;
    switch (f.type) {
      case 'seg': return choiceGroup(f, false);
      case 'chips': return choiceGroup(f, true);
      case 'select':
        input = el('select', { id: uid }, [el('option', { value: '', text: 'Bitte wählen' })].concat(
          f.options.map(function (o) { return el('option', { value: o, text: o }); })));
        input.value = v;
        input.addEventListener('change', function () { set(f.id, input.value); });
        wrap = el('div', { class: 'field', 'data-field': f.id }, [el('label', { for: uid, class: 'label' }, labelKids(f)), input]);
        break;
      case 'text':
      case 'textarea':
        input = el(f.type === 'text' ? 'input' : 'textarea', { id: uid, placeholder: f.placeholder, rows: f.type === 'textarea' ? 2 : null, type: f.type === 'text' ? 'text' : null, required: f.required, autocomplete: 'off' });
        input.value = v;
        input.addEventListener('input', function () { set(f.id, input.value); });
        wrap = el('div', { class: 'field', 'data-field': f.id }, [el('label', { for: uid, class: 'label' }, labelKids(f)), input, piiWarn(f, input)]);
        break;
      case 'toggle':
        input = el('input', { type: 'checkbox', role: 'switch', id: uid, class: 'switch-input' });
        input.checked = !!v;
        input.addEventListener('change', function () { set(f.id, input.checked); });
        wrap = el('div', { class: 'field field-toggle', 'data-field': f.id }, [
          el('label', { for: uid, class: 'switch' }, [input, el('span', { class: 'switch-track', 'aria-hidden': 'true' }), el('span', { class: 'label', text: fieldLabel(f) })])]);
        break;
      case 'stepper':
        wrap = stepper(f, v, function (n) { set(f.id, n); });
        break;
      case 'range':
        var out = el('output', { for: uid, class: 'range-value', text: f.valueLabels[v - 1] });
        input = el('input', { type: 'range', id: uid, min: f.min, max: f.max, step: 1, value: v, 'aria-valuetext': f.valueLabels[v - 1] });
        input.addEventListener('input', function () {
          var n = Number(input.value);
          out.textContent = f.valueLabels[n - 1]; input.setAttribute('aria-valuetext', f.valueLabels[n - 1]);
          set(f.id, n);
        });
        wrap = el('div', { class: 'field', 'data-field': f.id }, [
          el('label', { for: uid, class: 'label' }, [fieldLabel(f)]), out, input,
          el('div', { class: 'range-ticks', 'aria-hidden': 'true' }, [el('span', { text: 'I' }), el('span', { text: 'II' }), el('span', { text: 'III' })])]);
        break;
      case 'afbVert':
        var sum = el('p', { class: 'sum', role: 'status' });
        var showSum = function () {
          var t = v.I + v.II + v.III;
          sum.textContent = 'Summe: ' + t + ' %' + (t === 100 ? '' : ' – bitte auf 100 % anpassen');
          sum.className = 'sum' + (t === 100 ? '' : ' warn');
        };
        var rows = ['I', 'II', 'III'].map(function (k) {
          var id = uid + '-' + k;
          var inp = el('input', { type: 'number', id: id, min: 0, max: 100, step: 5, value: v[k], inputmode: 'numeric' });
          inp.addEventListener('change', function () {
            var n = Math.max(0, Math.min(100, Math.round(Number(inp.value)) || 0));
            inp.value = n; v = clone(state.afbVert); v[k] = n; showSum(); set(f.id, v);
          });
          return el('div', { class: 'afb-item' }, [el('label', { for: id, text: 'AFB ' + k }), inp, el('span', { class: 'unit', text: '%' })]);
        });
        showSum();
        wrap = el('fieldset', { class: 'field', 'data-field': f.id }, [el('legend', { class: 'label', text: fieldLabel(f) }), el('div', { class: 'afb' }, rows), sum]);
        break;
      case 'action':
        wrap = el('div', { class: 'field', 'data-field': f.id }, [
          el('button', { type: 'button', class: 'btn secondary', html: icon(f.action === 'toEwh' ? 'arrowRight' : 'wand') + '<span></span>', onclick: actions[f.action] })]);
        wrap.firstChild.lastChild.textContent = f.label;
        break;
    }
    if (f.hint && f.type !== 'seg' && f.type !== 'chips') wrap.appendChild(el('p', { class: 'hint', text: f.hint }));
    return wrap;
  }

  function renderForm() {
    var form = $('form'), mode = PB.getMode(D, state.mode);
    form.innerHTML = '';
    D.cards.forEach(function (c) {
      var h2 = el('h2', { id: 'h-' + c.id });
      h2.appendChild(el('span', { class: 'tile', 'aria-hidden': 'true', html: icon(c.icon || mode.id) }));
      h2.appendChild(document.createTextNode(c.title || mode.label));
      var sec = el('section', { class: 'card', 'aria-labelledby': h2.id, 'data-card': c.id }, [h2]);
      if (!c.title && mode.pruefen) sec.appendChild(el('p', { class: 'callout warn', html: icon('warn') + '<span></span>' }));
      if (!c.title && mode.pruefen) sec.lastChild.lastChild.textContent = T.pruefenHinweis;
      (c.fields || mode.fields).forEach(function (id) { sec.appendChild(renderField(F[id])); });
      form.appendChild(sec);
    });
    renderUploads();
    updateVisibility();
    updatePreview();
  }

  function updateVisibility() {
    document.querySelectorAll('[data-field]').forEach(function (n) { n.hidden = !PB.isVisible(F[n.getAttribute('data-field')], state); });
    document.querySelectorAll('[data-card]').forEach(function (c) {
      c.hidden = !c.querySelector('[data-field]:not([hidden])');
    });
  }

  function renderUploads() {
    var box = $('uploadChips'), mode = PB.getMode(D, state.mode);
    box.innerHTML = '';
    PB.uploadIdsForMode(D, mode).forEach(function (id) {
      var input = el('input', { type: 'checkbox', id: 'up-' + id, class: 'sr-only' });
      input.checked = state.uploads.indexOf(id) !== -1;
      input.addEventListener('change', function () {
        var cur = state.uploads.filter(function (x) { return x !== id; });
        if (input.checked) cur.push(id);
        set('uploads', cur);
      });
      box.appendChild(input);
      box.appendChild(el('label', { for: 'up-' + id, html: icon('check') + '<span></span>' }));
      box.lastChild.lastChild.textContent = D.uploadCatalog[id];
    });
  }

  // ---------------- Vorschau ----------------
  function currentPrompt() { return PB.buildPrompt(state, D); }

  function updatePreview() {
    $('promptOut').textContent = currentPrompt();
    var q = PB.quality(state, D), pct = q.total ? Math.round(q.done / q.total * 100) : 100;
    $('qualityBar').style.width = pct + '%';
    var parts = ['Prompt-Qualität: ' + q.done + ' von ' + q.total + ' Angaben.'];
    if (q.missingRequired.length) parts.push('Noch nötig: ' + q.missingRequired.join(', ') + '.');
    if (q.missingRec.length) parts.push('Hilfreich wären: ' + q.missingRec.join(', ') + '.');
    else if (!q.missingRequired.length) parts.push('Alles Wichtige ist angegeben.');
    $('qualityText').textContent = parts.join(' ');
  }

  // ---------------- Kopieren, Download, Verlauf ----------------
  function copyText(text) {
    function fallback() {
      var ta = el('textarea', { readonly: true, class: 'offscreen' });
      ta.value = text; document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    }
    return Promise.resolve(fallback());
  }

  function copyPrompt() {
    copyText(currentPrompt()).then(function (ok) {
      if (!ok) {
        var r = document.createRange(); r.selectNodeContents($('promptOut'));
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        return toast('Kopieren nicht möglich. Der Prompt ist markiert – kopiere ihn mit Strg/⌘ + C.');
      }
      addHistory();
      if (!load(LS.hint, false)) { save(LS.hint, true); toast(T.kopierHinweis); }
      else toast('Prompt kopiert.' + (state.thema.trim() ? '' : ' Hinweis: Das Thema fehlt noch.'));
    });
  }

  function slug(s) {
    return (s || 'prompt').toLowerCase().replace(/[äöüß]/g, function (c) { return { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]; })
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'prompt';
  }
  function downloadFile(name, text, type) {
    var a = el('a', { href: URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function downloadPrompt(ext) {
    var mode = PB.getMode(D, state.mode), p = currentPrompt();
    if (ext === 'md') p = '# Prompt: ' + mode.label + (state.thema.trim() ? ' – ' + state.thema.trim() : '') + '\n\n' + p;
    downloadFile('prompt-' + mode.id + '-' + slug(state.thema) + '.' + ext, p, ext === 'md' ? 'text/markdown' : 'text/plain');
    addHistory();
    toast('Download gestartet.');
  }

  function addHistory() {
    var h = load(LS.history, []);
    if (!Array.isArray(h)) h = [];
    var snap = clone(state);
    if (h[0] && JSON.stringify(h[0].state) === JSON.stringify(snap)) h.shift();
    h.unshift({ ts: Date.now(), state: snap });
    save(LS.history, h.slice(0, 10));
  }

  function renderHistory() {
    var list = $('historyList'), h = load(LS.history, []);
    list.innerHTML = '';
    if (!Array.isArray(h) || !h.length) { list.appendChild(el('li', { class: 'empty', text: 'Noch nichts kopiert oder heruntergeladen.' })); return; }
    h.forEach(function (e) {
      var s = PB.sanitizeState(e.state, D), m = PB.getMode(D, s.mode);
      list.appendChild(el('li', {}, [
        el('div', { class: 'list-text' }, [
          el('strong', { text: s.thema || 'Ohne Thema' }),
          el('span', { class: 'small muted', text: m.label + ' · ' + new Date(e.ts).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) })]),
        el('button', { type: 'button', class: 'btn', text: 'Kopieren', onclick: function () { copyText(PB.buildPrompt(s, D)).then(function (ok) { toast(ok ? 'Prompt aus dem Verlauf kopiert.' : 'Kopieren nicht möglich.'); }); } }),
        el('button', { type: 'button', class: 'btn primary', text: 'Wiederherstellen', onclick: function () {
          var prev = clone(state); state = s; $('dlgHistory').close(); commit(); undoable('Eintrag wiederhergestellt.', prev);
        } })
      ]));
    });
  }

  // ---------------- Profile ----------------
  function getProfiles() { var p = load(LS.profiles, {}); return p && typeof p === 'object' && !Array.isArray(p) ? p : {}; }

  function renderProfiles() {
    var list = $('profileList'), p = getProfiles(), names = Object.keys(p).sort(function (a, b) { return a.localeCompare(b, 'de'); });
    list.innerHTML = '';
    if (!names.length) { list.appendChild(el('li', { class: 'empty', text: 'Noch keine Profile gespeichert.' })); return; }
    names.forEach(function (n) {
      var s = PB.sanitizeState(p[n], D);
      list.appendChild(el('li', {}, [
        el('div', { class: 'list-text' }, [el('strong', { text: n }), el('span', { class: 'small muted', text: [PB.getMode(D, s.mode).label, s.fach, s.jahrgang && 'Jg. ' + s.jahrgang].filter(Boolean).join(' · ') })]),
        el('button', { type: 'button', class: 'btn', text: 'Löschen', 'aria-label': 'Profil „' + n + '“ löschen', onclick: function () {
          var all = getProfiles(), old = all[n]; delete all[n]; save(LS.profiles, all); renderProfiles();
          toast('Profil gelöscht.', { label: 'Rückgängig', fn: function () { var a = getProfiles(); a[n] = old; save(LS.profiles, a); renderProfiles(); } });
        } }),
        el('button', { type: 'button', class: 'btn primary', text: 'Laden', 'aria-label': 'Profil „' + n + '“ laden', onclick: function () {
          var prev = clone(state); state = s; $('dlgProfiles').close(); commit(); undoable('Profil „' + n + '“ geladen.', prev);
        } })
      ]));
    });
  }

  function saveProfile() {
    var input = $('profileName'), name = input.value.trim().slice(0, 60);
    if (!name) { input.focus(); return toast('Bitte einen Namen für das Profil eingeben.'); }
    if (PB.findPII(name).length) return toast('Der Name sieht nach personenbezogenen Daten aus. Bitte anders benennen.');
    var all = getProfiles(), old = all[name];
    all[name] = clone(state); save(LS.profiles, all); input.value = ''; renderProfiles();
    if (old) toast('Profil „' + name + '“ überschrieben.', { label: 'Rückgängig', fn: function () { var a = getProfiles(); a[name] = old; save(LS.profiles, a); renderProfiles(); } });
    else toast('Profil „' + name + '“ gespeichert.');
  }

  function exportProfiles() {
    downloadFile('prompt-baukasten-profile.json', JSON.stringify({ app: 'prompt-baukasten', version: 1, profiles: getProfiles() }, null, 2), 'application/json');
  }

  function importProfiles(file) {
    if (!file) return;
    if (file.size > 1024 * 1024) return toast('Die Datei ist zu groß (max. 1 MB).');
    var r = new FileReader();
    r.onload = function () {
      var obj;
      try { obj = JSON.parse(r.result); } catch (e) { return toast('Die Datei ist kein gültiges JSON.'); }
      var src = obj && obj.profiles && typeof obj.profiles === 'object' ? obj.profiles : obj;
      if (!src || typeof src !== 'object' || Array.isArray(src)) return toast('Keine Profile in der Datei gefunden.');
      var all = getProfiles(), before = clone(all), n = 0;
      Object.keys(src).forEach(function (k) {
        var name = String(k).trim().slice(0, 60);
        if (name && src[k] && typeof src[k] === 'object') { all[name] = PB.sanitizeState(src[k], D); n++; }
      });
      save(LS.profiles, all); renderProfiles();
      toast(n + ' Profil(e) importiert.', { label: 'Rückgängig', fn: function () { save(LS.profiles, before); renderProfiles(); } });
    };
    r.readAsText(file);
  }

  // ---------------- Aktionen ----------------
  var actions = {
    toEwh: function () {
      saveKa();
      setMode('ewh');
      state.bezug = 'Zur oben geplanten Klassenarbeit';
      commit();
      toast('Erwartungshorizont: Fach, Jahrgang, Thema, Zweige, Punkte und Anforderungsbereiche übernommen.');
    },
    takeKa: function () {
      var snap = load(LS.ka, null);
      if (!snap) return toast('Noch keine Klassenarbeit geplant. Fülle zuerst den Modus „Klassenarbeit“ aus.');
      var prev = clone(state), clean = PB.sanitizeState(snap, D);
      KA_KEYS.forEach(function (k) { if (k in snap) state[k] = clean[k]; });
      commit();
      undoable('Felder der Klassenarbeit übernommen.', prev);
    }
  };

  function resetForm() {
    var prev = clone(state), mode = PB.getMode(D, state.mode);
    state = PB.defaultState(D); state.mode = mode.id; Object.assign(state, mode.defaults || {});
    commit();
    undoable('Formular zurückgesetzt.', prev);
  }

  function loadExample() {
    var prev = clone(state), mode = PB.getMode(D, state.mode);
    state = PB.defaultState(D); state.mode = mode.id;
    Object.assign(state, mode.defaults || {}, clone(mode.example));
    commit();
    undoable('Beispiel „' + mode.label + '“ geladen.', prev);
  }

  // ---------------- Start ----------------
  function init() {
    document.querySelectorAll('[data-icon]').forEach(function (n) { n.insertAdjacentHTML('afterbegin', icon(n.getAttribute('data-icon'))); });
    T.hinweise.forEach(function (h) { $('hinweise').appendChild(el('li', { text: h })); });
    $('uploadPrivacy').innerHTML = icon('info') + '<span></span>';
    $('uploadPrivacy').lastChild.textContent = T.uploadDatenschutz;

    D.nachschaerfen.forEach(function (n) {
      $('followups').appendChild(el('li', {}, [
        el('div', { class: 'list-text' }, [el('strong', { text: n.label }), el('span', { class: 'small muted', text: n.text })]),
        el('button', { type: 'button', class: 'btn', html: icon('copy') + '<span class="sr-only"></span>', 'aria-label': '„' + n.label + '“ kopieren', onclick: function () {
          copyText(n.text).then(function (ok) { toast(ok ? 'Folgeprompt „' + n.label + '“ kopiert.' : 'Kopieren nicht möglich.'); });
        } })
      ]));
    });

    renderModebar();
    renderForm();

    var setHeaderH = function () { document.documentElement.style.setProperty('--header-h', document.querySelector('.topbar').offsetHeight + 'px'); };
    setHeaderH();
    window.addEventListener('resize', setHeaderH);

    document.querySelectorAll('[data-copy]').forEach(function (b) { b.addEventListener('click', copyPrompt); });
    $('btnTxt').addEventListener('click', function () { downloadPrompt('txt'); });
    $('btnMd').addEventListener('click', function () { downloadPrompt('md'); });
    $('btnReset').addEventListener('click', resetForm);
    $('btnExample').addEventListener('click', loadExample);
    $('btnProfiles').addEventListener('click', function () { renderProfiles(); $('dlgProfiles').showModal(); });
    $('btnHistory').addEventListener('click', function () { renderHistory(); $('dlgHistory').showModal(); });
    $('btnSaveProfile').addEventListener('click', saveProfile);
    $('profileName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveProfile(); } });
    $('btnExport').addEventListener('click', exportProfiles);
    $('btnImport').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function () { importProfiles(this.files[0]); this.value = ''; });
    $('form').addEventListener('submit', function (e) { e.preventDefault(); });

    // Dunkelmodus: Schalter überschreibt die Systemeinstellung; ohne gespeicherte Wahl folgt die App dem System.
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var applyTheme = function (t) { document.documentElement.setAttribute('data-theme', t); $('themeSwitch').checked = t === 'dark'; };
    applyTheme(document.documentElement.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light'));
    $('themeSwitch').addEventListener('change', function () {
      var t = this.checked ? 'dark' : 'light';
      try { localStorage.setItem(LS.theme, t); } catch (e) { /* nur für diese Sitzung */ }
      applyTheme(t);
    });
    mq.addEventListener('change', function () {
      var t; try { t = localStorage.getItem(LS.theme); } catch (e) { t = null; }
      if (t !== 'dark' && t !== 'light') applyTheme(mq.matches ? 'dark' : 'light');
    });

    $('sheetToggle').addEventListener('click', function () {
      var open = $('preview').classList.toggle('open');
      if (!open) document.querySelector('.followups').open = false;
      this.setAttribute('aria-expanded', String(open));
      this.lastElementChild.textContent = open ? 'Prompt ausblenden' : 'Prompt anzeigen';
    });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); copyPrompt(); return; }
      var m = e.altKey && !e.ctrlKey && !e.metaKey && /^Digit([1-7])$/.exec(e.code);
      if (m) { e.preventDefault(); setMode(D.modes[Number(m[1]) - 1].id); $('mode-' + state.mode).focus(); }
      if (e.key === 'Escape' && !$('toast').hidden) hideToast();
    });
  }

  init();
})();
