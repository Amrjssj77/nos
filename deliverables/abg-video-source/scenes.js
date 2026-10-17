// ===== scene builders =====
const FLAG = { high: "▲", low: "▼", norm: "●" };
function vrows(vals, st) {
  return vals.map((v, i) => '<div class="vrow" id="' + (st || "vr") + i + '"><span class="k">' + v.k + '</span><span class="v ' + (v.f || "") + '">' + v.v + '</span><span class="f ' + (v.f || "") + '">' + (FLAG[v.f] || "") + '</span><span class="r">' + (v.r || "") + "</span></div>").join("");
}
function gaugeHTML(w, marker, opts) { // pH scale 7.00 .. 7.80
  const lo = 7.0, hi = 7.8, X = v => ((v - lo) / (hi - lo) * 100).toFixed(2);
  return '<div class="gauge" style="position:relative;width:' + w + 'px;height:150px;direction:ltr">' +
    '<div style="position:absolute;left:0;top:70px;width:' + X(7.35) + '%;height:30px;background:linear-gradient(90deg,#f3b9a5,#e5673f);border-radius:15px 0 0 15px"></div>' +
    '<div style="position:absolute;left:' + X(7.35) + '%;top:70px;width:' + (X(7.45) - X(7.35)).toFixed(2) + '%;height:30px;background:#1f9d6b"></div>' +
    '<div style="position:absolute;left:' + X(7.45) + '%;top:70px;right:0;height:30px;background:linear-gradient(90deg,#8fb0f0,#3b6fe0);border-radius:0 15px 15px 0"></div>' +
    '<div class="cap" style="position:absolute;left:0;top:108px;color:#e5673f;font-weight:900">ACIDOSIS &lt; 7.35</div>' +
    '<div class="cap" style="position:absolute;left:' + (X(7.4) - 9) + '%;top:108px;color:#1f9d6b;font-weight:900;white-space:nowrap">NORMAL 7.35–7.45</div>' +
    '<div class="cap" style="position:absolute;right:0;top:108px;color:#3b6fe0;font-weight:900">ALKALOSIS &gt; 7.45</div>' +
    '<div id="mk" style="position:absolute;left:' + X(marker == null ? 7.4 : marker) + '%;top:0;width:0;opacity:' + (marker == null ? 0 : 1) + '"><div style="position:absolute;left:-48px;top:0;width:96px;text-align:center;background:#16140f;color:#fff;border-radius:12px;font-weight:900;font-size:28px;padding:2px 0">' + (opts && opts.label || (marker != null ? marker.toFixed(2) : "pH")) + '</div><div style="position:absolute;left:-10px;top:40px;border-left:10px solid transparent;border-right:10px solid transparent;border-top:20px solid #16140f"></div></div></div>';
}
const X7 = v => ((v - 7.0) / 0.8 * 100);

B.hook = c => {
  const { V, E, t0 } = c;
  const card = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:12px;direction:ltr;margin-bottom:6px">' + tile("clipboard", "ink", 46) + '<span class="big" style="font-size:28px">ABG REPORT</span></div>' + vrows([{ k: "pH", v: "7.32", f: "low", r: "7.35–7.45" }, { k: "PaCO₂", v: "58", f: "high", r: "35–45" }, { k: "HCO₃", v: "29", f: "high", r: "22–26" }, { k: "PaO₂", v: "62", f: "low", r: "80–100" }], "h"), V);
  pos(card, "width:470px"); gsap.set(card, { rotation: -3 });
  popIn(card, t0 + 0.15, { y: 50 });
  const q = [], qs = [[-300, -120], [300, -90], [-330, 90], [330, 120]];
  qs.forEach((p, k) => { const d = mk("div", "abs", '<div class="tile coral" style="width:64px;height:64px;font-weight:900;color:#fff;font-size:40px">?</div>', V); d.style.cssText = "left:calc(50% + " + p[0] + "px - 32px);top:calc(50% + " + p[1] + "px - 32px)"; q.push(d); popIn(d, t0 + 0.5 + k * 0.15, { s: 0.2 }); tl.to(d, { y: -10, duration: 0.5, yoyo: true, repeat: 5, ease: "sine.inOut" }, t0 + 1 + k * 0.1); });
  const st = [];
  [1, 2, 3].forEach((n, k) => { const d = mk("div", "abs", '<div class="tile coral" style="width:84px;height:84px;font-weight:900;color:#fff;font-size:52px">' + n + "</div>", V); d.style.cssText = "left:calc(50% + " + (k - 1) * 120 + "px - 42px);top:350px"; st.push(d); });
  tl.to(q, { opacity: 0, scale: 0.2, duration: 0.25, ease: "power2.in" }, E("steps", 4));
  st.forEach((d, k) => popIn(d, E("steps", 4) + 0.2 + k * 0.16, { s: 0.2, y: 20 }));
  tl.to(card, { scale: 0.86, y: -34, duration: 0.4, ease: "power2.out" }, E("steps", 4) + 0.1);
  tl.to("#h0,#h1,#h2,#h3", { backgroundColor: "rgba(229,103,63,0.12)", duration: 0.3, stagger: 0.25 }, E("screen", 9));
};

