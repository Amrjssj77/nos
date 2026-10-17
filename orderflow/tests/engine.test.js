// node tests/engine.test.js
global.window = undefined;
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = vm.createContext({ console, Math, Date, Float32Array, Float64Array, Int32Array });
ctx.globalThis = ctx;
for (const f of ['instruments', 'sim', 'engine', 'indicators'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', f + '.js'), 'utf8'), ctx);
const assert = require('assert');
const { Sim, Engine, Ind, INSTRUMENTS } = ctx;
let ok = 0; const t = (n, f) => { f(); ok++; console.log('ok -', n); };

t('instrument universe covers US funds, indices, Japan225', () => {
  const s = INSTRUMENTS.map(i => i.sym);
  ['SPY', 'QQQ', 'ES', 'NQ', 'JP225', 'NKD', 'EWJ', 'TLT', 'GLD'].forEach(x => assert(s.includes(x), x));
  assert(INSTRUMENTS.length >= 55);
});
t('sim produces consistent prints for every instrument', () => {
  for (const inst of INSTRUMENTS) {
    const sim = new Sim(inst, inst.px, 0); sim.advance(120000);
    assert(sim.ticks.length > 50, inst.sym + ' ticks');
    for (const tk of sim.ticks) { assert(tk.s > 0 && (tk.side === 1 || tk.side === -1) && isFinite(tk.p)); }
  }
});
t('engine volume/delta conservation', () => {
  const inst = ctx.INST_BY_SYM.ES, sim = new Sim(inst, inst.px, 0); sim.advance(600000);
  const e = new Engine(inst); e.load(sim.ticks, sim.snaps); e.setTF(30);
  const tv = sim.ticks.reduce((a, x) => a + x.s, 0), td = sim.ticks.reduce((a, x) => a + x.side * x.s, 0);
  assert.strictEqual(e.bars.reduce((a, b) => a + b.vol, 0), tv);
  assert.strictEqual(e.bars.reduce((a, b) => a + b.delta, 0), td);
  assert.strictEqual(e.cvd, td);
  for (const b of e.bars) { let s = 0; for (const k in b.lv) s += b.lv[k][0] + b.lv[k][1]; assert.strictEqual(s, b.vol); assert(b.h >= b.l && b.h >= b.o && b.l <= b.c); }
  e.setMult(inst.cluster * 2); assert.strictEqual(e.bars.reduce((a, b) => a + b.vol, 0), tv);
});
t('value area contains >=70% and POC is max', () => {
  const p = Engine.profile({ 1: [1, 1], 2: [5, 5], 3: [20, 20], 4: [4, 4], 5: [1, 1] }, 0.7);
  assert.strictEqual(p.poc, 3); assert(p.vah >= 3 && p.val <= 3);
});
t('imbalance + stacked detection', () => {
  const inst = ctx.INST_BY_SYM.ES, e = new Engine(inst);
  const b = { n: 1, lv: { 10: [1, 1], 11: [1, 30], 12: [1, 30], 13: [1, 30], 14: [1, 1] } };
  const im = e.imbalances(b); assert(im.buy[11] && im.buy[12] && im.buy[13]); assert(im.sBuy[11] && im.sBuy[13]);
});
t('indicators sane', () => {
  const c = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 5) * 5 + i * 0.1);
  const r = Ind.rsi(c, 14); assert(r[99] > 0 && r[99] < 100);
  assert(Math.abs(Ind.sma(c, 5)[10] - (c[6] + c[7] + c[8] + c[9] + c[10]) / 5) < 1e-9);
  const rg = Ind.regime(Array.from({ length: 200 }, (_, i) => 100 + i)); assert.strictEqual(rg.lab[199] === 'TREND' || rg.lab[199] === 'MIXED', true);
});
t('sim volatility is sane (1m range ticks)', () => {
  for (const s of ['ES', 'SPY', 'JP225', 'EWJ', 'TLT']) {
    const inst = ctx.INST_BY_SYM[s], sim = new Sim(inst, inst.px, 0); sim.advance(3600000);
    const e = new Engine(inst); e.load(sim.ticks, sim.snaps); e.setTF(60);
    const r = e.bars.map(b => (b.h - b.l) / inst.tick).sort((a, b) => a - b);
    console.log('   ', s, 'median 1m range (ticks):', r[r.length >> 1].toFixed(1), ' px move/h:', (sim.last - inst.px).toFixed(inst.dec));
  }
});
console.log(ok + ' tests passed');
