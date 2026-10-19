---
name: real-studio-video
description: Author, preview and render video as HTML compositions (GSAP timeline -> deterministic MP4), in the style of HeyGen's HyperFrames. Use for any request to make a video, motion graphic, title card, intro/outro or animated clip for this site, and to re-encode clips for the scroll-scrubbed tour in site/videos/.
---

# Real Studio video

Videos are web pages. A composition is one HTML file whose animation is a **paused GSAP timeline**; the renderer seeks that timeline frame by frame in headless Chromium and pipes PNG frames to ffmpeg. Same input -> same MP4, no real-time capture.

## Workflow
1. Copy `templates/composition.html` AND `templates/gsap.min.js` (vendored GSAP 3.12.5, so renders work offline) to `studio/<name>/` (create `studio/` if missing).
2. Edit scenes, text, media. Keep assets next to the file and reference them relatively.
3. Preview: open the HTML in a browser; append `?t=2.5` to freeze at 2.5s.
4. Render: `node .claude/skills/real-studio-video/scripts/render.mjs studio/<name>/index.html out.mp4 [--fps 24] [--scrub]`
5. For the tour, write to `site/videos/NN.mp4` with `--scrub` (see below). Check with `ffprobe` and extract a frame (`ffmpeg -ss 3 -i out.mp4 -frames:v 1 f.png`) to eyeball it.

## Composition contract
- Root element `#stage` with `data-width`, `data-height`, `data-duration` (seconds). Default 1280x720, 24fps to match `site/videos/*`.
- Build ONE timeline: `const tl = gsap.timeline({ paused: true }); window.__tl = tl;`. Nothing may animate outside it.
- No `Math.random()`, `Date.now()`, `setTimeout`, CSS transitions/animations, or autoplaying `<video>`/`<audio>` (non-deterministic). Seed anything random.
- Video clips inside a composition: drive `video.currentTime` from the timeline (`tl.call`/onUpdate) and wait for `seeked`; prefer pre-extracted image sequences for heavy use.
- Fonts and images must be local or fully loaded before first frame; the renderer waits for `document.fonts.ready`.
- Duration = `data-duration`; the timeline should be at least that long.

## Scroll-scrub encoding (`--scrub`)
`site/index.html` scrubs `video.currentTime` with scroll, so every frame must be cheap to seek: `-g 1` (all-intra H.264), `-pix_fmt yuv420p`, `-movflags +faststart`, no audio, CRF ~20. Files get large; keep clips short (~10s at 1280x720 is the current norm). Without `--scrub` the render uses normal GOP settings (`-crf 18`, `-g 48`).

## Rules of thumb
- Ease everything (`power2.out`, `expo.out`); linear motion looks cheap.
- One idea per scene, 2-4s each; overlap transitions by ~0.3s.
- Text legible at 1280x720: >=48px headings, safe margin 64px.
- Don't commit large renders unless asked; `.gitignore` already tracks the repo's mp4s, so add new ones deliberately.

## Setup
Needs `ffmpeg` and `playwright` (Chromium). In cloud sessions both are preinstalled (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); the renderer uses Playwright's headless shell, falling back to that Chromium binary. Elsewhere: `npm i -D playwright && npx playwright install chromium`.

## Gotchas
- In any `page.evaluate`, never return a GSAP object (`tl.seek()` returns the timeline; it is circular and Playwright hangs serializing it). Wrap in braces: `() => { tl.seek(t); }`.
- Set the viewport when creating the page, not via `setViewportSize` after load.
- Sandboxed sessions may block CDNs; use the vendored `gsap.min.js`.
