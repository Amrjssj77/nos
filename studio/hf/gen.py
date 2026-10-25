#!/usr/bin/env python3
"""Generates a HyperFrames project (portrait 1080x1920) for one explainer.
usage: gen.py <project_dir> <timeline.js> <voice.wav>
timeline.js comes from studio/explainer/build_timeline.py (beats + speech timing + voice envelope)."""
import json, os, re, shutil, sys

PROJ, TLJS, WAV = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__)); EXP = os.path.join(HERE, "..", "explainer")

raw = open(TLJS).read()
def grab(name): return json.loads(re.search(r"window\.%s=(.*?);window\." % name, raw + ";window.x", re.S).group(1).strip().rstrip(";"))
DUR = float(re.search(r"window\.DURATION=([\d.]+)", raw).group(1))
TL = grab("TIMELINE"); ENV = grab("ENV"); SECS = grab("SECS") or ["hook", "the problem", "the fix", "next step"]
NAME = os.path.basename(os.path.abspath(PROJ))

os.makedirs(PROJ + "/compositions", exist_ok=True); os.makedirs(PROJ + "/assets/fonts", exist_ok=True)
for f in os.listdir(EXP + "/fonts"): shutil.copy(EXP + "/fonts/" + f, PROJ + "/assets/fonts/" + f)
shutil.copy(EXP + "/gsap.min.js", PROJ + "/assets/gsap.min.js")
shutil.copy(WAV, PROJ + "/assets/voice.wav")
os.system(f"python3 {HERE}/sfx.py {TLJS} {PROJ}/assets/sfx.wav")

engine = open(EXP + "/engine.js").read()
illus = open(EXP + "/illustrations.js").read().replace("gsap.timeline()", "mkT()")
css = open(EXP + "/style.css").read().replace("url(fonts/", "url(assets/fonts/")
css = re.sub(r"html,body \{[^}]*\}", "", css)
css = css.replace("#stage { position:relative;", "#stage-unused { position:relative;")

icon = re.search(r"const ICON = \{.*?\n\};", engine, re.S).group(0)
ic_line = re.search(r"const ic = .*?\n.*?\n", engine).group(0)
el_line = re.search(r"const el = .*?\n", engine).group(0)
hl_line = re.search(r"const hlText = .*?\n", engine).group(0)
LIB = r"""
const mkT = () => { const tl = gsap.timeline();
  tl.from = function (target, vars, pos) {            // seek-safe: from() becomes fromTo() with the element's own end state
    const meta = ["duration", "ease", "delay", "stagger", "repeat", "yoyo", "transformOrigin", "onUpdate", "onComplete", "overwrite"];
    const fromV = {}, opts = {}; Object.keys(vars).forEach(k => (meta.includes(k) ? (opts[k] = vars[k]) : (fromV[k] = vars[k])));
    const st = typeof opts.stagger === "number" ? opts.stagger : 0; delete opts.stagger;
    gsap.utils.toArray(target).forEach((t, i) => { const to = {}; Object.keys(fromV).forEach(k => { to[k] = gsap.getProperty(t, k); });
      this.fromTo(t, fromV, Object.assign({}, to, opts), typeof pos === "number" ? pos + i * st : pos); });
    return this; };
  return tl; };
""" + icon + "\n" + ic_line + el_line + hl_line

FONT_ZONE = "<style>\n" + css + "\n#root { position:absolute; inset:0; background:transparent !important; }\n.sc { position:absolute; left:0; top:0; width:720px; height:1280px; transform:scale(1.5); transform-origin:0 0; }\n</style>"

def scene(sid, body_html, script, dur):
    return f"""<template>
{FONT_ZONE}
<div id="root" data-composition-id="{sid}" data-width="1080" data-height="1920">
{body_html}
</div>
<script>
(function () {{
{script}
}})();
</script>
</template>
"""

