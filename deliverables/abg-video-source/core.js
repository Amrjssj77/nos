// ===== core: helpers, captions, transitions =====
const PT = typeof REEL !== "undefined" && !!REEL.portrait;
const W = PT ? 1080 : 1280, H = PT ? 1920 : 720;
const tl = gsap.timeline({ paused: true });
const ROOT = document.getElementById("root");
function mk(tag, cls, html, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
const ic = n => '<svg class="ic"><use href="#i-' + n + '"/></svg>';
const tile = (n, c, sz, st) => '<div class="tile ' + c + '" style="width:' + sz + 'px;height:' + sz + 'px;' + (st || "") + '">' + ic(n) + '</div>';
function popIn(t, tt, o) { o = o || {}; tl.fromTo(t, { opacity: 0, y: o.y == null ? 26 : o.y, scale: o.s == null ? 0.88 : o.s }, { opacity: 1, y: 0, scale: 1, duration: o.d || 0.45, ease: o.ease || "back.out(1.6)", stagger: o.st || 0 }, tt); }
function fadeIn(t, tt, d) { tl.fromTo(t, { opacity: 0 }, { opacity: 1, duration: d || 0.3, ease: "power1.out" }, tt); }
function pos(el, css) { el.style.cssText += ";" + css; return el; }
function burstSVG(cls, size) {
  let l = "";
  for (let k = 0; k < 12; k++) { const a = k * 30 * Math.PI / 180, r1 = 17, r2 = k % 2 ? 36 : 47; l += '<line x1="' + (50 + Math.cos(a) * r1).toFixed(1) + '" y1="' + (50 + Math.sin(a) * r1).toFixed(1) + '" x2="' + (50 + Math.cos(a) * r2).toFixed(1) + '" y2="' + (50 + Math.sin(a) * r2).toFixed(1) + '"/>'; }
  return '<svg class="burst ' + (cls || "") + '" viewBox="0 0 100 100" style="width:' + size + 'px;height:' + size + 'px">' + l + "</svg>";
}
// deterministic pseudo random (LCG)
function lcg(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

// ===== captions =====
const KEY_O = /^(acidosis|hypoxemia|DKA|الحموضة|حموضة|حمضي|الحمض|الأحماض|خطر|hypoxemia)$/i;
const KEY_U = /^(alkalosis|القلوية|قلوية|القلوي)$/i;
const KEY_G = /^(طبيعي|طبيعية|fully|كامل|الأكسجة)$/i;
const KEY_B = /^(تنفسي|أيضي|تعويض|الاتجاه|اتجاه|سبب|السبب|التعويض|مفيش|لايك|اشترك|ABG)$/i;
function wclass(raw) {
  const t = raw.replace(/[،.؟?:!]/g, "").replace(/^الـ\s*/, "");
  if (/compensated/i.test(t) || /^ROME$/.test(t)) return "p en";
  if (KEY_O.test(t)) return "o"; if (KEY_U.test(t)) return "u"; if (KEY_G.test(t)) return "g";
  if (/[A-Za-z]/.test(t)) return "b en"; if (/\d/.test(t)) return "b"; if (KEY_B.test(t)) return "b";
  return "";
}
const capsEl = document.getElementById("caps");
const chunks = [];
PH.forEach((p, pi) => {
  const ws = p.w, n = ws.length;
  let pieces = 1; const ch = ws.reduce((a, w) => a + w.t.length + 1, 0);
  pieces = Math.max(Math.ceil(n / (PT ? 5 : 7)), Math.ceil(ch / (PT ? 30 : 46))); const per = Math.ceil(n / pieces);
  for (let k = 0; k < n; k += per) chunks.push({ ws: ws.slice(k, k + per), pend: p.e, last: k + per >= n });
});
chunks.forEach((c, ci) => {
  const el = mk("div", "chunk", "", capsEl); el.id = "ck" + ci;
  // group consecutive pure-Latin words into one LTR span (keeps "Arterial Blood Gas" in order)
  const isLat = t => /^[A-Za-z0-9₂₃%\/\-\.]+[،.؟?:!]?$/.test(t);
  c.groups = []; let gi = 0;
  while (gi < c.ws.length) {
    let gj = gi;
    while (gj + 1 < c.ws.length && isLat(c.ws[gj].t) && isLat(c.ws[gj + 1].t) && !/[،.؟?:!]$/.test(c.ws[gj].t)) gj++;
    c.groups.push({ a: gi, b: gj }); gi = gj + 1;
  }
  c.groups.forEach((g, k) => {
    const txt = c.ws.slice(g.a, g.b + 1).map(w => w.t.replace(/[.:،]$/g, "")).join(" ");
    const s = mk("span", "w " + wclass(c.ws[g.a].t) + (g.b > g.a ? " en" : ""), txt, el); s.id = "cw" + ci + "_" + k; g.s = c.ws[g.a].s;
  });
  const a = c.ws[0].s, nx = chunks[ci + 1];
  let b = c.ws[c.ws.length - 1].e + 0.28;
  if (nx && nx.ws[0].s - b < 0.5) b = Math.max(a + 0.25, nx.ws[0].s - 0.02);
  tl.set(el, { opacity: 1 }, a);
  c.groups.forEach((g, k) => tl.fromTo("#cw" + ci + "_" + k, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, g.s));
  tl.set(el, { opacity: 0 }, b);
});

// ===== scenes =====
const B = {}; // builders registered in scenes.js
const SCENE_EL = [];
function buildScenes() {
  SC.forEach((s, i) => {
    const el = mk("div", "scene" + (i === 0 ? " first" : ""), '<div class="vis"></div>', ROOT);
    el.id = "sc" + i; SCENE_EL.push(el);
    ROOT.insertBefore(el, capsEl);
    const V = el.querySelector(".vis");
    const ev = s.ev || {};
    const E = (n, rel) => (ev[n] != null ? ev[n] : s.t0 + (rel == null ? 0.4 : rel));
    const rnd = lcg(i * 7919 + 13);
    // decorative bursts
    for (let k = 0; k < 2; k++) {
      const size = 150 + Math.floor(rnd() * 130), left = k ? W - 240 + rnd() * 140 : -40 + rnd() * 100, top = PT ? (k ? 1640 + rnd() * 120 : 20 + rnd() * 80) : (k ? 330 + rnd() * 120 : -40 + rnd() * 110);
      const holder = mk("div", "abs", burstSVG(k ? "" : "gray", size), el); el.insertBefore(holder, V); holder.style.cssText = "left:" + left.toFixed(0) + "px;top:" + top.toFixed(0) + "px;width:" + size + "px;height:" + size + "px";
      tl.fromTo(holder, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.8)" }, s.t0 + 0.1 + k * 0.15);
      tl.fromTo(holder, { rotation: k ? 0 : 20 }, { rotation: k ? 100 : -80, duration: Math.max(2, s.t1 - s.t0), ease: "none" }, s.t0);
    }
    tl.fromTo(V, { scale: 1 }, { scale: 1.035, duration: Math.max(1, s.t1 - s.t0), ease: "none" }, s.t0);
    if (!B[s.type]) throw new Error("no builder " + s.type);
    B[s.type]({ el, V, E, t0: s.t0, t1: s.t1, p: s.p || {}, idx: i, rnd });
  });
}

// ===== transitions =====
function buildTransitions() {
  const types = ["burst", "push", "blur", "vpush", "zoom", "iris", "blocks", "flash"];
  const D = 0.42;
  for (let i = 0; i < SC.length - 1; i++) {
    const o = "#sc" + i, n = "#sc" + (i + 1), t = SC[i + 1].t0 - 0.28;
    const ty = SC[i + 1].tr || types[i % types.length];
    if (ty === "push") { tl.set(n, { opacity: 1 }, t); tl.to(o, { x: W, duration: D, ease: "power3.inOut" }, t); tl.fromTo(n, { x: -W }, { x: 0, duration: D, ease: "power3.inOut" }, t); tl.set(o, { opacity: 0 }, t + D); tl.set(o, { x: 0 }, t + D + 0.01); }
    else if (ty === "vpush") { tl.set(n, { opacity: 1 }, t); tl.to(o, { y: -H, duration: D, ease: "power3.inOut" }, t); tl.fromTo(n, { y: H }, { y: 0, duration: D, ease: "power3.inOut" }, t); tl.set(o, { opacity: 0 }, t + D); tl.set(o, { y: 0 }, t + D + 0.01); }
    else if (ty === "blur") { tl.to(o, { opacity: 0, filter: "blur(22px)", duration: D + 0.1, ease: "sine.inOut" }, t); tl.fromTo(n, { opacity: 0, filter: "blur(22px)" }, { opacity: 1, filter: "blur(0px)", duration: D + 0.1, ease: "sine.inOut" }, t); tl.set(o, { filter: "none" }, t + D + 0.11); }
    else if (ty === "zoom") { tl.to(o, { scale: 2.4, opacity: 0, duration: D, ease: "power3.in" }, t); tl.fromTo(n, { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: D, ease: "power3.out" }, t); tl.set(o, { scale: 1 }, t + D + 0.01); }
    else if (ty === "iris") { tl.set(n, { opacity: 1 }, t); tl.fromTo(n, { clipPath: "circle(0px at " + (W / 2) + "px " + (PT ? 520 : 250) + "px)" }, { clipPath: "circle(" + (PT ? 1500 : 900) + "px at " + (W / 2) + "px " + (PT ? 520 : 250) + "px)", duration: D + 0.1, ease: "power2.inOut" }, t); tl.set(o, { opacity: 0 }, t + D + 0.1); tl.set(n, { clipPath: "none" }, t + D + 0.12); }
    else if (ty === "flash") { tl.to("#flash", { opacity: 1, duration: 0.14, ease: "power2.in" }, t); tl.set(o, { opacity: 0 }, t + 0.14); tl.set(n, { opacity: 1 }, t + 0.14); tl.to("#flash", { opacity: 0, duration: 0.3, ease: "power2.out" }, t + 0.16); }
    else if (ty === "blocks") {
      for (let k = 0; k < 4; k++) { const b = "#blk" + k; tl.fromTo(b, { y: -H }, { y: 0, duration: 0.2, ease: "power3.out" }, t + k * 0.05); tl.to(b, { y: H, duration: 0.2, ease: "power3.in" }, t + 0.26 + k * 0.05); }
      tl.set(o, { opacity: 0 }, t + 0.26); tl.set(n, { opacity: 1 }, t + 0.26);
    }
    else { // burst
      tl.fromTo("#wipe", { opacity: 1, scale: 0.2, rotation: -30 }, { scale: PT ? 26 : 15, rotation: 50, duration: 0.38, ease: "power3.in" }, t);
      tl.set(o, { opacity: 0 }, t + 0.38); tl.set(n, { opacity: 1 }, t + 0.38);
      tl.to("#wipe", { opacity: 0, duration: 0.25, ease: "power1.out" }, t + 0.4);
      tl.set("#wipe", { scale: 0.2 }, t + 0.66);
    }
  }
}
