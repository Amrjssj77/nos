// ===== Omarchy video: scene builders (all 1280x720, light style) =====
function vcard(c, w, opts) {
  opts = opts || {};
  const card = mk("div", "card vc", "", opts.parent || c.V);
  const h = Math.round(w * 473 / 842);
  card.style.cssText += ";width:" + w + "px;height:" + h + "px;border-radius:22px;overflow:hidden;position:relative;padding:0;background:#0d0d0d;flex:none";
  const v = document.getElementById("vid" + c.idx);
  if (v) { v.style.cssText = "width:100%;height:100%;object-fit:cover;display:block"; card.appendChild(v); }
  const dots = mk("div", "abs", '<i style="background:#fb4a5a"></i><i style="background:#fbbf24"></i><i style="background:#34d399"></i>', card);
  dots.style.cssText = "left:14px;top:10px;display:flex;gap:7px;z-index:3;opacity:.9"; dots.querySelectorAll("i").forEach(i => i.style.cssText = "width:11px;height:11px;border-radius:50%;display:block");
  return card;
}
function typeWords(el, text, t, dur) {
  const ws = text.split(" "); el.innerHTML = "";
  const spans = ws.map(w => { const s = mk("span", "", w + " ", el); s.style.opacity = 0; return s; });
  spans.forEach((s, i) => tl.set(s, { opacity: 1 }, t + (dur * i) / ws.length));
  return spans;
}
const T64 = (n, c) => tile(n, c, 64);
function chip(txt, cls) { return '<span class="pill ' + (cls || "soft") + '" style="font-size:24px;padding:6px 18px">' + txt + "</span>"; }

B.hero = c => {
  const { V, E, t0, p } = c;
  const w = p.w || 700;
  const card = vcard(c, w); gsap.set(card, { rotation: p.rot == null ? -2 : p.rot });
  popIn(card, t0 + 0.2, { y: 60, d: 0.6 });
  (p.tiles || [["code", "ink", -470, -150], ["sliders", "coral", 440, -130], ["spark", "blue", -440, 120], ["shield", "green", 450, 140]]).forEach((x, k) => {
    const d = mk("div", "abs", tile(x[0], x[1], 84), V); d.style.cssText += ";left:calc(50% + " + x[2] + "px - 42px);top:calc(50% + " + x[3] + "px - 42px)";
    gsap.set(d, { rotation: k % 2 ? 8 : -8 }); popIn(d, E("t" + k, 0.9 + k * 0.45), { s: 0.2 });
    tl.to(d, { y: -9, duration: 0.7, yoyo: true, repeat: 7, ease: "sine.inOut" }, t0 + 1.5 + k * 0.1);
  });
  if (p.badge) { const b = mk("div", "abs pill " + (p.bc || "coral"), p.badge, V); b.style.cssText += ";left:50%;top:6px;transform:translateX(-50%);font-size:30px"; gsap.set(b, { xPercent: -50, x: 0 }); b.style.transform = ""; popIn(b, E("badge", 1.2), { s: 0.4 }); }
};

B.vs2 = c => {
  const { V, E, t0, p } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:50px;direction:ltr";
  [p.a, p.b].forEach((d, k) => {
    const e = mk("div", "card pad col", tile(d.icon, d.c || "ink", 110) + '<div class="big ltr" style="font-size:54px">' + d.name + '</div><div class="row" style="gap:10px;flex-wrap:wrap">' + d.tags.map(t => '<span class="pill ' + (t[1] || "soft") + '" style="font-size:24px;padding:6px 16px">' + t[0] + "</span>").join("") + "</div>", row);
    e.style.cssText += ";width:450px;height:340px;position:relative";
    popIn(e, E(k ? "b" : "a", 0.4 + k * 1.2), { y: 50 });
    const st = mk("div", "abs tile coral", ic(d.stamp || "lock"), e); st.style.cssText += ";width:76px;height:76px;right:-16px;top:-16px";
    gsap.set(st, { rotation: 10 }); popIn(st, E("x" + k, 3 + k), { s: 0.2 });
  });
};

