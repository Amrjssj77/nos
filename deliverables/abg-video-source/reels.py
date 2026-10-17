# -*- coding: utf-8 -*-
import json, os, shutil, subprocess, math, sys
BASE = os.path.dirname(os.path.abspath(__file__))
ROOTD = os.path.join(BASE, "reels")
ALIGN = json.load(open(os.path.join(BASE, "align.json")))
SCENES = json.load(open(os.path.join(BASE, "scenes.json")))
VO = os.path.join(BASE, "..", "vo_final.wav")
GSAP = os.path.join(BASE, "proj", "abg", "assets", "gsap.min.js")
FONTS = os.path.join(BASE, "proj", "abg", "assets", "fonts")
ICONS_SRC = open(os.path.join(BASE, "build.py")).read()

DIAC = __import__("re").compile(r'[\u064B-\u0652\u0670]'); PUNCT = __import__("re").compile(r'[،.؟?:!]')
def _norm(t): return PUNCT.sub("", DIAC.sub("", t))
def _merge(ws):
    out = []; i = 0
    while i < len(ws):
        if ws[i] == "الـ" and i + 1 < len(ws): out.append(ws[i] + " " + ws[i+1]); i += 2
        else: out.append(ws[i]); i += 1
    return out
TOK = [{"n": _norm(w["t"]), "s": w["s"], "e": w["e"]} for p in ALIGN for w in p["w"]]
def _find(anchor, start=0):
    a = [_norm(x) for x in _merge(anchor.split())]
    for i in range(start, len(TOK) - len(a) + 1):
        if all(TOK[i + k]["n"] == a[k] for k in range(len(a))): return i, i + len(a) - 1
    raise SystemExit("anchor not found: " + anchor)
def SEG(a_anchor, b_anchor, after=0.0):
    i0 = next(i for i, t in enumerate(TOK) if t["s"] >= after)
    ia, _ = _find(a_anchor, i0); _, ib = _find(b_anchor, ia)
    a = TOK[ia]["s"] - 0.1; b = TOK[ib]["e"] + 0.1
    if ia > 0: a = max(a, (TOK[ia-1]["e"] + TOK[ia]["s"]) / 2)
    if ib + 1 < len(TOK): b = min(b, (TOK[ib]["e"] + TOK[ib+1]["s"]) / 2)
    return (round(max(a, 0.0), 3), round(b, 3))
_s_hook = SEG("لو بتبص", "تلات خطوات بس")
_s_steps = SEG("تعالى نشوف الطريقة", "اتجاه سبب تعويض", after=140)
_s_pat = SEG("المريض راجل", "مرهق ونعسان")
_s_case = SEG("الدكتور طلب ABG", "بتعويض جزئي", after=_s_pat[1])
_s_c5 = SEG("الحالة الخامسة", "fully compensated")
REELS = [
 {"name": "reel1", "segs": [_s_hook, _s_steps],
  "hook": ["الـ ABG مش لغز!", "3 خطوات بس تفسّر أي نتيجة"], "hl": 0, "override": {"rome": {"rome": 0.6}}},
 {"name": "reel2", "segs": [_s_pat, _s_case],
  "hook": ["مريض <bdi dir=\"ltr\">COPD</bdi>", "<bdi dir=\"ltr\">pH = 7.32</bdi>", "تشخّصه إزاي؟"], "hl": 2,
  "override": {"patient": {"rr": 1.8, "hr": 3.0, "bp": 4.2, "spo2": 5.4}}},
 {"name": "reel3", "segs": [_s_c5],
  "hook": ["الـ <bdi dir=\"ltr\">pH</bdi> طبيعي؟", "يعني المريض سليم؟", "لأ! والسبب غريب"], "hl": 2},
]
HOOK_T = 2.7

def run(cmd): subprocess.run(cmd, check=True)

# icon sprite + wipe from build.py (re-exec the ICONS dict)
ns = {}
src = ICONS_SRC[ICONS_SRC.index("ICONS = {"):ICONS_SRC.index("sprite =")]
exec(src, ns)
sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + "".join('<symbol id="i-%s" viewBox="0 0 24 24">%s</symbol>' % (k, v) for k, v in ns["ICONS"].items()) + "</svg>"
wipe_lines = ""
for k in range(12):
    a = k * 30 * math.pi / 180; r1 = 20; r2 = 46 if k % 2 else 38
    wipe_lines += '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (50 + math.cos(a) * r1, 50 + math.sin(a) * r1, 50 + math.cos(a) * r2, 50 + math.sin(a) * r2)
