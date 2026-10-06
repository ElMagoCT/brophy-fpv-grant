/* Navigation, transitions, speaker notes, the arming sequence.
   Scenes are <section class="scene"> in order. Each click reveals the next
   .frag in the scene; when none are left the next click flies to the next
   sheet through a race gate. Hash #/n keeps the place across a reload. */
(function () {
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var cur = -1, flying = false, armed = false;
  var body = document.body, rail = document.getElementById('rail'), quad = document.getElementById('quad'), gate = document.getElementById('gate');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = window.DEMOS || {};
  var demoFor = {};            // scene index -> [demo]
  var notes = [];              // per-scene HTML from SCRIPT.md

  /* ---------------------------------------------------------------- fit */
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var s = Math.min((w - (w < 700 ? 16 : 120)) / 1280, (h - (w < 700 ? 60 : 124)) / 760);
    document.documentElement.style.setProperty('--fit', s.toFixed(4));
    placeQuad(false);
  }
  window.addEventListener('resize', fit);


  /* --------------------------------------------------- city skyline layers */
  (function buildCity() {
    var layers = document.querySelectorAll('#city .layer'); if (!layers.length) return;
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    Array.prototype.forEach.call(layers, function (L, li) {
      var W = 1600, H = 400, x = 0, parts = [], minW = [70, 50, 36][li], maxW = [160, 120, 90][li], minH = [60, 90, 120][li], maxH = [220, 300, 390][li];
      while (x < W) {
        var w = minW + rnd() * (maxW - minW), h = minH + rnd() * (maxH - minH), y = H - h;
        parts.push('<rect class="b" x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '"/>');
        if (li > 0) for (var wy = y + 10; wy < H - 14; wy += 16) for (var wx = x + 7; wx < x + w - 10; wx += 13) if (rnd() < .55) parts.push('<rect class="w' + (rnd() < .12 ? ' lit' : '') + '" x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="6" height="8"/>');
        if (rnd() < .25) { var ax = x + w / 2; parts.push('<line class="ant" x1="' + ax.toFixed(0) + '" y1="' + y + '" x2="' + ax.toFixed(0) + '" y2="' + (y - 30) + '"/><circle class="beacon" cx="' + ax.toFixed(0) + '" cy="' + (y - 32) + '" r="2.5"/>'); }
        x += w + 4 + rnd() * 18;
      }
      L.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice">' + parts.join('') + '</svg>';
    });
  })();

  /* -------------------------------------------------------------- demos */
  function mount(id, demo) {
    var node = document.getElementById(id); if (!node || !demo) return;
    demo.mount(node);
    var sc = node.closest('.scene'), i = scenes.indexOf(sc);
    (demoFor[i] = demoFor[i] || []).push(demo);
  }
  mount('liveStats', D.liveStats); mount('ladder', D.ladder); mount('badges', D.badges); mount('kioskDemo', D.kiosk); mount('siteDemo', D.siteDemo);
  function demos(i, on) { (demoFor[i] || []).forEach(function (d) { try { d[on ? 'start' : 'stop'](); } catch (e) {} }); }

  /* --------------------------------------------- photos that may not exist */
  Array.prototype.forEach.call(document.querySelectorAll('img[data-photo]'), function (img) {
    var probe = new Image();
    probe.onload = function () { img.src = img.getAttribute('data-photo'); img.style.objectFit = 'cover'; img.style.height = '100%'; img.style.width = '100%'; };
    probe.onerror = function () {
      var ph = document.createElement('div'); ph.className = 'ph'; ph.style.height = '100%';
      ph.innerHTML = '<span>photo coming from the kiosk session</span><b>' + img.getAttribute('data-label') + '</b><span class="f">' + img.getAttribute('data-photo').replace('assets/img/', '') + '</span>';
      img.parentNode.replaceChild(ph, img);
    };
    probe.src = img.getAttribute('data-photo');
  });

  /* --------------------------------------------------------------- rail */
  scenes.forEach(function (s, i) {
    var t = document.createElement('div'); t.className = 'tick'; t.setAttribute('data-n', (i + 1) + ' · ' + s.getAttribute('data-title'));
    t.addEventListener('click', function (e) { e.stopPropagation(); go(i); });
    rail.appendChild(t);
  });
  var ticks = Array.prototype.slice.call(rail.children);
  function placeQuad(bank) {
    if (cur < 0) return;
    var r = ticks[cur].getBoundingClientRect();
    var x = r.left + r.width / 2 - 20;
    quad.style.transform = 'translateX(' + x + 'px)' + (bank ? ' rotate(' + bank + 'deg)' : '');
    if (bank) setTimeout(function () { quad.style.transform = 'translateX(' + x + 'px)'; }, 500);
  }

  /* ----------------------------------------------------------- fragments */
  function frags(i) { return Array.prototype.slice.call(scenes[i].querySelectorAll('.frag')); }
  function shown(i) { return frags(i).filter(function (f) { return f.classList.contains('on'); }).length; }
  function setFrags(i, n) { frags(i).forEach(function (f, k) { f.classList.toggle('on', k < n); }); }
  function allFrags() { return body.classList.contains('show-all'); }

  /* ------------------------------------------------------------------ go */
  function go(n, opts) {
    opts = opts || {};
    if (n < 0 || n >= scenes.length || flying) return;
    if (n === cur) return;
    var fwd = n > cur, old = cur;
    cur = n;
    var dur = reduce ? 320 : 800;
    var sNew = scenes[n], sOld = old >= 0 ? scenes[old] : null;
    flying = true; body.classList.add('flying'); body.classList.toggle('back', !fwd);
    if (sOld) {
      demos(old, false);
      sOld.classList.remove('active', 'enter-fwd', 'enter-back');
      sOld.classList.add('leaving', fwd ? 'leave-fwd' : 'leave-back');
      sOld.style.zIndex = fwd ? 3 : 1;
    }
    setFrags(n, fwd && !opts.allFrags ? 0 : frags(n).length);
    sNew.classList.remove('leaving', 'leave-fwd', 'leave-back');
    sNew.classList.add('active', fwd ? 'enter-fwd' : 'enter-back');
    sNew.style.zIndex = 2;
    if (!reduce && fwd && old >= 0) { gate.classList.remove('go'); void gate.offsetWidth; gate.classList.add('go'); }
    ticks.forEach(function (t, k) { t.classList.toggle('cur', k === n); t.classList.toggle('done', k < n); });
    placeQuad(fwd ? 14 : -14);
    document.getElementById('osdScene').textContent = pad(n + 1) + '/' + pad(scenes.length);
    document.getElementById('osdTitle').textContent = ' · ' + sNew.getAttribute('data-title');
    if (location.hash !== '#/' + (n + 1)) history.replaceState(null, '', '#/' + (n + 1));
    renderNotes(); renderMenu();
    setTimeout(function () {
      if (sOld) { sOld.classList.remove('leaving', 'leave-fwd', 'leave-back'); }
      sNew.classList.remove('enter-fwd', 'enter-back');
      flying = false; body.classList.remove('flying', 'back');
      demos(n, true);
    }, dur);
  }
  function next() {
    if (flying) return;
    var f = frags(cur);
    if (!allFrags() && !scenes[cur].hasAttribute('data-nofrag') && shown(cur) < f.length) { f[shown(cur)].classList.add('on'); return; }
    if (cur < scenes.length - 1) go(cur + 1); else toast('end of flight plan');
  }
  function prev() {
    if (flying) return;
    var s = shown(cur);
    if (!allFrags() && !scenes[cur].hasAttribute('data-nofrag') && s > 0) { frags(cur)[s - 1].classList.remove('on'); return; }
    if (cur > 0) go(cur - 1, { allFrags: true });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ------------------------------------------------------------- toast */
  var toastT;
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 1600); }

  /* -------------------------------------------------------------- notes */
  var notesEl = document.getElementById('notes'), notesBody = document.getElementById('notesBody');
  function md(s) {
    var out = [], inList = false;
    s.split('\n').forEach(function (line) {
      var l = line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[EDIT:([^\]]*)\]/g, '<mark>EDIT:$1</mark>').replace(/_(.+?)_/g, '<i>$1</i>');
      if (/^\s*[-*] /.test(l)) { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + l.replace(/^\s*[-*] /, '') + '</li>'); return; }
      if (inList) { out.push('</ul>'); inList = false; }
      if (/^> /.test(l)) out.push('<div class="cue">' + l.slice(2) + '</div>');
      else if (/^### /.test(l)) out.push('<h4>' + l.slice(4) + '</h4>');
      else if (l.trim()) out.push('<p>' + l + '</p>');
    });
    if (inList) out.push('</ul>');
    return out.join('');
  }
  fetch('SCRIPT.md').then(function (r) { return r.text(); }).then(function (txt) {
    var parts = txt.split(/^## /m).slice(1);
    notes = parts.map(function (p) { var nl = p.indexOf('\n'); return '<h4 style="font-size:20px;margin-top:0">' + p.slice(0, nl) + '</h4>' + md(p.slice(nl + 1)); });
    renderNotes();
  }).catch(function () { notesBody.innerHTML = '<p class="hint">SCRIPT.md could not be loaded (open the deck over http, not file://).</p>'; });
  function renderNotes() {
    if (!notesEl.classList.contains('open')) return;
    notesBody.innerHTML = notes[cur] || '<p class="hint">No notes for this sheet yet. Add a "## ' + (cur + 1) + '." section to SCRIPT.md.</p>';
    notesEl.scrollTop = 0;
  }

  /* --------------------------------------------------------------- menu */
  var menu = document.getElementById('menu'), menuList = document.getElementById('menuList');
  scenes.forEach(function (s, i) {
    var b = document.createElement('button'); b.innerHTML = '<span>' + pad(i + 1) + '</span>' + s.getAttribute('data-title');
    b.addEventListener('click', function (e) { e.stopPropagation(); menu.classList.remove('open'); go(i, { allFrags: true }); });
    menuList.appendChild(b);
  });
  function renderMenu() { Array.prototype.forEach.call(menuList.children, function (b, i) { b.classList.toggle('cur', i === cur); }); }
  menu.addEventListener('click', function () { menu.classList.remove('open'); });

  /* ------------------------------------------------------------- clock */
  function clock() { var d = new Date(); document.getElementById('osdClock').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  clock(); setInterval(clock, 10000);

  /* --------------------------------------------------------------- arm */
  var armEl = document.getElementById('arm');
  function arm(instant) {
    if (armed) return; armed = true;
    var start = parseInt((location.hash.match(/#\/(\d+)/) || [])[1], 10);
    var target = isNaN(start) ? 0 : Math.min(scenes.length, Math.max(1, start)) - 1;
    if (instant) { armEl.classList.add('off'); body.classList.remove('disarmed'); document.getElementById('osdMode').textContent = 'ARMED'; go(target, { allFrags: true }); return; }
    var bars = armEl.querySelectorAll('#armSeq i'), word = document.getElementById('armWord'), hint = document.getElementById('armHint');
    word.textContent = 'ARMING'; hint.textContent = 'props spinning up';
    bars.forEach(function (b, i) { setTimeout(function () { b.classList.add('on'); }, 120 + i * 110); });
    setTimeout(function () { word.textContent = 'ARMED'; word.classList.add('armed'); body.classList.remove('disarmed'); document.getElementById('osdMode').textContent = 'ARMED'; }, 900);
    setTimeout(function () { armEl.classList.add('off'); go(target); }, 1350);
  }
  armEl.addEventListener('click', function (e) { e.stopPropagation(); arm(false); });

  /* ------------------------------------------------------------- input */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (!armed) { arm(false); e.preventDefault(); return; }
    var k = e.key;
    if (k === 'Escape') { notesEl.classList.remove('open'); menu.classList.remove('open'); return; }
    if (menu.classList.contains('open') && k !== 'g' && k !== 'G') { menu.classList.remove('open'); }
    switch (k) {
      case 'ArrowRight': case ' ': case 'PageDown': case 'Enter': case 'ArrowDown': next(); e.preventDefault(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace': case 'ArrowUp': prev(); e.preventDefault(); break;
      case 'Home': go(0, { allFrags: true }); break;
      case 'End': go(scenes.length - 1, { allFrags: true }); break;
      case 'n': case 'N': notesEl.classList.toggle('open'); renderNotes(); break;
      case 'g': case 'G': menu.classList.toggle('open'); renderMenu(); break;
      case 'a': case 'A': body.classList.toggle('show-all'); toast(allFrags() ? 'all bullets shown' : 'bullets one click at a time'); break;
      case 'f': case 'F': if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); break;
      default: if (/^[1-9]$/.test(k)) go(parseInt(k, 10) - 1, { allFrags: true });
    }
  });
  document.getElementById('stage').addEventListener('click', function (e) {
    if (!armed) return;
    if (e.target.closest('.no-nav, a, button, input, select, textarea')) return;
    if (e.clientX < window.innerWidth * 0.22) prev(); else next();
  });
  var tx = null, ty = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx == null) return; var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); }
  });
  window.addEventListener('hashchange', function () {
    var n = parseInt((location.hash.match(/#\/(\d+)/) || [])[1], 10);
    if (!isNaN(n) && n - 1 !== cur && armed) go(n - 1, { allFrags: true });
  });

  /* -------------------------------------------------------------- boot */
  fit();
  var startAt = parseInt((location.hash.match(/#\/(\d+)/) || [])[1], 10);
  if (!isNaN(startAt) && startAt > 1) arm(true);
})();
