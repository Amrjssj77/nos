# -*- coding: utf-8 -*-
import json, re, os, sys, shutil, math, subprocess
BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
from spec_om import SPEC
ABG = os.path.join(BASE, "..", "abg", "build")
PROJ = os.path.join(BASE, "proj", "omarchy")
TOTAL = 498.0
CLIPLEN = {"desk1": 170, "desk2": 150, "slides": 115, "fw": 70, "wall": 30}

ALIGN = json.load(open(os.path.join(BASE, "align.json")))
_prev = 0.0
for p in ALIGN:
    for w in p["w"]:
        w["s"] = round(max(w["s"], _prev), 3); w["e"] = round(max(w["e"], w["s"] + 0.06), 3); _prev = w["s"]
DIAC = re.compile(r'[ً-ْٰ]'); PUNCT = re.compile(r'[،.؟?:!«»()]')
def norm(t): return PUNCT.sub("", DIAC.sub("", t))
def merge(ws):
    out = []; i = 0
    while i < len(ws):
        if ws[i] == "الـ" and i + 1 < len(ws): out.append(ws[i] + " " + ws[i+1]); i += 2
        else: out.append(ws[i]); i += 1
    return out
tokens = [{"n": norm(w["t"]), "s": w["s"], "e": w["e"]} for p in ALIGN for w in p["w"]]
def find(anchor, start):
    a = [norm(x) for x in merge(anchor.split())]
    for i in range(start, len(tokens) - len(a) + 1):
        if all(tokens[i + k]["n"] == a[k] for k in range(len(a))): return i
    raise SystemExit("ANCHOR NOT FOUND: %r after %d (%r)" % (anchor, start, " ".join(t["n"] for t in tokens[start:start+6])))

scenes = []; cursor = 0
for sp in SPEC:
    i0 = find(sp["anchor"], cursor)
    t0 = 0.0 if not scenes else round(tokens[i0]["s"] - 0.02, 3)
    ev = {}; ec = i0
    for k, v in sp["ev"].items():
        if isinstance(v, (int, float)): ev[k] = round(t0 + v, 3)
        else:
            j = find(v, ec); ev[k] = round(tokens[j]["s"], 3); ec = j
    scenes.append({"type": sp["type"], "t0": t0, "p": sp["p"], "ev": ev, "vid": sp["vid"]})
    cursor = i0 + 1
for i, s in enumerate(scenes): s["t1"] = scenes[i+1]["t0"] if i + 1 < len(scenes) else TOTAL
print("scenes", len(scenes))
for i, s in enumerate(scenes): print(i, s["type"], s["t0"], round(s["t1"] - s["t0"], 1), s["vid"] or "")

# project assets
A = os.path.join(PROJ, "assets"); os.makedirs(os.path.join(A, "fonts"), exist_ok=True); os.makedirs(os.path.join(A, "clips"), exist_ok=True)
FONTS = os.path.join(ABG, "proj", "abg", "assets", "fonts")
for f in os.listdir(FONTS): shutil.copy(os.path.join(FONTS, f), os.path.join(A, "fonts", f))
shutil.copy(os.path.join(ABG, "proj", "abg", "assets", "gsap.min.js"), A)
for f in os.listdir(os.path.join(BASE, "clips")):
    if f.endswith(".mp4"): shutil.copy(os.path.join(BASE, "clips", f), os.path.join(A, "clips", f))
for n in ("whoosh", "pop", "chime"): shutil.copy(os.path.join(ABG, "proj", "abg", "assets", n + ".wav"), A)
shutil.copy(os.path.join(ABG, "core.js"), A); shutil.copy(os.path.join(BASE, "scenes_om.js"), A)
shutil.copy(os.path.join(BASE, "vo.wav"), A)
clean = []
for s in scenes:
    d = dict(s); d.pop("vid"); clean.append(d)