CSS = open(os.path.join(BASE, "style.css")).read()
PT_CSS = """
      html, body { width: 1080px; height: 1920px; }
      #caps { left: 50px; right: 50px; top: 1215px; height: 430px; }
      .w { font-size: 82px; line-height: 1.32; }
      .chunk { gap: 0 20px; }
      .vis { top: 40px; height: 1100px; }
      .blk { width: 270px; height: 1920px; transform: translateY(-1920px); }
      #wipe { top: 28%; }
      #hookcard { position: absolute; left: 0; top: 0; width: 1080px; height: 1150px; background: var(--bg); z-index: 70; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; direction: rtl; }
      #hookcard .hl { font-size: 118px; font-weight: 900; line-height: 1.15; text-align: center; padding: 0 50px; opacity: 0; }
      #hookcard .hl.c { color: var(--coral); }
      #hookcard .hb { position: absolute; left: 50%; top: 50%; width: 1300px; height: 1300px; margin: -650px 0 0 -650px; opacity: .22; }
"""

def build_reel(R):
    d = os.path.join(ROOTD, R["name"]); shutil.rmtree(d, ignore_errors=True); os.makedirs(os.path.join(d, "assets", "fonts"))
    for f in os.listdir(FONTS): shutil.copy(os.path.join(FONTS, f), os.path.join(d, "assets", "fonts", f))
    shutil.copy(GSAP, os.path.join(d, "assets", "gsap.min.js"))
    for f in ("core.js", "scenes.js", "scenes_pt.js"): shutil.copy(os.path.join(BASE, f), os.path.join(d, "assets", f))
    # segment offsets
    offs = []; acc = 0.0
    for (a, b) in R["segs"]: offs.append(acc); acc += b - a
    D = round(acc, 3)
    def mapt(t, k):
        a, b = R["segs"][k]; return round(offs[k] + (t - a), 3)
    # phrases
    PH = []
    for p in ALIGN:
        for k, (a, b) in enumerate(R["segs"]):
            if p["s"] >= a - 0.25 and p["e"] <= b + 0.3:
                PH.append({"s": mapt(p["s"], k), "e": mapt(p["e"], k), "end": p.get("end", True), "w": [{"t": w["t"], "s": mapt(w["s"], k), "e": mapt(w["e"], k)} for w in p["w"]]}); break
    # scenes
    SC = []
    for s in SCENES:
        for k, (a, b) in enumerate(R["segs"]):
            if s["t1"] > a + 0.3 and s["t0"] < b - 0.3:
                t0 = max(s["t0"], a); t1 = min(s["t1"], b)
                ev = {}
                for n, v in s["ev"].items():
                    if v < t0: v = t0 + 0.3
                    ev[n] = mapt(v, k)
                ov = (R.get("override") or {}).get(s["type"])
                if ov:
                    for n, v in ov.items(): ev[n] = round(mapt(t0, k) + v, 3)
                SC.append({"type": s["type"], "t0": mapt(t0, k), "t1": mapt(t1, k), "p": s["p"], "ev": ev})
                break
    # first scene starts at 0
    SC[0]["t0"] = 0.0
    SC[-1]["t1"] = D
    reel = {"portrait": True, "hook": R["hook"], "hl": R["hl"], "dur": D}
    open(os.path.join(d, "assets", "data.js"), "w").write("const REEL = " + json.dumps(reel, ensure_ascii=False) + ";\nconst PH = " + json.dumps(PH, ensure_ascii=False) + ";\nconst SC = " + json.dumps(SC, ensure_ascii=False) + ";\n")
    # audio: concat VO segments
    parts = []; filt = ""
    for k, (a, b) in enumerate(R["segs"]):
        filt += "[0]atrim=%s:%s,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=%s:d=0.03[a%d];" % (a, b, round(b - a - 0.03, 3), k)
        parts.append("[a%d]" % k)
    filt += "".join(parts) + "concat=n=%d:v=0:a=1,apad=pad_dur=1[o]" % len(parts)
    run(["ffmpeg", "-v", "error", "-y", "-i", VO, "-filter_complex", filt, "-map", "[o]", "-ar", "24000", "-ac", "1", os.path.join(d, "assets", "vo.wav")])
    # music + sfx
    A = os.path.join(d, "assets")
    run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=110:d=%s" % (D + 3), "-f", "lavfi", "-i", "sine=f=164.81:d=%s" % (D + 3), "-f", "lavfi", "-i", "sine=f=220:d=%s" % (D + 3), "-f", "lavfi", "-i", "sine=f=277.18:d=%s" % (D + 3),
         "-filter_complex", "[0]volume=0.5[a];[1]volume=0.25[b];[2]volume=0.2,tremolo=f=0.2:d=0.5[c];[3]volume=0.12,tremolo=f=0.13:d=0.6[d];[a][b][c][d]amix=inputs=4:normalize=0,lowpass=f=900,volume=0.5,afade=t=in:d=1.5,afade=t=out:st=%s:d=2,atrim=0:%s,aformat=channel_layouts=stereo[m]" % (round(D - 2, 2), round(D + 0.9, 2)),
         "-map", "[m]", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "96k", os.path.join(A, "music.mp3")])
    for n in ("whoosh", "pop", "chime"): shutil.copy(os.path.join(BASE, "proj", "abg", "assets", n + ".wav"), A)
    sfx = [("whoosh", round(SC[i]["t0"] - 0.3, 2), 0.45, 0.5) for i in range(1, len(SC)) if SC[i]["t0"] - 0.3 > 0.1]
    for s in SC:
        if "dx" in s["ev"]: sfx.append(("chime", round(s["ev"]["dx"] + 0.05, 2), 0.5, 0.55))
    sfx.append(("whoosh", 0.05, 0.45, 0.6))
    seen = set(); sfx2 = []
    for x in sorted(sfx, key=lambda x: (x[1], x[0])):
        if (x[0], round(x[1], 1)) in seen: continue
        seen.add((x[0], round(x[1], 1))); sfx2.append(x)
    audio = ['<audio id="vo" src="assets/vo.wav" data-start="0" data-duration="%s" data-track-index="0" data-volume="1"></audio>' % (D + 0.9),
             '<audio id="music" src="assets/music.mp3" data-start="0" data-duration="%s" data-track-index="1" data-volume="0.55"></audio>' % (D + 0.9)]
    for i, (n, t, du, v) in enumerate(sfx2):
        audio.append('<audio id="sfx%d" src="assets/%s.wav" data-start="%s" data-duration="%s" data-track-index="%d" data-volume="%s"></audio>' % (i, n, t, 0.45 if n == "whoosh" else 0.5, 2 + i % 3, v))
    hook_html = "".join('<div class="hl%s" id="hl%d">%s</div>' % (" c" if i == R["hl"] else "", i, t) for i, t in enumerate(R["hook"]))
    html = """<!doctype html>
<html lang="ar" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>%s</title>
    <script src="assets/gsap.min.js"></script>
    <style>
%s
%s
    </style>
  </head>
  <body>
    %s
    <div id="root" class="pt" data-composition-id="main" data-start="0" data-duration="%s" data-width="1080" data-height="1920" data-fps="30">
      <div class="bgdots"></div><div class="vig"></div>
      <div id="caps"></div>
      <div id="hookcard"><svg class="hb burst" viewBox="0 0 100 100">%s</svg>%s</div>
      <div id="flash"></div>
      <div id="wipe"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="22" stroke="none"/>%s</svg></div>
      <div class="blk" id="blk0" style="left:0"></div><div class="blk" id="blk1" style="left:270px"></div><div class="blk" id="blk2" style="left:540px"></div><div class="blk" id="blk3" style="left:810px"></div>
      %s
    </div>
    <script src="assets/data.js"></script>
    <script src="assets/core.js"></script>
    <script src="assets/scenes.js"></script>
    <script src="assets/scenes_pt.js"></script>
    <script>
      buildScenes(); buildTransitions();
      // hook card: big kinetic text over the first seconds, then reveals the scene
      REEL.hook.forEach((t, i) => tl.fromTo("#hl" + i, { opacity: 0, y: 60, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, 0.12 + i * 0.5));
      tl.fromTo("#hookcard .hb", { rotation: -40, scale: 0.6 }, { rotation: 60, scale: 1, duration: %s, ease: "none" }, 0);
      tl.to("#hookcard", { opacity: 0, duration: 0.4, ease: "power1.in" }, %s);
      tl.set("#hookcard", { display: "none" }, %s);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""" % (R["name"], CSS, PT_CSS, sprite, round(D + 0.9, 2), "".join(l for l in __import__("re").findall(r"<line[^>]*/>", wipe_lines)), hook_html, wipe_lines, "\n      ".join(audio), HOOK_T + 0.4, HOOK_T, HOOK_T + 0.45)
    open(os.path.join(d, "index.html"), "w").write(html)
    for f in ("hyperframes.json", "meta.json", "package.json"):
        src = os.path.join(BASE, "proj", "abg", f)
        if os.path.exists(src): shutil.copy(src, d)
    print(R["name"], "dur", D, "scenes", len(SC), "phrases", len(PH), "sfx", len(sfx2))
    for s in SC: print("  ", s["type"], s["t0"], round(s["t1"] - s["t0"], 1))

if __name__ == "__main__":
    which = sys.argv[1:] or [r["name"] for r in REELS]
    for R in REELS:
        if R["name"] in which: build_reel(R)
