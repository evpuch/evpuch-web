# evpuch-web — project context

Personal one-page website for **Emilka Puchalski** (evpuch). This file is a
handoff summary for future Claude Code sessions. It is excluded from the Jekyll
build (see `_config.yml`), so it is not published.

## Stack & hosting
- **Jekyll** static site (kramdown, `permalink: pretty`). Single page.
- **Three.js** (from jsDelivr CDN) drives the hero molecule.
- Fonts: Space Grotesk. Dark theme; blue molecule; teal accent `#64ffda`.
- **Repo:** github.com/evpuch/evpuch-web · **Host:** Netlify (auto-deploys on push to `main`) · **Domain:** evpuch.com (primary, registered through Netlify).
- Local dev: `bundle exec jekyll serve` → http://localhost:4000.

## ⚠️ Deploy workflow (important)
The user batches deploys to conserve Netlify build credits. **Commit locally as
you work, but only `git push` when the user explicitly says "deploy"** (or
"push"/"ship"). Each push = one Netlify build. Verify changes with a local
`bundle exec jekyll build` + the preview, not by deploying. The user often
commits/pushes themselves from VS Code, so `git log origin/main..HEAD` may not
match what you expect — check state before pushing.

## File map (where to edit things)
| Want to change | File |
|---|---|
| Bio (name, dept, school, origin, lead, intro, Foundations, Otherwise, footer) | `index.md` front matter |
| Molecule branch pop-ups (title / photo / text / link) | `assets/js/molecule.js` → `BLURBS` object |
| "Elsewhere" photo gallery | `_data/photos.yml` |
| Endeavours list (supports HTML links, see below) | `_data/endeavours.yml` |
| "Find me" links | `_data/links.yml` |
| Scroll-cue text | `_layouts/home.html` (`.scroll-cue span`) |
| Spotify bubble label | `assets/js/spotify.js` |
| All styling | `assets/css/style.css` |
| Photos | `assets/images/` |

`_layouts/home.html` is the whole page (it's a full HTML doc, not wrapped by
`default.html`). `_layouts/default.html` also exists and carries the same
favicon links — keep the two in sync.

## Page structure (`_layouts/home.html`)
1. **Hero** = full-viewport (`100svh`) spinning molecule + a "Scroll" cue + the Spotify bubble.
2. **Two-column grid** below: sticky **identity rail** (name, profile photo, affiliation, links, "evpuch 2026") + **main content** (intro/lead, Endeavours, Foundations/Otherwise two-up, "Elsewhere" photo gallery).

## The molecule (`assets/js/molecule.js`)
- Rotating Three.js molecule; camera auto-fits (fills height in landscape, fits
  width in portrait). Container id `#molecule-container`.
- **Sizing:** `fitCamera()` computes `baseCamZ` (the "whole hero to itself"
  framing); `updateLayout()` then decides the actual `targetCamZ` / `targetShiftY`,
  which the render loop eases toward. Resize is watched with a **`ResizeObserver`
  on the container, not `window.resize`** — the hero can settle its size after the
  script runs (late layout, font swap, mobile URL bar) and a canvas built at 0×0
  would otherwise stay blank until the user rotated the phone. Pixel ratio is
  **capped at 2** (phones report 3 for 2.25× the fragment cost).
- Atoms are tagged with a **group**; each group maps to a **blurb**. Groups &
  current content (note: the internal group *keys* no longer match the topic —
  content was rearranged):
  - `core` → **Pigs** (`pig.jpg`)
  - `aging` → **Fridge memory** ("Useless expertise", `fridge.jpg`)
  - `music` → **Emo/Spotify** ("On repeat", `music.jpg`, has a `link` to Spotify)
  - `cars` → **Fermentation** ("Always bubbling", `ferment.jpg`, `imgPos: 'center 26%'`)
  - `origins` → **Maps** ("Maps galore", `map.jpg`; also covers the dense cluster atoms)