open(os.path.join(A, "data.js"), "w").write("const PH = " + json.dumps(ALIGN, ensure_ascii=False) + ";\nconst SC = " + json.dumps(clean, ensure_ascii=False) + ";\n")
if not os.path.exists(os.path.join(A, "music.mp3")):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=110:d=503", "-f", "lavfi", "-i", "sine=f=164.81:d=503", "-f", "lavfi", "-i", "sine=f=220:d=503", "-f", "lavfi", "-i", "sine=f=277.18:d=503",
        "-filter_complex", "[0]volume=0.5[a];[1]volume=0.25[b];[2]volume=0.2,tremolo=f=0.2:d=0.5[c];[3]volume=0.12,tremolo=f=0.13:d=0.6[d];[a][b][c][d]amix=inputs=4:normalize=0,lowpass=f=900,volume=0.5,afade=t=in:d=3,afade=t=out:st=493:d=5,atrim=0:498,aformat=channel_layouts=stereo[m]",
        "-map", "[m]", "-c:a", "libmp3lame", "-b:a", "96k", os.path.join(A, "music.mp3")], check=True)

# audio + video tags
sfx = [("whoosh", round(scenes[i]["t0"] - 0.3, 2), 0.45, 0.5) for i in range(1, len(scenes))]
for s in scenes:
    if s["type"] == "cta":
        for k in ("like", "sub", "bell"):
            if k in s["ev"]: sfx.append(("pop", round(s["ev"][k] + 0.1, 2), 0.25, 0.7))
    if s["type"] == "enter": sfx.append(("pop", round(s["ev"]["enter"] + 0.05, 2), 0.25, 0.8)); sfx.append(("chime", round(s["ev"]["done"], 2), 0.5, 0.55))
seen = set(); sfx2 = []
for x in sorted(set(sfx), key=lambda x: (x[1], x[0])):
    if (x[0], round(x[1], 1)) in seen: continue
    seen.add((x[0], round(x[1], 1))); sfx2.append(x)
audio = ['<audio id="vo" src="assets/vo.wav" data-start="0" data-duration="498" data-track-index="0" data-volume="1"></audio>',
         '<audio id="music" src="assets/music.mp3" data-start="0" data-duration="498" data-track-index="1" data-volume="0.55"></audio>']
for i, (n, t, du, v) in enumerate(sfx2):
    audio.append('<audio id="sfx%d" src="assets/%s.wav" data-start="%s" data-duration="%s" data-track-index="%d" data-volume="%s"></audio>' % (i, n, t, 0.45 if n == "whoosh" else 0.5, 2 + i % 3, v))
vids = []
for i, s in enumerate(scenes):
    if not s["vid"]: continue
    clip, st = s["vid"]; ds = max(0.0, s["t0"] - 0.4); dur = round(min(s["t1"] - ds + 0.6, TOTAL - ds), 2)
    if st + dur > CLIPLEN[clip]: st = max(0, CLIPLEN[clip] - dur - 0.1)
    assert dur <= CLIPLEN[clip], (clip, dur)
    vids.append('<video id="vid%d" src="assets/clips/%s.mp4" data-start="%s" data-duration="%s" data-media-start="%s" muted playsinline></video>' % (i, clip, round(ds, 2), dur, round(st, 2)))

