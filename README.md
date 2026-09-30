# AS·1 — Aryavardhan Sharma · ASIC Physical Design Portfolio

A product-launch style portfolio (Kerf K1–inspired, original code) built with
**React 18 + Vite 5 + Three.js**. A procedurally built flip-chip package sits
fixed behind the page and explodes, rotates and re-frames as you scroll.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the build locally
```

## Deploy (Vercel)

Push to GitHub → import the repo in Vercel. `vercel.json` already sets
framework = Vite, build = `npm run build`, output = `dist`.

## Project structure

```
├── index.html                 Fonts, meta, #root
├── vite.config.js             React plugin, three/react split into own chunks
├── vercel.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx               React entry
    ├── App.jsx                Page composition (chrome + 8 sections)
    │
    ├── data/                  ← EDIT YOUR CONTENT HERE
    │   ├── profile.js         Name, role, location, email, links, status badge
    │   ├── content.js         Skills, experience, projects, papers, recognition…
    │   └── sections.js        Section order + 3D camera state per section
    │
    ├── three/                 3D engine (framework-agnostic)
    │   ├── ChipEngine.js      Renderer, lights, scroll choreography, labels, loop
    │   ├── buildChip.js       16-layer flip-chip stack + via placement
    │   ├── materials.js       Copper / tungsten / solder / substrate materials
    │   └── lidTexture.js      Etched marking on the heat spreader
    │
    ├── components/            Reusable UI
    │   ├── ChipScene.jsx      Mounts/disposes ChipEngine
    │   ├── Loader.jsx         "Initialising die" preloader
    │   ├── TopBar.jsx         Brand, section nav, status, IST clock
    │   ├── HUD.jsx            Live explode / rotation / scroll readouts
    │   ├── SideIndex.jsx      Right-edge section ticks
    │   ├── Frame.jsx          Thin viewport frame with corner marks
    │   ├── Marquee.jsx        Scrolling PD-flow ticker
    │   ├── Chapter.jsx        Full-height section wrapper
    │   ├── Panel.jsx          Glass panel with accent corners
    │   ├── Reveal.jsx         Scroll-in animation wrapper
    │   ├── Eyebrow.jsx        Section kicker label
    │   └── Footer.jsx
    │
    ├── sections/              One file per page section
    │   ├── Hero.jsx  Anatomy.jsx  Spec.jsx  Experience.jsx
    │   └── Work.jsx  Publications.jsx  Recognition.jsx  Contact.jsx
    │
    ├── hooks/
    │   ├── useTelemetry.js    Subscribe to engine state (active section, ready)
    │   ├── useClock.js        Live IST clock
    │   └── useReveal.js       Shared IntersectionObserver
    │
    ├── lib/
    │   ├── telemetry.js       Tiny pub/sub between engine and UI
    │   └── math.js            clamp / lerp / smoothstep / seeded RNG
    │
    └── styles/
        ├── index.css          Imports everything below
        ├── tokens.css         Colours, fonts, spacing — retheme here
        ├── base.css           Reset, typography, reveal animation
        ├── chrome.css         Canvas, frame, top bar, HUD, labels, loader, marquee
        ├── layout.css         Chapters, columns, panels, buttons
        ├── sections.css       Per-section styles
        └── responsive.css     ≤1100px, ≤760px, reduced-motion
```

## Common edits

| Want to…                         | Edit                                                   |
|----------------------------------|--------------------------------------------------------|
| Change text, add a project/paper | `src/data/content.js`                                  |
| Hide "Open to PD roles"          | `src/data/profile.js` → `status: null`                 |
| Change how the chip moves        | `src/data/sections.js` → `scene` for that section      |
| Recolour the site                | `src/styles/tokens.css`                                |
| Recolour the chip                | `src/three/materials.js`                               |
| Change metal stack / via density | `src/three/buildChip.js` (`METALS` table, `want`)      |
| Add a new section                | Create `src/sections/X.jsx` using `<Chapter id="x">`, add it to `App.jsx`, and add `{ id: "x", … }` to `sections.js` in the same position |

## Notes

- Section `id`s in `sections.js` must match the `<Chapter id>` in each section file —
  the engine uses them to know where each section sits on the page.
- Honors `prefers-reduced-motion`. On screens < 760px the chip centres, labels
  and side chrome hide.
- If WebGL is unavailable the page still loads as a plain dark layout.
