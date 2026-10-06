/* The fly-through: every <section class="scene"> is a sign placed along a
   winding 3D route; #route is moved so the current sign sits at the origin,
   and a CSS transition on that transform is the camera flight. Neon trails
   are thin 3D bars between consecutive signs. The city parallaxes with the
   camera. Hash #/n keeps the place; N notes, G list, A bullets, F fullscreen. */
(function () {
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var cur = -1, moving = false;
  var body = document.body, D = window.DEMOS || {}, demoFor = {}, notes = [];
  var route = document.getElementById('route');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------- route */
  var STEP = 2200;                                   // depth between signs
  var pos = scenes.map(function (s, i) {
    return { x: Math.sin(i * 1.15) * 760, y: Math.cos(i * 0.9) * 230 - 40, z: -i * STEP };
  });
  var fit = 1;
  function layout() {
    var w = window.innerWidth, h = window.innerHeight - 44;
    fit = Math.min((w - (w < 700 ? 8 : 90)) / 1280, (h - (w < 700 ? 8 : 80)) / 720) * (w < 700 ? 1 : 0.82);   // leave sky and city around the sign
    scenes.forEach(function (s, i) {
      var p = pos[i];
      s.style.transform = 'translate3d(' + p.x * fit + 'px,' + p.y * fit + 'px,' + p.z * fit + 'px) scale(' + fit + ')';
    });
    trails.forEach(function (t, i) {
      var a = pos[i], b = pos[i + 1];
      var dx = (b.x - a.x) * fit, dy = (b.y - a.y) * fit, dz = (b.z - a.z) * fit;
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var ry = Math.atan2(-dz, dx) * 180 / Math.PI;          // yaw in the x/z plane
      var rz = Math.asin(dy / len) * 180 / Math.PI;          // pitch toward y
      // start a little behind the sign so the bar leaves from its lower edge
      t.style.transform = 'translate3d(' + (a.x * fit) + 'px,' + (a.y * fit + 330 * fit) + 'px,' + (a.z * fit - 20) + 'px) rotateY(' + ry + 'deg) rotateZ(' + rz + 'deg)';
      t.style.width = len + 'px';
    });
    camera(false);
  }
  var trails = scenes.slice(0, -1).map(function (s, i) {
    var t = document.createElement('div'); t.className = 'trail';
    t.style.setProperty('--tc', s.getAttribute('data-neon') || '#4de3ff');
    route.appendChild(t); return t;
  });
  var cityLayers = Array.prototype.slice.call(document.querySelectorAll('#city .layer'));
  function camera(animate) {
    if (cur < 0) return;
    var p = pos[cur];
    if (!animate) { route.style.transition = 'none'; cityLayers.forEach(function (l) { l.style.transition = 'none'; }); }
    route.style.transform = 'translate3d(' + (-p.x * fit) + 'px,' + (-p.y * fit) + 'px,' + (-p.z * fit) + 'px)';
    cityLayers.forEach(function (l, k) {
      var f = [0.04, 0.07, 0.11][k], fz = [0.012, 0.02, 0.03][k];
      l.style.transform = 'translate3d(' + (-p.x * f + p.z * fz) + 'px,' + (-p.y * f * 0.5) + 'px,0)';
    });
    if (!animate) { void route.offsetWidth; route.style.transition = ''; cityLayers.forEach(function (l) { l.style.transition = ''; }); }
  }
  window.addEventListener('resize', layout);

  /* ------------------------------------------------------------- city */
  (function buildCity() {
    var seed = 11; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    cityLayers.forEach(function (L, li) {
      var W = 2400, H = [320, 420, 520][li], x = 0, parts = [];
      var minW = [60, 46, 34][li], maxW = [150, 120, 96][li], minH = [60, 100, 140][li], maxH = [H * .7, H * .85, H * .98][li];
      var fill = ['#0f1b31', '#13223d', '#182a4a'][li], win = ['rgba(255,220,150,', 'rgba(255,230,170,', 'rgba(255,240,200,'][li];
      while (x < W) {
        var w = minW + rnd() * (maxW - minW), h = minH + rnd() * (maxH - minH), y = H - h;
        parts.push('<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + fill + '" stroke="rgba(170,200,240,.18)"/>');
        if (li > 0) for (var wy = y + 10; wy < H - 12; wy += 15) for (var wx = x + 6; wx < x + w - 9; wx += 12) if (rnd() < .5) parts.push('<rect x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="5" height="7" fill="' + win + (rnd() < .2 ? '.9' : '.35') + ')"/>');
        if (li === 2 && rnd() < .3) { var ax = x + w / 2; parts.push('<line x1="' + ax.toFixed(0) + '" y1="' + y + '" x2="' + ax.toFixed(0) + '" y2="' + (y - 26) + '" stroke="rgba(200,220,255,.5)"/><circle cx="' + ax.toFixed(0) + '" cy="' + (y - 28) + '" r="2.5" fill="#ff5a5a"><animate attributeName="opacity" values="1;.1;1" dur="1.4s" repeatCount="indefinite"/></circle>'); }
        if (li === 2 && rnd() < .18) { var sx = x + 8 + rnd() * (w - 40), sy = y + 20 + rnd() * (h * .3), sw = 24 + rnd() * 30, col = ['#4de3ff', '#ff4fd8', '#9dff57', '#ffc14d'][Math.floor(rnd() * 4)]; parts.push('<rect x="' + sx.toFixed(0) + '" y="' + sy.toFixed(0) + '" width="' + sw.toFixed(0) + '" height="6" fill="' + col + '" opacity=".85"/>'); }
        x += w + 3 + rnd() * 14;
      }
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + parts.join('') + '</svg>';
      L.style.backgroundImage = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
      L.style.backgroundSize = 'auto 100%';
    });
  })();

  /* ---------------------------------------------------------- flyers */
  (function buildFlyers() {
    var host = document.getElementById('flyers');
    var QUAD = '<svg class="quad" viewBox="0 0 120 100">' +
      '<path class="frame" d="M30 30 L90 70 M90 30 L30 70"/>' +
      '<circle class="duct" cx="30" cy="30" r="20"/><circle class="duct" cx="90" cy="30" r="20"/><circle class="duct" cx="30" cy="70" r="20"/><circle class="duct" cx="90" cy="70" r="20"/>' +
      '<g class="prop"><ellipse cx="30" cy="30" rx="16" ry="5"/><ellipse cx="30" cy="30" rx="5" ry="16"/></g>' +
      '<g class="prop" style="animation-direction:reverse"><ellipse cx="90" cy="30" rx="16" ry="5"/><ellipse cx="90" cy="30" rx="5" ry="16"/></g>' +
      '<g class="prop" style="animation-direction:reverse"><ellipse cx="30" cy="70" rx="16" ry="5"/><ellipse cx="30" cy="70" rx="5" ry="16"/></g>' +
      '<g class="prop"><ellipse cx="90" cy="70" rx="16" ry="5"/><ellipse cx="90" cy="70" rx="5" ry="16"/></g>' +
      '<rect class="body" x="46" y="36" width="28" height="28" rx="6"/>' +
      '<path class="canopy" d="M50 40 Q60 30 70 40 L72 58 Q60 64 48 58 Z"/>' +
      '<circle class="lens" cx="60" cy="38" r="4"/>' +
      '<circle class="led g" cx="28" cy="30" r="2.6"/><circle class="led g" cx="92" cy="30" r="2.6"/><circle class="led r" cx="28" cy="70" r="2.6"/><circle class="led r" cx="92" cy="70" r="2.6"/>' +
      '<circle class="strobe" cx="60" cy="62" r="2"/></svg>';
    var set = [
      { y: '14%', w: '110px', dur: '34s', delay: '-6s', dy: '-40px', op: .9, tilt: '-8deg', c: '#4de3ff' },
      { y: '32%', w: '64px', dur: '52s', delay: '-20s', dy: '30px', op: .6, tilt: '6deg', c: '#ff4fd8', rev: true },
      { y: '58%', w: '150px', dur: '26s', delay: '-11s', dy: '-70px', op: .95, tilt: '-14deg', c: '#9dff57' },
      { y: '8%', w: '40px', dur: '70s', delay: '-33s', dy: '20px', op: .4, tilt: '0deg', c: '#ffc14d', rev: true },
      { y: '44%', w: '86px', dur: '44s', delay: '-2s', dy: '50px', op: .7, tilt: '10deg', c: '#b388ff' }
    ];
    set.forEach(function (f) {
      var d = document.createElement('div'); d.className = 'flyer' + (f.rev ? ' rev' : '');
      d.style.setProperty('--y', f.y); d.style.setProperty('--w', f.w); d.style.setProperty('--dur', f.dur); d.style.setProperty('--delay', f.delay);
      d.style.setProperty('--dy', f.dy); d.style.setProperty('--op', f.op); d.style.setProperty('--tilt', f.tilt); d.style.setProperty('--neon-c', f.c);
      d.innerHTML = QUAD; host.appendChild(d);
    });
  })();

  /* ------------------------------------------------------------ demos */
  if (D.badgelists) D.badgelists.mount();
  if (D.statics) D.statics.mount();
  function mount(id, demo) {
    var node = document.getElementById(id); if (!node || !demo) return;
    demo.mount(node); var i = scenes.indexOf(node.closest('.scene')); (demoFor[i] = demoFor[i] || []).push(demo);
  }
  mount('liveStats', D.liveStats); mount('ladder', D.ladder); mount('carousel', D.carousel); mount('timeline', D.timeline); mount('budget', D.budget);
  function demos(i, on) { (demoFor[i] || []).forEach(function (d) { try { d[on ? 'start' : 'stop'](); } catch (e) {} }); }

  /* -------------------------------------------------------- fragments */
  function frags(i) { return Array.prototype.slice.call(scenes[i].querySelectorAll('.frag')); }
  function shown(i) { return frags(i).filter(function (f) { return f.classList.contains('on'); }).length; }
  function setFrags(i, n) { frags(i).forEach(function (f, k) { f.classList.toggle('on', k < n); }); }
  function allFrags() { return body.classList.contains('show-all'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* --------------------------------------------------------------- go */
  var progress = document.querySelector('#progress i'), counter = document.getElementById('counter');
  function go(n, opts) {
    opts = opts || {};
    if (n < 0 || n >= scenes.length || n === cur) return;
    var fwd = n > cur, old = cur; cur = n;
    moving = true;
    if (old >= 0) demos(old, false);
    scenes.forEach(function (s, i) { s.classList.toggle('near', Math.abs(i - n) <= 2); s.classList.toggle('active', i === n); });
    setFrags(n, fwd && !opts.allFrags ? 0 : frags(n).length);
    var neon = scenes[n].getAttribute('data-neon') || '#4de3ff';
    document.documentElement.style.setProperty('--neon', neon);
    progress.style.width = ((n + 1) / scenes.length * 100) + '%';
    counter.textContent = (n + 1) + ' / ' + scenes.length;
    if (location.hash !== '#/' + (n + 1)) history.replaceState(null, '', '#/' + (n + 1));
    camera(old >= 0);
    renderNotes(); renderMenu();
    setTimeout(function () { moving = false; demos(n, true); }, old < 0 || reduce ? 50 : 1250);
  }
  function next() {
    if (moving) return;
    var f = frags(cur);
    if (!allFrags() && !scenes[cur].hasAttribute('data-nofrag') && shown(cur) < f.length) { f[shown(cur)].classList.add('on'); return; }
    if (cur < scenes.length - 1) go(cur + 1); else toast('last slide');
  }
  function prev() {
    if (moving) return;
    var s = shown(cur);
    if (!allFrags() && !scenes[cur].hasAttribute('data-nofrag') && s > 0) { frags(cur)[s - 1].classList.remove('on'); return; }
    if (cur > 0) go(cur - 1, { allFrags: true });
  }
  var toastT;
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 1600); }

  /* ------------------------------------------------------------ notes */
  var notesEl = document.getElementById('notes'), notesBody = document.getElementById('notesBody');
  function md(s) {
    var out = [], inList = false;
    s.split('\n').forEach(function (line) {
      var l = line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[EDIT:([^\]]*)\]/g, '<mark>EDIT:$1</mark>').replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<i>$2</i>');
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
    notes = txt.split(/^## /m).slice(1).map(function (p) { var nl = p.indexOf('\n'); return '<h4 style="font-size:20px;margin-top:0">' + p.slice(0, nl) + '</h4>' + md(p.slice(nl + 1)); });
    renderNotes();
  }).catch(function () { notesBody.innerHTML = '<p class="hint">SCRIPT.md could not be loaded (open the deck over http, not file://).</p>'; });
  function renderNotes() {
    if (!notesEl.classList.contains('open')) return;
    notesBody.innerHTML = notes[cur] || '<p class="hint">No notes for this slide yet.</p>'; notesEl.scrollTop = 0;
  }

  /* ------------------------------------------------------------- menu */
  var menu = document.getElementById('menu'), menuList = document.getElementById('menuList');
  scenes.forEach(function (s, i) {
    var b = document.createElement('button'); b.innerHTML = '<span>' + pad(i + 1) + '</span>' + s.getAttribute('data-title');
    b.addEventListener('click', function (e) { e.stopPropagation(); menu.classList.remove('open'); go(i, { allFrags: true }); });
    menuList.appendChild(b);
  });
  function renderMenu() { Array.prototype.forEach.call(menuList.children, function (b, i) { b.classList.toggle('cur', i === cur); }); }
  menu.addEventListener('click', function () { menu.classList.remove('open'); });

  /* ------------------------------------------------------------ input */
  setTimeout(function () { body.classList.add('quiet'); }, 9000);
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    body.classList.add('quiet');
    var k = e.key;
    if (k === 'Escape') { notesEl.classList.remove('open'); menu.classList.remove('open'); return; }
    if (menu.classList.contains('open') && k !== 'g' && k !== 'G') menu.classList.remove('open');
    switch (k) {
      case 'ArrowRight': case ' ': case 'PageDown': case 'Enter': case 'ArrowDown': next(); e.preventDefault(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace': case 'ArrowUp': prev(); e.preventDefault(); break;
      case 'Home': go(0, { allFrags: true }); break;
      case 'End': go(scenes.length - 1, { allFrags: true }); break;
      case 'n': case 'N': notesEl.classList.toggle('open'); renderNotes(); break;
      case 'g': case 'G': menu.classList.toggle('open'); renderMenu(); break;
      case 'a': case 'A': body.classList.toggle('show-all'); toast(allFrags() ? 'all bullets shown' : 'bullets one click at a time'); if (!allFrags()) setFrags(cur, 0); break;
      case 'f': case 'F': if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); break;
      default: if (/^[1-9]$/.test(k)) go(parseInt(k, 10) - 1, { allFrags: true });
    }
  });
  document.getElementById('world').addEventListener('click', function (e) {
    if (e.target.closest('.no-nav, a, button, input, select, textarea')) return;
    body.classList.add('quiet');
    if (e.clientX < window.innerWidth * 0.22) prev(); else next();
  });
  var tx = null, ty = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx == null) return; var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (e.target.closest('.no-nav')) return;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); }
  });
  window.addEventListener('hashchange', function () {
    var n = parseInt((location.hash.match(/#\/(\d+)/) || [])[1], 10);
    if (!isNaN(n) && n - 1 !== cur) go(n - 1, { allFrags: true });
  });

  /* ------------------------------------------------------------- boot */
  layout();
  var startAt = parseInt((location.hash.match(/#\/(\d+)/) || [])[1], 10);
  go(isNaN(startAt) ? 0 : Math.min(scenes.length, Math.max(1, startAt)) - 1, { allFrags: true });
})();