ICONS = {
 "clipboard": '<path d="M9 4h6v3H9zM7 5.5H5.5V21h13V5.5H17M9 12h6M9 16h6"/>',
 "laptop": '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19h20"/>',
 "monitor": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
 "lock": '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
 "code": '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 5l-4 14"/>',
 "usb": '<rect x="8" y="3" width="8" height="6" rx="1"/><rect x="6" y="9" width="12" height="12" rx="2"/><path d="M10 6h.01M14 6h.01"/>',
 "cpu": '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"/>',
 "memory": '<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v8M11 8v8M15 8v8M6 16v3M10 16v3M14 16v3M18 16v3"/>',
 "folder": '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>',
 "download": '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
 "heart": '<path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/>',
 "star": '<path d="M12 3l2.7 5.6 6.2.9-4.5 4.4 1 6.1L12 17l-5.4 3 1-6.1L3.1 9.5l6.2-.9L12 3z"/>',
 "spark": '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
 "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
 "check": '<path d="M5 12l5 5 9-10"/>',
 "x": '<path d="M6 6l12 12M18 6L6 18"/>',
 "terminal": '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9l3 3-3 3M12 16h5"/>',
 "bell": '<path d="M6 17h12l-2-3v-4a4 4 0 00-8 0v4l-2 3zM10 20a2 2 0 004 0"/>',
 "thumb": '<path d="M7 11v9H4v-9h3zM7 11l4-7c1.5 0 2.5 1 2.5 2.5V10h5a2 2 0 012 2.3l-1 6A2 2 0 0116.5 20H7"/>',
 "comment": '<path d="M4 5h16v11H9l-5 4V5z"/>',
 "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "alert": '<path d="M12 3l10 18H2L12 3zM12 10v5M12 18h.01"/>',
 "gauge": '<path d="M4 16a8 8 0 1116 0M12 16l4-5"/>',
 "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
 "sliders": '<path d="M5 4v16M12 4v16M19 4v16"/><circle cx="5" cy="9" r="2"/><circle cx="12" cy="15" r="2"/><circle cx="19" cy="8" r="2"/>',
 "rocket": '<path d="M12 3c4 2 6 6 5 11l-3 3h-4l-3-3C6 9 8 5 12 3zM9 17l-3 3M15 17l3 3M12 9h.01"/>',
 "layers": '<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/>',
 "trophy": '<path d="M8 4h8v6a4 4 0 01-8 0V4zM8 6H4a3 3 0 003 4M16 6h4a3 3 0 01-3 4M12 14v4M8 20h8"/>',
 "smile": '<circle cx="12" cy="12" r="9"/><path d="M8 14a5 5 0 008 0M9 9.5h.01M15 9.5h.01"/>',
 "chart": '<path d="M4 20V4M4 20h16M8 16l3-4 3 3 5-7"/>',
 "arrowr": '<path d="M5 12h14M13 6l6 6-6 6"/>',
 "arrowup": '<path d="M12 19V5M6 11l6-6 6 6"/>',
 "trash": '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
 "shield": '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
 "hand": '<path d="M8 12V6.5a1.5 1.5 0 013 0V11V4.5a1.5 1.5 0 013 0V11V6a1.5 1.5 0 013 0v9c0 4-3 6-6 6s-5-2-6-5l-2-4a1.5 1.5 0 012.5-1z"/>',
 "link": '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
}
sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + "".join('<symbol id="i-%s" viewBox="0 0 24 24">%s</symbol>' % (k, v) for k, v in ICONS.items()) + "</svg>"
wipe_lines = ""
for k in range(12):
    a = k * 30 * math.pi / 180; r1 = 20; r2 = 46 if k % 2 else 38
    wipe_lines += '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (50 + math.cos(a) * r1, 50 + math.sin(a) * r1, 50 + math.cos(a) * r2, 50 + math.sin(a) * r2)
css = open(os.path.join(ABG, "style.css")).read() + "\n      .card.vc { box-shadow: 0 20px 44px rgba(22,20,15,.28); }\n"
html = """<!doctype html>
<html lang="ar" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1280, height=720" />
    <title>Omarchy</title>
    <script src="assets/gsap.min.js"></script>
    <style>
%s
    </style>
  </head>
  <body>
    %s
    <div id="root" data-composition-id="main" data-start="0" data-duration="498" data-width="1280" data-height="720" data-fps="30">
      <div class="bgdots"></div><div class="vig"></div>
      <div id="caps"></div>
      <div id="flash"></div>
      <div id="wipe"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="22" stroke="none"/>%s</svg></div>
      <div class="blk" id="blk0" style="left:0"></div><div class="blk" id="blk1" style="left:320px"></div><div class="blk" id="blk2" style="left:640px"></div><div class="blk" id="blk3" style="left:950px"></div>
      %s
      %s
    </div>
    <script src="assets/data.js"></script>
    <script src="assets/core.js"></script>
    <script src="assets/scenes_om.js"></script>
    <script>
      buildScenes(); buildTransitions();
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""" % (css, sprite, wipe_lines, "\n      ".join(vids), "\n      ".join(audio))
open(os.path.join(PROJ, "index.html"), "w").write(html)
for f in ("hyperframes.json", "meta.json", "package.json"):
    src = os.path.join(ABG, "proj", "abg", f)
    if os.path.exists(src): shutil.copy(src, PROJ)
print("sfx", len(sfx2), "videos", len(vids))
