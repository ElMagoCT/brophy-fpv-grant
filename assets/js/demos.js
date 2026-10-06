/* Live pieces of the slideshow, all re-rendered from the club's real data:
     liveStats  - the public dashboard's data.json (same origin on GitHub Pages)
     badgelists - one slide per track, from badges.js
     ladder     - the four tiers, from badges.js, animated as one pilot climbs */
(function () {
  var FS = window.FS;
  var TC = { flight: 'var(--sky)', build: 'var(--amber)', know: 'var(--green)', crew: 'var(--violet)' };
  var TYPE = { knowledge: 'quiz', bench: 'bench', witnessed: 'witnessed', auto: 'automatic' };
  var TIER_ORDER = { t0: 0, t1: 1, t2: 2, t3: 3, el: 4 };
  var D = window.DEMOS = {};
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function tierOf(id) { return FS.TIERS.filter(function (t) { return t.id === id; })[0]; }
  function tierLabel(t) { return t.n >= 0 ? 'Tier ' + t.n : 'Elective'; }

  /* ------------------------------------------------------ badge lists */
  D.badgelists = {
    mount: function () {
      Array.prototype.forEach.call(document.querySelectorAll('.badgelist'), function (root) {
        var track = root.getAttribute('data-track');
        root.style.setProperty('--c', TC[track]);
        FS.BADGES.filter(function (b) { return b.track === track; })
          .sort(function (a, b) { return TIER_ORDER[a.tier] - TIER_ORDER[b.tier]; })
          .forEach(function (b) {
            var t = tierOf(b.tier);
            var card = el('div', 'badge', '<div class="n">' + b.name + '</div><div class="t">' + tierLabel(t) + ' · ' + TYPE[b.type] + '</div><div class="d">' + b.do + '</div><div class="w">' + b.why + '</div>');
            card.style.setProperty('--tier', t.color);
            root.appendChild(card);
          });
      });
    }, start: function () {}, stop: function () {}
  };

  /* ------------------------------------------------------- live stats */
  D.liveStats = (function () {
    var root, url = 'https://elmagoct.github.io/brophy-uav-dashboard/data.json';
    var FALLBACK = { generatedIso: '2026-10-04T17:01:41-07:00', totals: { clubMs: 315020320, pilots: 35, activePilots7: 22, sims: 5 } };
    function hrs(ms) { return Math.floor(ms / 3600000); }
    function render(d, live) {
      var t = d.totals;
      root.innerHTML = '';
      root.appendChild(el('div', 'live' + (live ? '' : ' off'), '<i></i>' + (live ? 'live from the lab' : 'snapshot (offline)') + ' · ' + new Date(d.generatedIso).toLocaleDateString([], { month: 'short', day: 'numeric' })));
      var s = el('div', 'ministats');
      [[hrs(t.clubMs) + '<small>h</small>', 'hours flown'], [t.pilots, 'pilots logged'], [t.activePilots7, 'flying this week']].forEach(function (x) {
        s.appendChild(el('div', 'stat', '<div class="v">' + x[0] + '</div><div class="l">' + x[1] + '</div>'));
      });
      root.appendChild(s);
      var h = document.getElementById('liveHours'); if (h) h.innerHTML = hrs(t.clubMs) + '<small>h</small>';
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

  /* ----------------------------------------------------------- ladder */
  var GATE = '<svg viewBox="0 0 34 30"><path d="M3 29 V14 A14 14 0 0 1 31 14 V29"/></svg>';
  D.ladder = (function () {
    var root, timer, rungs = [], chips = [], running = false;
    function build() {
      root.innerHTML = '';
      var lad = el('div', 'ladder');
      FS.TIERS.filter(function (t) { return t.id !== 'el'; }).forEach(function (t) {
        var r = el('div', 'rung'); r.style.setProperty('--c', t.color);
        var bs = FS.BADGES.filter(function (b) { return b.tier === t.id; });
        r.innerHTML = '<div class="tn">Tier ' + t.n + '</div><div class="nm">' + t.name + '</div><div class="gear">' + t.gear + '</div>';
        var ch = el('div', 'chips');
        bs.forEach(function (b) { var c = el('div', 'chip', '<i></i>' + b.name + '<span class="ck">✓</span>'); c.style.setProperty('--tc', TC[b.track]); ch.appendChild(c); chips.push({ el: c, tier: r }); });
        if (!bs.length) ['All 8 Tier 2 badges', 'FAA TRUST on file', 'Spotter beside you', 'Cleared for crowds'].forEach(function (txt) {
          var c = el('div', 'chip el', '<i></i>' + txt + '<span class="ck">✓</span>'); c.style.setProperty('--tc', t.color); ch.appendChild(c); chips.push({ el: c, tier: r });
        });
        r.appendChild(ch);
        r.appendChild(el('div', 'gatebox', '<span>' + (t.gate || '') + '</span>' + GATE));
        lad.appendChild(r); rungs.push(r);
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
        if (i < chips.length) {
          var c = chips[i]; c.el.classList.add('on'); i++;
          var done = chips.filter(function (x) { return x.tier === c.tier; }).every(function (x) { return x.el.classList.contains('on'); });
          if (done) { c.tier.classList.add('open'); timer = setTimeout(step, 900); } else timer = setTimeout(step, 280);
        } else timer = setTimeout(run, 4000);
      }
      timer = setTimeout(step, 900);
    }
    return { mount: function (n) { root = n; build(); }, start: function () { if (running) return; running = true; run(); }, stop: function () { running = false; clearTimeout(timer); } };
  })();
})();