# ---------------- illustration scenes ----------------
hosts = []
for i, b in enumerate(TL):
    sid = f"s{i+1:02d}"; d = round(b["end"] - b["start"], 3)
    body = f'<div class="sc"><div class="ill" id="{sid}-ill"></div></div>'
    script = LIB + illus + f"""
Object.assign(ICON, window.ICONX);
const inner = window.ILLX["{b['ill']}"](document.getElementById("{sid}-ill"), "{b['theme']}");
const tl = gsap.timeline({{ paused: true }}); tl.add(inner, 0.15);
window.__timelines["{sid}"] = tl;
"""
    open(f"{PROJ}/compositions/{sid}.html", "w").write(scene(sid, body, script, d))
    hosts.append(f'<div id="{sid}" class="clip" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{b["start"]}" data-duration="{d}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920"></div>')

# ---------------- background + HUD ----------------
beats_js = json.dumps([{"s": b["start"], "e": b["end"], "t": b["theme"], "sec": b["sec"]} for b in TL])
bg_body = """<div class="sc"><div class="bg" id="bgL"></div><div class="bg" id="bgD"></div>
<div class="hud" id="hudL" data-layout-ignore><span style="opacity:.55" id="hudSEC">SEC</span> <span id="hudNums"></span></div><div class="hud" id="hudR" data-layout-ignore></div></div>"""
bg_script = f"""
const BEATS = {beats_js}, SECS = {json.dumps(SECS)}, D = {DUR};
const g = id => document.getElementById(id);
const tl = gsap.timeline({{ paused: true }});
const bgD = g("bgD"), hudL = g("hudL"), hudR = g("hudR"), nums = g("hudNums"), sec = g("hudSEC");
tl.set(bgD, {{ opacity: BEATS[0].t === "dark" ? 1 : 0 }}, 0);
BEATS.forEach((b, i) => {{ if (i) {{ const p = BEATS[i - 1]; if (p.t !== b.t) tl.fromTo(bgD, {{ opacity: p.t === "dark" ? 1 : 0 }}, {{ opacity: b.t === "dark" ? 1 : 0, duration: .3, ease: "none" }}, b.s); }}
  const fg = b.t === "dark" ? "#e9e7de" : "#17150f", ac = b.t === "dark" ? "#c6f03a" : "#e8452c";
  const lab = document.createElement("span"); lab.textContent = "// 0" + (SECS.indexOf(b.sec) + 1 || 1) + " — " + b.sec; lab.style.cssText = "position:absolute;right:0;top:0;white-space:nowrap;visibility:hidden;color:" + fg; hudR.appendChild(lab);
  tl.set(lab, {{ visibility: "visible" }}, b.s); tl.set(lab, {{ visibility: "hidden" }}, b.e);
  tl.set(sec, {{ color: fg }}, b.s); tl.set(nums, {{ color: ac }}, b.s); }});
for (let n = 0; n <= 30; n++) {{ const s = document.createElement("b"); s.textContent = String(n).padStart(2, "0") + "/30"; s.style.cssText = "position:absolute;left:44px;top:0;visibility:hidden;font-weight:700"; nums.appendChild(s);
  const a = n === 0 ? 0 : (n - .5) / 30 * D, e = n === 30 ? D : (n + .5) / 30 * D; tl.set(s, {{ visibility: "visible" }}, a); tl.set(s, {{ visibility: "hidden" }}, e); }}
hudL.style.width = "120px"; hudR.style.width = "260px"; hudR.style.height = "20px"; hudR.style.textAlign = "right";
window.__timelines["bg"] = tl;
"""
open(f"{PROJ}/compositions/bg.html", "w").write(scene("bg", bg_body, bg_script, DUR).replace("#hudR { right:36px; opacity:.7; }", "#hudR { right:36px; opacity:.7; }"))

# ---------------- captions (headlines) ----------------
chunks = []
for b in TL:
    for c in b["chunks"]: chunks.append({"s": c["start"], "e": c["end"], "t": b["theme"], "h": c["show"]})
