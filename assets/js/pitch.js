/* Slideshow navigation: slides are <section class="scene"> in order. Each
   click reveals the next .frag; when none are left the next click moves to the
   next slide. Hash #/n keeps the place across a reload. N = notes from
   SCRIPT.md, G = slide list, A = all bullets at once, F = fullscreen. */
(function () {
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var cur = -1, moving = false;
  var body = document.body, D = window.DEMOS || {}, demoFor = {}, notes = [];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fit() {
    var w = window.innerWidth, h = window.innerHeight - 44;
    var s = Math.min((w - (w < 700 ? 8 : 48)) / 1280, (h - (w < 700 ? 8 : 48)) / 720);
    document.documentElement.style.setProperty('--fit', s.toFixed(4));
  }
  window.addEventListener('resize', fit); fit();

  /* demos */
  if (D.badgelists) D.badgelists.mount();
  function mount(id, demo) {
    var node = document.getElementById(id); if (!node || !demo) return;
    demo.mount(node); var i = scenes.indexOf(node.closest('.scene')); (demoFor[i] = demoFor[i] || []).push(demo);
  }
  mount('liveStats', D.liveStats); mount('ladder', D.ladder);
  function demos(i, on) { (demoFor[i] || []).forEach(function (d) { try { d[on ? 'start' : 'stop'](); } catch (e) {} }); }

  /* fragments */
  function frags(i) { return Array.prototype.slice.call(scenes[i].querySelectorAll('.frag')); }
  function shown(i) { return frags(i).filter(function (f) { return f.classList.contains('on'); }).length; }
  function setFrags(i, n) { frags(i).forEach(function (f, k) { f.classList.toggle('on', k < n); }); }
  function allFrags() { return body.classList.contains('show-all'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* go */
  var progress = document.querySelector('#progress i'), counter = document.getElementById('counter');
  function go(n, opts) {
    opts = opts || {};
    if (n < 0 || n >= scenes.length || moving || n === cur) return;
    var fwd = n > cur, old = cur; cur = n;
    var sNew = scenes[n], sOld = old >= 0 ? scenes[old] : null;
    moving = true;
    if (sOld) { demos(old, false); sOld.classList.remove('active', 'enter-fwd', 'enter-back'); sOld.classList.add('leaving', fwd ? 'leave-fwd' : 'leave-back'); }
    setFrags(n, fwd && !opts.allFrags ? 0 : frags(n).length);
    sNew.classList.remove('leaving', 'leave-fwd', 'leave-back');
    sNew.classList.add('active', old < 0 ? 'enter-fwd' : (fwd ? 'enter-fwd' : 'enter-back'));
    progress.style.width = ((n + 1) / scenes.length * 100) + '%';
    counter.textContent = (n + 1) + ' / ' + scenes.length;
    if (location.hash !== '#/' + (n + 1)) history.replaceState(null, '', '#/' + (n + 1));
    renderNotes(); renderMenu();
    setTimeout(function () {
      if (sOld) sOld.classList.remove('leaving', 'leave-fwd', 'leave-back');
      sNew.classList.remove('enter-fwd', 'enter-back');
      moving = false; demos(n, true);
    }, reduce ? 260 : 470);
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

  /* notes */
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
    notesBody.innerHTML = notes[cur] || '<p class="hint">No notes for this slide yet. Add a "## ' + (cur + 1) + '." section to SCRIPT.md.</p>';
    notesEl.scrollTop = 0;
  }

  /* menu */
  var menu = document.getElementById('menu'), menuList = document.getElementById('menuList');
  scenes.forEach(function (s, i) {
    var b = document.createElement('button'); b.innerHTML = '<span>' + pad(i + 1) + '</span>' + s.getAttribute('data-title');
    b.addEventListener('click', function (e) { e.stopPropagation(); menu.classList.remove('open'); go(i, { allFrags: true }); });
    menuList.appendChild(b);
  });
  function renderMenu() { Array.prototype.forEach.call(menuList.children, function (b, i) { b.classList.toggle('cur', i === cur); }); }
  menu.addEventListener('click', function () { menu.classList.remove('open'); });

  /* input */
  var hintT = setTimeout(function () { body.classList.add('quiet'); }, 8000);
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
      case 'a': case 'A': body.classList.toggle('show-all'); toast(allFrags() ? 'all bullets shown' : 'bullets one click at a time'); break;
      case 'f': case 'F': if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); break;
      default: if (/^[1-9]$/.test(k)) go(parseInt(k, 10) - 1, { allFrags: true });
    }
  });
  document.getElementById('stage').addEventListener('click', function (e) {
    if (e.target.closest('.no-nav, a, button, input, select, textarea')) return;
    body.classList.add('quiet');
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
    if (!isNaN(n) && n - 1 !== cur) go(n - 1, { allFrags: true });
  });

  /* boot */
  var startAt = parseInt((location.hash.match(/#\/(\d+)/) || [])[1], 10);
  go(isNaN(startAt) ? 0 : Math.min(scenes.length, Math.max(1, startAt)) - 1, { allFrags: !isNaN(startAt) && startAt > 1 });
})();
