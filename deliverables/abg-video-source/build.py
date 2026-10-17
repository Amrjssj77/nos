# -*- coding: utf-8 -*-
import json, re, os, subprocess, sys, shutil
sys.path.insert(0, os.path.dirname(__file__))
from spec import SPEC
BASE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.join(BASE, "proj", "abg")
ALIGN = json.load(open(os.path.join(BASE, "align.json")))
_prev = 0.0
for _p in ALIGN:
    for _w in _p["w"]:
        _w["s"] = round(max(_w["s"], _prev), 3); _w["e"] = round(max(_w["e"], _w["s"] + 0.06), 3); _prev = _w["s"]
TOTAL = 780.0

DIAC = re.compile(r'[ً-ْٰ]')
PUNCT = re.compile(r'[،.؟?:!]')
def norm(t): return PUNCT.sub("", DIAC.sub("", t))
def merge(ws):
    out = []; i = 0
    while i < len(ws):
        if ws[i] == "الـ" and i + 1 < len(ws): out.append(ws[i] + " " + ws[i+1]); i += 2
        else: out.append(ws[i]); i += 1
    return out
tokens = []
for p in ALIGN:
    for w in p["w"]: tokens.append({"n": norm(w["t"]), "s": w["s"], "e": w["e"]})
def find(anchor, start_idx):
    a = [norm(x) for x in merge(anchor.split())]
    for i in range(start_idx, len(tokens) - len(a) + 1):
        if all(tokens[i + k]["n"] == a[k] for k in range(len(a))): return i
    raise SystemExit("ANCHOR NOT FOUND: %r after token %d (%r)" % (anchor, start_idx, " ".join(t["n"] for t in tokens[start_idx:start_idx+6])))

scenes = []; cursor = 0
for (typ, anc, par, evs) in SPEC:
    if not scenes: i0 = find(anc, 0)
    else: i0 = find(anc, cursor)
    t0 = 0.0 if not scenes else round(tokens[i0]["s"] - 0.02, 3)
    ev = {}; ec = i0
    for k, v in evs.items():
        if isinstance(v, (int, float)): ev[k] = round(t0 + v, 3)
        else:
            j = find(v, ec); ev[k] = round(tokens[j]["s"], 3); ec = j
    scenes.append({"type": typ, "t0": t0, "p": par, "ev": ev, "a": i0})
    cursor = i0 + 1
for i, s in enumerate(scenes): s["t1"] = scenes[i+1]["t0"] if i + 1 < len(scenes) else TOTAL
for s in scenes: s.pop("a")
# report
print("scenes", len(scenes))
for i, s in enumerate(scenes): print(i, s["type"], s["t0"], round(s["t1"] - s["t0"], 1))

os.makedirs(os.path.join(PROJ, "assets"), exist_ok=True)
open(os.path.join(PROJ, "assets", "data.js"), "w").write("const PH = " + json.dumps(ALIGN, ensure_ascii=False) + ";\nconst SC = " + json.dumps(scenes, ensure_ascii=False) + ";\n")
for f in ("core.js", "scenes.js"): shutil.copy(os.path.join(BASE, f), os.path.join(PROJ, "assets", f))

# SFX list
sfx = []
for i in range(1, len(scenes)): sfx.append(("whoosh", round(scenes[i]["t0"] - 0.3, 2), 0.45, 0.5))
for s in scenes:
    if "dx" in s["ev"]: sfx.append(("chime", round(s["ev"]["dx"] + 0.05, 2), 0.5, 0.55))
    if s["type"] == "cta":
        for k in ("like", "sub", "bell"):
            if k in s["ev"]: sfx.append(("pop", round(s["ev"][k] + 0.1, 2), 0.25, 0.7))
    if s["type"] == "hook": sfx.append(("pop", round(s["ev"]["steps"] + 0.2, 2), 0.25, 0.7))
sfx = sorted(set(sfx), key=lambda x: (x[1], x[0]))
uniq=[]; seen=set()
for x in sfx:
    if (x[0], round(x[1],1)) in seen: continue
    seen.add((x[0], round(x[1],1))); uniq.append(x)
sfx = uniq
audio = ['<audio id="vo" src="assets/vo.wav" data-start="0" data-duration="780" data-track-index="0" data-volume="1"></audio>',
         '<audio id="music" src="assets/music.mp3" data-start="0" data-duration="780" data-track-index="1" data-volume="0.55"></audio>']
for i, (n, t, d, v) in enumerate(sfx):
    audio.append('<audio id="sfx%d" src="assets/%s.wav" data-start="%s" data-duration="%s" data-track-index="%d" data-volume="%s"></audio>' % (i, n, t, d, 2 + i % 3, v))

