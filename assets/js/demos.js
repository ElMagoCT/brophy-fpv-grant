/* Live and generated pieces of the slideshow:
     badgelists - one slide per track, from badges.js
     liveStats  - the public dashboard's data.json (same origin on GitHub Pages)
     ladder     - the four tiers from badges.js, one pilot climbing
     carousel   - the graduate skills, a turning 3D ring
     budget     - bars drawn from the figures below
     timeline   - the six steps */
(function () {
  var FS = window.FS;
  /* the deck's tier labels: Tier 2 is the cinewhoop tier, and the ask is one Pavo */
  FS.TIERS.forEach(function (t) { if (t.id === 't2') { t.name = 'Cine whoop'; t.gear = 'Pavo 20 Pro'; } if (t.id === 't3') { t.gear = 'The Pavo at a school event, with a spotter'; } });
  var TC = { flight: '#4de3ff', build: '#ffc14d', know: '#5dffc3', crew: '#b388ff' };
  var TIERC = { t0: '#4de3ff', t1: '#b388ff', t2: '#ff7a45', t3: '#9dff57', el: '#ffc14d' };
  var TYPE = { knowledge: 'quiz', bench: 'bench', witnessed: 'witnessed', auto: 'automatic' };
  var ORDER = { t0: 0, t1: 1, t2: 2, t3: 3, el: 4 };
  var D = window.DEMOS = {};
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function tierOf(id) { return FS.TIERS.filter(function (t) { return t.id === id; })[0]; }
  function tierLabel(t) { return t.n >= 0 ? 'Tier ' + t.n : 'Elective'; }

  D.badgelists = {
    mount: function () {
      Array.prototype.forEach.call(document.querySelectorAll('.badgelist'), function (root) {
        var track = root.getAttribute('data-track'); root.style.setProperty('--c', TC[track]);
        FS.BADGES.filter(function (b) { return b.track === track; }).sort(function (a, b) { return ORDER[a.tier] - ORDER[b.tier]; }).forEach(function (b) {
          var t = tierOf(b.tier);
          var card = el('div', 'badge', '<div class="n">' + b.name + '</div><div class="t">' + tierLabel(t) + ' · ' + TYPE[b.type] + '</div><div class="d">' + b.do + '</div><div class="w">' + b.why + '</div>');
          card.style.setProperty('--tier', TIERC[b.tier]); root.appendChild(card);
        });
      });
    }
  };

  D.liveStats = (function () {
    var root, url = 'https://elmagoct.github.io/brophy-uav-dashboard/data.json';
    var FALLBACK = { generatedIso: '2026-10-04T17:01:41-07:00', totals: { clubMs: 315020320, pilots: 35, activePilots7: 22, sims: 5 } };
    function hrs(ms) { return Math.floor(ms / 3600000); }
    function render(d, live) {
      var t = d.totals; root.innerHTML = '';
      root.appendChild(el('div', 'live' + (live ? '' : ' off'), '<i></i>' + (live ? 'live from the lab' : 'snapshot (offline)') + ' · ' + new Date(d.generatedIso).toLocaleDateString([], { month: 'short', day: 'numeric' })));
      var s = el('div', 'ministats');
      [[hrs(t.clubMs) + '<small>h</small>', 'hours flown'], [t.pilots, 'pilots logged'], [t.activePilots7, 'flying this week']].forEach(function (x) { s.appendChild(el('div', 'stat', '<div class="v">' + x[0] + '</div><div class="l">' + x[1] + '</div>')); });
      root.appendChild(s);
      var h = document.getElementById('liveHours'); if (h) h.innerHTML = hrs(t.clubMs) + '<small>h</small>';
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
      var els = FS.BADGES.filter(function (b) { return b.tier === 'el'; });
      root.appendChild(el('div', 'legend', Object.keys(FS.TRACK).map(function (k) { return '<span><i style="--tc:' + TC[k] + '"></i>' + FS.TRACK[k] + '</span>'; }).join('') + '<span>+ ' + els.length + ' electives</span>'));
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
    var root, ring, angle = 0, raf, running = false, dragging = false, lastX = 0, vel = 0, idle = 0;
    var SKILLS = [
      ['flight', 'Fly in acro', 'Hover, orbit, Split-S, gaps, power loops, clean race laps.', 'M12 40 L32 20 L52 40 M8 48 H56'],
      ['flight', 'Land it blind', 'Take off, hover and land without goggles when the video dies.', 'M12 44 H52 M32 12 V36 M22 28 L32 38 L42 28'],
      ['build', 'Build from parts', 'Assemble a drone; solder ESCs, motors and wiring.', 'M14 50 L38 26 M38 14 L50 26 L44 32 L32 20 Z'],
      ['build', 'Flash and configure', 'Betaflight firmware, bind a radio, set and test a failsafe.', 'M12 16 H52 V44 H12 Z M20 52 H44 M24 28 L30 34 L40 24'],
      ['build', 'Match the parts', 'Choose motors, ESCs, props and batteries that agree.', 'M12 32 H24 M40 32 H52 M24 20 H40 V44 H24 Z'],
      ['build', 'Handle LiPos safely', 'Charge, store, inspect and dispose of batteries.', 'M12 24 H44 V44 H12 Z M44 30 H52 V38 H44 M20 34 H36'],
      ['build', 'Diagnose in the field', 'Why it won’t arm; swap a motor or prop on the spot.', 'M32 10 V26 M32 38 V54 M10 32 H26 M38 32 H54 M32 32 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'],
      ['build', 'Tune it', 'Fix an oscillation with PID and filter changes.', 'M8 40 Q20 10 32 40 T56 40'],
      ['know', 'Read the airspace', 'Class B, the 400 ft ceiling, B4UFLY, LAANC; hold FAA TRUST.', 'M32 8 L52 16 V32 C52 44 42 52 32 56 C22 52 12 44 12 32 V16 Z'],
      ['know', 'Run an emergency', 'Failsafe, flyaway, LiPo fire, the incident report.', 'M32 10 L56 52 H8 Z M32 26 V38 M32 44 V46'],
      ['crew', 'Spot and brief', 'Keep eyes on the aircraft, set a flight zone, brief bystanders.', 'M8 32 C16 20 48 20 56 32 C48 44 16 44 8 32 Z M32 32 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0'],
      ['crew', 'Plan and shoot', 'Shot list with a coach; follow, orbit and reveal; digital video set up.', 'M8 16 H44 V48 H8 Z M44 28 L58 20 V44 L44 36'],
      ['crew', 'Cut and keep', 'Grade a clip; keep gear checked out and maintained.', 'M14 14 L50 50 M50 14 L14 50 M14 50 m-4 0 a4 4 0 1 0 8 0 M50 50 m-4 0 a4 4 0 1 0 8 0'],
      ['crew', 'Teach the next class', 'Mentor a new member, then sign off the badges you hold.', 'M22 22 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M8 50 C8 38 16 34 22 34 C28 34 36 38 36 50 M44 26 m-6 0 a6 6 0 1 0 12 0 M34 48 C36 40 40 38 44 38 C50 38 56 42 56 50']
    ];
    var N = SKILLS.length, R = 760;
    function build() {
      root.innerHTML = ''; ring = el('div', 'ring');
      SKILLS.forEach(function (s, i) {
        var c = el('div', 'card', '<svg viewBox="0 0 64 64"><path d="' + s[3] + '"/></svg><div class="k">' + FS.TRACK[s[0]] + '</div><h4>' + s[1] + '</h4><p>' + s[2] + '</p><div class="n">' + (i + 1) + ' / ' + N + '</div>');
        c.style.setProperty('--c', TC[s[0]]); c.style.transform = 'rotateY(' + (i * 360 / N) + 'deg) translateZ(' + R + 'px)'; ring.appendChild(c);
      });
      root.appendChild(ring);
      var l = el('div', 'arrow l', '‹'), r = el('div', 'arrow r', '›');
      l.addEventListener('click', function (e) { e.stopPropagation(); vel = 0; angle += 360 / N; idle = 0; });
      r.addEventListener('click', function (e) { e.stopPropagation(); vel = 0; angle -= 360 / N; idle = 0; });
      root.appendChild(l); root.appendChild(r);
      root.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; vel = 0; root.setPointerCapture(e.pointerId); });
      root.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; angle += dx * 0.25; vel = dx * 0.25; idle = 0; });
      root.addEventListener('pointerup', function () { dragging = false; }); root.addEventListener('pointercancel', function () { dragging = false; });
      root.addEventListener('wheel', function (e) { e.preventDefault(); angle -= e.deltaX * 0.2; idle = 0; }, { passive: false });
    }
    var shown = -1;
    function tick() {
      if (!running) return;
      idle++;
      if (!dragging) { if (Math.abs(vel) > 0.05) { angle += vel; vel *= 0.94; } else if (idle > 90) angle -= 0.12; }
      ring.style.transform = 'translateZ(-' + R + 'px) rotateY(' + angle + 'deg)';
      raf = requestAnimationFrame(tick);
    }
    return { mount: function (n) { root = n; build(); ring.style.transform = 'translateZ(-' + R + 'px)'; }, start: function () { if (running) return; running = true; tick(); }, stop: function () { running = false; cancelAnimationFrame(raf); } };
  })();

  /* ------------------------------------------------------------ budget */
  D.budget = (function () {
    var root;
    var ROWS = [
      ['Pilot kit', '2 × DJI N3 goggles · 2 × RadioMaster Pocket', 682],
      ['Trainers', '2 × Meteor 75 Pro', 480],
      ['Camera ship', 'Pavo 20 Pro', 365],
      ['Accessories', 'batteries, charger, frames, props, electronics, tools · TBD', 180, true],
      ['Race course', '3D-printed gates, PVC, LEDs · priced with Stuco', 50, true]
    ];
    function build() {
      root.innerHTML = ''; var max = 700, sum = 0;
      ROWS.forEach(function (r) {
        sum += r[2];
        root.appendChild(el('div', 'bar' + (r[3] ? ' tbd' : ''), '<div class="lab">' + r[0] + '<small>' + r[1] + '</small></div><div class="track"><span class="fill" style="--w:' + (r[2] / max * 100).toFixed(1) + '%"></span></div><div class="v">' + (r[3] ? '~' : '') + '$' + r[2] + '</div>'));
      });
      root.appendChild(el('div', 'bar total', '<div class="lab">Estimated with tax and shipping<small>parts about $' + sum + '; roughly $' + (2000 - 1870) + ' of headroom under the $2,000 ask</small></div><div></div><div class="v">≈ $1,870</div>'));
    }
    return { mount: function (n) { root = n; build(); }, start: function () { Array.prototype.forEach.call(root.querySelectorAll('.fill'), function (f) { f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; }); }, stop: function () {} };
  })();

  /* ---------------------------------------------------------- timeline */
  D.timeline = (function () {
    var root, timer;
    var STEPS = [
      ['Done', 'Proposal written', 'Parts list, badge program and this pitch, reviewed at club meetings.'],
      ['Next', 'Mr. Reasy', 'Present the proposal and this deck.'],
      ['Then', 'Mr. Burr', 'Student Activities sign-off.'],
      ['Stuco', 'The rally slot', 'Confirm the drone segment and price the course.'],
      ['Fall assembly', 'The public pitch', 'Present alongside recruiting the new pilots.'],
      ['Funded', 'Order and launch', 'Fleet ordered, badge sheet published, mentors certified, new members on Simulator Flight.']
    ];
    function build() {
      root.innerHTML = '<div class="line"></div>';
      STEPS.forEach(function (s) { root.appendChild(el('div', 'tnode', '<div class="stem"></div><div class="dot"></div><div class="lab"><div class="k">' + s[0] + '</div><h4>' + s[1] + '</h4><p>' + s[2] + '</p></div>')); });
    }
    return {
      mount: function (n) { root = n; build(); },
      start: function () {
        var nodes = root.querySelectorAll('.tnode'), line = root.querySelector('.line'); var i = 0;
        Array.prototype.forEach.call(nodes, function (n) { n.classList.remove('done'); }); line.style.setProperty('--w', '0%');
        function step() { if (i < nodes.length) { nodes[i].classList.add('done'); line.style.setProperty('--w', (i / (nodes.length - 1) * 92) + '%'); i++; timer = setTimeout(step, 650); } }
        timer = setTimeout(step, 400);
      },
      stop: function () { clearTimeout(timer); }
    };
  })();
})();
