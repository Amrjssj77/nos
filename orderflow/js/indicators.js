/* Indicator library (bar-array based). Each returns arrays aligned to bars. */
(function (G) {
  const nan = NaN;
  function ema(x, n) { const o = new Array(x.length).fill(nan), k = 2 / (n + 1); let p = nan; for (let i = 0; i < x.length; i++) { if (isNaN(x[i])) continue; p = isNaN(p) ? x[i] : x[i] * k + p * (1 - k); o[i] = p; } return o; }
  function sma(x, n) { const o = new Array(x.length).fill(nan); let s = 0; for (let i = 0; i < x.length; i++) { s += x[i]; if (i >= n) s -= x[i - n]; if (i >= n - 1) o[i] = s / n; } return o; }
  function stdev(x, n) { const o = new Array(x.length).fill(nan); for (let i = n - 1; i < x.length; i++) { let m = 0; for (let j = i - n + 1; j <= i; j++) m += x[j]; m /= n; let v = 0; for (let j = i - n + 1; j <= i; j++) v += (x[j] - m) ** 2; o[i] = Math.sqrt(v / n); } return o; }
  function boll(c, n, k) { const m = sma(c, n), s = stdev(c, n); return { m, u: m.map((v, i) => v + k * s[i]), l: m.map((v, i) => v - k * s[i]) }; }
  function rsi(c, n) { const o = new Array(c.length).fill(nan); let g = 0, l = 0; for (let i = 1; i < c.length; i++) { const d = c[i] - c[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0); if (i <= n) { g += up / n; l += dn / n; if (i === n) o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } } return o; }
  function atr(b, n) { const tr = b.map((x, i) => i ? Math.max(x.h - x.l, Math.abs(x.h - b[i - 1].c), Math.abs(x.l - b[i - 1].c)) : x.h - x.l); const o = new Array(b.length).fill(nan); let p = nan; for (let i = 0; i < b.length; i++) { p = isNaN(p) ? tr[i] : (p * (n - 1) + tr[i]) / n; if (i >= n - 1) o[i] = p; } return o; }
  function macd(c, f, s, g) { const ef = ema(c, f), es = ema(c, s), m = ef.map((v, i) => v - es[i]), sg = ema(m, g); return { m, s: sg, h: m.map((v, i) => v - sg[i]) }; }
  /* Regime: Kaufman efficiency ratio + Lo-MacKinlay variance ratio + realised-vol percentile */
  function regime(c) {
    const n = c.length, er = new Array(n).fill(nan), vr = new Array(n).fill(nan), rvp = new Array(n).fill(nan), lab = new Array(n).fill('');
    const ret = c.map((v, i) => i ? Math.log(v / c[i - 1]) : 0), W = 20, Q = 4, VW = 60;
    const rv = new Array(n).fill(nan);
    for (let i = W; i < n; i++) {
      let net = Math.abs(c[i] - c[i - W]), path = 0; for (let j = i - W + 1; j <= i; j++) path += Math.abs(c[j] - c[j - 1]);
      er[i] = path ? net / path : 0;
      let s = 0; for (let j = i - W + 1; j <= i; j++) s += ret[j] * ret[j]; rv[i] = Math.sqrt(s / W);
    }
    for (let i = VW; i < n; i++) {
      let m1 = 0; for (let j = i - VW + 1; j <= i; j++) m1 += ret[j]; m1 /= VW;
      let v1 = 0; for (let j = i - VW + 1; j <= i; j++) v1 += (ret[j] - m1) ** 2; v1 /= VW - 1;
      let vq = 0, cnt = 0; for (let j = i - VW + Q; j <= i; j++) { let r = 0; for (let q = 0; q < Q; q++) r += ret[j - q]; vq += (r - Q * m1) ** 2; cnt++; }
      vq /= cnt; vr[i] = v1 > 0 ? vq / (Q * v1) : 1;
    }
    for (let i = 0; i < n; i++) {
      if (!isNaN(rv[i])) { let lt = 0, ct = 0; for (let j = Math.max(W, i - 100); j <= i; j++) { if (!isNaN(rv[j])) { ct++; if (rv[j] <= rv[i]) lt++; } } rvp[i] = ct ? lt / ct : nan; }
      if (!isNaN(er[i]) && !isNaN(vr[i])) lab[i] = er[i] > 0.35 && vr[i] > 1.1 ? 'TREND' : er[i] < 0.2 && vr[i] < 0.9 ? 'CHOP' : 'MIXED';
    }
    return { er, vr, rvp, lab };
  }
  /* Everything the chart can ask for, computed once per bar-set version. */
  function compute(bars) {
    const c = bars.map(b => b.c);
    return {
      vwap: bars.map(b => b.vw), vsd: bars.map(b => b.sd),
      ema9: ema(c, 9), ema21: ema(c, 21), sma50: sma(c, 50), boll: boll(c, 20, 2),
      rsi: rsi(c, 14), atr: atr(bars, 14), macd: macd(c, 12, 26, 9), regime: regime(c),
      delta: bars.map(b => b.delta), cvd: bars.map(b => b.cd), vol: bars.map(b => b.vol),
      deltaPct: bars.map(b => b.vol ? 100 * b.delta / b.vol : 0),
    };
  }
  G.Ind = { ema, sma, stdev, boll, rsi, atr, macd, regime, compute };
})(typeof window !== 'undefined' ? window : globalThis);
