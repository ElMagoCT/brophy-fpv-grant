/* Builds the editable slideshow version of the pitch (slides/pitch.pptx) so it can
   be uploaded to Google Slides, edited there, and re-imported into the HTML deck.
   Run:  NODE_PATH=$(npm root -g) node tools/build-slides.js [imgDir]
   Speaker notes come from SCRIPT.md, one "## n." section per slide. */
const pptxgen = require('pptxgenjs');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const IMG = process.argv[2] || path.join(ROOT, 'assets', 'img');
const OUT = path.join(ROOT, 'slides', 'pitch.pptx');

/* ---- brand (the club's paper-and-ink system) ---- */
const PAPER = 'F2ECE0', INK = '1F3350', INKSOFT = '546881', RUST = '8F3D12', SKY = '1C5578', VIOLET = '4B3287', GREEN = '1F5230', AMBER = '7D5810', WHITE = 'FFFFFF', GOGGLE = '0B1424', OSD = 'DFE9C9';
const FONT = 'Barlow';

/* ---- notes from SCRIPT.md ---- */
const script = fs.readFileSync(path.join(ROOT, 'SCRIPT.md'), 'utf8');
const notes = script.split(/^## /m).slice(1).map(p => {
  const body = p.slice(p.indexOf('\n') + 1).split('\n---')[0];
  return body.replace(/^> (.*)$/gm, '[$1]').replace(/\*\*/g, '').replace(/^_(.*)_$/gm, '($1)').trim();
});

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';                 // 10 x 5.625 in
pres.author = 'Micah Tucker'; pres.title = 'Pilots before drones';
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

function img(name) { const p = path.join(IMG, name); return fs.existsSync(p) ? p : null; }
function addImg(slide, name, o) { const p = img(name); if (p) slide.addImage(Object.assign({ path: p }, o)); else slide.addShape(pres.ShapeType.rect, Object.assign({ fill: { color: 'E6DFD0' }, line: { color: INKSOFT, width: 1, dashType: 'dash' } }, o)); }