caps_body = '<div class="sc" id="capsWrap"></div>'
caps_script = r"""
const C = __CHUNKS__;
""".replace("__CHUNKS__", json.dumps(chunks, ensure_ascii=False)) + LIB + r"""
const wrap = document.getElementById("capsWrap");
const tl = gsap.timeline({ paused: true });
C.forEach((c, i) => {
  const h = document.createElement("div"); h.className = "heads " + c.t; h.id = "cap" + i;
  h.style.cssText = "position:absolute;top:112px;left:40px;right:40px;height:190px;visibility:hidden";
  h.innerHTML = '<div class="head" style="display:block">' + hlText(c.h) + '</div>'; wrap.appendChild(h);
  const hl = h.querySelectorAll(".hl"), end = c.e, st = c.s;
  tl.set(h, { visibility: "visible" }, st);
  tl.fromTo(h.firstChild, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: "power3.out" }, st);
  if (hl.length) tl.fromTo(hl, { scale: .75 }, { scale: 1, duration: .45, ease: "back.out(2.6)" }, st + .12);
  tl.to(h.firstChild, { opacity: 0, duration: .12, ease: "power2.in" }, end - .12);
  tl.set(h, { opacity: 0, visibility: "hidden" }, end);
});
window.__timelines["caps"] = tl;
"""
open(f"{PROJ}/compositions/caps.html", "w").write(scene("caps", caps_body, caps_script, DUR))

