# alex-carter-portfolio.fig (the website)

A UI/UX designer portfolio that looks and feels like an open Figma file —
toolbar, layers panel, multiplayer cursors, selection boxes, frame labels,
a FigJam process board — built as a clean, fast, single-page site.

## Run it

It's a static site. Open `index.html` directly, or serve the folder:

```
npx http-server . -p 3210
```

GSAP loads from a CDN, so you need internet on first load.

## Stack

- HTML + CSS + vanilla JS — no build step
- [GSAP 3.13](https://gsap.com) — ScrollTrigger (pinned horizontal FigJam board,
  reveals, scroll-progress "zoom"), ScrollToPlugin (layers-panel navigation),
  SplitText (hero line reveal)
- Inter + Caveat from Google Fonts

## Figma-isms map

| Site element | Figma reference |
|---|---|
| Top bar with tools, filename, avatars, Share | Editor toolbar — the tools actually work (see below) |
| Toolbar tools (V/F/R/P/T/C) | Working canvas tools: Move, Frame, Rectangle (Shift = square), Pen (freehand), Text, Comment. Pick one (or press its shortcut), then draw/type/click on the page. Click an object to select it; Ctrl+] / Ctrl+[ reorder layers (Shift = front/back), Del deletes, Esc returns to Move |
| Left nav | Layers panel (click = scroll to frame) |
| Assets tab | Working component library — drag instances (editable stickies, wandering cursors, comment pins, emotes, a "Hire me" button) onto the canvas |
| Hero headline | Selected layer: blue selection box, 8 handles, dimensions chip |
| Floating named cursors | Multiplayer cursors |
| 💬 pin in hero | Comments |
| Section titles ("01 · about-me") | Frame name labels |
| About cards | Components (blue dashed) |
| Stat separators | Auto-layout gap markers (pink "24") |
| Process section | FigJam board with sticky notes, pinned horizontal scroll |
| Skills table | Local variables / design tokens panel |
| Contact card | Share → "Invite collaborator" dialog |
| Bottom-right chip + toolbar % | Zoom level = scroll progress (100% → 200%) |
| Sun/moon button in toolbar | Figma's dark UI theme — chrome goes dark, your "designs" (mocks, stickies) stay lit; choice is remembered |

## Customize

- **Name / email / location** — the site ships with the dummy identity
  `Alex Carter` / `alex.carter@example.com`; search both in `index.html`
  (also check the `AC` sticky-note stamps and the `A` avatar in the share card)
- **Social links** — the `.socials` block near the bottom of `index.html`
  (currently placeholder toasts)
- **Projects** — each `<article class="project">` in `#work`; thumbnails are
  pure CSS mocks, swap in real images if you have them
- **Colors / tokens** — `:root` variables at the top of `style.css`

Reduced-motion users get a static, fully readable page; everything also
renders without JavaScript (the preloader self-hides).