B.sponsor = c => {
  const { V, E, t0 } = c;
  const book = mk("div", "abs", '<div style="position:relative;width:250px;height:340px;border-radius:6px 18px 18px 6px;background:linear-gradient(135deg,#e5673f,#c4481f);box-shadow:-14px 20px 36px rgba(22,20,15,.35),inset 10px 0 0 rgba(0,0,0,.18);padding:30px 26px 26px 36px;color:#fff;direction:ltr"><div style="font-weight:900;font-size:14px;letter-spacing:2px;opacity:.85">NURSING</div><div style="font-weight:900;font-size:40px;line-height:1.02;margin-top:18px">THE ULTIMATE NURSE HACKS</div><div style="margin-top:20px;display:inline-block;background:#16140f;border-radius:10px;padding:4px 14px;font-weight:900;font-size:24px">CHEAT SHEET</div></div>', V);
  book.style.cssText += ";left:calc(50% - 330px);top:48px";
  gsap.set(book, { rotation: -6 });
  popIn(book, t0 + 0.2, { y: 80, s: 0.7, d: 0.6 });
  tl.to(book, { y: -10, rotation: -4, duration: 2, ease: "sine.inOut", yoyo: true, repeat: 3 }, t0 + 1);
  const side = mk("div", "abs col", '<div class="pill ink" style="font-size:28px;letter-spacing:1px">SPONSORED BY</div><div class="big ltr" style="font-size:44px;line-height:1.1;text-align:left;max-width:420px">The Ultimate Nurse Hacks Cheat Sheet</div>', V);
  side.style.cssText += ";left:calc(50% + 10px);top:110px;align-items:flex-start;gap:20px";
  popIn(side, t0 + 0.6, { x: 40 });
  const link = mk("div", "abs row card", tile("link", "coral", 52) + '<span class="big" style="font-size:28px">اللينك في وصف الفيديو</span>', V);
  link.style.cssText += ";left:calc(50% + 10px);top:320px;padding:12px 24px;gap:14px;border-radius:999px";
  popIn(link, E("link", 8), { s: 0.4 });
};