- **Mouse:** molecule spins continuously. Hovering an atom lights up its whole
  branch (teal) and shows a blurb **panel at a random spot** in the hero (biased
  away from the molecule via `moleculeScreenBox()`/`pickTipPosition()`).
  Selection only changes when the cursor *moves* (so spin doesn't churn it);
  panel clears on hero `mouseleave`. Blurb images are **preloaded** and the
  panel is **gated on image load** (`tip._imgReady`) so it never flashes empty.
- **Touch** (a tap fires `pointerdown`/`pointerup` with no `pointermove`, so the
  hover path never runs — don't "simplify" these back into one path):
  - Tap an atom to open, the **same branch again** to close, another branch to
    switch, empty space to close.
  - Taps get a **44px hit radius** (`TOUCH_HIT_PX`) around each atom, slightly
    depth-biased; an exact raycast still wins. A fingertip can't hit a
    0.12-unit sphere.
  - A swipe stays a scroll: drift (`TAP_SLOP`) / duration (`TAP_MS`) thresholds
    plus `pointercancel`, which fires when the browser claims the gesture.
  - Hero `mouseleave` is **guarded on `lastPointerType`** — touch fires
    compatibility mouse events that would otherwise close the panel on
    finger-up.
  - Dismissal is bound to **`pointerup`, not `click`**: iOS only synthesises
    `click` for elements it deems clickable, so a tap on the panel's own text
    produced no click and the blurb stayed put. The link keeps an exception so
    it still navigates.
  - The close button shows via a **`.by-touch` class** set when the blurb was
    opened by a finger. `@media (pointer: coarse)` alone missed hybrid laptops
    and device-emulation, where the button never appeared. It's a 44px target.
- **Mobile layout (≤600px, must match the `narrow` matchMedia in JS):** the
  blurb **docks to the bottom** of the hero instead of landing at random, which
  would always cover the molecule on a narrow screen, and the scroll cue fades
  (`.hero.tip-open`). `updateLayout()` then gives the molecule the band the panel
  isn't using: it **slides up** to sit centred there, and only if it still won't
  fit does the camera back off to shrink it. Both ease, and both restore on
  close. The band is measured from the panel's real height, and the molecule's
  extent comes from its **bounding sphere** so it doesn't wobble while spinning.
- A blurb = `{ title, img, imgPos?, text, link? }`. `link` = `{ href, label }`
  (rendered clickable; panel is interactive when visible).
- Dev note: the headless preview runs the tab **hidden**, which throttles
  `requestAnimationFrame` *and* `ResizeObserver` delivery — the animation loop
  barely runs, and a `resize_window` mid-session may not resize the canvas
  (reload at the target size instead). Add a temp `window.__t` hook exposing
  `frame()`/`pick()`/`tap()` to drive frames and simulate touch, then **remove it
  before committing**. Simulate taps with `PointerEvent`s only — dispatching a
  synthetic `click` hides exactly the iOS bug described above.

## Spotify "now playing" bubble
Static site can't hold Spotify secrets, so a **GitHub Action** does the fetching
(never Netlify — keeps it off build credits):
- `.github/workflows/spotify.yml` — cron `*/20` + manual dispatch; `timeout-minutes: 3`.
- `scripts/update-spotify.mjs` — refreshes a Spotify token, gets current-or-recent
  track, writes it to a **public Gist**. Has fetch **retries + graceful skip**
  on transient network errors (exits 0 so blips don't send failure emails; real
  errors like bad tokens still fail loudly).
- **GitHub repo secrets:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
  `SPOTIFY_REFRESH_TOKEN`, `GIST_ID`, `GIST_TOKEN` (PAT, `gist` scope).
- Client `assets/js/spotify.js` fetches the Gist raw URL (hardcoded):
  `https://gist.githubusercontent.com/evpuch/9657c60e3dc239fd5972dd83d780ced5/raw/spotify.json`
- Bubble: bottom-left on desktop, **top-left on mobile** (so it clears the scroll
  cue). Label "Live from my Spotify" when playing (spinning disc), else "Last
  played". Refetches client-side every 60s.

## Favicon
Multi-format for cross-browser reliability (Safari ignores SVG-only and requests
`/favicon.ico`):
- `assets/favicon.svg` (asymmetric molecule, blue→teal gradient, mint accent atom).
- Root `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png` — **generated
  from the SVG geometry** by a Pillow script (kept in the deploy chat history;
  regenerate by drawing the same atoms/bonds/gradient if you change the SVG).
- Links live in both layouts with `?v=N` cache-busting — **bump `?v=` when you
  change the icon**, or browsers keep the old one. Safari caches favicons very
  aggressively (clear via Settings → Privacy → Manage Website Data). This one is
  still a **manual** number, unlike CSS/JS below (icons change rarely, and
  refetching them every deploy isn't worth it).

## Asset cache-busting
`style.css`, `molecule.js` and `spotify.js` are linked with
`?v={{ site.time | date: '%s' }}` in both layouts — the **build timestamp**, so
every Netlify deploy gets a fresh URL automatically and nobody has to remember to
bump anything. Before this, Safari would happily serve a stale `molecule.js`
after a deploy and the site looked unchanged. Cost is re-downloading ~20KB per
deploy, which is nothing. If you ever want it to change only on real edits,
swap in a hand-bumped `site.assets_version` from `_config.yml`.

## Conventions / gotchas
- **Phone photos are usually sideways (EXIF).** Bake upright with Pillow:
  `ImageOps.exif_transpose(img)` → `thumbnail((1400,1400))` → save JPEG q≈82–85.
  `sips --rotate` only writes an EXIF tag that some browsers ignore — **don't use it.**
- **Profile photo** currently shows the *full* image (landscape frame): CSS
  `.profile-photo` is `width:100%; max-width:240px; height:auto` (no `object-fit`
  crop). Blurb photos are cover-cropped in a 150px box (`object-position` via
  `imgPos`).
- **Endeavours links:** Liquid does **not** escape `{{ item.name }}`, so put raw
  HTML in the YAML: `- name: '... <a href="..." target="_blank" rel="noopener">text</a>'`
  (single-quote the value, double-quote the attributes).
- Coordinates were removed from the footer; only "evpuch 2026" remains.

## Current bio (index.md)
Dept: "Math, Chemical & Biological Engineering, and Spanish" · Princeton ·
origin "Warsaw / Chicago". The user edits `index.md` prose directly; preserve
their wording (don't "fix" grammar unless asked).
