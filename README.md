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

## Editing tips

- The header and footer are copied into each page. If you change one, change it on every page.
- **New project:** copy a project page, add its images to `assets/images/`, add a `.work-card` to the homepage, and update the "NEXT PROJECT" links so they still loop.
- **New playground piece:** copy an `.archive-item` in `playground.html`. `data-offset` sets how far right it sits: `0`, `2`, or `3` columns.

## Deploying

This works on any static host: GitHub Pages, Netlify, Vercel, or Cloudflare Pages. Point the host at this folder with no build command, then move the `yulissalu.com` domain over from Framer.
