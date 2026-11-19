# Yulissa Lu — Portfolio

Plain HTML/CSS/JS version of [yulissalu.com](https://yulissalu.com), moved over from Framer. There's no build step.

The layout, spacing, fonts, colors, and breakpoints copy the Framer site exactly. They were checked element by element against the live site at desktop (1440px), tablet (800px), and phone (390px) widths.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Where things live

| File | What it is |
| --- | --- |
| `index.html` | Homepage: falling pills, giant name, Glyph Clock, about, selected works, playground link, experiences |
| `time-based-media.html`, `tsa-design.html`, `interactive-visuals.html` | Project pages |
| `playground.html` | Archived painting, drawing, and ceramics work |
| `css/style.css` | All styling. Colors are at the top (light, then dark). Each page's section is labeled. |
| `js/main.js` | Theme toggle, footer clock, custom cursor, falling pills (Matter.js), and entrance/scroll animations |
| `embeds/glyph-clock.html` | The p5.js Glyph Clock sketch, loaded in an iframe |
| `assets/` | Images, the preview video, and favicons |

## Things that work the same as on Framer

- **Fonts:** Inter Tight for text, Space Grotesk for "YULISSA LU", and Space Mono for the pills.
- **Grid:** a 6-column grid with 15px gaps. Pages are padded 64px on desktop, 32px on tablet, and 16px on phone.
- **Breakpoints:** these differ per page, the same as in Framer. They're listed at the top of `css/style.css`.
- **Text sizes** step down at the same widths Framer used, for example h3 is 20 → 15 → 14px.
- **Animations:**
  - The pills fall and can be dragged.
  - The cursor ring follows the mouse.
  - The project list fades in after 1.2s.
  - Project titles slide up word by word.
  - Playground images ease from 110% to 100% as you scroll.

## Tuning motion

Every scroll, cursor, and physics number lives in the `MOTION` object at the top of `js/main.js`.

The defaults are the values read from the live Framer site.

- **Scroll** (`MOTION.scroll`): uses [Lenis](https://github.com/darkroomengineering/lenis) 1.0.29 (`js/vendor/lenis-1.0.29.min.js`), the same version and settings as the Framer site. `duration` is the main dial: each wheel or trackpad input glides for that many seconds, so lower (e.g. `0.9`) feels snappier and higher (e.g. `1.5`) floatier. `wheelMultiplier` changes how far each tick goes. Touch scrolling stays native unless you set `smoothTouch: true` (Framer's setting). Smooth scroll turns off for reduced motion.
- **Cursor** (`MOTION.cursor`): a spring, in the same units as Framer's spring transition. Raise `stiffness` or lower `mass` to make the ring catch up faster; raise `damping` to remove any overshoot. `offsetX`/`offsetY` place the ring relative to the pointer. The normal pointer stays visible, as on Framer. The ring only appears at 1200px and wider (`minWidth`), and Playground has none.
- **Pills** (`MOTION.physics`): `gravityY` sets fall speed, `frictionAir` slows falling and drifting, `restitution` adds bounce (0 = none), `friction` controls sliding, and `dragAngularStiffness` controls whether a dragged pill swings (0) or stays upright (1).

## Cache-busting

Every page loads `css/style.css?v=…` and `js/main.js?v=…`. After changing either file, bump the `v=` value in all five `.html` pages so visitors get the new version instead of a cached copy (GitHub Pages lets browsers cache files for 10 minutes).

## Editing tips

- The header and footer are copied into each page. If you change one, change it on every page.
- **New project:** copy a project page, add its images to `assets/images/`, add a `.work-card` to the homepage, and update the "NEXT PROJECT" links so they still loop.
- **New playground piece:** copy an `.archive-item` in `playground.html`. `data-offset` sets how far right it sits: `0`, `2`, or `3` columns.

## Deploying

This works on any static host: GitHub Pages, Netlify, Vercel, or Cloudflare Pages. Point the host at this folder with no build command, then move the `yulissalu.com` domain over from Framer.
