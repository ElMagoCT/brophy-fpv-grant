/* Live and generated pieces of the slideshow:
     badgelists - one card per badge on the four track slides, from badges.js
     liveStats  - the public dashboard's data.json (same origin on GitHub Pages)
     ladder     - the four tiers from badges.js, one pilot climbing
     carousel   - the graduate skills, a ring that is always turning
     budget     - bars drawn from the figures below
     timeline   - founding to race; the lit part stops at "this presentation" */
(function () {
  var FS = window.FS;
  FS.TIERS.forEach(function (t) { if (t.id === 't2') { t.name = 'Cine whoop'; t.gear = 'Pavo 20 Pro'; } if (t.id === 't3') { t.gear = 'The Pavo at a school event, with a spotter'; } });
  var TC = { flight: '#4de3ff', build: '#ffc14d', know: '#5dffc3', crew: '#b388ff' };
  var TIERC = { t0: '#4de3ff', t1: '#b388ff', t2: '#ff7a45', t3: '#9dff57', el: '#ffc14d' };
  var TYPE = { knowledge: 'quiz', bench: 'bench', witnessed: 'witnessed', auto: 'automatic' };
  var ORDER = { t0: 0, t1: 1, t2: 2, t3: 3, el: 4 };
  var D = window.DEMOS = {};
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function tierOf(id) { return FS.TIERS.filter(function (t) { return t.id === id; })[0]; }
  function tierLabel(t) { return t.n >= 0 ? 'Tier ' + t.n : 'Elective'; }

  /* badge cards: staggered across three columns so the path snakes through them */
  var SLOTS = [[1, 4, 0], [5, 4, 70], [9, 4, 0], [9, 4, 40], [5, 4, 110], [1, 4, 40], [3, 4, 60]];
  D.badgelists = {
    mount: function () {
      Array.prototype.forEach.call(document.querySelectorAll('.badgelist'), function (root) {
        var track = root.getAttribute('data-track');
        FS.BADGES.filter(function (b) { return b.track === track; }).sort(function (a, b) { return ORDER[a.tier] - ORDER[b.tier]; }).forEach(function (b, k) {
          var t = tierOf(b.tier), slot = SLOTS[k % SLOTS.length];
          var card = el('div', 'card badge', '<div class="n">' + b.name + '</div><div class="t">' + tierLabel(t) + ' · ' + TYPE[b.type] + '</div>');
          card.style.setProperty('--c', TC[track]); card.style.setProperty('--tier', TIERC[b.tier]);
          card.style.gridColumn = slot[0] + ' / span ' + slot[1]; card.style.marginTop = slot[2] + 'px';
          root.parentNode.insertBefore(card, root);
        });
        root.parentNode.removeChild(root);
      });
    }
  };

  D.liveStats = (function () {
    var root, url = 'https://elmagoct.github.io/brophy-uav-dashboard/data.json';
    var FALLBACK = { generatedIso: '2026-10-04T17:01:41-07:00', totals: { clubMs: 315020320, pilots: 35, activePilots7: 22, sims: 5 } };
    function hrs(ms) { return Math.floor(ms / 3600000); }
    function render(d, live) {
      var t = d.totals; root.innerHTML = '';
      root.appendChild(el('div', 'live' + (live ? '' : ' off'), '<i></i>' + (live ? 'live from the lab' : 'snapshot') + ' · ' + new Date(d.generatedIso).toLocaleDateString([], { month: 'short', day: 'numeric' })));
      var s = el('div', 'ministats');
      [[hrs(t.clubMs) + '<small>h</small>', 'hours flown'], [t.pilots, 'pilots logged'], [t.activePilots7, 'flying this week']].forEach(function (x) { s.appendChild(el('div', 'stat', '<div class="v">' + x[0] + '</div><div class="l">' + x[1] + '</div>')); });
      root.appendChild(s);
      var h = document.getElementById('liveHours'); if (h) h.innerHTML = hrs(t.clubMs) + '<small>h</small>';
      if (window.PITCH && window.PITCH.relayout) window.PITCH.relayout();
    }
    return { mount: function (n) { root = n; render(FALLBACK, false); try { fetch(url + '?t=' + Math.floor(Date.now() / 600000), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { if (d && d.totals) render(d, true); }).catch(function () {}); } catch (e) {} }, start: function () {}, stop: function () {} };
  })();

  var GATE = '<svg viewBox="0 0 34 30"><path d="M3 29 V14 A14 14 0 0 1 31 14 V29"/></svg>';
  D.ladder = (function () {
    var root, timer, rungs = [], chips = [], running = false;
    function build() {
      root.innerHTML = ''; var lad = el('div', 'ladder');
      FS.TIERS.filter(function (t) { return t.id !== 'el'; }).forEach(function (t) {
        var r = el('div', 'rung'); r.style.setProperty('--c', TIERC[t.id]);
        var bs = FS.BADGES.filter(function (b) { return b.tier === t.id; });
        r.innerHTML = '<div class="tn">Tier ' + t.n + '</div><div class="nm">' + t.name + '</div><div class="gear">' + t.gear + '</div>';
        var ch = el('div', 'chips');
        bs.forEach(function (b) { var c = el('div', 'chip', '<i></i>' + b.name + '<span class="ck">✓</span>'); c.style.setProperty('--tc', TC[b.track]); ch.appendChild(c); chips.push({ el: c, tier: r }); });
        if (!bs.length) ['All 6 Tier 2 badges', 'FAA TRUST on file', 'Spotter beside you', 'Cleared for crowds'].forEach(function (txt) { var c = el('div', 'chip el', '<i></i>' + txt + '<span class="ck">✓</span>'); c.style.setProperty('--tc', TIERC[t.id]); ch.appendChild(c); chips.push({ el: c, tier: r }); });
        r.appendChild(ch); r.appendChild(el('div', 'gatebox', '<span>' + (t.gate || '') + '</span>' + GATE)); lad.appendChild(r); rungs.push(r);
      });
      root.appendChild(lad);
    }
    function reset() { chips.forEach(function (c) { c.el.classList.remove('on'); }); rungs.forEach(function (r) { r.classList.remove('open'); }); }
    function run() {
      reset(); var i = 0;
      function step() {
        if (!running) return;
        if (i < chips.length) { var c = chips[i]; c.el.classList.add('on'); i++; var done = chips.filter(function (x) { return x.tier === c.tier; }).every(function (x) { return x.el.classList.contains('on'); }); if (done) { c.tier.classList.add('open'); timer = setTimeout(step, 900); } else timer = setTimeout(step, 280); }
        else timer = setTimeout(run, 4000);
      }
      timer = setTimeout(step, 900);
    }
    return { mount: function (n) { root = n; build(); }, start: function () { if (running) return; running = true; run(); }, stop: function () { running = false; clearTimeout(timer); } };
  })();

  /* ---------------------------------------------------------- carousel */
  D.carousel = (function () {
    var root, ring, angle = 0, raf, dragging = false, lastX = 0, vel = 0, idle = 999, last = 0;
    var SKILLS = [
      ['flight', 'Fly in acro', 'M12 40 L32 20 L52 40 M8 48 H56'],
      ['flight', 'Land it blind', 'M12 44 H52 M32 12 V36 M22 28 L32 38 L42 28'],
      ['build', 'Build from parts', 'M14 50 L38 26 M38 14 L50 26 L44 32 L32 20 Z'],
      ['build', 'Flash and configure', 'M12 16 H52 V44 H12 Z M20 52 H44 M24 28 L30 34 L40 24'],
      ['build', 'Match the parts', 'M12 32 H24 M40 32 H52 M24 20 H40 V44 H24 Z'],
      ['build', 'Handle LiPos safely', 'M12 24 H44 V44 H12 Z M44 30 H52 V38 H44 M20 34 H36'],
      ['build', 'Diagnose in the field', 'M32 10 V26 M32 38 V54 M10 32 H26 M38 32 H54 M32 32 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'],
      ['build', 'Tune it', 'M8 40 Q20 10 32 40 T56 40'],
      ['know', 'Read the airspace', 'M32 8 L52 16 V32 C52 44 42 52 32 56 C22 52 12 44 12 32 V16 Z'],
      ['know', 'Run an emergency', 'M32 10 L56 52 H8 Z M32 26 V38 M32 44 V46'],
      ['crew', 'Spot and brief', 'M8 32 C16 20 48 20 56 32 C48 44 16 44 8 32 Z M32 32 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0'],
      ['crew', 'Plan and shoot', 'M8 16 H44 V48 H8 Z M44 28 L58 20 V44 L44 36'],
      ['crew', 'Cut and keep', 'M14 14 L50 50 M50 14 L14 50 M14 50 m-4 0 a4 4 0 1 0 8 0 M50 50 m-4 0 a4 4 0 1 0 8 0'],
      ['crew', 'Teach the next class', 'M22 22 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M8 50 C8 38 16 34 22 34 C28 34 36 38 36 50 M44 26 m-6 0 a6 6 0 1 0 12 0 M34 48 C36 40 40 38 44 38 C50 38 56 42 56 50']
    ];
    // two decks of seven; the lower deck is offset half a card so the rows stagger
    var DECKS = 2, PER = Math.ceil(SKILLS.length / DECKS), R = 360, SPEED = 0.45 * 0.7, rings = [];
    function build() {
      root.innerHTML = '';
      for (var d = 0; d < DECKS; d++) {
        var r = el('div', 'ring deck' + d);
        SKILLS.slice(d * PER, (d + 1) * PER).forEach(function (s, k) {
          var i = d * PER + k;
          var c = el('div', 'card sk', '<svg viewBox="0 0 64 64"><path d="' + s[2] + '"/></svg><div class="k">' + FS.TRACK[s[0]] + '</div><h4>' + s[1] + '</h4>');
          c.style.setProperty('--c', TC[s[0]]);
          c.style.transform = 'rotateY(' + (k * 360 / PER + (d ? 180 / PER : 0)) + 'deg) translateZ(' + R + 'px)';
          r.appendChild(c);
        });
        root.appendChild(r); rings.push(r);
      }
      ring = rings[0];
      rings.forEach(function (r) { r.style.transform = 'translateZ(-' + R + 'px) rotateY(0deg)'; });
      var l = el('div', 'arrow l', '\u2039'), rr = el('div', 'arrow r', '\u203A');
      l.addEventListener('click', function (e) { e.stopPropagation(); vel = 0; angle += 360 / PER; idle = 0; });
      rr.addEventListener('click', function (e) { e.stopPropagation(); vel = 0; angle -= 360 / PER; idle = 0; });
      root.appendChild(l); root.appendChild(rr);
      root.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; vel = 0; root.setPointerCapture(e.pointerId); });
      root.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; angle += dx * 0.25; vel = dx * 0.25; idle = 0; });
      root.addEventListener('pointerup', function () { dragging = false; }); root.addEventListener('pointercancel', function () { dragging = false; });
      root.addEventListener('wheel', function (e) { e.preventDefault(); angle -= e.deltaX * 0.2; idle = 0; }, { passive: false });
    }
    function tick(ts) {
      var dt = Math.min(40, ts - last || 16) / 16.7; last = ts; idle += dt;
      if (!dragging) { if (Math.abs(vel) > 0.05) { angle += vel * dt; vel *= Math.pow(0.94, dt); } else if (idle > 150) angle -= SPEED * dt; }
      var t = 'translateZ(-' + R + 'px) rotateY(' + angle + 'deg)';
      for (var d = 0; d < rings.length; d++) rings[d].style.transform = t;
      raf = requestAnimationFrame(tick);
    }
    // the ring turns from page load, so it is already moving when the slide arrives
    return { mount: function (n) { root = n; build(); raf = requestAnimationFrame(tick); }, start: function () {}, stop: function () {} };
  })();

  /* ------------------------------------------------------------ budget */
  D.budget = (function () {
    var root;
    var ROWS = [['Pilot kit', 682], ['Trainers', 480], ['Camera ship', 365], ['Accessories', 180, true], ['Race course', 50, true]];
    function build() {
      root.innerHTML = ''; var max = 700;
      ROWS.forEach(function (r) { root.appendChild(el('div', 'bar' + (r[2] ? ' tbd' : ''), '<div class="lab">' + r[0] + '</div><div class="track"><span class="fill" style="--w:' + (r[1] / max * 100).toFixed(1) + '%"></span></div><div class="v">' + (r[2] ? '~' : '') + '$' + r[1] + '</div>')); });
      root.appendChild(el('div', 'bar total', '<div class="lab">With tax and shipping</div><div></div><div class="v">≈ $1,870</div>'));
    }
    return { mount: function (n) { root = n; build(); }, start: function () { Array.prototype.forEach.call(root.querySelectorAll('.fill'), function (f) { f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; }); }, stop: function () {} };
  })();

  /* ---------------------------------------------------------- timeline */
  D.timeline = (function () {
    var root, timer, NOW = 4;
    var STEPS = [['Spring', 'Founding'], ['Summer', 'Simulators set up'], ['Fall', '20 members'], ['Fall', 'Badge system'], ['Today', 'This presentation'], ['Funded', 'Order'], ['Then', 'Train'], ['Then', 'Film'], ['Then', 'Race']];
    function build() {
      root.innerHTML = '<div class="line"></div>';
      STEPS.forEach(function (s) { root.appendChild(el('div', 'tnode', '<div class="stem"></div><div class="dot"></div><div class="lab"><div class="k">' + s[0] + '</div><h4>' + s[1] + '</h4></div>')); });
    }
    return {
      mount: function (n) { root = n; build(); },
      start: function () {
        var nodes = root.querySelectorAll('.tnode'), line = root.querySelector('.line'); var i = 0;
        Array.prototype.forEach.call(nodes, function (n) { n.classList.remove('done', 'now'); }); line.style.setProperty('--w', '0%');
        function step() { if (i <= NOW) { nodes[i].classList.add('done'); if (i === NOW) nodes[i].classList.add('now'); line.style.setProperty('--w', (i / (nodes.length - 1) * 94) + '%'); i++; timer = setTimeout(step, 600); } }
        timer = setTimeout(step, 400);
      },
      stop: function () { clearTimeout(timer); }
    };
  })();
})();