let n = 0;
function slide(opts) {
  const s = pres.addSlide(); s.background = { color: opts.dark ? GOGGLE : PAPER };
  if (!opts.dark) s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: PAPER }, line: { color: PAPER } });
  if (opts.eyebrow) s.addText(opts.eyebrow.toUpperCase(), { x: 0.5, y: 0.3, w: 9, h: 0.3, fontSize: 10, color: RUST, charSpacing: 3, fontFace: 'Courier New', margin: 0, isTextBox: true });
  if (opts.title) s.addText(opts.title, { x: 0.5, y: 0.58, w: 9, h: 0.8, fontSize: opts.titleSize || 30, bold: true, color: opts.dark ? OSD : INK, margin: 0, isTextBox: true, valign: 'top' });
  s.addNotes(notes[n] || '');
  s.addText(String(n + 1) + ' / 14  ·  Brophy FPV Club  ·  grant 2026–27', { x: 0.5, y: 5.25, w: 9, h: 0.25, fontSize: 8, color: INKSOFT, fontFace: 'Courier New', charSpacing: 2, margin: 0, isTextBox: true, align: 'right' });
  n++; return s;
}
function bullets(s, items, o) {
  const runs = items.map((t, i) => {
    const m = typeof t === 'string' ? { b: '', r: t } : t;
    const parts = [];
    if (m.b) parts.push({ text: m.b + ' ', options: { bold: true, color: INK } });
    parts.push({ text: m.r, options: { color: INK } });
    parts[parts.length - 1].options.breakLine = i < items.length - 1;
    parts[0].options.bullet = { code: '25CB' };
    return parts;
  }).flat();
  s.addText(runs, Object.assign({ x: 0.5, y: 1.45, w: 4.6, h: 3.6, fontSize: 13, paraSpaceAfter: 7, valign: 'top', margin: 0, isTextBox: true }, o));
}
function card(s, x, y, w, h, k, title, body, color) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: WHITE }, line: { color: 'B9B1A2', width: 0.75 }, shadow: { type: 'outer', blur: 6, offset: 2, angle: 90, color: '1F3350', opacity: 0.12 } });
  s.addText(k.toUpperCase(), { x: x + 0.18, y: y + 0.12, w: w - 0.36, h: 0.22, fontSize: 8, color: color || RUST, fontFace: 'Courier New', charSpacing: 2, margin: 0, isTextBox: true });
  s.addText(title, { x: x + 0.18, y: y + 0.34, w: w - 0.36, h: 0.5, fontSize: 14, bold: true, color: INK, margin: 0, isTextBox: true, valign: 'top' });
  s.addText(body, { x: x + 0.18, y: y + 0.86, w: w - 0.36, h: h - 0.98, fontSize: 11, color: INK, margin: 0, isTextBox: true, valign: 'top' });
}
function shot(s, name, x, y, w, h, cap) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h: h + 0.26, rectRadius: 0.06, fill: { color: WHITE }, line: { color: '8A94A3', width: 0.75 } });
  s.addShape(pres.ShapeType.rect, { x: x + 0.01, y: y + 0.01, w: w - 0.02, h: 0.24, fill: { color: 'E9E3D6' }, line: { color: 'E9E3D6' } });
  s.addText(cap, { x: x + 0.12, y: y + 0.01, w: w - 0.24, h: 0.24, fontSize: 7.5, color: INKSOFT, fontFace: 'Courier New', margin: 0, isTextBox: true, valign: 'middle' });
  addImg(s, name, { x: x + 0.04, y: y + 0.28, w: w - 0.08, h: h - 0.06, sizing: { type: 'cover', w: w - 0.08, h: h - 0.06 } });
}
function qr(s, name, x, y, w, label, sub, hero) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h: w + 0.55, rectRadius: 0.06, fill: { color: WHITE }, line: { color: hero ? RUST : 'B9B1A2', width: hero ? 1.5 : 0.75 } });
  const p = path.join(ROOT, 'assets', 'qr', name + '.png');
  if (fs.existsSync(p)) s.addImage({ path: p, x: x + 0.12, y: y + 0.12, w: w - 0.24, h: w - 0.24 });
  s.addText(label, { x, y: y + w - 0.08, w, h: 0.3, fontSize: 11, bold: true, color: INK, align: 'center', margin: 0, isTextBox: true });
  s.addText(sub, { x: x + 0.05, y: y + w + 0.2, w: w - 0.1, h: 0.3, fontSize: 7, color: INKSOFT, fontFace: 'Courier New', align: 'center', margin: 0, isTextBox: true });
}
function placeholder(s, x, y, w, h, label, file) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: 'EDE7DA' }, line: { color: INKSOFT, width: 1, dashType: 'dash' } });
  s.addText([{ text: 'PHOTO COMING FROM THE KIOSK\n', options: { fontSize: 7.5, fontFace: 'Courier New', color: INKSOFT, charSpacing: 2 } }, { text: label + '\n', options: { fontSize: 11, bold: true, color: INK } }, { text: file, options: { fontSize: 7, fontFace: 'Courier New', color: INKSOFT } }],
    { x, y, w, h, align: 'center', valign: 'middle', margin: 0.1, isTextBox: true });
}

