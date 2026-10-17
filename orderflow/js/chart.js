/* Canvas chart: footprint / candles / heatmap / profile / overlays / sub-panes. */
(function (G) {
  const C = { bg: '#0a0d12', grid: '#151a22', txt: '#8b95a5', up: '#2ebd85', dn: '#f6465d', acc: '#f0b90b', blue: '#4c9aff', purple: '#b07cff', cross: '#5b6678' };
  const PANE_LABEL = { volume: 'Volume', delta: 'Delta', cvd: 'Cum. Delta (CVD)', rsi: 'RSI 14', macd: 'MACD 12/26/9', atr: 'ATR 14', regime: 'Regime (ER / VR)', deltaPct: 'Delta % of volume' };

  function Chart(canvas, engine) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.e = engine;
    this.s = {
      type: 'footprint', barW: 74, off: 4, scale: 1,
      show: { vwap: true, vbands: false, ema9: false, ema21: false, sma50: false, boll: false, heat: false, profile: true, sess: false, poc: true, imb: true, stack: true, absorb: true, ice: true, big: true, div: true, summary: true, ladder: true },
      panes: ['delta', 'cvd'],
    };
    this.dirty = true; this.mouse = null; this.ind = null; this.indKey = '';
    this.bind();
  }
  const P = Chart.prototype;
  P.invalidate = function () { this.dirty = true; };
  P.bind = function () {
    const cv = this.cv; let drag = null;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, off: this.s.off }; });
    cv.addEventListener('pointerup', () => (drag = null));
    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect(); this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (drag) { this.s.off = drag.off + (e.clientX - drag.x) / this.s.barW; this.clampOff(); }
      this.dirty = true;
    });
    cv.addEventListener('pointerleave', () => { this.mouse = null; this.hoverIdx = null; this.dirty = true; });
    cv.addEventListener('dblclick', () => { this.s.off = 4; this.s.scale = 1; this.dirty = true; });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      if (e.shiftKey) this.s.scale = Math.min(4, Math.max(0.4, this.s.scale * (e.deltaY > 0 ? 1.1 : 0.9)));
      else { const f = e.deltaY > 0 ? 0.9 : 1.1; this.s.barW = Math.min(240, Math.max(5, this.s.barW * f)); }
      this.dirty = true;
    }, { passive: false });
  };
  P.clampOff = function () { const n = this.e.bars.length; this.s.off = Math.max(-5, Math.min(n - 5, this.s.off)); };
  P.fmt = function (p) { return p.toFixed(this.e.inst.dec); };
  P.compute = function () {
    const b = this.e.bars, key = b.length + ':' + (b.length ? b[b.length - 1].n : 0) + ':' + this.e.tf;
    if (key !== this.indKey) { this.ind = G.Ind.compute(b); this.indKey = key; }
    return this.ind;
  };
  const nice = r => { const p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; };
  const abbr = v => { const a = Math.abs(v); return a >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : a >= 1e4 ? (v / 1e3).toFixed(1) + 'K' : a >= 1e3 ? (v / 1e3).toFixed(2) + 'K' : String(Math.round(v)); };

  P.draw = function () {
    if (!this.dirty) return; this.dirty = false;
    const cv = this.cv, dpr = window.devicePixelRatio || 1, cw = cv.clientWidth, ch = cv.clientHeight;
    if (!cw || !ch) return;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    const g = this.ctx; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = C.bg; g.fillRect(0, 0, cw, ch);
    const e = this.e, bars = e.bars, s = this.s, inst = e.inst;
    if (!bars.length) { g.fillStyle = C.txt; g.fillText('Waiting for data…', 20, 30); return; }
    const ind = this.compute();
    const axisW = 66, timeH = 22, paneH = 84;
    const panes = s.panes, nP = panes.length;
    const profW = s.show.profile ? 92 : 0;
    const plotR = cw - axisW - profW, sumH = (s.type === 'footprint' && s.show.summary && s.barW >= 52) ? 46 : 0;
    const priceH = Math.max(120, ch - timeH - nP * paneH);
    const L = { cw, ch, axisW, timeH, paneH, plotR, priceTop: 0, priceH, profW, sumH };
    this.L = L;
    const bw = s.barW, n = bars.length;
    const xc = i => plotR - bw * (n - 1 - i + s.off) - bw * 0.5;
    this.xc = xc;
    const i0 = Math.max(0, Math.floor(n - 1 + s.off - plotR / bw) - 1), i1 = Math.min(n - 1, Math.ceil(n - 1 + s.off) + 1);
    this.i0 = i0; this.i1 = i1;
    // visible price range
    let hi = -Infinity, lo = Infinity;
    for (let i = i0; i <= i1; i++) { const b = bars[i]; if (b.h > hi) hi = b.h; if (b.l < lo) lo = b.l; }
    if (!isFinite(hi)) { hi = bars[n - 1].h; lo = bars[n - 1].l; }
    const tk = inst.tick, minR = tk * 20; if (hi - lo < minR) { const m = (hi + lo) / 2; hi = m + minR / 2; lo = m - minR / 2; }
    const pad = (hi - lo) * 0.08 * s.scale, top = priceH - sumH - 8;
    const pMax = hi + pad, pMin = lo - pad - (sumH ? 0 : 0);
    const y = p => 10 + (pMax - p) / (pMax - pMin) * (top - 10);
    this.y = y; this.pMax = pMax; this.pMin = pMin;
    const rowPx = e.mult * tk / (pMax - pMin) * (top - 10);
    this.rowPx = rowPx;

    g.save(); g.beginPath(); g.rect(0, 0, plotR, priceH); g.clip();
    this.grid(g, L, y, pMin, pMax, i0, i1, xc);
    if (s.show.heat) this.heat(g, L, y, xc, i0, i1);
    if (s.show.sess) this.sessLines(g, L, y);
    this.overlays(g, L, ind, xc, y, i0, i1);
    if (s.type === 'footprint' && bw >= 52 && rowPx >= 7) this.footprint(g, L, y, xc, i0, i1, rowPx);
    else this.candles(g, L, y, xc, i0, i1, s.type === 'footprint');
    this.markers(g, L, y, xc, i0, i1);
    if (sumH) this.summary(g, L, xc, i0, i1, priceH - sumH);
    this.lastLine(g, L, y);
    g.restore();
    if (profW) this.profile(g, L, y);
    this.priceAxis(g, L, y, pMin, pMax);
    // panes
    const bTop = priceH;
    panes.forEach((name, k) => this.pane(g, name, ind, bTop + k * paneH, paneH, xc, i0, i1, plotR, axisW, cw));
    this.timeAxis(g, L, xc, i0, i1, ch - timeH);
    this.legend(g, L, ind);
    if (this.mouse) this.crosshair(g, L, ind);
  };

  P.grid = function (g, L, y, pMin, pMax, i0, i1, xc) {
    const step = nice((pMax - pMin) / 8); g.strokeStyle = C.grid; g.lineWidth = 1; g.beginPath();
    for (let p = Math.ceil(pMin / step) * step; p < pMax; p += step) { const yy = Math.round(y(p)) + .5; g.moveTo(0, yy); g.lineTo(L.plotR, yy); }
    g.stroke(); this.gridStep = step;
  };
  P.priceAxis = function (g, L, y, pMin, pMax) {
    g.fillStyle = C.bg; g.fillRect(L.plotR + L.profW, 0, L.axisW, L.priceH);
    g.strokeStyle = '#1d2330'; g.beginPath(); g.moveTo(L.plotR + L.profW + .5, 0); g.lineTo(L.plotR + L.profW + .5, L.ch); g.stroke();
    g.fillStyle = C.txt; g.font = '11px ui-monospace,Menlo,Consolas,monospace'; g.textAlign = 'left'; g.textBaseline = 'middle';
    const step = this.gridStep;
    for (let p = Math.ceil(pMin / step) * step; p < pMax; p += step) g.fillText(this.fmt(p), L.plotR + L.profW + 6, y(p));
    const b = this.e.bars[this.e.bars.length - 1];
    if (b) { const yy = y(b.c), up = b.c >= b.o; g.fillStyle = up ? C.up : C.dn; g.fillRect(L.plotR + L.profW, yy - 9, L.axisW, 18); g.fillStyle = '#fff'; g.fillText(this.fmt(b.c), L.plotR + L.profW + 6, yy); }
  };
  P.lastLine = function (g, L, y) {
    const b = this.e.bars[this.e.bars.length - 1]; if (!b) return; const yy = Math.round(y(b.c)) + .5;
    g.strokeStyle = b.c >= b.o ? C.up : C.dn; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(0, yy); g.lineTo(L.plotR, yy); g.stroke(); g.setLineDash([]);
  };
  P.timeAxis = function (g, L, xc, i0, i1, yT) {
    g.fillStyle = C.bg; g.fillRect(0, yT, L.cw, L.timeH); g.strokeStyle = '#1d2330'; g.beginPath(); g.moveTo(0, yT + .5); g.lineTo(L.cw, yT + .5); g.stroke();
    g.fillStyle = C.txt; g.font = '11px ui-monospace,Menlo,Consolas,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const every = Math.max(1, Math.ceil(100 / this.s.barW)), bars = this.e.bars, fm = this.timeFmt();
    for (let i = i0; i <= i1; i++) if ((bars.length - 1 - i) % every === 0) { const x = xc(i); if (x > 20 && x < L.plotR - 20) g.fillText(fm.format(new Date(bars[i].t0)), x, yT + L.timeH / 2); }
  };
  P.timeFmt = function () {
    const key = this.e.inst.tz + this.e.tf; if (this._tf && this._tf.k === key) return this._tf.f;
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: this.e.inst.tz, hour: '2-digit', minute: '2-digit', second: this.e.tf < 60 ? '2-digit' : undefined, hour12: false });
    this._tf = { k: key, f }; return f;
  };

  /* ---- price-pane layers ---- */
  P.candles = function (g, L, y, xc, i0, i1, volTint) {
    const bars = this.e.bars, bw = this.s.barW, w = Math.max(2, Math.min(bw * 0.7, 26)), maxV = Math.max(1, ...bars.slice(i0, i1 + 1).map(b => b.vol));
    for (let i = i0; i <= i1; i++) {
      const b = bars[i], x = xc(i), up = b.c >= b.o, col = up ? C.up : C.dn;
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1;
      g.beginPath(); g.moveTo(Math.round(x) + .5, y(b.h)); g.lineTo(Math.round(x) + .5, y(b.l)); g.stroke();
      const yo = y(b.o), yc = y(b.c), h = Math.max(1, Math.abs(yc - yo));
      g.globalAlpha = volTint ? 0.35 + 0.65 * (b.vol / maxV) : 1; g.fillRect(x - w / 2, Math.min(yo, yc), w, h); g.globalAlpha = 1;
      if (this.s.show.poc) { const pl = this.e.poc(b); if (pl != null) { const py = y((pl + 0.5) * this.e.mult * this.e.inst.tick - this.e.inst.tick * 0.5); g.fillStyle = C.acc; g.fillRect(x - w / 2 - 2, py - 1, w + 4, 2); } }
    }
  };
  P.footprint = function (g, L, y, xc, i0, i1, rowPx) {
    const e = this.e, bars = e.bars, bw = this.s.barW, cellW = bw - 6, m = e.mult, tk = e.inst.tick, fs = Math.max(8, Math.min(12, rowPx - 2)), text = rowPx >= 9 && bw >= 62;
    g.font = fs + 'px ui-monospace,Menlo,Consolas,monospace'; g.textBaseline = 'middle';
    for (let i = i0; i <= i1; i++) {
      const b = bars[i], x = xc(i), x0 = x - cellW / 2, im = e.imbalances(b), poc = e.poc(b);
      let mx = 1; for (const k in b.lv) mx = Math.max(mx, b.lv[k][0] + b.lv[k][1]);
      // body outline
      const top = y(b.h) , bot = y(b.l);
      g.strokeStyle = b.c >= b.o ? C.up : C.dn; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0 - 1.5, y(b.o)); g.lineTo(x0 - 1.5, y(b.c)); g.stroke(); g.lineWidth = 1;
      g.strokeStyle = '#3a4352'; g.beginPath(); g.moveTo(x0 - 1.5, top); g.lineTo(x0 - 1.5, bot); g.stroke();
      for (const k in b.lv) {
        const L0 = +k, [bd, ak] = b.lv[k], pTop = (L0 + 1) * m * tk - tk * 0.5, yy = y(pTop), hh = rowPx;
        const t = (bd + ak) / mx, isP = poc === L0;
        const dom = ak - bd;
        g.fillStyle = dom >= 0 ? 'rgba(46,189,133,' + (0.07 + 0.5 * t) + ')' : 'rgba(246,70,93,' + (0.07 + 0.5 * t) + ')';
        g.fillRect(x0, yy + .5, cellW, hh - 1);
        if (this.s.show.imb) {
          if (im.buy[L0]) { g.fillStyle = this.s.show.stack && im.sBuy[L0] ? 'rgba(46,189,133,.85)' : 'rgba(46,189,133,.5)'; g.fillRect(x0 + cellW / 2, yy + .5, cellW / 2, hh - 1); }
          if (im.sell[L0]) { g.fillStyle = this.s.show.stack && im.sSell[L0] ? 'rgba(246,70,93,.85)' : 'rgba(246,70,93,.5)'; g.fillRect(x0, yy + .5, cellW / 2, hh - 1); }
        }
        if (isP && this.s.show.poc) { g.strokeStyle = C.acc; g.lineWidth = 1.5; g.strokeRect(x0 + .5, yy + 1, cellW - 1, hh - 2); g.lineWidth = 1; }
        if (text) {
          g.fillStyle = '#e8ecf2'; g.textAlign = 'right'; g.fillText(abbr(bd), x0 + cellW / 2 - 5, yy + hh / 2 + .5);
          g.textAlign = 'left'; g.fillText(abbr(ak), x0 + cellW / 2 + 5, yy + hh / 2 + .5);
        }
      }
    }
  };
  P.summary = function (g, L, xc, i0, i1, yTop) {
    const bars = this.e.bars; g.font = '10.5px ui-monospace,Menlo,Consolas,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#0d1118'; g.fillRect(0, yTop, L.plotR, L.sumH);
    const rows = ['Δ', 'Vol', 'Δ%'];
    for (let i = i0; i <= i1; i++) {
      const b = bars[i], x = this.xc(i), pc = b.vol ? 100 * b.delta / b.vol : 0;
      g.fillStyle = b.delta >= 0 ? C.up : C.dn; g.fillText((b.delta > 0 ? '+' : '') + abbr(b.delta), x, yTop + 9);
      g.fillStyle = C.txt; g.fillText(abbr(b.vol), x, yTop + 23);
      g.fillStyle = pc >= 0 ? C.up : C.dn; g.fillText(pc.toFixed(1) + '%', x, yTop + 37);
    }
    g.textAlign = 'left'; g.fillStyle = '#4b5565'; rows.forEach((r, k) => g.fillText(r, 4, yTop + 9 + k * 14));
  };
  P.overlays = function (g, L, ind, xc, y, i0, i1) {
    const s = this.s.show, line = (arr, col, w, dash) => {
      g.strokeStyle = col; g.lineWidth = w || 1.2; g.setLineDash(dash || []); g.beginPath(); let st = false;
      for (let i = Math.max(0, i0 - 1); i <= Math.min(arr.length - 1, i1 + 1); i++) { if (isNaN(arr[i])) { st = false; continue; } const X = xc(i), Y = y(arr[i]); if (!st) { g.moveTo(X, Y); st = true; } else g.lineTo(X, Y); }
      g.stroke(); g.setLineDash([]); g.lineWidth = 1;
    };
    if (s.vbands) { [1, 2].forEach(k => { line(ind.vwap.map((v, i) => v + k * ind.vsd[i]), 'rgba(240,185,11,.35)', 1, [4, 3]); line(ind.vwap.map((v, i) => v - k * ind.vsd[i]), 'rgba(240,185,11,.35)', 1, [4, 3]); }); }
    if (s.vwap) line(ind.vwap, C.acc, 1.6);
    if (s.ema9) line(ind.ema9, C.blue); if (s.ema21) line(ind.ema21, C.purple); if (s.sma50) line(ind.sma50, '#e57c3b');
    if (s.boll) { line(ind.boll.u, 'rgba(120,160,220,.7)'); line(ind.boll.l, 'rgba(120,160,220,.7)'); line(ind.boll.m, 'rgba(120,160,220,.4)', 1, [3, 3]); }
  };
  P.markers = function (g, L, y, xc, i0, i1) {
    const e = this.e, bars = e.bars, s = this.s.show, tk = e.inst.tick; g.font = 'bold 10px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tri = (x, yy, up, col) => { g.fillStyle = col; g.beginPath(); if (up) { g.moveTo(x, yy); g.lineTo(x - 5, yy + 9); g.lineTo(x + 5, yy + 9); } else { g.moveTo(x, yy); g.lineTo(x - 5, yy - 9); g.lineTo(x + 5, yy - 9); } g.fill(); };
    for (let i = i0; i <= i1; i++) {
      const b = bars[i], x = xc(i);
      if (s.absorb && b.abs === 'H') { tri(x, y(b.h) - 14, false, C.dn); g.fillStyle = C.dn; g.fillText('ABS', x, y(b.h) - 26); }
      if (s.absorb && b.abs === 'L') { tri(x, y(b.l) + 14, true, C.up); g.fillStyle = C.up; g.fillText('ABS', x, y(b.l) + 26); }
      if (s.div && b.div) { const up = b.div > 0; g.fillStyle = C.purple; g.fillText(up ? 'DIV▲' : 'DIV▼', x, up ? y(b.l) + 40 : y(b.h) - 40); }
      if (s.ice) for (const ic of b.ices) { const yy = y(ic.k * tk); g.fillStyle = '#5cc8ff'; g.fillRect(x + this.s.barW * .5 - 8, yy - 4, 7, 8); g.fillStyle = '#05212f'; g.fillText('I', x + this.s.barW * .5 - 4.5, yy + .5); }
    }
    if (s.big) {
      const t0 = bars[i0].t0, ms = e.tf * 1000, bw = this.s.barW;
      for (const t of e.bigs) {
        if (t.t < t0) continue; const idx = bars.findIndex(b => b.t0 === Math.floor(t.t / ms) * ms); if (idx < i0 || idx > i1) continue;
        const bar = bars[idx], X = xc(idx) + ((t.t - bar.t0) / ms - .5) * bw * .6, r = Math.min(20, 3 + Math.sqrt(t.s / e.inst.lot) * 1.8);
        g.fillStyle = t.side > 0 ? 'rgba(46,189,133,.35)' : 'rgba(246,70,93,.35)'; g.strokeStyle = t.side > 0 ? C.up : C.dn;
        g.beginPath(); g.arc(X, y(t.p), r, 0, 6.283); g.fill(); g.stroke();
      }
    }
  };
  P.sessLines = function (g, L, y) {
    const p = G.Engine.profile(this.e.prof, .7); if (!p) return; const e = this.e, f = Lv => ((Lv * e.mult) * e.inst.tick);
    [[f(p.poc), C.acc, 'sPOC'], [f(p.vah + 1) - e.inst.tick, '#6e7b91', 'sVAH'], [f(p.val), '#6e7b91', 'sVAL']].forEach(([pr, col, t]) => {
      const yy = Math.round(y(pr)) + .5; g.strokeStyle = col; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(0, yy); g.lineTo(L.plotR, yy); g.stroke(); g.setLineDash([]); g.fillStyle = col; g.font = '10px sans-serif'; g.textAlign = 'left'; g.fillText(t + ' ' + this.fmt(pr), 6, yy - 6);
    });
  };
  P.heat = function (g, L, y, xc, i0, i1) {
    const e = this.e, snaps = e.snaps, bars = e.bars, bw = this.s.barW, tf = e.tf * 1000, tk = e.inst.tick;
    if (!snaps.length) return;
    const tStart = bars[Math.max(0, i0)].t0, tEnd = bars[i1].t0 + tf;
    // binary search first snap
    let lo = 0, hi = snaps.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (snaps[m].t < tStart) lo = m + 1; else hi = m; }
    const colPx = Math.max(3, bw * 1000 / tf), stride = Math.max(1, Math.round(colPx < 3 ? 3 / (bw * 1000 / tf) : 1));
    const rowT = Math.max(1, Math.round(3 / Math.max(.01, (e.inst.tick / (this.pMax - this.pMin) * (L.priceH - 70)))));
    const samp = []; for (let i = lo; i < snaps.length && snaps[i].t <= tEnd; i += stride) samp.push(snaps[i]);
    const vals = []; for (let q = 0; q < samp.length; q += Math.max(1, samp.length >> 6)) { const sn = samp[q]; for (let j = 0; j < sn.bid.length; j += 2) { vals.push(sn.bid[j], sn.ask[j]); } }
    vals.sort((a, b) => a - b); const mx = Math.max(1, vals[Math.floor(vals.length * .985)] || 1);
    const D = snaps[0].bid.length, lot = e.inst.lot;
    for (const sn of samp) {
      const bi = Math.min(e.bars.length - 1, e.bars.findIndex(b => b.t0 === Math.floor(sn.t / tf) * tf)); if (bi < 0) continue;
      const bar = bars[bi], x = xc(bi) + ((sn.t - bar.t0) / tf - .5) * bw, w = Math.max(2, bw * 1000 * stride / tf + 1);
      for (let j = 0; j < D; j += rowT) {
        let a = 0, b2 = 0; for (let q = 0; q < rowT && j + q < D; q++) { a = Math.max(a, sn.ask[j + q]); b2 = Math.max(b2, sn.bid[j + q]); }
        const ya = y((sn.bb + 1 + j) * tk + tk * .5), yb = y((sn.bb - j) * tk + tk * .5), h = Math.max(2, rowT * tk / (this.pMax - this.pMin) * (L.priceH - 70));
        const ta = Math.min(1, a / mx), tb = Math.min(1, b2 / mx);
        if (ta > .25) { g.fillStyle = 'rgba(246,70,93,' + (.12 + ta * ta * .6) + ')'; g.fillRect(x, ya - h, w, h); }
        if (tb > .25) { g.fillStyle = 'rgba(46,189,133,' + (.12 + tb * tb * .6) + ')'; g.fillRect(x, yb, w, h); }
      }
    }
  };
  P.profile = function (g, L, y) {
    const e = this.e, x0 = L.plotR, W = L.profW, bars = e.bars; if (!bars.length) return;
    const map = G.Engine.rangeProfile(bars, this.i0, this.i1), pr = G.Engine.profile(map, .7); if (!pr) return;
    g.fillStyle = '#0c1016'; g.fillRect(x0, 0, W, L.priceH); g.strokeStyle = '#1d2330'; g.beginPath(); g.moveTo(x0 + .5, 0); g.lineTo(x0 + .5, L.priceH); g.stroke();
    const tk = e.inst.tick, m = e.mult;
    for (const Lv of pr.levels) {
      const [b, a] = map[Lv], tot = a + b, w = (tot / pr.max) * (W - 8), yy = y((Lv + 1) * m * tk - tk * .5), h = Math.max(1, this.rowPx - 1), inVA = Lv >= pr.val && Lv <= pr.vah;
      const wa = w * (a / tot), wb = w - wa;
      g.fillStyle = inVA ? 'rgba(46,189,133,.55)' : 'rgba(46,189,133,.25)'; g.fillRect(x0 + 4, yy, wa, h);
      g.fillStyle = inVA ? 'rgba(246,70,93,.55)' : 'rgba(246,70,93,.25)'; g.fillRect(x0 + 4 + wa, yy, wb, h);
    }
    const yp = y((pr.poc + 1) * m * tk - tk * .5) + this.rowPx / 2;
    g.fillStyle = C.acc; g.fillRect(x0, yp - 1, W, 2); g.font = '10px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText('POC ' + this.fmt(pr.poc * m * tk), x0 + 4, yp - 3);
    g.fillStyle = '#6e7b91'; g.textBaseline = 'top'; g.fillText('VP (visible) VA70', x0 + 4, 3);
    g.textBaseline = 'middle';
    // value-area lines across plot
    g.save(); g.beginPath(); g.rect(0, 0, L.plotR, L.priceH); g.clip(); g.strokeStyle = 'rgba(240,185,11,.35)'; g.setLineDash([2, 4]);
    [pr.poc].forEach(Lv => { const yy = Math.round(y((Lv + 1) * m * tk - tk * .5) + this.rowPx / 2) + .5; g.beginPath(); g.moveTo(0, yy); g.lineTo(L.plotR, yy); g.stroke(); });
    g.setLineDash([]); g.restore();
  };

  /* ---- sub panes ---- */
  P.pane = function (g, name, ind, top, h, xc, i0, i1, plotR, axisW, cw) {
    g.save(); g.beginPath(); g.rect(0, top, cw, h); g.clip();
    g.fillStyle = C.bg; g.fillRect(0, top, cw, h); g.strokeStyle = '#1d2330'; g.beginPath(); g.moveTo(0, top + .5); g.lineTo(cw, top + .5); g.stroke();
    const bars = this.e.bars, bw = this.s.barW, W = Math.max(1, Math.min(bw * .7, 24)), pad = 14;
    let series = [], mode = 'hist', ref = [], mn, mx, fmt = abbr;
    if (name === 'volume') series = [{ a: ind.vol, col: i => bars[i].c >= bars[i].o ? C.up : C.dn }];
    else if (name === 'delta') series = [{ a: ind.delta, col: i => ind.delta[i] >= 0 ? C.up : C.dn }];
    else if (name === 'deltaPct') { series = [{ a: ind.deltaPct, col: i => ind.deltaPct[i] >= 0 ? C.up : C.dn }]; fmt = v => v.toFixed(0) + '%'; }
    else if (name === 'cvd') { mode = 'line'; series = [{ a: ind.cvd, col: () => C.blue }]; }
    else if (name === 'rsi') { mode = 'line'; series = [{ a: ind.rsi, col: () => C.purple }]; mn = 0; mx = 100; ref = [30, 70]; fmt = v => v.toFixed(0); }
    else if (name === 'atr') { mode = 'line'; series = [{ a: ind.atr, col: () => C.acc }]; fmt = v => v.toFixed(this.e.inst.dec); }
    else if (name === 'macd') { series = [{ a: ind.macd.h, col: i => ind.macd.h[i] >= 0 ? C.up : C.dn }, { a: ind.macd.m, col: () => C.blue, line: true }, { a: ind.macd.s, col: () => C.acc, line: true }]; fmt = v => v.toFixed(this.e.inst.dec + 1); }
    else if (name === 'regime') { mode = 'line'; series = [{ a: ind.regime.er, col: () => C.blue }, { a: ind.regime.rvp, col: () => '#e57c3b' }]; mn = 0; mx = 1; ref = [.2, .35]; fmt = v => v.toFixed(2); }
    if (mn == null) { mn = Infinity; mx = -Infinity; series.forEach(sr => { for (let i = i0; i <= i1; i++) { const v = sr.a[i]; if (!isNaN(v)) { if (v < mn) mn = v; if (v > mx) mx = v; } } }); if (name === 'volume' || name === 'delta' || name === 'deltaPct' || name === 'macd') { mn = Math.min(mn, 0); mx = Math.max(mx, 0); } if (!isFinite(mn)) { mn = 0; mx = 1; } if (mn === mx) mx = mn + 1; }
    const yy = v => top + pad + (mx - v) / (mx - mn) * (h - pad - 4);
    ref.forEach(r => { g.strokeStyle = '#222a37'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(0, yy(r) + .5); g.lineTo(plotR, yy(r) + .5); g.stroke(); g.setLineDash([]); });
    const z = yy(0); if (mn < 0 && mx > 0) { g.strokeStyle = '#222a37'; g.beginPath(); g.moveTo(0, z + .5); g.lineTo(plotR, z + .5); g.stroke(); }
    series.forEach(sr => {
      if (mode === 'hist' && !sr.line) { for (let i = i0; i <= i1; i++) { const v = sr.a[i]; if (isNaN(v)) continue; g.fillStyle = sr.col(i); const y1 = yy(Math.max(v, mn < 0 ? 0 : mn)), y2 = yy(Math.min(v, 0 > mn ? 0 : mn)); const a = Math.min(yy(v), yy(mn < 0 ? 0 : mn)), b = Math.max(yy(v), yy(mn < 0 ? 0 : mn)); g.fillRect(xc(i) - W / 2, a, W, Math.max(1, b - a)); } }
      else { g.strokeStyle = sr.col(0); g.lineWidth = 1.4; g.beginPath(); let st = false; for (let i = Math.max(0, i0 - 1); i <= Math.min(sr.a.length - 1, i1 + 1); i++) { const v = sr.a[i]; if (isNaN(v)) { st = false; continue; } if (!st) { g.moveTo(xc(i), yy(v)); st = true; } else g.lineTo(xc(i), yy(v)); } g.stroke(); g.lineWidth = 1; }
    });
    g.fillStyle = C.bg; g.fillRect(plotR, top + 1, cw - plotR, h); g.strokeStyle = '#1d2330'; g.beginPath(); g.moveTo(plotR + L_prof(this) + .5, top); g.lineTo(plotR + L_prof(this) + .5, top + h); g.stroke();
    g.font = '10.5px ui-monospace,Menlo,Consolas,monospace'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = C.txt;
    g.fillText(fmt(mx), plotR + L_prof(this) + 6, top + pad); g.fillText(fmt(mn), plotR + L_prof(this) + 6, top + h - 8);
    const lastv = series[0].a[bars.length - 1]; let txt = PANE_LABEL[name] + (name === 'regime' && ind.regime.lab[bars.length - 1] ? '  ·  ' + ind.regime.lab[bars.length - 1] : '') + (isNaN(lastv) ? '' : '  ' + (name === 'regime' ? lastv.toFixed(2) : fmt(lastv)));
    g.fillStyle = '#6e7b91'; g.font = '11px system-ui,sans-serif'; g.fillText(txt, 8, top + 8);
    g.restore();
  };
  function L_prof(c) { return c.L.profW; }

  P.legend = function (g, L, ind) {
    const e = this.e, bars = e.bars, i = this.hoverIdx != null ? this.hoverIdx : bars.length - 1, b = bars[i]; if (!b) return;
    g.font = '12px ui-monospace,Menlo,Consolas,monospace'; g.textAlign = 'left'; g.textBaseline = 'top';
    const items = [['O', this.fmt(b.o)], ['H', this.fmt(b.h)], ['L', this.fmt(b.l)], ['C', this.fmt(b.c)], ['Vol', abbr(b.vol)], ['Δ', (b.delta > 0 ? '+' : '') + abbr(b.delta)], ['CVD', abbr(b.cd)]];
    let x = 8; g.fillStyle = '#e8ecf2'; g.font = 'bold 13px system-ui,sans-serif'; const hd = e.inst.sym + ' · ' + (e.tf >= 60 ? e.tf / 60 + 'm' : e.tf + 's') + ' · cluster ' + this.fmt(e.mult * e.inst.tick);
    g.fillText(hd, x, 6); x += g.measureText(hd).width + 14; g.font = '12px ui-monospace,Menlo,Consolas,monospace';
    items.forEach(([k, v]) => { g.fillStyle = C.txt; g.fillText(k, x, 7); x += g.measureText(k).width + 4; g.fillStyle = (k === 'Δ' ? (b.delta >= 0 ? C.up : C.dn) : '#e8ecf2'); g.fillText(v, x, 7); x += g.measureText(v).width + 12; });
    const tags = []; const ov = this.s.show; if (ov.vwap) tags.push(['VWAP ' + this.fmt(b.vw), C.acc]); if (ov.ema9) tags.push(['EMA9', C.blue]); if (ov.ema21) tags.push(['EMA21', C.purple]); if (ov.sma50) tags.push(['SMA50', '#e57c3b']); if (ov.boll) tags.push(['BB20,2', '#78a0dc']);
    x = 8; tags.forEach(([t, col]) => { g.fillStyle = col; g.fillText(t, x, 26); x += g.measureText(t).width + 12; });
    if (b.sig && b.sig.length) { g.fillStyle = C.purple; g.fillText('signals: ' + b.sig.join(' '), x, 26); }
  };
  P.crosshair = function (g, L, ind) {
    const m = this.mouse; if (m.x > L.plotR + L.profW) return;
    g.strokeStyle = C.cross; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(m.x + .5, 0); g.lineTo(m.x + .5, L.ch - L.timeH); g.stroke();
    if (m.y < L.priceH) { g.beginPath(); g.moveTo(0, m.y + .5); g.lineTo(L.plotR + L.profW, m.y + .5); g.stroke(); }
    g.setLineDash([]);
    const n = this.e.bars.length, bw = this.s.barW; let idx;
    // x = plotR - bw*(n-1-i+off) - bw/2  =>  i = n-1+off - (plotR - bw/2 - x)/bw
    idx = Math.round(n - 1 + this.s.off - (L.plotR - bw / 2 - m.x) / bw);
    this.hoverIdx = idx >= 0 && idx < n ? idx : null;
    if (m.y < L.priceH) {
      const p = this.pMax - (m.y - 10) / (L.priceH - L.sumH - 18) * (this.pMax - this.pMin);
      g.fillStyle = '#2a3342'; g.fillRect(L.plotR + L.profW, m.y - 9, L.axisW, 18); g.fillStyle = '#fff'; g.font = '11px ui-monospace,Menlo,Consolas,monospace'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(this.fmt(p), L.plotR + L.profW + 6, m.y);
    }
  };
  P.drawLoop = function () { const f = () => { this.draw(); requestAnimationFrame(f); }; f(); };

  G.Chart = Chart; G.OF_PANES = PANE_LABEL;
})(window);
