/* Orderflow engine: aggregates prints into footprint bars, session profile,
   VWAP, CVD and detects imbalances / absorption / icebergs / big prints. */
(function (G) {
  function Engine(inst) {
    this.inst = inst; this.tf = 60; this.mult = inst.cluster;
    this.imbRatio = 3; this.imbMinF = 0.6; this.stackN = 3; this.bigMult = 10;
    this.listeners = []; this.ticks = []; this.snaps = [];
    this.reset();
  }
  const P = Engine.prototype;
  P.reset = function () {
    this.bars = []; this.prof = {}; this.cvd = 0; this.sumPV = 0; this.sumV = 0; this.sumP2V = 0;
    this.bigs = []; this.signals = []; this.silent = true;
    this.iceS = { 1: null, '-1': null }; this.sessOpen = null; this.lastBigT = 0;
  };
  P.on = function (fn) { this.listeners.push(fn); };
  P.signal = function (type, msg, side, t) {
    if (this.silent) return;
    const s = { type, msg, side, t: t || Date.now() };
    this.signals.unshift(s); if (this.signals.length > 300) this.signals.pop();
    this.listeners.forEach(f => f(s));
  };
  P.setTF = function (s) { this.tf = s; this.rebuild(); };
  P.setMult = function (m) { this.mult = m; this.rebuild(); };
  P.rebuild = function () {
    const keepSig = this.signals; this.reset(); this.signals = keepSig;
    const t = this.ticks; for (let i = 0; i < t.length; i++) this.ingest(t[i], true, true);
    this.silent = false;
  };
  P.load = function (ticks, snaps) { this.ticks = ticks; this.snaps = snaps; this.signals = []; this.rebuild(); };
  P.newBar = function (t0, tk) {
    return { t0, o: tk.p, h: tk.p, l: tk.p, c: tk.p, vol: 0, buy: 0, sell: 0, delta: 0, minD: 0, maxD: 0, cd: 0, n: 0, lv: {}, vw: tk.p, sd: 0, ices: [], big: 0, sig: [] };
  };
  P.ingest = function (tk, replay, noStore) {
    if (!replay && !noStore) this.ticks.push(tk);
    const ms = this.tf * 1000, t0 = Math.floor(tk.t / ms) * ms;
    let b = this.bars[this.bars.length - 1];
    if (!b || b.t0 !== t0) { if (b) this.close(b); b = this.newBar(t0, tk); this.bars.push(b); }
    if (this.sessOpen == null) this.sessOpen = tk.p;
    b.n++; b.c = tk.p; if (tk.p > b.h) b.h = tk.p; if (tk.p < b.l) b.l = tk.p;
    const L = Math.floor(tk.k / this.mult);
    const cell = b.lv[L] || (b.lv[L] = [0, 0]), pc = this.prof[L] || (this.prof[L] = [0, 0]);
    const ix = tk.side > 0 ? 1 : 0;
    cell[ix] += tk.s; pc[ix] += tk.s; b.vol += tk.s;
    if (tk.side > 0) b.buy += tk.s; else b.sell += tk.s;
    b.delta = b.buy - b.sell; if (b.delta > b.maxD) b.maxD = b.delta; if (b.delta < b.minD) b.minD = b.delta;
    this.cvd += tk.side * tk.s; b.cd = this.cvd;
    this.sumPV += tk.p * tk.s; this.sumV += tk.s; this.sumP2V += tk.p * tk.p * tk.s;
    b.vw = this.sumPV / this.sumV; b.sd = Math.sqrt(Math.max(0, this.sumP2V / this.sumV - b.vw * b.vw));
    // iceberg: far more filled at a level than was ever displayed
    const st = this.iceS[tk.side];
    if (!st || st.k !== tk.k) this.iceS[tk.side] = { k: tk.k, shown: tk.dq, filled: tk.s, flag: false };
    else {
      st.filled += tk.s; if (tk.dq > st.shown) st.shown = tk.dq;
      if (!st.flag && st.filled > 3 * st.shown && st.filled >= this.inst.lot * 8) {
        st.flag = true; b.ices.push({ k: tk.k, side: tk.side, v: st.filled });
        this.signal('ICEBERG', (tk.side > 0 ? 'Sell' : 'Buy') + ' iceberg @ ' + tk.p.toFixed(this.inst.dec) + ' (' + Math.round(st.filled) + ' filled)', tk.side > 0 ? -1 : 1, tk.t);
      }
    }
    if (tk.s >= this.inst.lot * this.bigMult) {
      this.bigs.push({ t: tk.t, p: tk.p, s: tk.s, side: tk.side }); if (this.bigs.length > 600) this.bigs.shift();
      b.big++;
      if (tk.t - this.lastBigT > 1500) { this.lastBigT = tk.t; this.signal('BIG', 'Big ' + (tk.side > 0 ? 'buy' : 'sell') + ' ' + tk.s + ' @ ' + tk.p.toFixed(this.inst.dec), tk.side, tk.t); }
    }
  };
  /* Diagonal imbalances: ask[L] vs bid[L-1] (buy), bid[L] vs ask[L+1] (sell). */
  P.imbalances = function (b) {
    if (b._imb && b._imbN === b.n && b._imbR === this.imbRatio) return b._imb;
    const lv = b.lv, r = this.imbRatio, mv = Math.max(2, this.inst.lot * this.imbMinF);
    const buy = {}, sell = {}, ks = Object.keys(lv).map(Number);
    for (const L of ks) {
      const a = lv[L][1], bd = lv[L][0], below = lv[L - 1], above = lv[L + 1];
      if (a >= mv && a >= r * Math.max(1, below ? below[0] : 0) && (below || a >= mv * 2)) buy[L] = 1;
      if (bd >= mv && bd >= r * Math.max(1, above ? above[1] : 0) && (above || bd >= mv * 2)) sell[L] = 1;
    }
    const stack = (set, dir) => {
      const out = {}; const arr = Object.keys(set).map(Number).sort((x, y) => x - y);
      let run = [];
      const flush = () => { if (run.length >= this.stackN) run.forEach(L => (out[L] = 1)); run = []; };
      for (const L of arr) { if (run.length && L !== run[run.length - 1] + 1) flush(); run.push(L); }
      flush(); return out;
    };
    b._imb = { buy, sell, sBuy: stack(buy), sSell: stack(sell) };
    b._imbN = b.n; b._imbR = this.imbRatio; return b._imb;
  };
  P.poc = function (b) {
    if (b._poc != null && b._pocN === b.n) return b._poc;
    let best = -1, bl = null;
    for (const k in b.lv) { const v = b.lv[k][0] + b.lv[k][1]; if (v > best) { best = v; bl = +k; } }
    b._poc = bl; b._pocN = b.n; return bl;
  };
  /* On bar close: stacked imbalance, absorption, delta divergence. */
  P.close = function (b) {
    const im = this.imbalances(b), d = this.inst.dec, m = this.mult, tk = this.inst.tick;
    const px = L => (L * m * tk);
    const sb = Object.keys(im.sBuy).map(Number), ss = Object.keys(im.sSell).map(Number);
    if (sb.length) { b.sig.push('SB'); this.signal('STACK', 'Stacked buy imbalance ' + px(Math.min(...sb)).toFixed(d) + '–' + px(Math.max(...sb)).toFixed(d), 1, b.t0 + this.tf * 1000); }
    if (ss.length) { b.sig.push('SS'); this.signal('STACK', 'Stacked sell imbalance ' + px(Math.min(...ss)).toFixed(d) + '–' + px(Math.max(...ss)).toFixed(d), -1, b.t0 + this.tf * 1000); }
    const ks = Object.keys(b.lv).map(Number);
    if (ks.length >= 4) {
      const mean = b.vol / ks.length, hiL = Math.max(...ks), loL = Math.min(...ks);
      const vHi = b.lv[hiL][0] + b.lv[hiL][1] + (b.lv[hiL - 1] ? b.lv[hiL - 1][0] + b.lv[hiL - 1][1] : 0);
      const vLo = b.lv[loL][0] + b.lv[loL][1] + (b.lv[loL + 1] ? b.lv[loL + 1][0] + b.lv[loL + 1][1] : 0);
      const rng = b.h - b.l;
      if (vHi > 3 * mean && b.c < b.h - rng * 0.35 && b.lv[hiL][1] > b.lv[hiL][0]) { b.abs = 'H'; b.sig.push('AH'); this.signal('ABSORB', 'Buy absorption at high ' + b.h.toFixed(d), -1, b.t0 + this.tf * 1000); }
      else if (vLo > 3 * mean && b.c > b.l + rng * 0.35 && b.lv[loL][0] > b.lv[loL][1]) { b.abs = 'L'; b.sig.push('AL'); this.signal('ABSORB', 'Sell absorption at low ' + b.l.toFixed(d), 1, b.t0 + this.tf * 1000); }
    }
    // delta divergence vs previous swing within 12 bars
    const i = this.bars.indexOf(b), N = 12;
    if (i > N) {
      const prev = this.bars.slice(i - N, i);
      let hi = prev[0], lo = prev[0];
      prev.forEach(x => { if (x.h >= hi.h) hi = x; if (x.l <= lo.l) lo = x; });
      if (b.h > hi.h && b.cd < hi.cd && b.delta < 0) { b.div = -1; b.sig.push('DV-'); this.signal('DIV', 'Bearish delta divergence (new high, CVD lower)', -1, b.t0 + this.tf * 1000); }
      else if (b.l < lo.l && b.cd > lo.cd && b.delta > 0) { b.div = 1; b.sig.push('DV+'); this.signal('DIV', 'Bullish delta divergence (new low, CVD higher)', 1, b.t0 + this.tf * 1000); }
    }
  };
  /* Volume profile for a set of per-level volumes: returns POC / value area. */
  Engine.profile = function (map, pct) {
    const ls = Object.keys(map).map(Number).sort((a, b) => a - b);
    if (!ls.length) return null;
    const v = L => map[L][0] + map[L][1];
    let tot = 0, poc = ls[0], max = -1;
    for (const L of ls) { const x = v(L); tot += x; if (x > max) { max = x; poc = L; } }
    let lo = ls.indexOf(poc), hi = lo, acc = max; const target = tot * (pct || 0.7);
    while (acc < target && (lo > 0 || hi < ls.length - 1)) {
      const dn = lo > 0 ? v(ls[lo - 1]) + (lo > 1 ? v(ls[lo - 2]) : 0) : -1;
      const up = hi < ls.length - 1 ? v(ls[hi + 1]) + (hi < ls.length - 2 ? v(ls[hi + 2]) : 0) : -1;
      if (up >= dn) { hi++; acc += v(ls[hi]); } else { lo--; acc += v(ls[lo]); }
    }
    return { poc, vah: ls[hi], val: ls[lo], max, total: tot, levels: ls };
  };
  Engine.rangeProfile = function (bars, i0, i1) {
    const map = {};
    for (let i = Math.max(0, i0); i <= Math.min(bars.length - 1, i1); i++) {
      const lv = bars[i].lv;
      for (const k in lv) { const c = map[k] || (map[k] = [0, 0]); c[0] += lv[k][0]; c[1] += lv[k][1]; }
    }
    return map;
  };
  G.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
