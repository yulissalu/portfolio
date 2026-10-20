# Yulissa Lu — Portfolio

Plain HTML/CSS/JS version of [yulissalu.com](https://yulissalu.com), moved over from Framer. There's no build step.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. (Opening `index.html` directly also works, but a local server behaves more like the real site.)

## Where things live

| File | What it is |
| --- | --- |
| `index.html` | Homepage: hero, Glyph Clock, about, selected works, experiences |
| `time-based-media.html`, `tsa-design.html`, `interactive-visuals.html` | Project pages |
| `playground.html` | Archived painting/drawing/ceramics, click to enlarge |
| `css/style.css` | All styling. Colors and fonts are tokens at the top, with dark mode just below |
| `js/main.js` | Theme toggle, footer clock, fade-ins, hover video, lightbox, falling pills |
| `embeds/glyph-clock.html` | The p5.js Glyph Clock sketch, loaded in an iframe |
| `assets/` | Images, the preview video, favicons |

The header and footer are copied into each page. If you change one, change it on every page (or ask Claude to).

## Adding a project

1. Copy one of the project pages, such as `tsa-design.html`, and rename it.
2. Put images in `assets/images/`.
3. Add a `.work-card` for it in the "Selected Works" section of `index.html`.
4. Update the "NEXT PROJECT" links so the pages still loop.

## Deploying

This works on any static host: GitHub Pages, Netlify, Vercel, or Cloudflare Pages. Point the host at this folder with no build command, then move the `yulissalu.com` domain over from Framer.
