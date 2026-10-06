# Pilots before drones — the FPV Club grant pitch

A web presentation for the Brophy College Preparatory FPV Club's 2026–27 grant
proposal. Plain HTML/CSS/JS, no build step, served by GitHub Pages:

**https://elmagoct.github.io/brophy-fpv-grant/**

It is a deck, not a document: fourteen "sheets" you fly through, FPV-goggle
style, with live renderings of the club's real badge catalogue and lab numbers.

## Presenting

| Key | Does |
|---|---|
| **→ Space Enter** | next bullet, then next sheet (also: tap/click the right 78 % of the screen, or swipe) |
| **← Backspace** | previous bullet / sheet (click the left 22 %) |
| **A** | toggle "all bullets at once" instead of one per click |
| **N** | speaker notes beside the deck, read live from `SCRIPT.md` |
| **G** | the flight plan: jump to any sheet |
| **F** | fullscreen · **1–9** jump · **Home / End** |

The screen starts **DISARMED**; tap or press anything to arm. The URL carries the
sheet (`#/7`), so a reload lands on the same sheet, already armed.

The deck works offline except for two things: the live lab numbers on sheet 2
(it falls back to a dated snapshot and says so) and nothing else. Fonts are
self-hosted. Open it over http, not `file://`, or the notes cannot load.

## Editing

- **Words** are in `index.html`. Each `<section class="scene">` is one sheet;
  `data-title` names it in the OSD, rail and menu. `<li class="frag">` reveals one
  click at a time; a sheet with `data-nofrag` has no click-stops.
- **Script** is `SCRIPT.md`: one `## n. Title` per sheet, in order; `> ` lines are
  click cues, `[EDIT: …]` marks are highlighted in the notes panel.
- **Badge data** is `assets/js/badges.js`, a copy of the website's
  `flightschool/badges.js`. When the website's catalogue changes, copy it over.
- **Live demos** are in `assets/js/demos.js`; navigation and transitions in
  `assets/js/pitch.js`; look in `assets/css/pitch.css`.
- **Screenshots** of the website (`assets/img/web/`) were taken with headless
  Chrome at 1440 wide; kiosk shots and room photos are listed, with filenames the
  deck already expects, in `SIMULATOR-PHOTOS-PROMPT.md`. A missing file shows a
  dashed placeholder, so the deck is presentable before they arrive.
- **QR codes** (`assets/qr/*.svg`) were generated with the Python `qrcode`
  package. Regenerate if a URL changes:

  ```bash
  python3 -c "import qrcode,qrcode.image.svg as s; q=qrcode.QRCode(border=2); q.add_data('URL'); q.make(fit=True); q.make_image(image_factory=s.SvgPathImage).save('assets/qr/name.svg')"
  ```

## Numbers to keep straight

The proposal's headline says 27 badges; the badge list, the website and this deck
say **28** (seven per track). The sim-hours threshold is **7.5 h** everywhere.
Tier numbering is the club's: simulator is Tier 0.

## Preview locally

```bash
cd brophy-fpv-grant && python3 -m http.server 8795
```
