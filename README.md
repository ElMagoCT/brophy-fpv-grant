# Pilots before drones — the FPV Club grant pitch

A web presentation for the Brophy College Preparatory FPV Club's 2026–27 grant
proposal. Plain HTML/CSS/JS, no build step, served by GitHub Pages:

**https://elmagoct.github.io/brophy-fpv-grant/**

Seventeen slides (intro, why drones now, skills → access → structure → yields
→ gear → budget → timeline → thanks), presented as a night fly-through: the
city is the background with light trails behind, every slide is a cluster of
solid floating cards placed off-grid, a bright neon path curves through the
cards (anchored at their corners) and runs on to the next slide, and the camera pans sideways along a winding route with the
direction changing each step. Live renderings of the club's real badge
catalogue and lab numbers; product photos on the equipment slide.

## Presenting

| Key | Does |
|---|---|
| **→ Space Enter** | next bullet, then next slide (also: tap/click the right 78 % of the screen, or swipe) |
| **← Backspace** | previous bullet / slide (click the left 22 %) |
| **A** | toggle bullets one per click (default is all at once) |
| **N** | speaker notes beside the deck, read live from `SCRIPT.md` |
| **G** | the slide list: jump to any slide |
| **F** | fullscreen · **1–9** jump · **Home / End** |

The URL carries the slide (`#/7`), so a reload lands on the same slide. Slide 8
is a 3D ring of skill cards that turns on its own: drag it or use the arrows.
`SPEAKER-NOTES.txt` is the script as plain text (regenerated from `SCRIPT.md`).
Cards carry titles only; the words are in the script.

The deck works offline except for the live lab numbers on slides 1 and 8
(it falls back to a dated snapshot and says so). Fonts are
self-hosted. Open it over http, not `file://`, or the notes cannot load.

## Editing

- **Words** are in `index.html`. Each `<section class="scene">` is one slide, a
  12-column grid of `.card`s (`grid-column:span N`); the neon path follows card
  order, so order cards the way you want the eye to travel. The asset URLs carry
  `?v=N`; bump it when CSS or JS change so phones don't show a cached copy;
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

The proposal says 27/28 badges; since 2026-10-06 the catalogue, the website
and this deck say **23** (Flight 7, Build 6, Knowledge 5, Crew 5). The sim-hours threshold is **7.5 h** everywhere.
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

## Rendering notes

Do not add `will-change: transform` to `#route` or the city layers: the route
is about 30,000 px wide and a pre-promoted layer that size exceeds the GPU
texture limit, so some slides silently stop painting. The accent colour fades
between slides through a registered `@property --neon`.
