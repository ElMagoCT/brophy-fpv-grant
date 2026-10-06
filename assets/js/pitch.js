/* The fly-through. Every <section class="scene"> is a cluster of cards laid
   out on a 1280×780 canvas and placed along a winding route that runs mostly
   sideways; #route is moved so the current slide sits at the origin, and the
   CSS transition on that transform is the camera pan (no fades). Inside each
   slide an SVG path threads the cards in order; a 3D bar carries the path on
   to the next slide. Hash #/n keeps the place; N notes, G list, A bullets,
   F fullscreen. */
(function () {
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var cur = -1, moving = false;
  var body = document.body, D = window.DEMOS || {}, demoFor = {}, notes = [];
  var route = document.getElementById('route');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 1280, H = 780;

  /* ----------------------------------------------------------- route */
  // Mostly sideways, with the direction changing every step: up-right, down-right,
  // a long flat run, a dip. Small depth changes keep the parallax alive.
  var DX = 1900, YS = [0, -320, 260, -140, 380, -300, 120, -380, 240, -200, 360, -60, -340, 300, -220, 160];
  var pos = scenes.map(function (s, i) { return { x: i * DX, y: YS[i % YS.length], z: (i % 3 === 1 ? -220 : i % 3 === 2 ? 160 : 0) }; });
  var fit = 1;
  var cityLayers = Array.prototype.slice.call(document.querySelectorAll('#city .layer'));
  var trails = scenes.slice(0, -1).map(function (s) {
    var t = document.createElement('div'); t.className = 'trail';
    t.style.setProperty('--tc', s.getAttribute('data-neon') || '#4de3ff'); route.appendChild(t); return t;
  });
  var paths = scenes.map(function (s) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'path'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '<polyline class="pl"/><polyline class="pulse"/>'; s.insertBefore(svg, s.firstChild); return svg;
  });
  function cardsOf(s) { return Array.prototype.filter.call(s.querySelectorAll('.card'), function (c) { return !c.closest('#carousel'); }); }
  function centre(c, s) { // layout coordinates inside the scene, unaffected by transforms
    var x = c.offsetWidth / 2, y = c.offsetHeight / 2, e = c;
    while (e && e !== s) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x: x, y: y };
  }
  var ends = [];   // per scene: {first:{x,y}, last:{x,y}} in scene coordinates
  function drawPaths() {
    scenes.forEach(function (s, i) {
      var cs = cardsOf(s); if (!cs.length) return;
      var pts = cs.map(function (c) { return centre(c, s); });
      // the path enters from the left edge and leaves by the right edge, so the
      // 3D bar to the next slide never has to cross a card
      var entry = { x: -40, y: pts[0].y }, exit = { x: W + 40, y: pts[pts.length - 1].y };
      var all = (i > 0 ? [entry] : []).concat(pts, i < scenes.length - 1 ? [exit] : []);
      var str = all.map(function (p) { return p.x.toFixed(0) + ',' + p.y.toFixed(0); }).join(' ');
      var pl = paths[i].querySelector('.pl'), pu = paths[i].querySelector('.pulse');
      pl.setAttribute('points', str); pu.setAttribute('points', str);
      var dots = paths[i].querySelectorAll('circle'); Array.prototype.forEach.call(dots, function (d) { d.remove(); });
      pts.forEach(function (p) { var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 6); paths[i].appendChild(c); });
      ends[i] = { first: entry, last: exit };
    });
  }
  function layout() {
    var w = window.innerWidth, h = window.innerHeight - 44;
    fit = Math.min((w - (w < 700 ? 8 : 60)) / W, (h - (w < 700 ? 8 : 60)) / H) * (w < 700 ? 1 : 0.97);
    // a slide whose cards run past the canvas is scaled down to fit it
    scenes.forEach(function (s, i) {
      var p = pos[i], cs = cardsOf(s), bottom = 0;
      cs.forEach(function (c) { var y = c.offsetHeight, e = c; while (e && e !== s) { y += e.offsetTop; e = e.offsetParent; } if (y > bottom) bottom = y; });
      var car = s.querySelector('#carousel'); if (car) bottom = Math.max(bottom, car.offsetTop + car.offsetHeight);
      var sf = Math.min(1, H / Math.max(1, bottom + 10));
      s.style.transform = 'translate3d(' + p.x * fit + 'px,' + (p.y * fit + (H - H * sf) / 2 * fit * 0) + 'px,' + p.z * fit + 'px) scale(' + (fit * sf) + ')';
    });
    drawPaths();
    trails.forEach(function (t, i) {
      var a = pos[i], b = pos[i + 1], ea = ends[i] || { last: { x: W / 2, y: H / 2 } }, eb = ends[i + 1] || { first: { x: W / 2, y: H / 2 } };
      var ax = (a.x + ea.last.x - W / 2) * fit, ay = (a.y + ea.last.y - H / 2) * fit, az = a.z * fit;
      var bx = (b.x + eb.first.x - W / 2) * fit, by = (b.y + eb.first.y - H / 2) * fit, bz = b.z * fit;
      var dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var ry = Math.atan2(-dz, dx) * 180 / Math.PI, rz = Math.asin(dy / len) * 180 / Math.PI;
      t.style.transform = 'translate3d(' + ax + 'px,' + ay + 'px,' + (az - 6) + 'px) rotateY(' + ry + 'deg) rotateZ(' + rz + 'deg)';
      t.style.width = len + 'px';
    });
    camera(false);
  }
  function camera(animate) {
    if (cur < 0) return;
    var p = pos[cur];
    if (!animate) { route.style.transition = 'none'; cityLayers.forEach(function (l) { l.style.transition = 'none'; }); }
    route.style.transform = 'translate3d(' + (-p.x * fit) + 'px,' + (-p.y * fit) + 'px,' + (-p.z * fit) + 'px)';
    cityLayers.forEach(function (l, k) {
      var f = [0.05, 0.09, 0.14][k];
      l.style.transform = 'translate3d(' + (-p.x * f) + 'px,' + (-p.y * f * 0.35) + 'px,0)';
    });
    if (!animate) { void route.offsetWidth; route.style.transition = ''; cityLayers.forEach(function (l) { l.style.transition = ''; }); }
  }
  window.addEventListener('resize', layout);
  window.PITCH = { relayout: function () { requestAnimationFrame(layout); } };

  /* ------------------------------------------------------------- city */
  (function buildCity() {
    var seed = 11; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    cityLayers.forEach(function (L, li) {
      var CW = 2400, CH = [320, 420, 520][li], x = 0, parts = [];
      var minW = [60, 46, 34][li], maxW = [150, 120, 96][li], minH = [60, 100, 140][li], maxH = [CH * .7, CH * .85, CH * .98][li];
      var fill = ['#0f1b31', '#13223d', '#182a4a'][li], win = ['rgba(255,220,150,', 'rgba(255,230,170,', 'rgba(255,240,200,'][li];
      while (x < CW) {
        var w = minW + rnd() * (maxW - minW), h = minH + rnd() * (maxH - minH), y = CH - h;
        parts.push('<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + fill + '" stroke="rgba(170,200,240,.18)"/>');
        if (li > 0) for (var wy = y + 10; wy < CH - 12; wy += 15) for (var wx = x + 6; wx < x + w - 9; wx += 12) if (rnd() < .5) parts.push('<rect x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="5" height="7" fill="' + win + (rnd() < .2 ? '.9' : '.35') + ')"/>');
        if (li === 2 && rnd() < .3) { var ax = x + w / 2; parts.push('<line x1="' + ax.toFixed(0) + '" y1="' + y + '" x2="' + ax.toFixed(0) + '" y2="' + (y - 26) + '" stroke="rgba(200,220,255,.5)"/><circle cx="' + ax.toFixed(0) + '" cy="' + (y - 28) + '" r="2.5" fill="#ff5a5a"/>'); }
        if (li === 2 && rnd() < .18) { var sx = x + 8 + rnd() * (w - 40), sy = y + 20 + rnd() * (h * .3), sw = 24 + rnd() * 30, col = ['#4de3ff', '#ff4fd8', '#9dff57', '#ffc14d'][Math.floor(rnd() * 4)]; parts.push('<rect x="' + sx.toFixed(0) + '" y="' + sy.toFixed(0) + '" width="' + sw.toFixed(0) + '" height="6" fill="' + col + '" opacity=".85"/>'); }
        x += w + 3 + rnd() * 14;
      }
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + CW + ' ' + CH + '" width="' + CW + '" height="' + CH + '">' + parts.join('') + '</svg>';
      L.style.backgroundImage = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
      L.style.backgroundSize = 'auto 100%';
    });
  })();

  /* ------------------------------------------------------ light trails */
  (function buildTrails() {
    var host = document.getElementById('flyers');
    var P = [
      { d: 'M -100 220 C 300 80, 700 420, 1100 180 S 1700 260, 1800 120', c: '#4de3ff', dash: 260, dur: 7, delay: -2 },
      { d: 'M 1750 700 C 1300 520, 900 860, 500 640 S -50 560, -150 700', c: '#ff4fd8', dash: 200, dur: 9, delay: -5 },
      { d: 'M -120 560 C 250 700, 650 300, 950 520 S 1500 760, 1800 500', c: '#9dff57', dash: 320, dur: 11, delay: -1 },
      { d: 'M 1800 300 C 1400 160, 1100 140, 800 320 S 300 460, -100 380', c: '#ffc14d', dash: 180, dur: 8, delay: -6 },
      { d: 'M -100 80 C 400 160, 600 20, 1000 100 S 1500 60, 1800 160', c: '#b388ff', dash: 150, dur: 13, delay: -3 }
    ];
    var svg = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">';
    P.forEach(function (p, i) {
      // the path length is measured after insertion; a generous placeholder keeps the first frame sane
      svg += '<path class="tr glow" id="trg' + i + '" d="' + p.d + '" stroke="' + p.c + '" style="--dur:' + p.dur + 's;--delay:' + p.delay + 's"/>';
      svg += '<path class="tr" id="tr' + i + '" d="' + p.d + '" stroke="' + p.c + '" style="--dur:' + p.dur + 's;--delay:' + p.delay + 's"/>';
    });
    host.innerHTML = svg + '</svg>';
    P.forEach(function (p, i) {
      ['trg', 'tr'].forEach(function (k) {
        var el = document.getElementById(k + i), len = el.getTotalLength();
        el.style.setProperty('--len', len); el.style.setProperty('--dash', p.dash);
        el.setAttribute('stroke-dasharray', p.dash + ' ' + len);
      });
    });
  })();

  /* ------------------------------------------------------------ demos */
  if (D.badgelists) D.badgelists.mount();
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
    scenes.forEach(function (s, i) { s.classList.toggle('near', Math.abs(i - n) <= 1); s.classList.toggle('active', i === n); });
    trails.forEach(function (t, i) { t.style.visibility = (i >= n - 1 && i <= n) ? 'visible' : 'hidden'; });
    setFrags(n, fwd && !opts.allFrags ? 0 : frags(n).length);
    document.documentElement.style.setProperty('--neon', scenes[n].getAttribute('data-neon') || '#4de3ff');
    progress.style.width = ((n + 1) / scenes.length * 100) + '%';
    counter.textContent = (n + 1) + ' / ' + scenes.length;
    if (location.hash !== '#/' + (n + 1)) history.replaceState(null, '', '#/' + (n + 1));
    camera(old >= 0);
    renderNotes(); renderMenu();
    setTimeout(function () { moving = false; demos(n, true); }, old < 0 || reduce ? 50 : 1150);
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
  function renderNotes() { if (!notesEl.classList.contains('open')) return; notesBody.innerHTML = notes[cur] || '<p class="hint">No notes for this slide yet.</p>'; notesEl.scrollTop = 0; }

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
  // fonts and images change card sizes after first paint: redraw the paths once they settle
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); });
  window.addEventListener('load', function () { layout(); setTimeout(layout, 600); });
})();