# ---------------- presenter (cartoon character, voice-driven) ----------------
char_src = engine[engine.index("/* ---------- cartoon presenter"):engine.index("const A = {")]
char_src = char_src.replace('document.getElementById("pres").innerHTML', 'document.getElementById("pres").innerHTML')
pose_src = re.search(r"const POSE = \{.*?\]\s*\};", engine, re.S).group(0)
char_script = f"""
const TLB = {json.dumps([{"s": b["start"], "e": b["end"], "ill": b["ill"], "t": b["theme"], "c": [c["start"] for c in b["chunks"]]} for b in TL])};
const ENV = {json.dumps(ENV)}, FPS = 30, D = {DUR};
""" + LIB + r"""
const $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k, io = k => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
""" + char_src + pose_src + r"""
Object.assign(ICON, {}); Object.assign(POSE, __POSEX__);
const IDLE = ["idle", 8, -18];
const poseOf = (bi, k) => { const p = (POSE[TLB[bi].ill] || [["idle"], ["idle"]])[k]; return p[0] === "idle" ? IDLE : p; };
const arms = { L: { g: $("aL"), j: $("aLj"), f: $("aLf"), h: $("aLh") }, R: { g: $("aR"), j: $("aRj"), f: $("aRf"), h: $("aRh") } };
const glowL = $("glowL"), glowD = $("glowD"), pres = $("pres");
function mouth(o, t) {
  const w = 27 - o * 6 * (.5 + .5 * Math.sin(t * 17)), top = 259, depth = 4 + o * 32, cy = top + depth;
  const d = `M${200 - w} ${top} Q200 ${top - 5} ${200 + w} ${top} Q200 ${cy + 7} ${200 - w} ${top} Z`;
  $("mpath").setAttribute("d", d); $("mpathC").setAttribute("d", d); $("mlip").setAttribute("d", d); $("tongue").setAttribute("cy", String(cy - 4));
}
function frame(t) {
  let bi = TLB.findIndex((b, i) => t >= b.s && (i === TLB.length - 1 || t < TLB[i + 1].s)); if (bi < 0) bi = 0;
  const b = TLB[bi], prev = TLB[Math.max(0, bi - 1)], local = t - b.s;
  const dark = b.t === "dark" ? 1 : 0, pd = prev.t === "dark" ? 1 : 0, dv = bi === 0 ? dark : pd + (dark - pd) * Math.min(1, local / .3);
  glowD.style.opacity = dv; glowL.style.opacity = 1 - dv;
  const e = ENV[Math.min(ENV.length - 1, Math.round(t * FPS))] || 0;
  gsap.set(pres, { y: Math.sin(t * 1.6) * 3 - e * 4, scale: 1 + e * .01 }); gsap.set([glowL, glowD], { scale: 1 + e * .08 });
  mouth(Math.min(1, e * 1.25), t);
  let st = b.s; b.c.forEach(c => { if (c <= t) st = c; });
  $("brows").setAttribute("transform", `translate(0 ${-7 * Math.max(0, 1 - (t - st) / .5) - e * 2})`);
  const ph = t % 3.4, blink = ph < .14 ? Math.max(.08, Math.abs(ph - .07) / .07) : 1;
  $("eyes").setAttribute("transform", `translate(0 ${183 * (1 - blink)}) scale(1 ${blink})`);
  $("pL").setAttribute("cx", 167 + Math.sin(t * .7) * 3); $("pR").setAttribute("cx", 233 + Math.sin(t * .7) * 3);
  gsap.set($("headin"), { svgOrigin: "200 320", rotation: Math.sin(t * 1.3) * 2.2 + Math.sin(t * 5.1) * e * 1.8, y: -e * 5, x: Math.sin(t * .9) * 3 });
  ["L", "R"].forEach((k, i) => {
    const cur = poseOf(bi, i), pre = bi > 0 ? poseOf(bi - 1, i) : IDLE, kk = io(clamp((t - (b.s + .05)) / .55));
    const u = lerp(pre[1], cur[1], kk), f = lerp(pre[2], cur[2], kk), hand = cur[0], ar = arms[k];
    const wob = u > 40 ? Math.sin(t * 3 + (i ? 1.7 : 0)) * 3.5 * (.5 + e) : Math.sin(t * 1.2 + i) * 1.5;
    gsap.set(ar.g, { svgOrigin: "0 0", rotation: -u }); gsap.set(ar.f, { svgOrigin: "0 0", rotation: -f }); gsap.set(ar.j, { rotation: wob });
    ar.h.querySelector(".h-open").style.display = hand === "open" || hand === "idle" ? "" : "none";
    ar.h.querySelector(".h-point").style.display = hand === "point" ? "" : "none";
    ar.h.querySelector(".h-fist").style.display = hand === "fist" ? "" : "none";
  });
}
const tl = gsap.timeline({ paused: true }), px = { t: 0 };
tl.to(px, { t: D, duration: D, ease: "none", onUpdate() { frame(px.t); } }, 0);
frame(0);
window.__timelines["char"] = tl;
""".replace("__POSEX__", re.search(r"window\.POSEX = (\{.*?\n\});", open(EXP + "/illustrations.js").read(), re.S).group(1))
char_body = '<div class="sc"><div id="glowL" class="glow" style="background:radial-gradient(circle,rgba(232,69,44,.35),rgba(232,69,44,0) 68%)"></div><div id="glowD" class="glow" style="background:radial-gradient(circle,rgba(198,240,58,.55),rgba(198,240,58,0) 68%);opacity:0"></div><div id="pres"></div></div>'
char_html = scene("char", char_body, char_script, DUR).replace("</style>", ".glow{position:absolute;left:145px;bottom:70px;width:430px;height:430px;border-radius:50%;filter:blur(46px)}\n</style>")
open(f"{PROJ}/compositions/char.html", "w").write(char_html)

# ---------------- root ----------------
head = f"""<!doctype html>
<html lang="ar" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #000; }}
      #bg {{ z-index: 0; }} #caps {{ z-index: 4; }} #char {{ z-index: 3; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
      <audio id="vo" class="clip" src="assets/voice.wav" data-start="0" data-duration="{DUR}" data-track-index="9" data-volume="1"></audio>
      <audio id="sfx" class="clip" src="assets/sfx.wav" data-start="0" data-duration="{DUR}" data-track-index="8" data-volume="0.4"></audio>
      <div id="bg" class="clip" data-composition-id="bg" data-composition-src="compositions/bg.html" data-start="0" data-duration="{DUR}" data-track-index="0" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
      {chr(10).join('      ' + h for h in hosts)}
      <div id="char" class="clip" data-composition-id="char" data-composition-src="compositions/char.html" data-start="0" data-duration="{DUR}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
      <div id="caps" class="clip" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{DUR}" data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920"></div>
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
"""
open(PROJ + "/index.html", "w").write(head)
print("generated", PROJ, "scenes:", len(TL), "dur", DUR)