B.bigicon = c => {
  const { V, E, t0, p } = c;
  const card = mk("div", "card pad col", tile(p.icon, p.c || "ink", p.size || 130) + '<div class="big" style="font-size:' + (p.fs || 64) + 'px;text-align:center;line-height:1.1;direction:rtl">' + p.title + "</div>" + (p.sub ? '<div class="cap" style="font-size:30px;direction:rtl;text-align:center">' + p.sub + "</div>" : "") + '<div class="row" id="bi' + c.idx + '" style="gap:10px;flex-wrap:wrap">' + (p.tags || []).map(t => '<span class="pill ' + (t[1] || "soft") + '" style="font-size:26px;padding:6px 20px">' + t[0] + "</span>").join("") + "</div>", V);
  card.style.cssText += ";min-width:640px;max-width:900px;padding:34px 48px;gap:16px";
  popIn(card, t0 + 0.25, { y: 50, d: 0.55 });
  card.querySelectorAll("#bi" + c.idx + " .pill").forEach((e, k) => popIn(e, E("i" + k, 1.2 + k * 0.5), { s: 0.3, y: 14 }));
  if (p.stamp) { const st = mk("div", "abs tile " + (p.stampc || "coral"), ic(p.stamp), card); st.style.cssText += ";width:80px;height:80px;right:-18px;top:-18px"; gsap.set(st, { rotation: 10 }); popIn(st, E("stamp", 1.5), { s: 0.2 }); }
};

B.bars = c => { // horizontal bars comparison
  const { V, E, t0, p } = c;
  const card = mk("div", "card pad", '<div class="row" style="justify-content:flex-start;gap:14px;margin-bottom:14px;direction:rtl">' + tile(p.icon || "gauge", p.ic || "ink", 60) + '<div class="big" style="font-size:38px">' + p.title + "</div></div>", V);
  card.style.cssText += ";width:900px;padding:26px 36px";
  if (p.sub) { const sb = mk("div", "cap", p.sub, card); sb.style.cssText += ";font-size:26px;direction:rtl;text-align:right;margin:-6px 0 10px"; }
  p.rows.forEach((r, k) => {
    const row = mk("div", "row", '<div style="width:230px;text-align:right;font-weight:900;font-size:30px;direction:rtl">' + r.label + '</div><div class="bar" style="flex:1;height:34px"><i id="br' + c.idx + "_" + k + '" style="left:0;width:' + r.pct + "%;background:" + (r.color || "#e5673f") + ';border-radius:17px;transform-origin:left center"></i></div><div class="big ltr" style="width:90px;font-size:32px;color:' + (r.color || "#e5673f") + '">' + (r.val || r.pct + "%") + "</div>", card);
    row.style.cssText += ";gap:18px;margin:10px 0;direction:ltr;justify-content:flex-start";
    popIn(row, E("i" + k, 0.6 + k * 1.2), { y: 20 });
    tl.fromTo("#br" + c.idx + "_" + k, { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: "power2.out" }, E("i" + k, 0.6 + k * 1.2) + 0.15);
  });
};

B.adwin = c => {
  const { V, E, t0 } = c;
  const w = mk("div", "card", '<div style="height:44px;background:#e6e1d6;border-radius:24px 24px 0 0;display:flex;align-items:center;padding:0 18px;gap:8px"><i style="width:12px;height:12px;border-radius:50%;background:#16140f"></i><b style="font-size:18px;color:#5b564b">Start</b></div><div style="padding:24px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;direction:ltr">' + ["folder", "globe", "clipboard", "terminal", "clock", "star", "user", "bell"].map(n => '<div class="tile soft" style="width:100%;height:84px">' + ic(n) + "</div>").join("") + "</div>", V);
  w.style.cssText += ";width:780px;height:410px;position:relative;overflow:hidden";
  const ad = mk("div", "abs col", '<span class="tag" style="background:#16140f;color:#fff">AD</span><div class="big" style="font-size:54px;color:#fff;direction:rtl">إعلان جديد في وشك!</div><div class="pill soft" style="font-size:24px;direction:rtl">اشترك الآن · عرض محدود</div>', w);
  ad.style.cssText += ";left:60px;right:60px;top:110px;height:210px;background:linear-gradient(135deg,#e5673f,#c4481f);border-radius:22px;box-shadow:0 20px 40px rgba(0,0,0,.35);justify-content:center;gap:10px";
  const x = mk("div", "abs tile ink", ic("x"), ad); x.style.cssText += ";width:46px;height:46px;right:12px;top:12px;opacity:.85";
  const lk = mk("div", "abs tile soft", ic("lock"), ad); lk.style.cssText += ";width:56px;height:56px;right:-14px;bottom:-14px";
  popIn(w, t0 + 0.25, { y: 50 }); popIn(ad, E("ad", 1.2), { y: 40, s: 0.6, ease: "back.out(1.9)" }); popIn(lk, E("lock", 4), { s: 0.2 });
  tl.to(ad, { x: 8, duration: 0.07, yoyo: true, repeat: 5, ease: "none" }, E("lock", 4) + 0.2); tl.set(ad, { x: 0 }, E("lock", 4) + 0.7);
};

