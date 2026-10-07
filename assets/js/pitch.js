/* The fly-through. Every <section class="scene"> is a cluster of cards laid
   out on a 1280×780 canvas and placed along a winding route that runs mostly
   sideways; #route is moved so the current slide sits at the origin, and the
   CSS transition on that transform is the camera pan (no fades). Inside each
   slide a smooth SVG path threads the cards in order, drawn over them; a 3D
   bar carries the path on to the next slide. Hash #/n keeps the place;
   N notes, G list, A bullets, F fullscreen. */
(function () {
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var cur = -1, moving = false;
  var body = document.body, D = window.DEMOS || {}, demoFor = {}, notes = [];
  var route = document.getElementById('route');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 1280, H = 780;

  /* ----------------------------------------------------------- route */
  var DX = 1900, YS = [0, -320, 260, -140, 380, -300, 120, -380, 240, -200, 360, -60, -340, 300, -220, 160, -120];
  var pos = scenes.map(function (s, i) { return { x: i * DX, y: YS[i % YS.length], z: 0 }; });
  var fit = 1;
  var cityLayers = Array.prototype.slice.call(document.querySelectorAll('#city .layer'));
  var SVGNS = 'http://www.w3.org/2000/svg';
  var trails = scenes.slice(0, -1).map(function (s, i) {
    var t = document.createElementNS(SVGNS, 'svg'); t.setAttribute('class', 'link');
    var c1 = s.getAttribute('data-neon') || '#4de3ff', c2 = scenes[i + 1].getAttribute('data-neon') || '#4de3ff';
    t.innerHTML = '<defs><linearGradient id="lg' + i + '" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<path class="lg" stroke="url(#lg' + i + ')"/><path class="ll" stroke="url(#lg' + i + ')"/><path class="lp"/>';
    route.insertBefore(t, route.firstChild); return t;
  });
  var paths = scenes.map(function (s) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'path'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '<path class="pg"/><path class="pl"/><path class="pulse"/>'; s.insertBefore(svg, s.firstChild); return svg;
  });
  function cardsOf(s) { return Array.prototype.filter.call(s.querySelectorAll('.card'), function (c) { return !c.closest('#carousel'); }); }
  function offs(c, s) { var x = 0, y = 0, e = c; while (e && e !== s) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x: x, y: y }; }
  function centre(c, s) { var o = offs(c, s); return { x: o.x + c.offsetWidth / 2, y: o.y + c.offsetHeight / 2 }; }
  // Catmull-Rom through the points -> cubic Béziers: one continuous, fluid line
  // the outer lead points only shape the tangents; the line is drawn from..to
  function smooth(pts, from, to) {
    if (pts.length < 2) return '';
    from = from || 0; to = to == null ? pts.length - 1 : to;
    var d = 'M' + pts[from].x.toFixed(1) + ',' + pts[from].y.toFixed(1);
    for (var i = from; i < to; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6, c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1);
    }
    return d;
  }
  var ends = [];
  function drawPaths() {
    scenes.forEach(function (s, i) {
      var cs = cardsOf(s); if (!cs.length) return;
      // anchor each card at the corner that best continues the line, so the
      // path kisses empty corners instead of cutting through the words
      var rects = cs.map(function (c) { var o = offs(c, s); return { x: o.x, y: o.y, w: c.offsetWidth, h: c.offsetHeight }; });
      var centres = rects.map(function (r) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; });
      var pts = [], prev = { x: -60, y: centres[0].y };
      rects.forEach(function (r, k) {
        var nxt = centres[k + 1] || { x: W + 60, y: centres[k].y }, inset = 22;
        var corners = [{ x: r.x + inset, y: r.y + inset }, { x: r.x + r.w - inset, y: r.y + inset }, { x: r.x + inset, y: r.y + r.h - inset }, { x: r.x + r.w - inset, y: r.y + r.h - inset }];
        var best = corners[0], bd = Infinity;
        corners.forEach(function (c) { var d = Math.hypot(c.x - prev.x, c.y - prev.y) + Math.hypot(nxt.x - c.x, nxt.y - c.y); if (d < bd) { bd = d; best = c; } });
        pts.push(best); prev = best;
      });
      var entry = { x: -60, y: pts[0].y }, exit = { x: W + 60, y: pts[pts.length - 1].y };
      // lead in and out along the direction of travel so the curve arrives flat at the edges
      var lead = i > 0, tail = i < scenes.length - 1;
      var all = (lead ? [{ x: -260, y: entry.y }, entry] : []).concat(pts, tail ? [exit, { x: W + 260, y: exit.y }] : []);
      var d = smooth(all, lead ? 1 : 0, tail ? all.length - 2 : all.length - 1);
      ['pg', 'pl', 'pulse'].forEach(function (k) { paths[i].querySelector('.' + k).setAttribute('d', d); });
      Array.prototype.forEach.call(paths[i].querySelectorAll('circle'), function (c) { c.remove(); });
      pts.forEach(function (p) { var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 7); paths[i].appendChild(c); });
      ends[i] = { first: entry, last: exit };
    });
  }
  function layout() {
    var w = window.innerWidth, h = window.innerHeight - 44;
    fit = Math.min((w - (w < 700 ? 8 : 60)) / W, (h - (w < 700 ? 8 : 60)) / H) * (w < 700 ? 1 : 0.97);
    scenes.forEach(function (s, i) {
      var bottom = 0;
      cardsOf(s).forEach(function (c) { var y = offs(c, s).y + c.offsetHeight; if (y > bottom) bottom = y; });
      var car = s.querySelector('#carousel'); if (car) bottom = Math.max(bottom, car.offsetTop + car.offsetHeight);
      sfs[i] = Math.min(1, H / Math.max(1, bottom + 10));
    });
    drawPaths();
    place();
    camera(false);
  }
  // Everything is positioned relative to pos[base], so no element ever sits more
  // than a couple of slides from the origin: Chrome stops painting composited
  // layers placed tens of thousands of pixels away.
  var base = 0, sfs = [];
  function rel(i) { var p = pos[i], b = pos[base]; return { x: p.x - b.x, y: p.y - b.y, z: p.z - b.z }; }
  function place() {
    scenes.forEach(function (s, i) {
      if (Math.abs(i - base) > 2) { s.style.transform = 'translate3d(0,0,-9000px)'; return; }
      var p = rel(i);
      s.style.transform = 'translate3d(' + p.x * fit + 'px,' + p.y * fit + 'px,' + p.z * fit + 'px) scale(' + (fit * (sfs[i] || 1)) + ')';
    });
    trails.forEach(function (t, i) {
      if (Math.abs(i - base) > 2) { t.style.display = 'none'; return; }
      t.style.display = '';
      var ea = ends[i] || { last: { x: W + 60, y: H / 2 } }, eb = ends[i + 1] || { first: { x: -60, y: H / 2 } };
      var A = toRoute(i, ea.last), B = toRoute(i + 1, eb.first);
      var pad = 60, x0 = Math.min(A.x, B.x) - pad, y0 = Math.min(A.y, B.y) - pad;
      var w = Math.abs(B.x - A.x) + pad * 2, h = Math.abs(B.y - A.y) + pad * 2;
      var ax = A.x - x0, ay = A.y - y0, bx = B.x - x0, by = B.y - y0, k = (bx - ax) * 0.5;
      var d = 'M' + ax.toFixed(1) + ',' + ay.toFixed(1) + ' C' + (ax + k).toFixed(1) + ',' + ay.toFixed(1) + ' ' + (bx - k).toFixed(1) + ',' + by.toFixed(1) + ' ' + bx.toFixed(1) + ',' + by.toFixed(1);
      t.setAttribute('width', w); t.setAttribute('height', h); t.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      t.style.transform = 'translate3d(' + x0 + 'px,' + y0 + 'px,0)';
      var g = t.querySelector('linearGradient'); g.setAttribute('x1', ax); g.setAttribute('y1', ay); g.setAttribute('x2', bx); g.setAttribute('y2', by);
      Array.prototype.forEach.call(t.querySelectorAll('path'), function (pth) { pth.setAttribute('d', d); pth.style.strokeWidth = ''; });
      t.style.setProperty('--sw', (fit * Math.min(sfs[i] || 1, sfs[i + 1] || 1)).toFixed(3));
    });
  }
  // a point in slide i's own 1280x780 coordinates -> route coordinates
  function toRoute(i, pt) {
    var p = rel(i), sc = fit * (sfs[i] || 1);
    return { x: p.x * fit + (pt.x - W / 2) * sc, y: p.y * fit + (pt.y - H / 2) * sc };
  }
  function camera(animate) {
    if (cur < 0) return;
    var p = rel(cur), a = pos[cur];
    if (!animate) { route.style.transition = 'none'; cityLayers.forEach(function (l) { l.style.transition = 'none'; }); }
    route.style.transform = 'translate3d(' + (-p.x * fit) + 'px,' + (-p.y * fit) + 'px,' + (-p.z * fit) + 'px)';
    // the city scrolls by absolute position (it repeats, so large offsets are harmless)
    cityLayers.forEach(function (l, k) { var f = [0.05, 0.09, 0.14][k]; l.style.transform = 'translate3d(' + ((-a.x * f) % 2400) + 'px,' + (-a.y * f * 0.35) + 'px,0)'; });
    if (!animate) { void route.offsetWidth; route.style.transition = ''; cityLayers.forEach(function (l) { l.style.transition = ''; }); }
  }
  // move the origin to slide i without anything visibly moving
  function rebase(i) {
    if (i === base) return;
    base = i;
    route.style.transition = 'none';
    place();
    camera(false);
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
  // Each trail is a bright head with a fading tail, driven by one rAF loop so
  // it keeps moving no matter what else is on screen.
  (function buildTrails() {
    var host = document.getElementById('flyers');
    var P = [
      { d: 'M -100 220 C 300 80, 700 420, 1100 180 S 1700 260, 1800 120', c: '#4de3ff', tail: 260, speed: 300 },
      { d: 'M -120 560 C 250 700, 650 300, 950 520 S 1500 760, 1800 500', c: '#9dff57', tail: 320, speed: 260 },
      { d: 'M -100 80 C 400 160, 600 20, 1000 100 S 1500 60, 1800 160', c: '#b388ff', tail: 150, speed: 180 }

    ];
    var svg = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">';
    P.forEach(function (p, i) {
      svg += '<path class="tr glow" id="trg' + i + '" d="' + p.d + '" stroke="' + p.c + '"/><path class="tr" id="tr' + i + '" d="' + p.d + '" stroke="' + p.c + '"/><circle class="hd" id="trh' + i + '" r="4" fill="#fff"/>';
    });
    host.innerHTML = svg + '</svg>';
    var items = P.map(function (p, i) {
      var core = document.getElementById('tr' + i), glow = document.getElementById('trg' + i), head = document.getElementById('trh' + i), len = core.getTotalLength();
      [core, glow].forEach(function (e) { e.setAttribute('stroke-dasharray', p.tail + ' ' + (len + p.tail)); });
      return { core: core, glow: glow, head: head, len: len, tail: p.tail, speed: p.speed, pos: Math.random() * (len + p.tail) };
    });
    var last = 0;
    function tick(ts) {
      var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
      items.forEach(function (it) {
        it.pos += it.speed * dt; if (it.pos > it.len + it.tail) it.pos = 0;
        var off = it.tail - it.pos;           // dash starts at pos - tail, ends at pos
        it.core.setAttribute('stroke-dashoffset', off); it.glow.setAttribute('stroke-dashoffset', off);
        var hp = it.core.getPointAtLength(Math.max(0, Math.min(it.len, it.pos)));
        it.head.setAttribute('cx', hp.x); it.head.setAttribute('cy', hp.y);
        it.head.style.opacity = it.pos > it.len ? 0 : 1;
      });
      requestAnimationFrame(tick);
    }
    if (!reduce) requestAnimationFrame(tick);
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
    var rootEl = document.documentElement;
    if (old < 0) rootEl.style.transition = 'none';           // first paint: start on the slide's colour, no fade
    rootEl.style.setProperty('--neon', scenes[n].getAttribute('data-neon') || '#4de3ff');
    if (old < 0) { void getComputedStyle(rootEl).getPropertyValue('--neon'); requestAnimationFrame(function () { rootEl.style.transition = ''; }); }
    progress.style.width = ((n + 1) / scenes.length * 100) + '%';
    counter.textContent = (n + 1) + ' / ' + scenes.length;
    if (location.hash !== '#/' + (n + 1)) history.replaceState(null, '', '#/' + (n + 1));
    if (old >= 0) {
      // fly from a frame centred on the old slide, so both ends are near the origin
      cur = old; rebase(old); cur = n;
      // a long jump (menu, number keys) cuts instead of flying past many slides
      if (Math.abs(n - old) > 2) { rebase(n); }
      else { void route.offsetWidth; camera(true); }
    } else { rebase(n); camera(false); }
    renderNotes(); renderMenu();
    clearTimeout(go.t);
    go.t = setTimeout(function () { rebase(n); moving = false; demos(n, true); }, old < 0 || reduce ? 50 : 1150);
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
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); });
  window.addEventListener('load', function () { layout(); setTimeout(layout, 600); });
})();
