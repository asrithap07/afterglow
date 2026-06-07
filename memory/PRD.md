# AFTERGLOW — Y2K Digital Scrapbook PRD

## Problem statement (original)
Desktop-first web app that feels like a physical scrapbook on the internet. Y2K bedroom-floor aesthetic — printed digicam photos, polaroids, CDs, stickers, paper, tape, doodles arranged as a giant freeform collage. NOT a feed/grid/dashboard. Uses supplied user assets (logo, background, CDs, Nokia, digicam, stickers, paper, tape, retro window templates) as REQUIRED UI components — not decoration.

## User personas
- **Memory keeper** — wants a nostalgic personal photo journal that feels handmade and editable.
- **Y2K aesthete** — drawn to the chrome, dolphins-and-clouds, polaroid, CD, washi tape vibe.

## Core requirements (static)
- JWT email/password auth (register/login/logout/me)
- Photo upload → polaroid scrapbook object on a freeform canvas
- Multiple scrapbooks, each accessed via a clickable CD jewel case
- Drag, rotate, layer (z-index ↑↓), delete
- Stickers (star, smiley, cherry, bubble), paper scraps, tape, handwritten notes
- Retro Win98-style windows for upload + new-scrapbook creation
- Persistence: home canvas + each scrapbook's items saved to MongoDB
- Background: supplied dolphins/clouds/grass image; chrome Afterglow logo in header

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB) + bcrypt + PyJWT. Files stored on disk at /app/backend/uploads served via StaticFiles `/uploads/*`. Token in httpOnly cookie + JSON body (frontend uses Bearer from localStorage).
- **Frontend**: React 19 + react-router-dom 7 + Tailwind. Custom Draggable component (mouse + touch, move + rotate). Sonner for toasts.
- **DB collections**: users, scrapbooks (user_id, items[]), home_canvases (one per user, items[]).

## What's been implemented — 2026-02-08
- Auth (register/login/logout/me) — verified 12/12 backend tests + E2E
- 4 demo scrapbooks auto-seeded on register
- Home collage canvas: draggable photos, stickers, notes, persistence
- CD scrapbook browser (right-side cluster, spin-on-hover)
- /scrapbook/:id freeform canvas with photo/sticker/tape/paper/note tools, layering, delete
- Retro Upload Window + Create Scrapbook Window
- Static asset serving + photo uploads (backend disk)
- Nokia phone, digicam, bubble, star, smiley, cherry, paper, logo all used as required UI components

## Backlog / next phase
- **P1** drag-and-drop file upload directly onto canvas (no modal)
- **P1** photo resize handles + free rotation handle on every item
- **P1** more sticker variety + butterflies/flowers/sunglasses/aliens
- **P2** "share scrapbook" public read-only view (shareable URL) — strong viral hook
- **P2** music: attach a song to each CD scrapbook (Spotify embed)
- **P2** export scrapbook as a single image (html2canvas)
- **P3** mobile/touch polish (currently desktop-first per spec)
