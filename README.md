# Pilots before drones — the FPV Club grant pitch

A web presentation for the Brophy College Preparatory FPV Club's 2026–27 grant
proposal. Plain HTML/CSS/JS, no build step, served by GitHub Pages:

**https://elmagoct.github.io/brophy-fpv-grant/**

A plain 16-slide show in the order skills → access → structure → gear → ask,
with live renderings of the club's real badge catalogue and lab numbers.

## Presenting

| Key | Does |
|---|---|
| **→ Space Enter** | next bullet, then next sheet (also: tap/click the right 78 % of the screen, or swipe) |
| **← Backspace** | previous bullet / sheet (click the left 22 %) |
| **A** | toggle "all bullets at once" instead of one per click |
| **N** | speaker notes beside the deck, read live from `SCRIPT.md` |
| **G** | the flight plan: jump to any sheet |
| **F** | fullscreen · **1–9** jump · **Home / End** |

The URL carries the slide (`#/7`), so a reload lands on the same slide.

The deck works offline except for the live lab numbers on slides 1 and 8
(it falls back to a dated snapshot and says so). Fonts are
self-hosted. Open it over http, not `file://`, or the notes cannot load.

## Editing

- **Words** are in `index.html`. Each `<section class="scene">` is one slide;
  `data-title` names it in the slide list (G). `<li class="frag">` reveals one
  click at a time; a slide with `data-nofrag` has no click-stops. Slides 3–6 are filled from `badges.js` by `demos.js`.
- **Script** is `SCRIPT.md`: one `## n. Title` per slide, in order; `> ` lines are
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

## Other copies

`SLIDE-MENU.txt` is the planning list the current order came from.
`tools/build-doc.py` regenerates `slides/pitch-doc.html` (the Google Doc
version) from `index.html` + `SCRIPT.md`. `slides/pitch.pptx` and
`tools/build-slides.js` still describe the earlier 14-sheet version; rebuild
them only if a PowerPoint copy of this order is needed.
