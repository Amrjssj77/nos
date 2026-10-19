#!/usr/bin/env node
// Deterministic HTML -> MP4: seek window.__tl per frame in headless Chromium, pipe PNGs to ffmpeg.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args.splice(i, 2)[1]; };
const scrub = args.includes("--scrub") && !!args.splice(args.indexOf("--scrub"), 1);
const fps = Number(flag("--fps", 24));
const [input, output] = args;
if (!input || !output) { console.error("usage: render.mjs <composition.html> <out.mp4> [--fps 24] [--scrub]"); process.exit(1); }

function loadPlaywright() {
  const roots = [process.cwd(), execSync("npm root -g").toString().trim()];
  for (const r of roots) {
    try { return createRequire(resolve(r, "noop.js"))("playwright"); } catch {}
    try { return createRequire(resolve(r, "x/noop.js"))("playwright"); } catch {}
  }
  throw new Error("playwright not found: npm i -D playwright");
}
const { chromium } = loadPlaywright();
const fallback = "/opt/pw-browsers/chromium";
const launchOpts = { args: ["--no-sandbox", "--disable-gpu", "--disable-background-networking"] };
// Prefer Playwright's headless shell; fall back to the preinstalled Chromium.
const browser = await chromium.launch(launchOpts).catch(() =>
  chromium.launch({ ...launchOpts, executablePath: fallback }));
const url = pathToFileURL(resolve(input)).href;

// Probe stage size first; screenshots hang if the viewport is resized after load.
const probe = await browser.newPage();
await probe.goto(url);
const { w, h, dur } = await probe.$eval("#stage", (el) => ({
  w: +el.dataset.width, h: +el.dataset.height, dur: +el.dataset.duration,
}));
await probe.close();

const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto(url);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => !!window.__tl, null, { timeout: 15000 });
const frames = Math.round(dur * fps);

const enc = scrub ? ["-g", "1", "-crf", "20"] : ["-g", "48", "-crf", "18"];
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
  "-c:v", "libx264", ...enc, "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", output],
  { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((r, j) => { ff.on("exit", (c) => (c ? j(new Error("ffmpeg exit " + c)) : r())); });

for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => { window.__tl.seek(t, false); }, i / fps);
  const png = await page.screenshot({ type: "png" });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
await browser.close();
console.log(`rendered ${frames} frames (${w}x${h} @ ${fps}fps) -> ${output}`);