B.chat = c => {
  const { V, E, t0, p } = c;
  const win = mk("div", "card", '<div style="height:48px;background:#efebe2;border-radius:26px 26px 0 0;display:flex;align-items:center;gap:10px;padding:0 20px;direction:ltr">' + tile(p.icon || "spark", "coral", 30) + '<b style="font-size:22px">' + (p.title || "AI Agent") + "</b></div>", V);
  win.style.cssText += ";width:" + (p.w || 880) + "px;padding-bottom:20px";
  const body = mk("div", "col", "", win); body.style.cssText += ";align-items:stretch;gap:14px;padding:22px 26px;direction:rtl";
  p.lines.forEach((l, k) => {
    const me = l.who !== "ai";
    const b = mk("div", "", "", body);
    b.style.cssText = "max-width:700px;padding:16px 22px;border-radius:22px;font-weight:700;font-size:" + (l.fs || 30) + "px;line-height:1.35;direction:rtl;" + (me ? "align-self:flex-start;background:#16140f;color:#fff" : "align-self:flex-end;background:#f6e3da;color:#16140f");
    popIn(b, E("m" + k, 0.6 + k * 2.2), { y: 20, s: 0.9, d: 0.3 });
    typeWords(b, l.text, E("m" + k, 0.6 + k * 2.2) + 0.15, l.dur || 2.0);
  });
};

B.enter = c => {
  const { V, E, t0 } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:50px;direction:ltr";
  const card = vcard(c, 640, { parent: row }); popIn(card, t0 + 0.2, { y: 50 });
  const col = mk("div", "col", "", row); col.style.gap = "24px";
  const key = mk("div", "", '<span style="font-weight:900;font-size:54px">Enter ↵</span>', col);
  key.style.cssText = "width:300px;height:130px;border-radius:24px;background:#fff;border:3px solid #16140f;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 0 #16140f";
  popIn(key, t0 + 0.6, { y: 30 });
  tl.to(key, { y: 12, boxShadow: "0 2px 0 #16140f", duration: 0.12, yoyo: true, repeat: 1, ease: "power2.inOut" }, E("enter", 1));
  const toast = mk("div", "pill green", ic("check").replace('class="ic"', 'class="ic" style="width:30px;height:30px"') + " تم التعديل", col); toast.style.fontSize = "34px";
  popIn(toast, E("done", 2.6), { s: 0.4 });
};

B.morph = c => {
  const { V, E, t0 } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:40px;direction:ltr";
  const card = vcard(c, 640, { parent: row }); popIn(card, t0 + 0.2, { y: 50 });
  const col = mk("div", "col", "", row); col.style.gap = "18px";
  const sw = ["#e5673f", "#3b6fe0", "#1f9d6b", "#16140f"]; const sws = sw.map(cc => { const d = mk("div", "", "", col); d.style.cssText = "width:240px;height:64px;border-radius:18px;background:" + cc + ";border:4px solid transparent;box-shadow:0 8px 20px rgba(0,0,0,.18)"; return d; });
  sws.forEach((d, k) => { popIn(d, t0 + 0.7 + k * 0.25, { x: 0, y: 20 }); tl.to(d, { borderColor: "#fff", scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 }, t0 + 2.2 + k * 0.7); });
  const sl = mk("div", "tile ink", ic("sliders"), col); sl.style.cssText += ";width:90px;height:90px"; popIn(sl, t0 + 1.8, { s: 0.3 });
};

