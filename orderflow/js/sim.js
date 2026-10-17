/* Order-flow simulator: a limit order book with persistent walls, icebergs,
   sweeps and a mean-reverting aggressor-pressure process. It emits trade
   prints {t,p,k,s,side,dq}: k = integer tick index, side +1 buy / -1 sell,
   dq = displayed size at the level before the print. */
(function (G) {
  const rnd = Math.random;
  function randn() { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); }

  function Sim(inst, startPrice, t0) {
    this.inst = inst;
    this.D = Math.max(48, inst.cluster * 18);
    const D = this.D;
    this.bb = Math.round(startPrice / inst.tick);
    this.bid = new Float64Array(D); this.ask = new Float64Array(D);
    this.bw = new Int32Array(D); this.aw = new Int32Array(D); // wall lifetimes
    for (let i = 0; i < D; i++) { this.bid[i] = this.lvl(i, 1); this.ask[i] = this.lvl(i, -1); }
    this.iceA = {}; this.iceB = {};
    this.t = t0; this.nextT = t0; this.imb = 0; this.act = 1; this.burst = 0; this.burstSide = 1;
    this.ticks = []; this.snaps = []; this.lastSnap = t0;
    this.maxTicks = 450000; this.onTick = null;
    this.last = this.bb * inst.tick;
  }
  const P = Sim.prototype;
  P.base = function (i) { return this.inst.lot * this.inst.bk * (1 + i * 0.12); };
  P.lvl = function (i, sgn) {
    const t = Math.tanh(this.imb || 0) * 0.35 * sgn;
    return Math.max(1, Math.round(this.base(i) * Math.exp(0.5 * randn() - 0.1) * (1 + t)));
  };
  P.price = function (k) { return +(k * this.inst.tick).toFixed(this.inst.dec + 2); };
  P.bestBid = function () { return this.price(this.bb); };
  P.bestAsk = function () { return this.price(this.bb + 1); };

  P.emit = function (k, s, side, dq) {
    const tk = { t: this.t, p: this.price(k), k, s, side, dq };
    this.ticks.push(tk); this.last = tk.p;
    if (this.ticks.length > this.maxTicks) this.ticks.splice(0, 50000);
    if (this.onTick) this.onTick(tk);
  };
  P.shift = function (up) {
    const D = this.D;
    if (up) {
      this.bb++;
      this.ask.copyWithin(0, 1); this.aw.copyWithin(0, 1); this.ask[D - 1] = this.lvl(D - 1, -1); this.aw[D - 1] = 0;
      this.bid.copyWithin(1, 0); this.bw.copyWithin(1, 0); this.bid[0] = Math.max(1, Math.round(this.inst.lot * 1.5 * Math.exp(0.4 * randn()))); this.bw[0] = 0;
    } else {
      this.bb--;
      this.bid.copyWithin(0, 1); this.bw.copyWithin(0, 1); this.bid[D - 1] = this.lvl(D - 1, 1); this.bw[D - 1] = 0;
      this.ask.copyWithin(1, 0); this.aw.copyWithin(1, 0); this.ask[0] = Math.max(1, Math.round(this.inst.lot * 1.5 * Math.exp(0.4 * randn()))); this.aw[0] = 0;
    }
  };
  P.hit = function (side, size) {
    let rem = size, guard = 0;
    const lot = this.inst.lot;
    while (rem > 0 && guard++ < 60) {
      if (side > 0) {
        const k = this.bb + 1, lv = this.ask[0], take = Math.min(rem, lv);
        this.emit(k, take, 1, lv); this.ask[0] -= take; rem -= take;
        if (this.ask[0] < 1) {
          const h = this.iceA[k];
          if (h > 0) { const r = Math.min(h, Math.max(1, Math.round(lot * 1.5))); this.ask[0] = r; this.iceA[k] = h - r; if (h - r <= 0) delete this.iceA[k]; }
          else this.shift(true);
        }
      } else {
        const k = this.bb, lv = this.bid[0], take = Math.min(rem, lv);
        this.emit(k, take, -1, lv); this.bid[0] -= take; rem -= take;
        if (this.bid[0] < 1) {
          const h = this.iceB[k];
          if (h > 0) { const r = Math.min(h, Math.max(1, Math.round(lot * 1.5))); this.bid[0] = r; this.iceB[k] = h - r; if (h - r <= 0) delete this.iceB[k]; }
          else this.shift(false);
        }
      }
    }
  };
  P.refresh = function () {
    const D = this.D, lot = this.inst.lot;
    for (let n = 0; n < 4; n++) {
      const i = Math.floor(Math.pow(rnd(), 1.6) * D);
      if (this.bw[i] <= 0) this.bid[i] = this.lvl(i, 1); else this.bw[i]--;
      const j = Math.floor(Math.pow(rnd(), 1.6) * D);
      if (this.aw[j] <= 0) this.ask[j] = this.lvl(j, -1); else this.aw[j]--;
    }
    if (rnd() < 0.012) { // liquidity wall
      const i = 3 + Math.floor(rnd() * Math.min(20, D - 4)), m = 6 + rnd() * 8;
      if (rnd() < 0.5) { this.bid[i] = Math.round(this.base(i) * m); this.bw[i] = 150 + Math.floor(rnd() * 700); }
      else { this.ask[i] = Math.round(this.base(i) * m); this.aw[i] = 150 + Math.floor(rnd() * 700); }
    }
    if (rnd() < 0.004) { // hidden iceberg near the touch
      const d = Math.floor(rnd() * 3), hid = Math.round(lot * (20 + rnd() * 40));
      if (rnd() < 0.5) this.iceB[this.bb - d] = hid; else this.iceA[this.bb + 1 + d] = hid;
    }
  };
  P.event = function () {
    const lot = this.inst.lot;
    this.imb = this.imb * 0.997 + 0.07 * randn();
    this.act = Math.min(2.2, Math.max(0.35, this.act * 0.998 + 0.002 + 0.03 * randn() * 0.3));
    let side;
    if (this.burst > 0) { side = this.burstSide; this.burst--; }
    else side = rnd() < 0.5 + 0.2 * Math.tanh(this.imb) ? 1 : -1;
    let size = Math.max(1, Math.round(lot * Math.exp(0.9 * randn() - 0.4)));
    if (rnd() < 0.012) { size = Math.round(size * (6 + rnd() * 16)); this.burst = 2 + Math.floor(rnd() * 5); this.burstSide = side; }
    this.hit(side, size);
    this.refresh();
    const dt = -Math.log(1 - rnd()) / (this.inst.rate * this.act);
    this.nextT += dt * 1000;
  };
  P.snap = function () {
    if (this.t - this.lastSnap < 1000) return;
    this.lastSnap = this.t;
    const D = this.D;
    this.snaps.push({ t: this.t, bb: this.bb, bid: Float32Array.from(this.bid.subarray(0, D)), ask: Float32Array.from(this.ask.subarray(0, D)) });
    if (this.snaps.length > 30000) this.snaps.splice(0, 3000);
  };
  /* Advance the virtual clock to `until` (ms), emitting prints on the way. */
  P.advance = function (until) {
    while (this.nextT <= until) { this.t = this.nextT; this.event(); this.snap(); }
    this.t = until;
  };
  P.book = function () { return { bb: this.bb, bid: this.bid, ask: this.ask, D: this.D }; };

  G.Sim = Sim; G.randn = randn;
})(typeof window !== 'undefined' ? window : globalThis);
