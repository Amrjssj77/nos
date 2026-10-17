// ===== portrait (9:16) overrides — loaded after scenes.js, only used when REEL.portrait =====
if (PT) {
  B.hook = c => {
    const { V, E, t0 } = c;
    const card = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:12px;direction:ltr;margin-bottom:6px">' + tile("clipboard", "ink", 46) + '<span class="big" style="font-size:28px">ABG REPORT</span></div>' + vrows([{ k: "pH", v: "7.32", f: "low", r: "7.35-7.45" }, { k: "PaCO₂", v: "58", f: "high", r: "35-45" }, { k: "HCO₃", v: "29", f: "high", r: "22-26" }, { k: "PaO₂", v: "62", f: "low", r: "80-100" }], "h"), V);
    pos(card, "width:470px;zoom:1.65;margin-top:-120px"); gsap.set(card, { rotation: -3 });
    popIn(card, t0 + 0.15, { y: 50 });
    const q = [], qs = [[-410, -330], [410, -290], [-410, 150], [410, 190]];
    qs.forEach((p, k) => { const d = mk("div", "abs", '<div class="tile coral" style="width:92px;height:92px;font-weight:900;color:#fff;font-size:58px">?</div>', V); d.style.cssText = "left:calc(50% + " + p[0] + "px - 46px);top:calc(50% + " + p[1] + "px - 46px)"; q.push(d); popIn(d, t0 + 0.5 + k * 0.15, { s: 0.2 }); tl.to(d, { y: -12, duration: 0.5, yoyo: true, repeat: 5, ease: "sine.inOut" }, t0 + 1 + k * 0.1); });
    const st = [];
    [1, 2, 3].forEach((n, k) => { const d = mk("div", "abs", '<div class="tile coral" style="width:130px;height:130px;font-weight:900;color:#fff;font-size:84px">' + n + "</div>", V); d.style.cssText = "left:calc(50% + " + (k - 1) * 180 + "px - 65px);top:790px"; st.push(d); });
    tl.to(q, { opacity: 0, scale: 0.2, duration: 0.25, ease: "power2.in" }, E("steps", 4));
    st.forEach((d, k) => popIn(d, E("steps", 4) + 0.2 + k * 0.16, { s: 0.2, y: 20 }));
    tl.to(card, { scale: 0.88, y: -40, duration: 0.4, ease: "power2.out" }, E("steps", 4) + 0.1);
  };

  B.steps3 = c => {
    const { V, E, t0 } = c;
    const col = mk("div", "col", "", V); col.style.cssText += ";gap:26px;direction:rtl";
    const D = [["1", "الاتجاه", "Direction", "arrowupdown"], ["2", "السبب", "Cause", "search"], ["3", "التعويض", "Compensation", "scale"]];
    const cards = D.map(d => { const e = mk("div", "card pad row", '<div class="tile coral" style="width:110px;height:110px;font-weight:900;color:#fff;font-size:70px">' + d[0] + "</div>" + tile(d[3], "ink", 110) + '<div class="col" style="align-items:flex-start;gap:6px;flex:1"><div class="big" style="font-size:84px">' + d[1] + '</div><div class="cap ltr" style="font-size:34px">' + d[2] + "</div></div>", col); e.style.cssText += ";width:940px;height:270px;justify-content:flex-start;gap:34px;padding:0 44px"; return e; });
    cards.forEach((e, k) => popIn(e, E("s" + (k + 1), 0.5 + k * 0.9), { y: 60 }));
  };

  B.scale1 = c => {
    const { V, E, t0, p } = c;
    const col = mk("div", "col", "", V); col.style.cssText += ";gap:90px;width:1000px";
    const ttl = mk("div", "row", '<div class="tile ink" style="width:110px;height:110px;font-weight:900;color:#fff;font-size:70px">1</div><div class="big" style="font-size:90px">الاتجاه · pH</div>', col); popIn(ttl, t0 + 0.1, { y: -20 });
    const g = mk("div", "", gaugeHTML(940, p.marker, { label: p.label }), col); g.style.cssText += ";zoom:1.0;margin-top:20px"; g.querySelectorAll(".cap").forEach(e => e.style.fontSize = "24px");
    popIn(g, t0 + 0.3, { y: 40 });
    const tags = mk("div", "row", "", col); tags.style.gap = "40px";
    const tag1 = mk("div", "pill coral ltr", "Acidosis", tags); tag1.style.fontSize = "64px"; tag1.style.padding = "12px 40px";
    const tag2 = mk("div", "pill blue ltr", "Alkalosis", tags); tag2.style.fontSize = "64px"; tag2.style.padding = "12px 40px";
    const mkr = g.querySelector("#mk");
    if (p.marker == null) {
      popIn(tag1, E("acid", 3), { s: 0.4 }); popIn(tag2, E("alk", 6), { s: 0.4 }); tag1.style.visibility = "visible";
      tl.fromTo(mkr, { opacity: 0, x: -340 }, { opacity: 1, x: -140, duration: 0.6, ease: "power2.out" }, E("acid", 3) - 0.2);
      tl.to(mkr, { x: 340, duration: 0.8, ease: "power2.inOut" }, E("alk", 6) - 0.2);
    } else {
      const keep = p.marker < 7.35 ? tag1 : tag2, other = p.marker < 7.35 ? tag2 : tag1; other.style.display = "none";
      popIn(keep, E("mark", 1.2), { s: 0.4 }); tl.fromTo(mkr, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "bounce.out" }, E("mark", 1));
    }
  };

  B.rome = c => {
    const { V, E, t0, p } = c;
    const col = mk("div", "col", "", V); col.style.cssText += ";gap:36px;width:1000px";
    const hd = mk("div", "row", '<div class="tile ink" style="width:110px;height:110px;font-weight:900;color:#fff;font-size:70px">2</div><div class="big" style="font-size:90px">السبب · Cause</div>', col); popIn(hd, t0 + 0.1, { y: -20 });
    if (p.part !== "b") {
      const top = mk("div", "row ltr", "", col); top.style.gap = "20px";
      "ROME".split("").forEach((ch, k) => { const d = mk("div", "tile " + (k < 2 ? "coral" : "ink"), '<span style="font-weight:900;font-size:120px;color:#fff">' + ch + "</span>", top); d.style.cssText += ";width:190px;height:190px"; popIn(d, E("rome", 0.4) + k * 0.12, { s: 0.3 }); });
      const lab = mk("div", "col ltr", '<span class="pill soft" style="font-size:44px"><span><b style="color:var(--coral)">R</b>espiratory · <b>O</b>pposite</span></span><span class="pill soft" style="font-size:44px"><span><b>M</b>etabolic · <b>E</b>qual</span></span>', col); lab.style.gap = "20px"; popIn(lab, E("rome", 0.4) + 0.7);
    } else {
      const mkRow = (a, b, res, cls, note) => { const d = mk("div", "card col ltr", '<div class="row" style="gap:30px;width:100%;justify-content:space-between;padding:0 10px"><span class="big" style="font-size:76px">pH <span class="coral-t">' + a + '</span></span><span class="big" style="font-size:76px">' + b + '</span></div><span class="pill ' + cls + '" style="font-size:60px;padding:10px 40px">→ ' + res + '</span><div class="cap" style="font-size:38px;direction:rtl">' + note + "</div>", col); d.style.cssText += ";width:940px;padding:34px 34px;gap:16px"; return d; };
      const r1 = mkRow("↓", 'CO₂ <span class="coral-t">↑</span>', "Respiratory", "coral", "عكس بعض ⇄"), r2 = mkRow("↓", 'HCO₃ <span class="coral-t">↓</span>', "Metabolic", "ink", "زي بعض ⇉");
      popIn(r1, E("ex1", 3), { y: 50 }); popIn(r2, E("ex2", 5), { y: 50 });
    }
  };

  B.comp3 = c => {
    const { V, E, t0 } = c;
    const col = mk("div", "col", "", V); col.style.cssText += ";gap:22px;direction:ltr";
    const hd = mk("div", "row", '<div class="tile coral" style="width:100px;height:100px">' + ic("scale") + '</div><div class="big" style="font-size:76px">3 · التعويض</div>', col); popIn(hd, t0 + 0.15, { y: -20 });
    const D = [["Uncompensated", "مفيش تعويض", "القيمة التانية لسه طبيعية", 7.28, "coral", "unc"], ["Partially compensated", "تعويض جزئي", "اتحرّكت و pH لسه مش طبيعي", 7.32, "blue", "part"], ["Fully compensated", "تعويض كامل", "pH رجع طبيعي", 7.38, "green", "full"]];
    D.forEach((d, k) => {
      const e = mk("div", "card pad col", '<div class="row" style="width:100%;justify-content:space-between"><span class="pill ' + d[4] + '" style="font-size:38px">' + d[0] + '</span><span class="big" style="font-size:60px;direction:rtl">' + d[1] + '</span></div><div class="cap" style="font-size:34px;direction:rtl;text-align:right;width:100%">' + d[2] + '</div><div style="position:relative;width:860px;height:40px;direction:ltr"><div style="position:absolute;left:0;top:16px;width:44%;height:14px;background:#f3b9a5;border-radius:7px 0 0 7px"></div><div style="position:absolute;left:44%;top:16px;width:12.5%;height:14px;background:#1f9d6b"></div><div style="position:absolute;left:56.5%;top:16px;right:0;height:14px;background:#8fb0f0;border-radius:0 7px 7px 0"></div><div style="position:absolute;left:' + X7(d[3]) + '%;top:0;width:0"><div style="position:absolute;left:-11px;top:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:20px solid #16140f"></div></div></div>', col);
      e.style.cssText += ";width:940px;height:260px;gap:12px;align-items:stretch;justify-content:center"; popIn(e, E(d[5], 0.5 + k * 1.5), { y: 50 });
    });
  };

  B.recap3 = c => {
    const { V, E, t0 } = c;
    const row = mk("div", "row", "", V); row.style.cssText += ";gap:30px;direction:rtl";
    ["الاتجاه", "السبب", "التعويض"].forEach((tx, k) => { const e = mk("div", "col", '<div class="tile coral" style="width:200px;height:200px;font-weight:900;color:#fff;font-size:130px">' + (k + 1) + '</div><div class="big" style="font-size:70px">' + tx + "</div>", row); popIn(e, E("r" + (k + 1), 0.3 + k * 0.7), { s: 0.3, y: 30 }); });
  };

  B.patient = c => {
    const { V, E, t0 } = c;
    const wrap = mk("div", "col", "", V); wrap.style.cssText += ";gap:34px;direction:ltr";
    const pc = mk("div", "card pad col", tile("user", "ink", 110) + '<div class="big ltr" style="font-size:44px">68 y · Male</div><div class="row" style="gap:10px"><span class="tag">COPD</span><span class="tag">SOB 2 days</span></div><div class="row" style="gap:10px"><span class="tag" style="background:#fde3d9;color:var(--coral)">drowsy</span><span class="tag" style="background:#fde3d9;color:var(--coral)">exhausted</span></div>', wrap);
    pc.style.cssText += ";width:380px;height:370px;zoom:1.3"; popIn(pc, t0 + 0.3, { y: 50 });
    const g = mk("div", "", "", wrap); g.style.cssText = "display:grid;grid-template-columns:repeat(2,250px);gap:16px;zoom:1.62";
    const V4 = [["RR", "28", "/min", "wind", "rr"], ["HR", "108", "bpm", "heartpulse", "hr"], ["BP", "138/84", "mmHg", "gauge", "bp"], ["SpO₂", "89%", "", "drop", "spo2"]];
    V4.forEach((d, k) => { const e = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:12px;direction:ltr">' + tile(d[3], k === 3 ? "coral" : "ink", 52) + '<div><div class="cap ltr">' + d[0] + '</div><div class="big ltr" style="font-size:42px">' + d[1] + '<span class="cap" style="font-size:20px"> ' + d[2] + "</span></div></div></div>", g); e.style.height = "150px"; popIn(e, E(d[4], 1 + k), { y: 40 }); });
  };

  const _cc = B.casecard;
  B.casecard = c => {
    const { V, E, t0, p } = c;
    const five = p.values.length >= 5;
    const wrap = mk("div", "col", "", V); wrap.style.cssText += ";gap:" + (five ? 22 : 30) + "px;direction:ltr";
    const card = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:14px;margin-bottom:6px">' + tile(p.icon || "user", "ink", 54) + '<div style="text-align:right"><div class="big" dir="auto" style="font-size:28px">' + (p.title || "") + '</div><div class="cap" dir="auto" style="font-size:19px">' + (p.sub || "") + "</div></div></div>" + vrows(p.values, "cv" + c.idx + "_"), wrap);
    card.style.cssText += ";width:500px;zoom:" + (five ? 1.3 : 1.6);
    const steps = mk("div", "col", "", wrap); steps.style.cssText += ";align-items:stretch;gap:12px;width:430px;direction:rtl;zoom:" + (five ? 1.55 : 1.65);
    const sEls = (p.steps || []).map((tx, k) => mk("div", "card row", '<div class="tile coral" style="width:50px;height:50px;font-weight:900;color:#fff;font-size:30px">' + (k + 1) + '</div><span class="big" style="font-size:25px;flex:1;text-align:right;line-height:1.25">' + tx + "</span>", steps));
    sEls.forEach(e => e.style.cssText += ";padding:10px 16px;justify-content:flex-start;gap:14px");
    const verdict = mk("div", "pill " + (p.vcls || "ink") + " ltr", p.verdict || "", wrap); verdict.style.cssText += ";font-size:" + (five ? 46 : 46) + "px;justify-content:center;text-align:center;padding:14px 38px;max-width:960px";
    popIn(card, t0 + 0.25, { y: 50, d: 0.55 });
    p.values.forEach((v, k) => { const id = "#cv" + c.idx + "_" + k; if (p.reveal !== false) tl.fromTo(id, { opacity: 0.0, x: -16 }, { opacity: 1, x: 0, duration: 0.3 }, E("v" + k, 0.6 + k * 0.45)); });
    if (p.focus != null) { const ids = [].concat(p.focus).map(k => "#cv" + c.idx + "_" + k); tl.to(ids, { backgroundColor: "rgba(229,103,63,0.16)", duration: 0.3 }, E("focus", 0.6)); }
    if (p.focus2 != null) tl.to("#cv" + c.idx + "_" + p.focus2, { backgroundColor: "rgba(229,103,63,0.16)", duration: 0.3 }, E("focus2", 3));
    sEls.forEach((e, k) => popIn(e, E("s" + (k + 1), 3 + k), { x: 0, y: 30 }));
    if (p.verdict) { popIn(verdict, E("dx", 6), { s: 0.3 }); tl.to(verdict, { scale: 1.05, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, E("dx", 6) + 0.5); } else verdict.style.display = "none";
  };
}