B.cards3 = c => {
  const { V, E, t0, p } = c;
  const n = p.cards.length, w = p.cw || Math.floor((1180 - (n - 1) * 24) / n);
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:24px;direction:rtl;align-items:stretch";
  p.cards.forEach((d, k) => {
    const e = mk("div", "card pad col", tile(d.icon, d.c || "ink", 96) + '<div class="big" style="font-size:' + (d.fs || 40) + 'px;text-align:center;line-height:1.15;direction:rtl">' + d.title + "</div>" + (d.sub ? '<div class="cap" style="font-size:25px;text-align:center;direction:rtl">' + d.sub + "</div>" : "") + (d.tag ? '<span class="pill ' + (d.tagc || "soft") + ' ltr" style="font-size:22px;padding:5px 16px">' + d.tag + "</span>" : ""), row);
    e.style.cssText += ";width:" + w + "px;min-height:" + (p.h || 320) + "px;padding:24px 18px;gap:12px";
    popIn(e, E("i" + k, 0.5 + k * 1.2), { y: 50 });
  });
};

B.equation = c => {
  const { V, E, t0, p } = c;
  const col = mk("div", "col", "", V); col.style.gap = "20px";
  const row = mk("div", "row", "", col); row.style.cssText += ";gap:22px;direction:ltr";
  const mkp = (d, big) => { const e = mk("div", "card pad col", tile(d.icon, d.c, big ? 84 : 76) + '<div class="big" style="font-size:' + (big ? 32 : 30) + 'px;direction:rtl;text-align:center">' + d.label + "</div>", row); e.style.cssText += ";width:" + (big ? 330 : 300) + "px;height:170px;gap:8px"; return e; };
  const a = mkp(p.a), b = mkp(p.b), r = mkp(p.r, true);
  const plus = mk("div", "tile ink", '<span style="font-weight:900;font-size:52px;color:#fff">+</span>', null), eq = mk("div", "tile coral", '<span style="font-weight:900;font-size:52px;color:#fff">=</span>', null);
  [plus, eq].forEach(d => d.style.cssText += ";width:62px;height:62px");
  row.insertBefore(plus, b); row.insertBefore(eq, r);
  popIn(a, E("a", 0.4), { y: 40 }); popIn(plus, E("a", 0.4) + 0.5, { s: 0.3 }); popIn(b, E("b", 1.6), { y: 40 }); popIn(eq, E("r", 3) - 0.3, { s: 0.3 }); popIn(r, E("r", 3), { y: 40, s: 0.6, ease: "back.out(1.9)" });
  if (document.getElementById("vid" + c.idx)) { const v = vcard(c, p.vw || 430, { parent: col }); popIn(v, t0 + 0.7, { y: 40 }); }
};

B.devices = c => {
  const { V, E, t0, p } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:26px;direction:ltr";
  p.items.forEach((d, k) => {
    const e = mk("div", "card pad col", tile(d.icon, d.c || "ink", 100) + '<div class="big ltr" style="font-size:32px">' + d.name + "</div>", row);
    e.style.cssText += ";width:270px;height:250px;position:relative";
    const ck = mk("div", "abs tile green", ic("check"), e); ck.style.cssText += ";width:54px;height:54px;right:-12px;top:-12px";
    popIn(e, E("i" + k, 0.4 + k * 0.6), { y: 40 }); popIn(ck, E("i" + k, 0.4 + k * 0.6) + 0.35, { s: 0.2 });
  });
  const b = mk("div", "abs pill coral", p.big || "أي كمبيوتر", V); b.style.cssText += ";left:50%;bottom:10px;font-size:50px;padding:10px 46px"; gsap.set(b, { xPercent: -50 }); popIn(b, E("big", 3), { s: 0.3 });
};