/* ================================================================ 1 title */
{
  const s = slide({ dark: true });
  s.addText('FPV CLUB · BROPHY COLLEGE PREPARATORY · 2026–27', { x: 0.5, y: 0.5, w: 9, h: 0.3, fontSize: 10, color: OSD, fontFace: 'Courier New', charSpacing: 3, margin: 0, isTextBox: true });
  s.addText('Pilots before drones.', { x: 0.5, y: 1.0, w: 9, h: 1.3, fontSize: 60, bold: true, color: OSD, margin: 0, isTextBox: true });
  s.addText([{ text: 'The Brophy FPV Badge Program: ', options: { bold: true } }, { text: 'a standing certification path that turns beginners into responsible pilots, is taught by students, and outlives any one class of members.' }],
    { x: 0.5, y: 2.4, w: 8.6, h: 1.0, fontSize: 16, color: 'B9C4D6', margin: 0, isTextBox: true, valign: 'top' });
  [['$2,000', 'one-time ask'], ['28', 'skill badges · 4 tracks'], ['4', 'equipment tiers, gated'], ['+8', 'pilots already training']].forEach((st, i) => {
    const x = 0.5 + i * 2.3;
    s.addShape(pres.ShapeType.roundRect, { x, y: 3.7, w: 2.1, h: 1.0, rectRadius: 0.06, fill: { color: '101C31' }, line: { color: '3A4A66', width: 0.75 } });
    s.addText(st[0], { x: x + 0.15, y: 3.75, w: 1.9, h: 0.55, fontSize: 26, color: OSD, fontFace: 'Courier New', margin: 0, isTextBox: true });
    s.addText(st[1].toUpperCase(), { x: x + 0.15, y: 4.3, w: 1.9, h: 0.3, fontSize: 7.5, color: '9FB0C8', fontFace: 'Courier New', charSpacing: 2, margin: 0, isTextBox: true });
  });
  s.addText('Micah Tucker & team', { x: 0.5, y: 4.9, w: 5, h: 0.3, fontSize: 10, color: '9FB0C8', fontFace: 'Courier New', charSpacing: 2, margin: 0, isTextBox: true });
}
/* ================================================================ 2 */
{
  const s = slide({ eyebrow: '01 · Where we are today', title: 'We didn’t wait for the money. Tier 0 is already running.', titleSize: 26 });
  bullets(s, [
    { b: 'Five FPV simulators', r: 'in the IC, open to anyone, 7:00–4:00 on school days.' },
    { b: 'A kiosk students built:', r: 'tap your name, pick a sim, fly. Hours log themselves.' },
    { b: 'Ground School lessons and quizzes', r: 'run on the same machine while someone else has the seat.' },
    { b: 'A public website', r: 'shows the lab’s hours, the leaderboard and the whole badge path.' },
    { b: 'As of Oct 4:', r: '87 h 30 m flown · 35 pilots logged · 22 flying this week · 5 simulators. (Live numbers in the web deck.)' }
  ]);
  shot(s, 'kiosk-home.jpg', 5.4, 1.45, 4.1, 1.9, 'kiosk · home screen');
  shot(s, 'web-home.jpg', 5.4, 3.75, 4.1, 1.3, 'elmagoct.github.io/brophy-uav-dashboard/');
}
/* ================================================================ 3 */
{
  const s = slide({ eyebrow: '02 · The problem', title: 'Every year a club like this restarts from zero.' });
  bullets(s, [
    { b: 'Skills leave with the seniors.', r: 'Whoever knew how to build, tune and fly graduates, and nothing is written down.' },
    { b: 'Nobody can say who may fly what.', r: 'Expensive gear with no rule for who is trained to touch it.' },
    { b: 'FPV looks like a toy until it isn’t.', r: 'LiPo fires, flyaways and controlled airspace are real, and there is no safety standard on paper.' },
    { b: 'Students who want to film for the school', r: 'have no path to get there.' }
  ]);
  card(s, 5.4, 1.45, 4.1, 1.7, 'what a grant usually buys', 'Drones.', 'They get flown by the two people who already knew how, and when those two graduate the drones sit in a drawer.');
  card(s, 5.4, 3.3, 4.1, 1.75, 'what we are asking for instead', 'A training fleet for a certification system.', 'The drones in the budget are the hardware the badge program runs on, and the program is what the school keeps.', GREEN);
}
/* ================================================================ 4 */
{
  const s = slide({ eyebrow: '03 · The idea', title: 'Badges unlock gear.' });
  bullets(s, [
    { b: 'A badge is one specific, testable skill,', r: 'signed off by a certified member.' },
    { b: 'Earn every badge in a tier and the gate opens:', r: 'the next drone is yours to fly.' },
    { b: 'Four tiers:', r: 'Simulator → Tiny Whoop → Full-size → Event Pilot.' },
    { b: 'The expensive gear is never in untrained hands,', r: 'and “who may fly what” is written down, not remembered.' }
  ], { w: 4.3 });
  const tiers = [['TIER 0', 'Simulator', 'The five FPV sims in the IC', '7 badges → Gate 1', SKY], ['TIER 1', 'Tiny Whoop', 'Meteor 75 Pro · sub-250 g', '6 badges → Gate 2', VIOLET], ['TIER 2', 'Full-size', 'Pavo 20 Pro · Cinebot 35 · 5-inch', '8 badges → Gate 3', RUST], ['TIER 3', 'Event Pilot', 'Any Tier 2 airframe at a school event, with a spotter', '+ 7 electives', GREEN]];
  tiers.forEach((t, i) => {
    const x = 5.1 + (i % 2) * 2.25, y = 1.45 + Math.floor(i / 2) * 1.85;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 2.1, h: 1.7, rectRadius: 0.06, fill: { color: WHITE }, line: { color: 'B9B1A2', width: 0.75 } });
    s.addShape(pres.ShapeType.rect, { x: x + 0.02, y: y + 0.02, w: 2.06, h: 0.07, fill: { color: t[4] }, line: { color: t[4] } });
    s.addText(t[0], { x: x + 0.15, y: y + 0.17, w: 1.8, h: 0.22, fontSize: 8, color: t[4], fontFace: 'Courier New', charSpacing: 2, margin: 0, isTextBox: true });
    s.addText(t[1], { x: x + 0.15, y: y + 0.4, w: 1.8, h: 0.4, fontSize: 18, bold: true, color: INK, margin: 0, isTextBox: true });
    s.addText(t[2], { x: x + 0.15, y: y + 0.82, w: 1.8, h: 0.5, fontSize: 9.5, color: INKSOFT, margin: 0, isTextBox: true, valign: 'top' });
    s.addText(t[3].toUpperCase(), { x: x + 0.15, y: y + 1.38, w: 1.8, h: 0.22, fontSize: 7.5, color: INK, fontFace: 'Courier New', charSpacing: 1.5, margin: 0, isTextBox: true });
  });
}
/* ================================================================ 5 */
{
  const s = slide({ eyebrow: '04 · The curriculum', title: '28 badges. Four tracks. Every one has a “why”.', titleSize: 26 });
  const FS = {}; (function () { const code = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'badges.js'), 'utf8'); const w = { FS: null }; new Function('window', code)(w); Object.assign(FS, w.FS); })();
  const TC = { flight: SKY, build: AMBER, know: GREEN, crew: VIOLET }, TN = { t0: 'T0', t1: 'T1', t2: 'T2', t3: 'T3', el: 'EL' };
  Object.keys(FS.TRACK).forEach((k, i) => {
    const x = 0.5 + i * 2.3;
    s.addText(FS.TRACK[k].toUpperCase(), { x, y: 1.45, w: 2.15, h: 0.25, fontSize: 8.5, bold: true, color: TC[k], fontFace: 'Courier New', charSpacing: 2, margin: 0, isTextBox: true });
    const items = FS.BADGES.filter(b => b.track === k);
    const runs = items.map((b, j) => [{ text: b.name, options: { bold: true, color: INK, fontSize: 10.5 } }, { text: '  ' + TN[b.tier] + ' · ' + ({ knowledge: 'quiz', bench: 'bench', witnessed: 'witnessed', auto: 'auto' })[b.type], options: { color: INKSOFT, fontSize: 8, fontFace: 'Courier New' } }, { text: '\n' + b.why, options: { color: INKSOFT, fontSize: 8.5, italic: true, breakLine: j < items.length - 1 } }]).flat();
    s.addText(runs, { x, y: 1.72, w: 2.15, h: 3.45, fontSize: 10, paraSpaceAfter: 4, valign: 'top', margin: 0, isTextBox: true });
  });
}
/* ================================================================ 6 */
{
  const s = slide({ eyebrow: '05 · How a badge is earned', title: 'Demonstration, not attendance.' });
  bullets(s, [
    { b: 'Quiz badges:', r: 'short lessons, then a 10-question quiz. 80% passes, retake any time, the kiosk awards it by itself.' },
    { b: 'Bench badges:', r: 'a step-by-step checklist on the kiosk, a photo of the work, an instructor approves.' },
    { b: 'Witnessed badges:', r: 'an examiner watches you perform the standard written on the card.' },
    { b: 'Official:', r: 'the free FAA TRUST certificate before anyone touches a real drone.' },
    { b: 'Students run every sign-off.', r: 'Nothing here costs the school anything beyond the training fleet.' }
  ]);
  shot(s, 'web-flightschool.jpg', 5.4, 1.45, 4.1, 3.4, '…/brophy-uav-dashboard/flightschool/');
}
/* ================================================================ 7 */
{
  const s = slide({ eyebrow: '06 · Teaching', title: 'The classroom is already built.' });
  bullets(s, [
    { b: '45 lessons, about 140 minutes,', r: 'one module per knowledge badge: safety, batteries, electronics, radio, airspace, emergencies, event ops.' },
    { b: 'Works on the kiosk and on any phone.', r: 'Lessons, drills and quizzes; progress follows the pilot.' },
    { b: 'Stick drills on the real transmitter:', r: 'hover trainer, orientation recovery, the first flip and roll.' },
    { b: 'Written by students, maintained by students.', r: 'A new member has something to do on day one, with or without a free seat.' }
  ]);
  shot(s, 'web-groundschool.jpg', 5.4, 1.45, 4.1, 2.1, '…/brophy-uav-dashboard/groundschool/');
  if (img('kiosk-lesson.png')) shot(s, 'kiosk-lesson.png', 5.4, 3.75, 4.1, 1.05, 'kiosk · a lesson open'); else placeholder(s, 5.4, 3.95, 4.1, 1.1, 'A Flight School lesson open on the kiosk', 'kiosk/kiosk-lesson.png');
}
/* ================================================================ 8 */
{
  const s = slide({ eyebrow: '07 · Why sim first', title: 'Crashes should cost nothing while you learn.' });
  bullets(s, [
    { b: '7.5 hours in the simulator', r: 'before the first real flight. Acro muscle memory with zero risk.' },
    { b: 'Proficient Flight is sim-only on purpose:', r: 'orbit, Split-S, gaps, a finished race. It gates the first real battery.' },
    { b: 'Line of Sight:', r: 'if the video cuts out, the pilot can still level out and land.' },
    { b: 'Then a sub-250 g whoop that can’t do much damage.', r: 'Full-size only after Freestyle, Electrical Components, Radio Protocol and Field Repair.' },
    { b: 'Every gate is placed', r: 'where the next mistake starts to cost real money or real safety.' }
  ]);
  shot(s, '03-map-tier0.jpg', 5.4, 1.45, 2.3, 3.4, 'poster · Tier 0 trail map');
  if (img('kiosk-liftoff.jpg')) shot(s, 'kiosk-liftoff.jpg', 7.9, 1.45, 1.6, 3.4, 'kiosk · Liftoff'); else placeholder(s, 7.9, 1.45, 1.6, 3.66, 'A pilot mid-flight in Liftoff', 'kiosk/kiosk-liftoff.jpg');
}
/* ================================================================ 9 */
{
  const s = slide({ eyebrow: '08 · Sustainability', title: 'Built to outlive its founders.' });
  bullets(s, [
    { b: 'Mentor badge:', r: 'coach a new member through their first two badges. The program trains its own replacements.' },
    { b: 'Examiner badge:', r: 'who may sign off is defined by badges held plus officer approval, not by who is loudest.' },
    { b: 'Fleet Steward:', r: 'check-in/out and a maintenance log for school-funded gear, one semester at a time.' },
    { b: 'Everything is written down:', r: 'the safety rules, the badge sheet, seven printed posters, a website that runs itself.' },
    { b: 'Every award is recorded and signed', r: 'by the approving instructor, and progress only moves forward.' },
    { b: 'Gear is bought to last:', r: 'goggles and radios about 8 years, airframes about 4. A one-time build-out, not a recurring ask.' }
  ], { fontSize: 12, paraSpaceAfter: 5 });
  ['01-ad-sim.jpg', '02-ad-club.jpg', '04-map-tier1.jpg', '05-map-tier2.jpg', '06-map-tier3.jpg'].forEach((f, i) => addImg(s, f, { x: 5.4 + i * 0.84, y: 1.45, w: 0.78, h: 1.2, sizing: { type: 'cover', w: 0.78, h: 1.2 } }));
  placeholder(s, 5.4, 2.85, 4.1, 2.2, 'The printed posters above the simulators', 'photos/posters-wall.jpg');
}
/* ================================================================ 10 */
{
  const s = slide({ eyebrow: '09 · For the students', title: 'What a student walks away with.' });
  bullets(s, [
    { b: 'Hands:', r: 'soldering, electronics, firmware, field repair. Skills that transfer straight to robotics and engineering.' },
    { b: 'Judgment:', r: 'airspace law near Sky Harbor, FAA TRUST, emergency procedures, battery safety. Responsibility, not just reflexes.' },
    { b: 'Professionalism:', r: 'writing a shot list with a coach, briefing bystanders, running a flight zone at a game.' },
    { b: 'Teaching:', r: 'the path ends with coaching the next class, then examining them.' },
    { b: 'A record:', r: 'a logged, visible badge board that says exactly what they can do.' }
  ]);
  placeholder(s, 5.4, 1.45, 4.1, 2.2, 'A member flying on the sim in goggles', 'photos/pilot-flying.jpg');
  if (img('kiosk-journey.png')) shot(s, 'kiosk-journey.png', 5.4, 3.75, 4.1, 1.05, 'kiosk · a pilot’s badge map'); else placeholder(s, 5.4, 3.85, 4.1, 1.2, 'A pilot’s FPV Journey badge map on the kiosk', 'kiosk/kiosk-journey.png');
}
/* ================================================================ 11 */
{
  const s = slide({ eyebrow: '10 · For Brophy', title: 'What Brophy gets.' });
  card(s, 0.5, 1.45, 2.9, 2.35, 'a standing program', 'A safety standard and a clear answer to “who may fly what”', '• Written rules, a published badge sheet, a signed record of every award\n• FAA TRUST for every flying member, free\n• Nothing over 250 g until the top tier');
  card(s, 3.55, 1.45, 2.9, 2.35, 'a pipeline', 'Trained, certified pilots every single year', '• New members start on Simulator Flight the week they join\n• Mentors and examiners are produced by the path itself\n• Fifteen joint community-period meetings with RC Club a year');
  card(s, 6.6, 1.45, 2.9, 2.35, 'the output', 'Footage and moments the school can actually use', '• Best of Brophy: short aerial clips any team or club can use, two showcase films a year\n• A live FPV race at the pep rally, pilot’s-eye view on the scoreboard\n• A recruiting moment: students see FPV before they hear about it');
  s.addText([{ text: 'A model other clubs can copy. ', options: { bold: true } }, { text: 'Badge → gate → gear is not drone-specific. Robotics, shop, A/V: any club with expensive tools and a safety question can run the same system.' }],
    { x: 0.5, y: 4.0, w: 5.6, h: 1.0, fontSize: 12, color: INK, margin: 0, isTextBox: true, valign: 'top' });
  shot(s, 'web-posters.jpg', 6.6, 3.95, 2.9, 0.95, '…/brophy-uav-dashboard/posters/');
}
/* ================================================================ 12 */
{
  const s = slide({ eyebrow: '11 · The equipment, briefly', title: 'The drones are the training fleet the badge system runs on.', titleSize: 24 });
  card(s, 0.5, 1.45, 4.4, 1.6, 'trainers · tier 1', 'Two Meteor 75 Pro tiny whoops', 'Sub-250 g, ducted props, safe indoors, cheap to crash. Eight students are training today without a drone to share. Two trainers means two first flights at once.', VIOLET);
  card(s, 5.1, 1.45, 4.4, 1.6, 'pilot kit', 'Two goggle-and-radio sets', 'Two pilots can train or fly at the same time, on the sim or in the air. Goggles and radios last about eight years, so this is the part the school buys once.', SKY);
  card(s, 0.5, 3.2, 4.4, 1.6, 'camera ship · tier 2', 'One Pavo 20 Pro cinewhoop', 'Ducted, so it can fly near people; a D-log camera, so the footage can be graded. The drone Best of Brophy is shot on, and the airframe the top-tier badges are tested on.', RUST);
  card(s, 5.1, 3.2, 4.4, 1.6, 'keep it flying', 'Spares, batteries, a smoke stopper, two screwdrivers', 'Members fix what they break: that is a badge, not a chore. Spare frames, props and motors mean a crash is a repair lesson, not a purchase order.', AMBER);
  s.addText([{ text: 'About $1,975 estimated, inside the $2,000 ask, ', options: { bold: true } }, { text: 'with the pep-rally course priced after Stuco confirms the slot. Many essentials are donated by members. The full parts list, with a reason beside every line, is in the proposal.' }],
    { x: 0.5, y: 4.88, w: 9, h: 0.4, fontSize: 10.5, color: INK, margin: 0, isTextBox: true });
}
/* ================================================================ 13 */
{
  const s = slide({ eyebrow: '12 · The ask', title: '$2,000, tied to three projects.' });
  bullets(s, [
    { b: 'The Badge Program:', r: 'a standing certification path, run inside every club meeting.' },
    { b: 'Best of Brophy:', r: 'aerial clips through the year, a showcase film each semester.' },
    { b: 'The pep-rally race:', r: 'a live FPV race on the scoreboard, if Stuco and Student Activities approve the segment.' },
    { b: 'Next steps:', r: 'Mr. Reasy, then Mr. Burr for Student Activities sign-off, Stuco on the rally slot, then the fall assembly pitch with recruiting.' },
    { b: 'Once funded:', r: 'order the fleet, publish the badge sheet, certify current pilots as examiners, start every new member on Simulator Flight.' }
  ]);
  qr(s, 'proposal', 5.4, 1.45, 2.4, 'The official proposal', 'Google Doc · badges, budget, timeline', true);
  qr(s, 'dashboard', 8.0, 1.45, 1.5, 'Lab dashboard', 'hours · leaderboard');
  qr(s, 'flightschool', 8.0, 3.6, 1.5, 'Flight School', 'all 28 badges');
}
/* ================================================================ 14 */
{
  const s = slide({ eyebrow: 'Thank you · questions', title: 'Pilots before drones. Scan anything.' });
  [['proposal', 'Proposal', 'the official doc', true], ['deck', 'This pitch', 'web deck'], ['dashboard', 'Lab dashboard', 'hours · leaderboard'], ['flightschool', 'Flight School', 'all 28 badges'], ['posters', 'The posters', 'print-ready PDFs'], ['playlist', 'Flight reel', 'YouTube playlist']]
    .forEach((q, i) => qr(s, q[0], 0.5 + i * 1.52, 1.75, 1.4, q[1], q[2], q[3]));
  s.addText('FPV Club · Brophy College Preparatory · Micah Tucker & team · mtucker27@brophybroncos.org', { x: 0.5, y: 4.6, w: 9, h: 0.3, fontSize: 9, color: INKSOFT, fontFace: 'Courier New', charSpacing: 1.5, margin: 0, isTextBox: true });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
pres.writeFile({ fileName: OUT }).then(f => console.log('wrote', f, Math.round(fs.statSync(f).size / 1024) + ' KB'));