ICONS = {
 "coin": '<circle cx="12" cy="12" r="9"/><path d="M14.5 9c-.4-1-1.3-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.1-.5-2.5-1.5M12 6v1.5M12 16.5V18"/>',
 "clipboard": '<path d="M9 4h6v3H9zM7 5.5H5.5V21h13V5.5H17M9 12h6M9 16h6"/>',
 "syringe": '<path d="M18 3l3 3M16 5l3 3M13 8l3 3-7 7-3-3 7-7zM9 16l-5 5M7 18l-3-3"/>',
 "drop": '<path d="M12 3c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z"/>',
 "lung": '<path d="M10 4v9c0 3-2 5-4 5-2 0-3-1-3-3 0-4 2-8 5-11 1-1 2-.5 2 .5zM14 4v9c0 3 2 5 4 5 2 0 3-1 3-3 0-4-2-8-5-11-1-1-2-.5-2 .5z"/>',
 "kidney": '<path d="M15 4c3 0 5 3 5 7s-2 9-6 9c-2 0-3-1-3-2.5S12 15 12 13s-1-3-1-5 1-4 4-4zM9 8c-3 0-5 2-5 5"/>',
 "hand": '<path d="M8 12V6.5a1.5 1.5 0 013 0V11V4.5a1.5 1.5 0 013 0V11V6a1.5 1.5 0 013 0v9c0 4-3 6-6 6s-5-2-6-5l-2-4a1.5 1.5 0 012.5-1z"/>',
 "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "pill": '<path d="M10.5 4.5l9 9a4 4 0 01-5.7 5.7l-9-9a4 4 0 015.7-5.7zM8 11l5 5"/>',
 "x": '<path d="M6 6l12 12M18 6L6 18"/>',
 "check": '<path d="M5 12l5 5 9-10"/>',
 "heartpulse": '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
 "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
 "wind": '<path d="M3 8h11a3 3 0 10-3-3M3 12h15a3 3 0 11-3 3M3 16h8"/>',
 "gauge": '<path d="M4 16a8 8 0 1116 0M12 16l4-5"/>',
 "alert": '<path d="M12 3l10 18H2L12 3zM12 10v5M12 18h.01"/>',
 "thumb": '<path d="M7 11v9H4v-9h3zM7 11l4-7c1.5 0 2.5 1 2.5 2.5V10h5a2 2 0 012 2.3l-1 6A2 2 0 0116.5 20H7"/>',
 "bell": '<path d="M6 17h12l-2-3v-4a4 4 0 00-8 0v4l-2 3zM10 20a2 2 0 004 0"/>',
 "comment": '<path d="M4 5h16v11H9l-5 4V5z"/>',
 "link": '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
 "doctor": '<circle cx="12" cy="7" r="4"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6M12 15v6M9.5 18h5"/>',
 "arrowupdown": '<path d="M8 20V5M4 9l4-4 4 4M16 4v15M12 15l4 4 4-4"/>',
 "search": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 "scale": '<path d="M12 4v16M6 20h12M5 8h14M5 8l-3 7a3 3 0 006 0zM19 8l-3 7a3 3 0 006 0z"/>',
 "balance": '<path d="M12 4v16M6 20h12M5 8h14"/><circle cx="6" cy="14" r="3"/><circle cx="18" cy="14" r="3"/>',
}
sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + "".join('<symbol id="i-%s" viewBox="0 0 24 24">%s</symbol>' % (k, v) for k, v in ICONS.items()) + "</svg>"
wipe_lines = ""
import math
for k in range(12):
    a = k * 30 * math.pi / 180; r1 = 20; r2 = 46 if k % 2 else 38
    wipe_lines += '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (50 + math.cos(a) * r1, 50 + math.sin(a) * r1, 50 + math.cos(a) * r2, 50 + math.sin(a) * r2)
css = open(os.path.join(BASE, "style.css")).read()
html = """<!doctype html>
<html lang="ar" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1280, height=720" />
    <title>ABG 3-Step Method</title>
    <script src="assets/gsap.min.js"></script>
    <style>
%s
    </style>
  </head>
  <body>
    %s
    <div id="root" data-composition-id="main" data-start="0" data-duration="780" data-width="1280" data-height="720" data-fps="30">
      <div class="bgdots"></div><div class="vig"></div>
      <div id="caps"></div>
      <div id="flash"></div>
      <div id="wipe"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="22" stroke="none"/>%s</svg></div>
      <div class="blk" id="blk0" style="left:0"></div><div class="blk" id="blk1" style="left:320px"></div><div class="blk" id="blk2" style="left:640px"></div><div class="blk" id="blk3" style="left:950px"></div>
      %s
    </div>
    <script src="assets/data.js"></script>
    <script src="assets/core.js"></script>
    <script src="assets/scenes.js"></script>
    <script>
      buildScenes(); buildTransitions();
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""" % (css, sprite, wipe_lines, "\n      ".join(audio))
open(os.path.join(PROJ, "index.html"), "w").write(html)
print("sfx", len(sfx))
json.dump(scenes, open(os.path.join(BASE, "scenes.json"), "w"), ensure_ascii=False)