B.counter = c => {
  const { V, E, t0, p } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:36px;direction:ltr";
  const card = mk("div", "card pad col", tile(p.icon, p.ic || "ink", 100) + '<div class="big" id="cn' + c.idx + '" style="font-size:' + (p.fs || 190) + 'px;color:var(--coral)">' + (p.pre || "") + '0' + (p.unit || "") + '</div><div class="big" style="font-size:42px;direction:rtl">' + p.label + "</div>" + (p.sub ? '<div class="cap" style="font-size:28px;direction:rtl">' + p.sub + "</div>" : ""), row);
  card.style.cssText += ";min-width:620px;padding:30px 50px;gap:12px";
  popIn(card, t0 + 0.25, { y: 50 });
  const o = { v: 0 }; const dec = p.dec || 0;
  tl.to(o, { v: p.n, duration: 1.4, ease: "power2.out", onUpdate: () => { const el = document.getElementById("cn" + c.idx); if (el) el.textContent = (p.pre || "") + (dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString("en-US")) + (p.unit || ""); } }, E("num", 0.8));
  if (p.side) { const s = mk("div", "col", "", row); s.style.gap = "16px"; p.side.forEach((d, k) => { const e = mk("div", "card row", tile(d[0], d[1] || "ink", 60) + '<span class="big" style="font-size:32px;direction:rtl">' + d[2] + "</span>", s); e.style.cssText += ";padding:14px 24px;gap:16px;width:420px;justify-content:flex-start;direction:ltr"; popIn(e, E("s" + k, 2 + k * 1.2), { y: 30 }); }); }
};

B.fwvid = c => {
  const { V, E, t0, p } = c;
  const card = vcard(c, 780); popIn(card, t0 + 0.2, { y: 50 });
  const tag = mk("div", "abs pill coral ltr", p.tag || "Framework laptop", V); tag.style.cssText += ";left:130px;bottom:6px;font-size:30px"; popIn(tag, E("tag", 2.5), { s: 0.4 });
  if (p.note) { const n = mk("div", "abs pill soft", p.note, V); n.style.cssText += ";right:130px;bottom:6px;font-size:28px;direction:rtl"; popIn(n, E("note", 6), { s: 0.4 }); }
};

B.steps = c => {
  const { V, E, t0, p } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:18px;direction:ltr";
  p.steps.forEach((d, k) => {
    if (k) { const a = mk("div", "tile ink", ic("arrowr"), row); a.style.cssText += ";width:52px;height:52px"; popIn(a, E("i" + k, 0.6 + k * 1.2) - 0.25, { s: 0.2 }); }
    const e = mk("div", "card pad col", '<div class="tile coral" style="width:54px;height:54px;font-weight:900;color:#fff;font-size:34px">' + (k + 1) + "</div>" + tile(d.icon, d.c || "ink", 96) + '<div class="big" style="font-size:32px;text-align:center;direction:rtl;line-height:1.15">' + d.title + "</div>" + (d.sub ? '<div class="cap" style="font-size:22px;text-align:center;direction:rtl">' + d.sub + "</div>" : ""), row);
    e.style.cssText += ";width:" + (p.sw || 330) + "px;min-height:340px;gap:12px";
    popIn(e, E("i" + k, 0.6 + k * 1.2), { y: 50 });
  });
};

B.stack = c => {
  const { V, E, t0, p } = c;
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:36px;direction:ltr";
  const col = mk("div", "col", "", row); col.style.cssText += ";gap:14px;align-items:stretch";
  p.layers.forEach((d, k) => {
    if (k) { const a = mk("div", "abs", "", col); }
    const e = mk("div", "card row", tile(d.icon, d.c, 80) + '<div style="text-align:right;direction:rtl;flex:1"><div class="big" style="font-size:32px;white-space:nowrap">' + d.title + '</div><div class="cap" style="font-size:22px">' + d.sub + "</div></div>" + '<span class="tag">' + d.tag + "</span>", col);
    e.style.cssText += ";width:620px;height:130px;padding:0 24px;gap:18px;justify-content:flex-start;direction:ltr";
    popIn(e, E("i" + k, 0.6 + k * 2.4), { y: 40 });
  });
  if (document.getElementById("vid" + c.idx)) { const v = vcard(c, 500, { parent: row }); popIn(v, t0 + 0.6, { y: 40 }); }
};

