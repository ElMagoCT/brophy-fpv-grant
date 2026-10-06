# Prompt for the kiosk's Claude session — photos for the grant pitch

Paste everything below the line into the Claude Code session on the kiosk PC
(KIOSK-A `RCCLUB` or KIOSK-B `RC2`, whichever is in front of you). It knows the
kiosk; this tells it exactly which pictures the pitch needs and where to put them.
Phone photos: AirDrop/USB them into `C:\BrophyUAV-grant\assets\img\photos\`
first (any filename), then the session renames and resizes them.

---

Read `C:\BrophyUAV\CLAUDE.md` first, as always, and `git -C C:\BrophyUAV pull`.

I'm presenting the FPV Club grant with a web deck that lives in the **public**
GitHub repo `ElMagoCT/brophy-fpv-grant` (live at
https://elmagoct.github.io/brophy-fpv-grant/). The deck already references a
set of image files that do not exist yet; wherever one is missing it shows a
dashed "photo coming from the kiosk session" placeholder. Your job is to
produce those files from this kiosk and push them. **Do not edit `index.html`,
the CSS or the JS** — the filenames below are already wired in, and the
placeholders disappear by themselves when the files exist.

## Set-up

1. Clone the repo next to the other two if it is not there yet:
   `git clone https://github.com/ElMagoCT/brophy-fpv-grant.git C:\BrophyUAV-grant`
   (same cached GitHub credential as `C:\BrophyUAV-web`). If it exists, `git -C C:\BrophyUAV-grant pull`.
2. Screenshots are taken with the kiosk's own helper, `C:\BrophyUAV\capture.ps1`,
   which is DPI-aware (the display is 125 %, so a naive capture chops off the
   right-hand logbook). Run it in a fresh PowerShell process as its header says.
   For a full-screen capture of a running simulator, `capture.ps1` with the sim's
   window is fine, or press PrintScreen while the sim has focus and save from the
   clipboard with `[System.Windows.Forms.Clipboard]::GetImage()`.
3. Save PNG for UI, JPEG (quality ~85) for photos and game frames. Resize
   anything wider than **1800 px** down to 1800 px wide (System.Drawing is fine).
   Keep each file under ~600 KB; the deck loads all of them at once.

## Kiosk screenshots → `assets\img\kiosk\`

| File | What must be in it |
|---|---|
| `kiosk-home.jpg` | The full home screen with a **real pilot signed in**, the video reel actually playing (not the grey harness background), the six dock tiles and the Pilot Logbook on the right. Replace the stand-in that is already there. |
| `kiosk-liftoff.jpg` | Liftoff **mid-flight**, a real gameplay frame: a gate or a track visible, the drone moving. Not the menu. One of the club's regulars flying is ideal; the kiosk's bottom bar may show at the edge, that is fine. |
| `kiosk-journey.png` | The **FPV Journey** badge map on a pilot's dash (`renderJourney`) for a pilot who has some badges earned, some in progress, one marked next. Pick the pilot with the most progress. |
| `kiosk-lesson.png` | A Flight School lesson **open** in the course frame, mid-lesson: a drill (Hover Trainer or Go/No-Go) or a quiz question. Not the syllabus. |
| `kiosk-quiz-pass.png` | The moment a quiz is passed and the badge is awarded (BADGE EARNED on the module, or the award toast). Use the Test Pilot or your own profile if nobody real is at 80 yet; say which in the commit message. |
| `kiosk-logbook.png` | The Pilot Logbook column by itself, with the week's ranking and Ground School bars visible. |
| `kiosk-bar.png` | The bottom menu bar with the **green box** around the running sim and the FLYING FOR clock. `capture.ps1 -Bar` does this. |

Names on the kiosk are already `First L.`; that is as much as the deck should
show. If a capture happens to include a full name anywhere, crop it.

## Phone photos → `assets\img\photos\`

Micah or a member takes these on a phone and drops them in the folder; you
rename, resize and commit them. Landscape, well lit, no blur.

| File | The shot |
|---|---|
| `lab-wide.jpg` | The whole room: both kiosks, the radios on the desks, the posters on the wall, ideally with people at the sims. |
| `pilot-flying.jpg` | One member at a sim, goggles or screen, hands on the transmitter, concentrating. Side angle so the screen is visible. |
| `posters-wall.jpg` | The seven printed posters hung above the simulators, straight on. |
| `meteor-bench.jpg` | A Meteor 75 Pro (or any whoop) on the bench with the soldering iron / Betaflight on screen: the Building or Betaflight badge in progress. |
| `group.jpg` | The members together in the lab. |

Faces: these go on a public site. Only include students who have said yes to
being in it; otherwise shoot from behind or crop. Ask Micah if unsure.

## Commit

- `git -C C:\BrophyUAV-grant add assets\img\kiosk\<files> assets\img\photos\<files>` — **only the image files**, never `-A`.
- One commit per batch, message like `photos: kiosk home, Liftoff, journey map (KIOSK-A)` and, for the quiz shot, whose profile was used.
- `git -C C:\BrophyUAV-grant push`. GitHub Pages republishes within a minute or two; open https://elmagoct.github.io/brophy-fpv-grant/#/2 and confirm the placeholder on that sheet is gone (sheets 2, 7, 8, 9, 10 have placeholders).
- Then tell Micah which files landed and which are still missing, in a list.

Do not touch `C:\BrophyUAV` or `C:\BrophyUAV-web` for this; nothing in the kiosk
changes. If a capture needs a sim running, use the kiosk normally as a pilot
would; do not start or stop the bridge by hand.
