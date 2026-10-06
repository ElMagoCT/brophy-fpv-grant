/* Live demo renderings for the pitch. Everything here is a simplified
   re-render of the club's real things:
     liveStats  - the public dashboard's data.json (same origin on GitHub Pages)
     ladder     - the four tiers from badges.js, animated as one pilot climbs
     badges     - the 28-badge explorer, from badges.js
     kiosk      - a simplified kiosk pilot card + dock, with the Simulator Flight bar filling
     siteDemo   - the real website screenshots in a browser frame
   Each demo exposes start()/stop() so pitch.js can pause animation off-screen. */
(function () {
  var FS = window.FS;
  var TC = { flight: 'var(--sky)', build: 'var(--amber)', know: 'var(--green)', crew: 'var(--violet)' };
  var TYPE = { knowledge: 'Quiz', bench: 'Bench', witnessed: 'Witnessed', auto: 'Automatic' };
  var HOW = {
    knowledge: 'Short lessons, then a ten-question quiz drawn from this badge’s pool. 80 passes; retake any time. The kiosk awards it by itself.',
    bench: 'A step-by-step checklist on the kiosk or the website. Tick the boxes as you go, DM a photo of the work, an instructor approves.',
    witnessed: 'An examiner who already holds the badge watches you do it against the standard on the card, then signs it off.',
    auto: 'Derived by the kiosk from logged flight hours. Nothing to apply for.'
  };
  var D = window.DEMOS = {};
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmtH(ms) { var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000); return h + '<small>h ' + (m < 10 ? '0' : '') + m + 'm</small>'; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------------------------------------------------- live stats */
  D.liveStats = (function () {
    var root, url = 'https://elmagoct.github.io/brophy-uav-dashboard/data.json';
    // Snapshot from 2026-10-04 17:01 Phoenix: shown if the room has no internet.
    var FALLBACK = { generatedIso: '2026-10-04T17:01:41-07:00', totals: { clubMs: 315020320, pilots: 35, activePilots7: 22, sims: 5 },
      pilots: [{ name: 'Josiah T.', totalMs: 50206347 }, { name: 'Cyrus G.', totalMs: 38191377 }, { name: 'Bode K.', totalMs: 30000000 }] };
    function render(d, live) {
      root.innerHTML = '';
      var t = d.totals, max = Math.max.apply(null, d.pilots.slice(0, 5).map(function (p) { return p.totalMs; }));
      var hdr = el('div', 'live' + (live ? '' : ' off'), '<i></i>' + (live ? 'live from the lab · ' : 'snapshot (offline) · ') + 'updated ' + new Date(d.generatedIso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }));
      var stats = el('div', 'stats');
      [[fmtH(t.clubMs), 'hours flown'], [t.pilots, 'pilots logged'], [t.activePilots7, 'flying this week'], [t.sims, 'simulators']].forEach(function (s) {
        stats.appendChild(el('div', 'stat', '<div class="v">' + s[0] + '</div><div class="l">' + s[1] + '</div>'));
      });
      var board = el('div', 'board');
      d.pilots.slice().sort(function (a, b) { return b.totalMs - a.totalMs; }).slice(0, 3).forEach(function (p, i) {
        board.appendChild(el('div', 'row', '<span class="rk">' + (i + 1) + '</span><span class="nm">' + p.name + '</span><span class="hr">' + fmtH(p.totalMs).replace(/<\/?small>/g, '') + '</span><span class="pb" style="--w:' + Math.round(p.totalMs / max * 100) + '%"><i></i></span>'));
      });
      root.appendChild(hdr); root.appendChild(stats);
      var gap = el('div'); gap.style.height = '10px'; root.appendChild(gap);
      root.appendChild(board);
    }
    return {
      mount: function (node) {
        root = node; render(FALLBACK, false);
        try {
          fetch(url + '?t=' + Math.floor(Date.now() / 600000), { cache: 'no-store' }).then(function (r) { return r.json(); })
            .then(function (d) { if (d && d.totals) render(d, true); }).catch(function () {});
        } catch (e) {}
      }, start: function () {}, stop: function () {}
    };
  })();

  /* ------------------------------------------------------------- ladder */
  var QUAD = '<svg viewBox="0 0 40 40"><path class="arm" d="M9 9 L31 31 M31 9 L9 31"/><rect class="body" x="15" y="15" width="10" height="10" rx="2"/><circle class="prop" cx="9" cy="9" r="7"/><circle class="prop" cx="31" cy="9" r="7"/><circle class="prop" cx="9" cy="31" r="7"/><circle class="prop" cx="31" cy="31" r="7"/></svg>';
  var GATE = '<svg viewBox="0 0 34 30"><path d="M3 29 V14 A14 14 0 0 1 31 14 V29"/></svg>';
  D.ladder = (function () {
    var root, timer, rungs = [], chips = [], running = false;
    function build() {
      root.innerHTML = '';
      var lad = el('div', 'ladder');
      FS.TIERS.filter(function (t) { return t.id !== 'el'; }).forEach(function (t) {
        var r = el('div', 'rung'); r.style.setProperty('--c', t.color);
        var bs = FS.BADGES.filter(function (b) { return b.tier === t.id; });
        r.innerHTML = '<div class="pilot">' + QUAD + '</div><div class="tn">Tier ' + t.n + '</div><div class="nm">' + t.name + '</div><div class="gear">' + t.gear + '</div>';
        var ch = el('div', 'chips');
        bs.forEach(function (b) { var c = el('div', 'chip', '<i></i>' + b.name + '<span class="ck">✓</span>'); c.style.setProperty('--tc', TC[b.track]); ch.appendChild(c); chips.push({ el: c, tier: r }); });
        if (!bs.length) ['Every Tier 2 badge held', 'FAA TRUST on file', 'A spotter at every flight', 'Cleared to fly for a crowd'].forEach(function (txt) {
          var c = el('div', 'chip el', '<i></i>' + txt + '<span class="ck">✓</span>'); c.style.setProperty('--tc', t.color); ch.appendChild(c); chips.push({ el: c, tier: r });
        });
        r.appendChild(ch);
        r.appendChild(el('div', 'gatebox', '<span>' + (t.gate || '') + '</span>' + GATE));
        lad.appendChild(r); rungs.push(r);
      });
      root.appendChild(lad);
      var el7 = FS.BADGES.filter(function (b) { return b.tier === 'el'; });
      var leg = el('div', 'legend');
      leg.style.marginTop = '12px';
      leg.innerHTML = Object.keys(FS.TRACK).map(function (k) { return '<span><i style="--tc:' + TC[k] + '"></i>' + FS.TRACK[k] + '</span>'; }).join('') +
        '<span style="margin-left:auto">+ ' + el7.length + ' electives: ' + el7.map(function (b) { return b.name; }).join(', ') + '</span>';
      root.appendChild(leg);
    }
    function reset() { chips.forEach(function (c) { c.el.classList.remove('on'); }); rungs.forEach(function (r) { r.classList.remove('open', 'here'); }); }
    function run() {
      reset(); var i = 0; rungs[0].classList.add('here');
      function step() {
        if (!running) return;
        if (i < chips.length) {
          var c = chips[i]; c.el.classList.add('on'); i++;
          var tierChips = chips.filter(function (x) { return x.tier === c.tier; });
          var done = tierChips.every(function (x) { return x.el.classList.contains('on'); });
          if (done) {
            c.tier.classList.add('open');
            var k = rungs.indexOf(c.tier);
            timer = setTimeout(function () { c.tier.classList.remove('here'); if (rungs[k + 1]) rungs[k + 1].classList.add('here'); timer = setTimeout(step, 700); }, 650);
          } else timer = setTimeout(step, 260);
        } else timer = setTimeout(run, 3500);
      }
      timer = setTimeout(step, 900);
    }
    return { mount: function (n) { root = n; build(); }, start: function () { if (running) return; running = true; run(); }, stop: function () { running = false; clearTimeout(timer); } };
  })();

  /* ------------------------------------------------------------- badges */
  D.badges = (function () {
    var root, timer, btns = {}, detail, auto = true, order = [], idx = 0;
    function tierName(id) { var t = FS.TIERS.filter(function (x) { return x.id === id; })[0]; return t ? (t.n >= 0 ? 'Tier ' + t.n + ' · ' + t.name : t.name) : id; }
    function show(b) {
      Object.keys(btns).forEach(function (k) { btns[k].classList.toggle('sel', k === b.id); });
      var t = FS.TIERS.filter(function (x) { return x.id === b.tier; })[0];
      detail.style.setProperty('--tc', TC[b.track]);
      detail.innerHTML = '<div class="tags"><span class="tag c">' + FS.TRACK[b.track] + '</span><span class="tag" style="border-color:' + t.color + ';color:' + t.color + '">' + tierName(b.tier) + '</span><span class="tag">' + TYPE[b.type] + '</span></div>' +
        '<h4>' + b.name + '</h4>' +
        '<div class="k">The skill</div><p>' + b.do + '</p>' +
        '<div class="k">Why it exists</div><p>' + b.why + '</p>' +
        '<div class="k">How it’s earned</div><p style="font-size:16px;color:var(--ink-soft)">' + (b.standard || b.note || HOW[b.type]) + '</p>';
    }
    function build() {
      root.innerHTML = '';
      var wrap = el('div', 'bx'), grid = el('div', 'bgrid');
      Object.keys(FS.TRACK).forEach(function (k) {
        var col = el('div', 'col'); col.style.setProperty('--tc', TC[k]);
        col.appendChild(el('h5', null, '<i></i>' + FS.TRACK[k]));
        FS.BADGES.filter(function (b) { return b.track === k; }).forEach(function (b) {
          var btn = el('button', 'bb', '<span class="n">' + b.name + '</span><span class="t">' + tierName(b.tier).replace(' · ', ' ') + ' · ' + TYPE[b.type] + '</span>');
          btn.style.setProperty('--tc', TC[k]);
          btn.addEventListener('click', function (e) { e.stopPropagation(); auto = false; clearTimeout(timer); show(b); });
          btns[b.id] = btn; col.appendChild(btn); order.push(b);
        });
        grid.appendChild(col);
      });
      detail = el('div', 'bdetail');
      wrap.appendChild(grid); wrap.appendChild(detail); root.appendChild(wrap);
      show(FS.BADGES.filter(function (b) { return b.id === 'mentor'; })[0]);
    }
    function cycle() { if (!auto) return; idx = (idx + 1) % order.length; show(order[idx]); timer = setTimeout(cycle, 4200); }
    return { mount: function (n) { root = n; build(); }, start: function () { if (auto) timer = setTimeout(cycle, 4200); }, stop: function () { clearTimeout(timer); } };
  })();

  /* -------------------------------------------------------------- kiosk */
  D.kiosk = (function () {
    var root, timer, running = false, t0, simMs, sessionS;
    var SIMS = [['SIM 01', 'Liftoff', 'M6 30 L24 12 M6 12 L24 30 M22 10 a4 4 0 1 0 .1 0 M8 10 a4 4 0 1 0 .1 0 M8 28 a4 4 0 1 0 .1 0 M22 28 a4 4 0 1 0 .1 0'],
      ['SIM 02', 'Micro Drones', 'M10 12 a6 6 0 1 0 .1 0 M22 12 a6 6 0 1 0 .1 0 M10 26 a6 6 0 1 0 .1 0 M22 26 a6 6 0 1 0 .1 0'],
      ['SIM 03', 'FPV.SkyDive', 'M4 34 L14 16 L22 28 L30 10 M14 16 L10 8'],
      ['SIM 04', 'FPV Labs', 'M4 30 H30 M6 24 H28 M12 18 L22 8 M8 10 L26 20'],
      ['SIM 05', 'PicaSim', 'M4 22 Q17 12 32 22 M17 14 V28 M10 30 H24'],
      ['CLASS', 'Flight School', 'M6 10 H30 V30 H6 Z M18 10 V30 M9 16 H15 M9 20 H15 M21 16 H27 M21 20 H27']];
    function build() {
      root.innerHTML = '';
      var k = el('div', 'kiosk');
      k.innerHTML = '<div class="kcard">' +
        '<div class="lab">Flying as</div><div class="who">New Pilot</div>' +
        '<div class="sess"><span class="lab">Your session</span><b id="kSess">0:00</b></div>' +
        '<div class="trio"><div><small>logged</small><b class="a" id="kLog">0h 00m</b></div><div><small>board</small><b class="b" id="kRank">#35</b></div><div><small>ground</small><b class="c" id="kGs">0%</b></div></div>' +
        '<div class="jb next" id="kJb"><div class="ty">Tier 0 · automatic</div><div class="nm">Simulator Flight</div><div class="st" id="kSt">0.0 of 7.5 hours</div><div class="pb"><i id="kPb"></i></div></div>' +
        '</div><div class="kright"><div class="kreel" id="kReel">FPV reel · club playlist</div><div class="dock" id="kDock"></div></div>';
      root.appendChild(k);
      var dock = k.querySelector('#kDock');
      SIMS.forEach(function (s, i) {
        var t = el('div', 'tile' + (i === 0 ? ' run' : ''), '<svg viewBox="0 0 36 36"><path d="' + s[2] + '"/></svg><div class="k">' + s[0] + '</div><div class="n">' + s[1] + '</div><div class="h">' + (i === 0 ? 'you: <span id="kTile">0m</span>' : (i === 5 ? 'open →' : 'launch →')) + '</div>');
        dock.appendChild(t);
      });
    }
    function tick() {
      if (!running) return;
      var now = Date.now(), dt = now - t0; t0 = now;
      sessionS += dt / 1000;
      simMs += dt * 90;                     // demo time: one real second = 90 sim seconds
      var h = simMs / 3600000, pct = Math.min(100, h / FS.SIM_HOURS * 100);
      root.querySelector('#kSess').textContent = Math.floor(sessionS / 60) + ':' + pad(Math.floor(sessionS % 60));
      root.querySelector('#kLog').textContent = Math.floor(h) + 'h ' + pad(Math.floor(h % 1 * 60)) + 'm';
      root.querySelector('#kTile').textContent = Math.floor(h) + 'h ' + pad(Math.floor(h % 1 * 60)) + 'm';
      root.querySelector('#kGs').textContent = Math.min(100, Math.round(pct * .8)) + '%';
      root.querySelector('#kRank').textContent = '#' + Math.max(1, 35 - Math.round(pct / 3));
      root.querySelector('#kPb').style.setProperty('--w', pct + '%');
      var jb = root.querySelector('#kJb');
      if (pct >= 100) { jb.classList.remove('next'); jb.classList.add('earned'); root.querySelector('#kSt').innerHTML = '<span style="color:var(--green);font-weight:600">Earned ✓</span> · Gate 1 · 6 badges to go'; if (sessionS > 0 && simMs > FS.SIM_HOURS * 3600000 + 4 * 90000) { simMs = 0; sessionS = 0; jb.classList.add('next'); jb.classList.remove('earned'); } }
      else root.querySelector('#kSt').textContent = h.toFixed(1) + ' of ' + FS.SIM_HOURS + ' hours';
      timer = setTimeout(tick, 250);
    }
    return { mount: function (n) { root = n; build(); }, start: function () { if (running) return; running = true; t0 = Date.now(); simMs = 6.9 * 3600000; sessionS = 0; tick(); }, stop: function () { running = false; clearTimeout(timer); } };
  })();

  /* ---------------------------------------------------------- site demo */
  D.siteDemo = (function () {
    var root, timer, i = 0, auto = true, imgs = [], tabs = [];
    var PAGES = [['Flight Lab', 'assets/img/web/web-home-tall.jpg', 'elmagoct.github.io/brophy-uav-dashboard/'],
      ['Flight School', 'assets/img/web/web-flightschool-tall.jpg', '…/flightschool/'],
      ['Ground School', 'assets/img/web/web-groundschool.jpg', '…/groundschool/'],
      ['Posters', 'assets/img/web/web-posters.jpg', '…/posters/']];
    function show(n) { i = n; imgs.forEach(function (im, k) { im.classList.toggle('cur', k === n); }); tabs.forEach(function (t, k) { t.classList.toggle('cur', k === n); }); root.querySelector('.bar span').textContent = PAGES[n][2]; }
    function build() {
      root.innerHTML = '<div class="bar"><i></i><i></i><i></i><span></span></div>';
      var tb = el('div', 'tabs'), view = el('div', 'siteview scrolly');
      PAGES.forEach(function (p, k) {
        var b = el('button', null, p[0]); b.addEventListener('click', function (e) { e.stopPropagation(); auto = false; clearTimeout(timer); show(k); }); tb.appendChild(b); tabs.push(b);
        var im = el('img'); im.src = p[1]; im.alt = p[0]; view.appendChild(im); imgs.push(im);
      });
      root.appendChild(tb); root.appendChild(view);
      root.appendChild(el('div', 'cap', 'the real site, cycling · tap a tab to hold'));
      show(1);
    }
    function cycle() { if (!auto) return; show((i + 1) % PAGES.length); timer = setTimeout(cycle, 9000); }
    return { mount: function (n) { root = n; build(); }, start: function () { if (auto) timer = setTimeout(cycle, 9000); }, stop: function () { clearTimeout(timer); } };
  })();
})();