B.chart = c => {
  const { V, E, t0, p } = c;
  const card = mk("div", "card pad col", '<div class="row" style="gap:14px;direction:rtl">' + tile("chart", "green", 64) + '<div class="big" style="font-size:42px">' + p.title + '</div></div><div class="row" id="ch' + c.idx + '" style="align-items:flex-end;gap:22px;height:260px;direction:ltr"></div>', V);
  card.style.cssText += ";padding:28px 60px;gap:14px;min-width:760px";
  const ch = card.querySelector("#ch" + c.idx);
  [50, 70, 90, 120, 160, 200, 250].forEach((h, k) => { const b = mk("div", "", "", ch); b.style.cssText = "width:70px;height:" + h + "px;border-radius:14px 14px 4px 4px;background:linear-gradient(180deg,#34d399,#1f9d6b);transform-origin:bottom center"; tl.fromTo(b, { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: "power3.out" }, E("grow", 0.6) + k * 0.22); });
  popIn(card, t0 + 0.2, { y: 40 });
  const up = mk("div", "abs tile green", ic("arrowup"), V); up.style.cssText += ";width:96px;height:96px;right:140px;top:30px"; popIn(up, E("grow", 0.6) + 1.7, { s: 0.2 });
};

B.cta = c => {
  const { V, E, t0, p } = c;
  if (p.head) { const h = mk("div", "abs big", p.head, V); h.style.cssText += ";left:0;right:0;top:8px;text-align:center;font-size:62px;direction:rtl"; popIn(h, t0 + 0.2, { y: -20 }); }
  const row = mk("div", "row", "", V); row.style.cssText += ";gap:34px;direction:ltr;margin-top:" + (p.head ? 70 : 0) + "px";
  const like = mk("div", "card pad col", tile("thumb", "coral", 120) + '<div class="big" style="font-size:44px">Like</div>', row); like.style.cssText += ";width:250px;height:290px";
  const sub = mk("div", "card pad col", '<div class="pill coral" style="font-size:44px;padding:18px 40px;box-shadow:0 12px 24px rgba(229,103,63,.4)">Subscribe</div><div class="cap" style="margin-top:16px;font-size:26px;direction:rtl">واشترك في القناة</div>', row); sub.style.cssText += ";width:380px;height:290px";
  const bell = mk("div", "card pad col", tile("bell", "ink", 120) + '<div class="big" style="font-size:44px">Bell</div>', row); bell.style.cssText += ";width:250px;height:290px";
  popIn(like, E("like", 0.8), { s: 0.4 }); popIn(sub, E("sub", 0.5), { s: 0.4 }); popIn(bell, E("bell", 2), { s: 0.4 });
  tl.to(like.firstChild, { scale: 1.25, rotation: -14, duration: 0.18, yoyo: true, repeat: 3 }, E("like", 0.8) + 0.5);
  tl.to(bell.firstChild, { rotation: 18, duration: 0.1, yoyo: true, repeat: 9, ease: "sine.inOut" }, E("bell", 2) + 0.4);
  tl.to(sub.firstChild, { scale: 1.07, duration: 0.25, yoyo: true, repeat: 5 }, E("sub", 0.5) + 0.4);
  if (p.comment) { const cm = mk("div", "abs row card", tile("comment", "blue", 56) + '<span class="big" style="font-size:30px">اكتب في التعليقات</span>', V); cm.style.cssText += ";bottom:6px;left:calc(50% - 230px);padding:10px 26px;gap:14px;border-radius:999px"; popIn(cm, E("comment", 8), { s: 0.4 }); }
};

B.outro = c => {
  const { V, E, t0 } = c;
  const g = mk("div", "abs", burstSVG("", 360), V); g.style.cssText += ";left:calc(50% - 180px);top:0";
  tl.fromTo(g, { scale: 0.3, rotation: -40, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.4)" }, t0 + 0.2);
  tl.to(g, { rotation: 120, duration: Math.max(2, c.t1 - c.t0), ease: "none" }, t0 + 1);
  const t = mk("div", "abs col", '<div class="big" style="font-size:96px;direction:rtl">الرحلة لسه في أولها</div><div class="row" style="gap:16px"><div class="pill coral">Like</div><div class="pill ink">Subscribe</div><div class="pill soft ltr">Omarchy</div></div>', V); t.style.cssText += ";left:0;right:0;top:130px;direction:ltr";
  popIn(t, t0 + 0.5, { s: 0.5, d: 0.6 });
};