B.title = c => {
  const { V, t0, p } = c;
  const g = mk("div", "abs", burstSVG("", 430), V); g.style.cssText += ";left:calc(50% - 215px);top:8px";
  tl.fromTo(g, { scale: 0.3, rotation: -60, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.4)" }, t0 + 0.1);
  tl.to(g, { rotation: 90, duration: Math.max(2, c.t1 - c.t0), ease: "none" }, t0 + 0.9);
  const t = mk("div", "abs col", '<div class="big ltr" style="font-size:150px;letter-spacing:4px">' + p.main + '</div><div class="pill ink" style="font-size:34px">' + p.sub + "</div>", V);
  t.style.cssText += ";left:0;right:0;top:120px";
  popIn(t, t0 + 0.4, { s: 0.6, d: 0.6 });
};

B.defn = c => {
  const { V, E, t0 } = c;
  const row = mk("div", "row", "", V); row.style.direction = "ltr";
  const items = [["syringe", "ink", "A", "Arterial", "شريان", "artery"], ["drop", "coral", "B", "Blood", "دم", "acid"], ["lung", "blue", "G", "Gas", "غازات", "lung"]];
  const cards = items.map(it => { const d = mk("div", "card pad col", '<div class="big" style="font-size:90px;color:var(--coral)">' + it[2] + "</div>" + tile(it[0], it[1], 74) + '<div class="big" style="font-size:36px">' + it[3] + '</div><div class="cap">' + it[4] + "</div>", row); d.style.width = "300px"; d.style.height = "330px"; return d; });
  cards.forEach((d, k) => popIn(d, E(items[k][5], 0.4 + k * 0.5), { y: 60, d: 0.55 }));
  const tag = mk("div", "abs row", '<span class="tag">pH</span><span class="tag">O₂</span><span class="tag">CO₂</span>', V); tag.style.cssText += ";bottom:14px;left:0;right:0";
  popIn(tag, E("lung", 4) + 0.5);
};

B.listicon = c => {
  const { V, E, t0, p } = c;
  const cols = p.cols || 2; const wrap = mk("div", "", "", V);
  wrap.style.cssText = "display:grid;grid-template-columns:repeat(" + cols + ",420px);gap:18px 26px;direction:rtl";
  const els = p.items.map((it, k) => { const d = mk("div", "card row", tile(it.ic, it.c || "ink", 64) + '<span class="big" style="font-size:32px;flex:1;text-align:right">' + it.t + "</span>", wrap); d.style.cssText += ";padding:14px 20px;justify-content:flex-start;height:96px"; return d; });
  els.forEach((d, k) => popIn(d, E("i" + k, 0.4 + k * 0.5), { x: 0, y: 30 }));
};

B.procedure = c => {
  const { V, E, t0 } = c;
  const _h = mk("div", "abs row", '<div class="tile ink" style="width:64px;height:64px">' + ic("syringe") + '</div><div class="big" style="font-size:50px">سحب العينة · Sampling</div>', V); _h.style.cssText += ";top:6px;left:0;right:0"; popIn(_h, t0 + 0.15, { y: -20 });
  const row = mk("div", "row", "", V); row.style.gap = "40px"; row.style.direction = "ltr";
  const a = mk("div", "card pad col", tile("hand", "ink", 84) + '<div class="big" style="font-size:40px">Allen test</div><div class="cap">الدم بيوصل لليد؟</div>', row); a.style.cssText += ";width:320px;height:300px";
  const bR = mk("div", "card pad col", tile("clock", "coral", 84) + '<div class="big" style="font-size:90px;color:var(--coral)">5<span style="font-size:34px"> min</span></div><div class="cap">ضغط بعد السحب</div>', row); bR.style.cssText += ";width:320px;height:300px";
  const cR = mk("div", "card pad col", tile("pill", "blue", 84) + '<div class="big" style="font-size:90px;color:var(--blue)">10<span style="font-size:34px"> min</span></div><div class="cap">لو واخد مميّعات</div>', row); cR.style.cssText += ";width:320px;height:300px";
  popIn(a, E("allen", 0.4), { y: 50 }); popIn(bR, E("five", 1.5), { y: 50 }); popIn(cR, E("ten", 3), { y: 50 });
};

B.understand = c => {
  const { V, E, t0 } = c;
  const row = mk("div", "row", "", V); row.style.gap = "50px";
  const a = mk("div", "card pad col", '<div style="display:grid;grid-template-columns:repeat(4,60px);gap:8px">' + "<i style='height:22px;background:#e6e1d6;border-radius:6px'></i>".repeat(16) + '</div><div class="big" style="font-size:36px;margin-top:10px">حفظ الجداول</div>' + '<div class="tile coral abs" style="width:64px;height:64px;right:-18px;top:-18px">' + '<svg class="ic"><use href="#i-x"/></svg></div>', row); a.style.cssText += ";width:420px;height:320px;position:relative";
  const b = mk("div", "card pad col", '<div class="row" style="gap:12px">' + [1, 2, 3].map(n => '<div class="tile green" style="width:70px;height:70px;font-weight:900;color:#fff;font-size:40px">' + n + "</div>").join("") + '</div><div class="big" style="font-size:36px;margin-top:10px">فهم الخطوات</div>' + '<div class="tile green abs" style="width:64px;height:64px;right:-18px;top:-18px"><svg class="ic"><use href="#i-check"/></svg></div>', row); b.style.cssText += ";width:420px;height:320px;position:relative";
  popIn(a, E("memorize", 0.5), { y: 40 }); tl.to(a, { opacity: 0.45, duration: 0.4 }, E("understand", 4));
  popIn(b, E("understand", 4), { y: 40, s: 0.7 });
};

B.balance = c => {
  const { V, E, t0 } = c;
  const L = mk("div", "card pad col", tile("lung", "blue", 84) + '<div class="big ltr" style="font-size:40px">Lungs</div><div class="pill soft ltr" style="font-size:24px">CO₂ = acid</div><div class="cap">⏱ minutes · دقايق</div>', V);
  L.style.cssText += ";position:absolute;left:100px;top:90px;width:330px;height:290px";
  const R = mk("div", "card pad col", tile("kidney", "green", 84) + '<div class="big ltr" style="font-size:40px">Kidneys</div><div class="pill soft ltr" style="font-size:24px">HCO₃ = base</div><div class="cap">⏱ hours–days · ساعات لأيام</div>', V);
  R.style.cssText += ";position:absolute;right:100px;top:90px;width:330px;height:290px";
  const mid = mk("div", "abs col", '<div class="big" style="font-size:96px;color:var(--coral)">pH</div><div class="pill ink ltr" style="font-size:24px">7.35 – 7.45</div>', V); mid.style.cssText += ";left:calc(50% - 90px);top:150px;width:180px";
  const bar = mk("div", "abs", "", V); bar.style.cssText += ";left:calc(50% - 90px);top:340px;width:180px;height:10px;background:var(--ink);border-radius:5px";
  popIn(L, E("lungs", 0.5), { x: -60, y: 20 }); popIn(R, E("kidneys", 3), { x: 60, y: 20 }); popIn(mid, t0 + 0.3, { s: 0.4 }); popIn(bar, t0 + 0.6);
  tl.to(bar, { rotation: -7, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: 5 }, E("key", 6));
};

B.normals = c => {
  const { V, E, t0, p } = c;
  if (!p.focus) { const _h = mk("div", "abs row", '<div class="tile ink" style="width:64px;height:64px">' + ic("balance") + '</div><div class="big" style="font-size:50px">الأرقام الطبيعية · Normal values</div>', V); _h.style.cssText += ";top:6px;left:0;right:0"; popIn(_h, t0 + 0.15, { y: -20 }); }
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:14px;direction:ltr";
  const D = [["pH", "7.35–7.45", "", "balance", "ink", "ACID–BASE"], ["PaCO₂", "35–45", "mmHg", "lung", "blue", "RESPIRATORY"], ["HCO₃", "22–26", "mEq/L", "kidney", "green", "METABOLIC"], ["PaO₂", "80–100", "mmHg", "drop", "coral", "OXYGEN"], ["SaO₂", "95–100", "%", "heartpulse", "coral", "OXYGEN"]];
  const cards = D.map((d, k) => { const e = mk("div", "card pad col", tile(d[3], d[4], 64) + '<div class="big ltr" style="font-size:38px">' + d[0] + '</div><div class="big ltr" style="font-size:' + (k === 0 ? 34 : 44) + 'px;color:var(--coral)">' + d[1] + '</div><div class="cap ltr">' + d[2] + '</div><div class="tag">' + d[5] + "</div>", row); e.style.cssText += ";width:226px;height:330px"; e.id = "nm" + c.idx + "_" + k; return e; });
  cards.forEach((e, k) => { popIn(e, E("n" + k, 0.4 + k * 0.5), { y: 60, d: 0.5 }); if (!p.focus) tl.to(e, { y: -12, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, E("n" + k, 0.4 + k * 0.5) + 0.6); });
  if (p.focus) {
    [3, 4].forEach(k => tl.to(cards[k], { opacity: 0.35, scale: 0.94, duration: 0.4 }, E("dim", 6)));
    [0, 1, 2].forEach((k, j) => tl.to(cards[k], { y: -10, boxShadow: "0 0 0 5px #e5673f, 0 20px 40px rgba(229,103,63,.3)", duration: 0.35 }, E("focus", 3) + j * 0.15));
  }
};

B.steps3 = c => {
  const { V, E, t0 } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:26px;direction:rtl";
  const D = [["1", "الاتجاه", "Direction", "arrowupdown"], ["2", "السبب", "Cause", "search"], ["3", "التعويض", "Compensation", "scale"]];
  const cards = D.map(d => { const e = mk("div", "card pad col", '<div class="tile coral" style="width:76px;height:76px;font-weight:900;color:#fff;font-size:48px">' + d[0] + "</div>" + tile(d[3], "ink", 72) + '<div class="big" style="font-size:44px">' + d[1] + '</div><div class="cap ltr">' + d[2] + "</div>", row); e.style.cssText += ";width:330px;height:340px"; return e; });
  cards.forEach((e, k) => popIn(e, E("s" + (k + 1), 0.5 + k * 0.9), { y: 60 }));
};

B.scale1 = c => { // pH scale
  const { V, E, t0, p } = c;
  const g = mk("div", "", gaugeHTML(980, p.marker, { label: p.label }), V); g.style.cssText += ";margin-top:30px";
  popIn(g, t0 + 0.3, { y: 40 });
  const ttl = mk("div", "abs row", '<div class="tile ink" style="width:70px;height:70px;font-weight:900;color:#fff;font-size:44px">1</div><div class="big" style="font-size:56px">الاتجاه · pH</div>', V); ttl.style.cssText += ";top:18px;left:0;right:0"; popIn(ttl, t0 + 0.1, { y: -20 });
  const tag1 = mk("div", "abs pill coral ltr", "Acidosis", V); tag1.style.cssText += ";left:130px;top:300px;font-size:34px";
  const tag2 = mk("div", "abs pill blue ltr", "Alkalosis", V); tag2.style.cssText += ";right:130px;top:300px;font-size:34px";
  const mkr = g.querySelector("#mk");
  if (p.marker == null) {
    popIn(tag1, E("acid", 3), { s: 0.4 }); popIn(tag2, E("alk", 6), { s: 0.4 });
    tl.fromTo(mkr, { opacity: 0, x: -300 }, { opacity: 1, x: -120, duration: 0.6, ease: "power2.out" }, E("acid", 3) - 0.2);
    tl.to(mkr, { x: 300, duration: 0.8, ease: "power2.inOut" }, E("alk", 6) - 0.2);
  } else { popIn(p.marker < 7.35 ? tag1 : tag2, E("mark", 1.2), { s: 0.4 }); tl.fromTo(mkr, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "bounce.out" }, E("mark", 1)); }
};

B.rome = c => {
  const { V, E, t0, p } = c;
  const hd = mk("div", "abs row", '<div class="tile ink" style="width:70px;height:70px;font-weight:900;color:#fff;font-size:44px">2</div><div class="big" style="font-size:56px">السبب · Cause</div>', V); hd.style.cssText += ";top:" + (p.part === "b" ? 18 : 6) + "px;left:0;right:0"; popIn(hd, t0 + 0.1, { y: -20 });
  if (p.part !== "b") {
  const top = mk("div", "row ltr", "", V); top.style.top = "96px"; top.style.cssText += ";position:absolute;top:96px;left:0;right:0;gap:12px";
  "ROME".split("").forEach((ch, k) => { const d = mk("div", "tile " + (k < 2 ? "coral" : "ink"), '<span style="font-weight:900;font-size:60px;color:#fff">' + ch + "</span>", top); d.style.cssText += ";width:92px;height:92px"; popIn(d, E("rome", 0.4) + k * 0.12, { s: 0.3 }); });
  const lab = mk("div", "abs row ltr", '<span class="pill soft" style="font-size:26px"><span><b style="color:var(--coral)">R</b>espiratory · <b>O</b>pposite</span></span><span class="pill soft" style="font-size:26px"><span><b style="color:var(--ink)">M</b>etabolic · <b>E</b>qual</span></span>', V); lab.style.cssText += ";top:212px;left:0;right:0;gap:30px"; popIn(lab, E("rome", 0.4) + 0.7);
  }
  if (p.part === "a") return;
  const ROFF = p.part === "b" ? -60 : 40;
  const mkRow = (a, b, res, cls, top) => { const d = mk("div", "abs card row ltr", '<span class="big" style="font-size:44px">pH <span class="coral-t">' + a + "</span></span>" + '<span class="big" style="font-size:44px">' + b + "</span>" + '<span class="pill ' + cls + '" style="font-size:34px">→ ' + res + "</span>", V); d.style.cssText += ";left:calc(50% - 400px);width:800px;top:" + top + "px;padding:14px 30px;justify-content:space-between"; return d; };
  const r1 = mkRow("↓", 'CO₂ <span class="coral-t">↑</span>', "Respiratory", "coral", 190 + ROFF), r2 = mkRow("↓", 'HCO₃ <span class="coral-t">↓</span>', "Metabolic", "ink", 300 + ROFF);
  popIn(r1, E("ex1", 3), { y: 40 }); popIn(r2, E("ex2", 5), { y: 40 });
  const n1 = mk("div", "abs cap", "عكس بعض ⇄", V); n1.style.cssText += ";top:" + (262 + ROFF) + "px;left:0;right:0;text-align:center"; popIn(n1, E("ex1", 3) + 0.4);
  const n2 = mk("div", "abs cap", "زي بعض ⇉", V); n2.style.cssText += ";top:" + (372 + ROFF) + "px;left:0;right:0;text-align:center"; popIn(n2, E("ex2", 5) + 0.4);
};

B.comp3 = c => {
  const { V, E, t0 } = c;
  const _h = mk("div", "abs row", '<div class="tile coral" style="width:64px;height:64px">' + ic("scale") + '</div><div class="big" style="font-size:50px">3 · التعويض · Compensation</div>', V); _h.style.cssText += ";top:6px;left:0;right:0"; popIn(_h, t0 + 0.15, { y: -20 });
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:24px;direction:ltr";
  const D = [["Uncompensated", "مفيش تعويض", "القيمة التانية لسه طبيعية", 7.28, "coral", "unc"], ["Partially compensated", "تعويض جزئي", "اتحرّكت و pH لسه مش طبيعي", 7.32, "blue", "part"], ["Fully compensated", "تعويض كامل", "pH رجع طبيعي", 7.38, "green", "full"]];
  D.forEach((d, k) => {
    const e = mk("div", "card pad col", '<div class="pill ' + d[4] + '" style="font-size:26px">' + d[0] + '</div><div class="big" style="font-size:44px">' + d[1] + '</div><div class="cap" style="text-align:center;min-height:56px;direction:rtl">' + d[2] + '</div><div style="position:relative;width:260px;height:34px;margin-top:6px;direction:ltr"><div style="position:absolute;left:0;top:12px;width:44%;height:12px;background:#f3b9a5;border-radius:6px 0 0 6px"></div><div style="position:absolute;left:44%;top:12px;width:12.5%;height:12px;background:#1f9d6b"></div><div style="position:absolute;left:56.5%;top:12px;right:0;height:12px;background:#8fb0f0;border-radius:0 6px 6px 0"></div><div style="position:absolute;left:' + X7(d[3]) + '%;top:0;width:0"><div style="position:absolute;left:-9px;top:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:16px solid #16140f"></div></div></div>', row);
    e.style.cssText += ";width:370px;height:300px;margin-top:50px"; popIn(e, E(d[5], 0.5 + k * 1.5), { y: 50 });
  });
};

B.recap3 = c => {
  const { V, E, t0 } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:36px;direction:rtl";
  ["الاتجاه", "السبب", "التعويض"].forEach((tx, k) => { const e = mk("div", "col", '<div class="tile coral" style="width:130px;height:130px;font-weight:900;color:#fff;font-size:84px">' + (k + 1) + '</div><div class="big" style="font-size:52px">' + tx + "</div>", row); popIn(e, E("r" + (k + 1), 0.3 + k * 0.7), { s: 0.3, y: 30 }); });
};

// generic case card (values + steps + verdict)
B.casecard = c => {
  const { V, E, t0, p } = c;
  const wrap = mk("div", "row", "", V); wrap.style.cssText += ";gap:34px;direction:ltr;align-items:flex-start;margin-top:-6px";
  const left = mk("div", "col", "", wrap); left.style.cssText += ";align-items:stretch;gap:14px";
  const card = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:14px;margin-bottom:6px">' + tile(p.icon || "user", "ink", 54) + '<div style="text-align:right"><div class="big" dir="auto" style="font-size:28px">' + (p.title || "") + '</div><div class="cap" dir="auto" style="font-size:19px">' + (p.sub || "") + "</div></div></div>" + vrows(p.values, "cv" + c.idx + "_"), left);
  card.style.width = "500px";
  const verdict = mk("div", "pill " + (p.vcls || "ink") + " ltr", p.verdict || "", left); verdict.style.cssText += ";font-size:28px;justify-content:center;align-self:center";
  const steps = mk("div", "col", "", wrap); steps.style.cssText += ";align-items:stretch;gap:12px;width:430px;direction:rtl";
  const sEls = (p.steps || []).map((tx, k) => mk("div", "card row", '<div class="tile coral" style="width:50px;height:50px;font-weight:900;color:#fff;font-size:30px">' + (k + 1) + '</div><span class="big" style="font-size:25px;flex:1;text-align:right;line-height:1.25">' + tx + "</span>", steps));
  sEls.forEach(e => e.style.cssText += ";padding:10px 16px;justify-content:flex-start;gap:14px");
  popIn(card, t0 + 0.25, { y: 50, d: 0.55 });
  p.values.forEach((v, k) => { const id = "#cv" + c.idx + "_" + k; if (p.reveal !== false) { tl.fromTo(id, { opacity: 0.0, x: -16 }, { opacity: 1, x: 0, duration: 0.3 }, E("v" + k, 0.6 + k * 0.45)); } });
  if (p.focus != null) { const ids = [].concat(p.focus).map(k => "#cv" + c.idx + "_" + k); tl.to(ids, { backgroundColor: "rgba(229,103,63,0.16)", duration: 0.3 }, E("focus", 0.6)); }
  if (p.focus2 != null) tl.to("#cv" + c.idx + "_" + p.focus2, { backgroundColor: "rgba(229,103,63,0.16)", duration: 0.3 }, E("focus2", 3));
  sEls.forEach((e, k) => popIn(e, E("s" + (k + 1), 3 + k), { x: 0, y: 30 }));
  if (p.verdict) { popIn(verdict, E("dx", 6), { s: 0.3 }); tl.to(verdict, { scale: 1.06, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, E("dx", 6) + 0.5); } else verdict.style.display = "none";
};

B.patient = c => {
  const { V, E, t0 } = c;
  const wrap = mk("div", "row", "", V); wrap.style.cssText += ";gap:40px;direction:ltr";
  const pc = mk("div", "card pad col", tile("user", "ink", 110) + '<div class="big ltr" style="font-size:44px">68 y · Male</div><div class="row" style="gap:10px"><span class="tag">COPD</span><span class="tag">SOB 2 days</span></div><div class="row" style="gap:10px"><span class="tag" style="background:#fde3d9;color:var(--coral)">drowsy</span><span class="tag" style="background:#fde3d9;color:var(--coral)">exhausted</span></div>', wrap);
  pc.style.cssText += ";width:380px;height:370px"; popIn(pc, t0 + 0.3, { y: 50 });
  const g = mk("div", "", "", wrap); g.style.cssText = "display:grid;grid-template-columns:repeat(2,250px);gap:16px";
  const V4 = [["RR", "28", "/min", "wind", "rr"], ["HR", "108", "bpm", "heartpulse", "hr"], ["BP", "138/84", "mmHg", "gauge", "bp"], ["SpO₂", "89%", "", "drop", "spo2"]];
  V4.forEach((d, k) => { const e = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:12px;direction:ltr">' + tile(d[3], k === 3 ? "coral" : "ink", 52) + '<div><div class="cap ltr">' + d[0] + '</div><div class="big ltr" style="font-size:42px">' + d[1] + '<span class="cap" style="font-size:20px"> ' + d[2] + "</span></div></div></div>", g); e.style.height = "150px"; popIn(e, E(d[4], 1 + k), { y: 40 }); });
};

B.chronic = c => {
  const { V, E, t0 } = c;
  const col = mk("div", "col", "", V); col.style.cssText += ";gap:24px;direction:ltr";
  const a = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:14px">' + tile("kidney", "green", 60) + '<div class="big" style="font-size:34px">Chronic CO₂ retention</div></div><div class="bar" style="width:800px;margin-top:14px"><i id="ca' + c.idx + '" style="left:0;width:100%;background:#1f9d6b"></i></div><div class="cap" style="margin-top:8px;direction:rtl">الكلى بتعوّض من فترة</div>', col);
  const b = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:14px">' + tile("alert", "coral", 60) + '<div class="big" style="font-size:34px">+ Acute worsening</div></div><div class="bar" style="width:800px;margin-top:14px"><i id="cb' + c.idx + '" style="left:0;width:100%;background:#e5673f"></i></div><div class="cap" style="margin-top:8px;direction:rtl">وزاد عليه تدهور حاد</div>', col);
  popIn(a, E("chronic", 0.4), { y: 40 }); tl.fromTo("#ca" + c.idx, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: "power2.out" }, E("chronic", 0.4) + 0.3);
  popIn(b, E("acute", 4), { y: 40 }); tl.fromTo("#cb" + c.idx, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.8, ease: "power2.out" }, E("acute", 4) + 0.3);
};

B.cta = c => {
  const { V, E, t0, p } = c;
  const _h = mk("div", "abs row", '<div class="tile coral" style="width:64px;height:64px">' + ic("hand") + '</div><div class="big" style="font-size:50px">وقفة سريعة</div>', V); _h.style.cssText += ";top:6px;left:0;right:0"; popIn(_h, t0 + 0.15, { y: -20 });
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:34px;direction:ltr";
  const like = mk("div", "card pad col", tile("thumb", "coral", 120) + '<div class="big" style="font-size:44px">Like</div>', row); like.style.cssText += ";width:250px;height:290px";
  const sub = mk("div", "card pad col", '<div class="pill coral" style="font-size:44px;padding:18px 40px;box-shadow:0 12px 24px rgba(229,103,63,.4)">Subscribe</div><div class="cap" style="margin-top:16px;font-size:26px;direction:rtl">واشترك في القناة</div>', row); sub.style.cssText += ";width:380px;height:290px";
  const bell = mk("div", "card pad col", tile("bell", "ink", 120) + '<div class="big" style="font-size:44px">Bell</div>', row); bell.style.cssText += ";width:250px;height:290px";
  popIn(like, E("like", 0.5), { s: 0.4 }); popIn(sub, E("sub", 2), { s: 0.4 }); popIn(bell, E("bell", 3.5), { s: 0.4 });
  tl.to(like.firstChild, { scale: 1.25, rotation: -14, duration: 0.18, yoyo: true, repeat: 3 }, E("like", 0.5) + 0.5);
  tl.to(bell.firstChild, { rotation: 18, duration: 0.1, yoyo: true, repeat: 9, ease: "sine.inOut" }, E("bell", 3.5) + 0.4);
  tl.to(sub.firstChild, { scale: 1.07, duration: 0.25, yoyo: true, repeat: 5 }, E("sub", 2) + 0.4);
  if (p.comment) { const cm = mk("div", "abs row card", tile("comment", "blue", 56) + '<span class="big" style="font-size:30px">اكتب في التعليقات</span>', V); cm.style.cssText += ";bottom:6px;left:calc(50% - 230px);padding:10px 26px;gap:14px;border-radius:999px"; popIn(cm, E("comment", 8), { s: 0.4 }); }
};

B.oxy = c => {
  const { V, E, t0 } = c;
  const a = mk("div", "card pad", '<div class="row" style="justify-content:space-between;direction:ltr"><div class="big ltr" style="font-size:40px">PaO₂</div><div class="big ltr coral-t" style="font-size:70px">62 <span class="cap">mmHg</span></div></div><div style="position:relative;width:860px;height:66px;direction:ltr;margin-top:8px"><div style="position:absolute;left:0;top:20px;width:100%;height:26px;border-radius:13px;background:#ebe7dc"></div><div style="position:absolute;left:62.5%;top:20px;width:25%;height:26px;background:#1f9d6b;border-radius:4px"></div><div id="oxm' + c.idx + '" style="position:absolute;left:' + (62 / 120 * 100) + '%;top:0;width:0"><div style="position:absolute;left:-12px;top:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:22px solid #e5673f"></div></div><div class="cap ltr" style="position:absolute;left:62.5%;top:48px">80</div><div class="cap ltr" style="position:absolute;left:84%;top:48px">100</div></div><div class="pill coral ltr" style="margin-top:10px">Hypoxemia · &lt; 80</div>', V);
  const b = mk("div", "card pad row ltr", tile("drop", "ink", 60) + '<div class="big" style="font-size:40px">SaO₂ 90%</div><span class="tag" style="background:#fde3d9;color:var(--coral)">&lt; 95</span>', V);
  a.style.cssText += ";position:absolute;left:calc(50% - 460px);top:40px;width:920px"; b.style.cssText += ";position:absolute;left:calc(50% - 230px);top:300px;gap:18px;padding:14px 30px";
  popIn(a, t0 + 0.3, { y: 40 }); tl.fromTo("#oxm" + c.idx, { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "bounce.out" }, E("pao2", 2));
  popIn(b, E("sao2", 5), { y: 40 });
};

B.checklist = c => {
  const { V, E, t0, p } = c;
  const col = mk("div", "", "", V); col.style.cssText = "display:grid;grid-template-columns:repeat(2,560px);gap:14px 22px;direction:rtl";
  p.items.forEach((it, k) => { const d = mk("div", "card row", tile(it.ic, it.c || "ink", 56) + '<span class="big" style="font-size:27px;flex:1;text-align:right;line-height:1.25">' + it.t + "</span>" + '<div class="tile green" style="width:36px;height:36px"><svg class="ic"><use href="#i-check"/></svg></div>', col); d.style.cssText += ";padding:10px 16px;justify-content:flex-start;gap:14px;height:94px"; popIn(d, E("i" + k, 0.4 + k * 0.6), { y: 30 }); });
};

B.casesTitle = c => {
  const { V, E, t0 } = c;
  const t = mk("div", "col", '<div class="big" style="font-size:96px">5 حالات</div><div class="pill ink ltr" style="font-size:34px">Quick practice</div><div class="row" id="dots' + c.idx + '" style="gap:16px"></div>', V);
  const dots = t.querySelector("#dots" + c.idx);
  for (let k = 1; k <= 5; k++) { const d = mk("div", "tile coral", '<span style="font-weight:900;font-size:36px;color:#fff">' + k + "</span>", dots); d.style.cssText += ";width:66px;height:66px"; popIn(d, t0 + 0.6 + k * 0.18, { s: 0.2 }); }
  popIn(t.children[0], t0 + 0.2, { s: 0.5 }); popIn(t.children[1], t0 + 0.4);
};

B.quad = c => {
  const { V, E, t0, p } = c;
  const g = mk("div", "", "", V); g.style.cssText = "display:grid;grid-template-columns:repeat(2,560px);gap:16px 20px;direction:rtl";
  p.cells.forEach((q, k) => {
    const e = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:14px;direction:rtl">' + tile(q.ic, q.c, 58) + '<div style="text-align:right"><div class="big" style="font-size:29px">' + q.title + '</div><div class="cap ltr" style="font-size:18px;text-align:right">' + q.en + "</div></div></div>" + '<div class="row" style="flex-wrap:wrap;justify-content:flex-start;gap:8px;margin-top:10px;direction:rtl" id="qc' + c.idx + "_" + k + '">' + q.items.map(x => '<span class="tag" style="font-size:20px">' + x + "</span>").join("") + "</div>", g);
    e.style.cssText += ";height:200px;padding:14px 20px";
    popIn(e, E("q" + k, 0.4 + k * 1.5), { y: 36 });
    tl.fromTo("#qc" + c.idx + "_" + k + " .tag", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.28, ease: "power2.out" }, E("q" + k, 0.4 + k * 1.5) + 0.35);
  });
};

B.mixed = c => {
  const { V, E, t0 } = c;
  const g = mk("div", "", gaugeHTML(980, 7.12, { label: "7.12" }), V); g.style.cssText += ";margin-top:40px"; popIn(g, t0 + 0.3, { y: 40 });
  const a = mk("div", "abs pill coral ltr", "CO₂ ↑ pushes pH ↓", V); a.style.cssText += ";left:150px;top:44px;font-size:30px";
  const b = mk("div", "abs pill ink ltr", "HCO₃ ↓ pushes pH ↓", V); b.style.cssText += ";left:150px;top:100px;font-size:30px";
  const t = mk("div", "abs big ltr", "Mixed acidosis", V); t.style.cssText += ";top:350px;left:0;right:0;text-align:center;font-size:60px;color:var(--coral)";
  popIn(a, E("a1", 1), { x: 0 }); popIn(b, E("a2", 3)); popIn(t, E("dx", 5), { s: 0.4 });
  tl.fromTo("#mk", { x: 500 }, { x: 0, duration: 0.8, ease: "power3.out" }, t0 + 0.6);
};

B.mistakes = c => {
  const { V, E, t0, p } = c;
  const col = mk("div", "col", "", V); col.style.cssText += ";gap:14px;align-items:stretch";
  p.items.forEach((t, k) => { const d = mk("div", "card row", '<div class="tile coral" style="width:54px;height:54px"><svg class="ic"><use href="#i-x"/></svg></div><span class="big" style="font-size:28px;flex:1;text-align:right;line-height:1.25">' + t + "</span>", col); d.style.cssText += ";width:980px;padding:12px 22px;justify-content:flex-start;gap:16px;direction:rtl"; popIn(d, E("i" + k, 0.4 + k * 1.5), { y: 30 }); });
};

B.disclaimer = c => {
  const { V, E, t0 } = c;
  const d = mk("div", "card pad row", tile("doctor", "blue", 110) + '<div class="col" style="align-items:flex-end;gap:10px;direction:rtl"><div class="big" style="font-size:46px">القرار العلاجي للدكتور</div><div class="big" style="font-size:36px;color:var(--ink2)">+ بروتوكول المستشفى</div><div class="pill soft" style="font-size:24px">للتعليم والتبسيط فقط</div></div>', V);
  d.style.cssText += ";padding:30px 44px;gap:34px;direction:ltr"; popIn(d, t0 + 0.3, { y: 50 });
};

B.recapfinal = c => {
  const { V, E, t0 } = c;
  const col = mk("div", "col", "", V); col.style.cssText += ";gap:14px;align-items:stretch";
  const D = [["1", "الاتجاه", "pH → Acidosis / Alkalosis"], ["2", "السبب", "ROME → Respiratory / Metabolic"], ["3", "التعويض", "None · Partial · Full"], ["+", "الأكسجة", "PaO₂ · SaO₂"]];
  D.forEach((d, k) => { const e = mk("div", "card row", '<div class="tile ' + (k === 3 ? "ink" : "coral") + '" style="width:60px;height:60px;font-weight:900;color:#fff;font-size:36px">' + d[0] + '</div><span class="big" style="font-size:36px;flex:1;text-align:right">' + d[1] + '</span><span class="tag" style="font-size:22px">' + d[2] + "</span>", col); e.style.cssText += ";width:960px;padding:10px 24px;gap:20px;direction:rtl;justify-content:flex-start"; popIn(e, E("r" + k, 0.4 + k * 1.5), { y: 30 }); });
};

B.outro = c => {
  const { V, E, t0 } = c;
  const g = mk("div", "abs", burstSVG("", 360), V); g.style.cssText += ";left:calc(50% - 180px);top:0";
  tl.fromTo(g, { scale: 0.3, rotation: -40, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.4)" }, t0 + 0.2);
  tl.to(g, { rotation: 120, duration: Math.max(2, c.t1 - c.t0), ease: "none" }, t0 + 1);
  const t = mk("div", "abs col", '<div class="big" style="font-size:120px">سلام</div><div class="row" style="gap:16px"><div class="pill coral">Like</div><div class="pill ink">Subscribe</div><div class="pill soft">The Ultimate Nurse Hacks Cheat Sheet</div></div>', V); t.style.cssText += ";left:0;right:0;top:130px;direction:ltr";
  popIn(t, t0 + 0.5, { s: 0.5, d: 0.6 });
};

B.sample = c => {
  const { V, E, t0 } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:30px;direction:ltr";
  const a = mk("div", "card pad col", tile("syringe", "ink", 120) + '<div class="big" style="font-size:40px">Arterial sample</div><div class="cap" style="direction:rtl">عينة دم من شريان</div>', row); a.style.cssText += ";width:340px;height:330px";
  const ar = mk("div", "tile coral", ic("arrowupdown").replace("arrowupdown", "arrowupdown"), row); ar.style.cssText += ";width:70px;height:70px;transform:rotate(90deg)";
  const b = mk("div", "card pad col", '<svg viewBox="0 0 240 120" style="width:300px;height:150px"><path d="M10 80 C60 40 120 110 230 50" stroke="#e5673f" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M10 80 C60 40 120 110 230 50" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".6"/><circle cx="150" cy="86" r="11" fill="#16140f"/></svg><div class="big" style="font-size:36px">Radial artery</div><div class="cap" style="direction:rtl">الشريان الكعبري · الرسغ</div>', row); b.style.cssText += ";width:400px;height:330px";
  popIn(a, t0 + 0.3, { x: 0, y: 50 }); popIn(ar, t0 + 1.1, { s: 0.3 }); popIn(b, t0 + 1.6, { y: 50 });
};

B.two = c => {
  const { V, E, t0 } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:34px;direction:ltr";
  const a = mk("div", "card pad col", tile("drop", "coral", 110) + '<div class="big" style="font-size:60px">pH</div><div class="cap" style="direction:rtl;font-size:26px">حموضة الدم</div>', row); a.style.cssText += ";width:420px;height:330px";
  const b = mk("div", "card pad col", tile("lung", "blue", 110) + '<div class="row" style="gap:14px"><span class="pill soft ltr" style="font-size:26px">O₂ ↘ in</span><span class="pill soft ltr" style="font-size:26px">CO₂ ↗ out</span></div><div class="cap" style="direction:rtl;font-size:26px">كفاءة الرئة</div>', row); b.style.cssText += ";width:520px;height:330px";
  popIn(a, E("ph", 0.4), { y: 50 }); popIn(b, E("lung", 3), { y: 50 });
};

B.phkeep = c => {
  const { V, E, t0 } = c;
  const g = mk("div", "", gaugeHTML(980, null), V); g.style.cssText += ";margin-top:20px"; popIn(g, t0 + 0.3, { y: 40 });
  const band = g.querySelector("#mk"); band.style.opacity = 1; band.innerHTML = '<div style="position:absolute;left:-60px;top:0;width:120px;text-align:center;background:#16140f;color:#fff;border-radius:12px;font-weight:900;font-size:26px;padding:2px 0">pH ثابت</div><div style="position:absolute;left:-10px;top:40px;border-left:10px solid transparent;border-right:10px solid transparent;border-top:20px solid #16140f"></div>';
  tl.fromTo(band, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "bounce.out" }, t0 + 1.2);
  const l = mk("div", "abs pill coral ltr", "→ acid", V); l.style.cssText += ";left:120px;top:60px;font-size:34px"; const r = mk("div", "abs pill blue ltr", "base ←", V); r.style.cssText += ";right:120px;top:60px;font-size:34px";
  popIn(l, t0 + 2.2, { s: 0.4 }); popIn(r, t0 + 2.6, { s: 0.4 });
  tl.to(l, { x: 24, duration: 0.5, yoyo: true, repeat: 7, ease: "sine.inOut" }, t0 + 3); tl.to(r, { x: -24, duration: 0.5, yoyo: true, repeat: 7, ease: "sine.inOut" }, t0 + 3);
  const cap = mk("div", "abs big", "نطاق ضيق جداً", V); cap.style.cssText += ";top:330px;left:0;right:0;text-align:center;font-size:52px"; popIn(cap, t0 + 3.5, { s: 0.6 });
};

B.quadmap = c => {
  const { V, E, t0, p } = c;
  const g = mk("div", "", "", V); g.style.cssText = "display:grid;grid-template-columns:repeat(2,420px);gap:18px 22px;direction:rtl";
  p.cells.forEach((q, k) => { const e = mk("div", "card pad row", tile(q.ic, q.c, 66) + '<div style="text-align:right;direction:rtl"><div class="big" style="font-size:32px">' + q.title + '</div><div class="cap ltr" style="font-size:19px;text-align:right">' + q.en + "</div></div>", g); e.style.cssText += ";height:140px;justify-content:flex-start;gap:16px"; popIn(e, t0 + 0.5 + k * 0.7, { y: 40 }); });
};

B.bigcell = c => {
  const { V, E, t0, t1, p } = c;
  const wrap = mk("div", "row", "", V); wrap.style.cssText += ";gap:44px;direction:rtl;align-items:center";
  const l = mk("div", "card pad col", tile(p.ic, p.c, 150) + '<div class="big" style="font-size:44px">' + p.title + '</div><div class="pill soft ltr" style="font-size:22px">' + p.en + "</div>", wrap); l.style.cssText += ";width:360px;height:360px";
  const list = mk("div", "col", "", wrap); list.style.cssText += ";gap:10px;align-items:stretch;width:600px";
  const n = p.items.length, span = Math.max(3, (t1 - t0) - 3.5);
  popIn(l, t0 + 0.3, { x: 0, y: 40 });
  p.items.forEach((x, k) => { const d = mk("div", "card row", '<div class="tile ' + p.c + '" style="width:44px;height:44px"><svg class="ic"><use href="#i-check"/></svg></div><span class="big" style="font-size:30px;flex:1;text-align:right;line-height:1.2">' + x + "</span>", list); d.style.cssText += ";padding:10px 18px;justify-content:flex-start;gap:16px;height:62px"; popIn(d, t0 + 1.0 + (k * span) / n, { y: 24 }); });
};
