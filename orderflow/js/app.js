/* App controller: instruments, simulated live feed, panels. */
(function () {
  const $ = id => document.getElementById(id);
  const TFS = [[5, '5s'], [15, '15s'], [30, '30s'], [60, '1m'], [180, '3m'], [300, '5m'], [900, '15m']];
  const HIST_MS = 4 * 3600 * 1000;
  const sims = {}, quotes = {}, store = (() => { try { return window.localStorage; } catch (e) { return null; } })();
  const q = new URLSearchParams(location.search);
  const cfg = JSON.parse((store && store.getItem('of.cfg')) || '{}');
  let cur = null, eng = null, chart = null, speed = 1, tab = 'tape', simClock = Date.now();

  /* ---- background quotes for the whole universe (light random walk) ---- */
  INSTRUMENTS.forEach(i => { const p = i.px * (1 + (Math.random() - .5) * .004); quotes[i.sym] = { open: p, last: p, bid: p, ask: p }; });
  function stepQuotes(dt) {
    for (const i of INSTRUMENTS) {
      const qq = quotes[i.sym]; if (cur && cur.live && cur.inst.sym === i.sym) { if (cur.last) qq.last = cur.last; continue; } if (sims[i.sym]) { qq.last = sims[i.sym].last; continue; }
      const s = i.px * 0.00004 * Math.sqrt(dt) * G_randn(); qq.last = Math.max(i.tick, Math.round((qq.last + s) / i.tick) * i.tick);
    }
  }
  const G_randn = () => randn();

  function getSim(sym) {
    if (sims[sym]) return sims[sym];
    const inst = INST_BY_SYM[sym], s = new Sim(inst, quotes[sym].last, simClock - HIST_MS);
    s.advance(simClock); sims[sym] = s; return s;
  }

  /* ---- select instrument ---- */
  function select(sym) {
    sym = (sym || '').toUpperCase(); if (!INST_BY_SYM[sym]) return;
    const inst = INST_BY_SYM[sym], isLive = !!(live.feed && live.authed && MassiveRoots[sym]);
    const sim = isLive ? liveBook(inst) : getSim(sym);
    if (cur) cur.onTick = null;
    cur = sim; eng = new Engine(inst); eng.tf = cfg.tf || 60;
    eng.imbRatio = +$('imbSel').value;
    if (isLive) { eng.load([], []); eng.snaps = []; liveSub(inst); }
    else { eng.load(sim.ticks.slice(), sim.snaps); eng.snaps = sim.snaps; liveUnsub(); }
    eng.on(() => { if (tab === 'sig') renderTab(); });
    if (!isLive) sim.onTick = tk => { eng.ingest(tk, true); tapeAdd(tk); };
    const old = chart && chart.s;
    if (!chart) { chart = new Chart($('chart'), eng); chart.drawLoop(); if (cfg.chart) Object.assign(chart.s.show, cfg.chart.show), (chart.s.panes = cfg.chart.panes || chart.s.panes), (chart.s.type = cfg.chart.type || chart.s.type); }
    else chart.e = eng;
    chart.indKey = ''; chart.s.off = 4; chart.invalidate();
    $('symIn').value = sym; tape.length = 0;
    fillCluster(inst); buildTF(); buildMenus(); markWatch(); renderTab(); domPrev = null;
    document.title = sym + ' · Orderflow Terminal';
    if (store) store.setItem('of.sym', sym);
  }
  window.OF = { select, get eng() { return eng; }, get chart() { return chart; }, get sim() { return cur; } };

  /* ---- toolbar ---- */
  function buildTF() {
    $('tfSeg').innerHTML = TFS.map(([s, l]) => `<button data-v="${s}" class="${eng.tf === s ? 'on' : ''}">${l}</button>`).join('');
  }
  $('tfSeg').onclick = e => { const v = e.target.dataset.v; if (!v) return; eng.setTF(+v); cfg.tf = +v; save(); chart.s.off = 4; chart.indKey = ''; buildTF(); chart.invalidate(); };
  $('typeSeg').onclick = e => { const v = e.target.dataset.v; if (!v) return; chart.s.type = v; [...$('typeSeg').children].forEach(b => b.classList.toggle('on', b.dataset.v === v)); save(); chart.invalidate(); };
  function fillCluster(inst) {
    const mults = [1, 2, 3, 4, 5, 8, 10, 20].map(x => Math.max(1, Math.round(inst.cluster * x / 2.5))).filter((v, i, a) => a.indexOf(v) === i);
    if (!mults.includes(inst.cluster)) mults.push(inst.cluster); mults.sort((a, b) => a - b);
    $('clSel').innerHTML = mults.map(m => `<option value="${m}" ${m === eng.mult ? 'selected' : ''}>${(m * inst.tick).toFixed(inst.dec)} (${m}t)</option>`).join('');
  }
  $('clSel').onchange = e => { eng.setMult(+e.target.value); chart.indKey = ''; chart.invalidate(); };
  $('imbSel').onchange = e => { eng.imbRatio = +e.target.value; chart.invalidate(); };
  $('spdSel').onchange = e => (speed = +e.target.value);
  $('symIn').onchange = e => select(e.target.value);
  $('symList').innerHTML = INSTRUMENTS.map(i => `<option value="${i.sym}">${i.name}</option>`).join('');

  const IND = [['vwap', 'VWAP'], ['vbands', 'VWAP ±1/2σ bands'], ['ema9', 'EMA 9'], ['ema21', 'EMA 21'], ['sma50', 'SMA 50'], ['boll', 'Bollinger 20,2'], ['sess', 'Session POC / VAH / VAL'], ['heat', 'Liquidity heatmap (book depth)'], ['profile', 'Volume profile (visible range)'], ['poc', 'Bar POC'], ['imb', 'Diagonal imbalances'], ['stack', 'Stacked imbalances'], ['absorb', 'Absorption'], ['ice', 'Iceberg detection'], ['big', 'Big-print bubbles'], ['div', 'Delta divergence'], ['summary', 'Δ / Vol / Δ% summary rows']];
  function buildMenus() {
    $('indMenu').innerHTML = '<h4>Overlays & orderflow</h4>' + IND.map(([k, l]) => `<label><input type="checkbox" data-k="${k}" ${chart.s.show[k] ? 'checked' : ''}>${l}</label>`).join('');
    $('paneMenu').innerHTML = '<h4>Sub-panes</h4>' + Object.entries(OF_PANES).map(([k, l]) => `<label><input type="checkbox" data-p="${k}" ${chart.s.panes.includes(k) ? 'checked' : ''}>${l}</label>`).join('');
  }
  $('indMenu').onchange = e => { chart.s.show[e.target.dataset.k] = e.target.checked; save(); chart.invalidate(); };
  $('paneMenu').onchange = e => { const k = e.target.dataset.p, p = chart.s.panes; if (e.target.checked) { if (!p.includes(k)) p.push(k); } else p.splice(p.indexOf(k), 1); save(); chart.invalidate(); };
  [['indBtn', 'indMenu'], ['paneBtn', 'paneMenu']].forEach(([b, m]) => ($(b).onclick = ev => { ev.stopPropagation(); const o = $(m).classList.contains('open'); document.querySelectorAll('.drop').forEach(d => d.classList.remove('open')); if (!o) $(m).classList.add('open'); }));
  document.addEventListener('click', e => { if (!e.target.closest('.drop') && e.target.id !== 'dataBtn') document.querySelectorAll('.drop').forEach(d => d.classList.remove('open')); });
  function save() { if (!store || !chart) return; cfg.chart = { show: chart.s.show, panes: chart.s.panes, type: chart.s.type }; try { store.setItem('of.cfg', JSON.stringify(cfg)); } catch (e) {} }

  /* ---- watchlist ---- */
  function buildWatch() {
    const f = $('wf').value.trim().toLowerCase(); let html = '', g = '';
    for (const i of INSTRUMENTS) {
      if (f && !(i.sym.toLowerCase().includes(f) || i.name.toLowerCase().includes(f))) continue;
      if (i.grp !== g) { g = i.grp; html += `<div class="grp">${g}</div>`; }
      html += `<div class="wr" data-s="${i.sym}" id="w_${i.sym}"><div><b>${i.sym}</b><small>${i.name}</small></div><span class="wp"></span><span class="wc"></span></div>`;
    }
    $('wlist').innerHTML = html; markWatch();
  }
  function markWatch() { document.querySelectorAll('.wr').forEach(r => r.classList.toggle('on', cur && r.dataset.s === cur.inst.sym)); }
  $('wlist').onclick = e => { const r = e.target.closest('.wr'); if (r) select(r.dataset.s); };
  $('wf').oninput = buildWatch;
  function updWatch() {
    for (const r of document.querySelectorAll('.wr')) {
      const i = INST_BY_SYM[r.dataset.s], qq = quotes[i.sym], ch = (qq.last - qq.open) / qq.open * 100;
      r.children[1].textContent = qq.last.toFixed(i.dec); const c = r.children[2]; c.textContent = (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%'; c.className = 'wc ' + (ch >= 0 ? 'up' : 'dn');
    }
  }

  /* ---- DOM ladder ---- */
  const LV = 12; let domPrev = null;
  function buildDom() {
    let h = ''; for (let i = 0; i < LV; i++) h += '<div class="dr ask" data-a="' + i + '"><div></div><div class="bidc"></div><div class="px"></div><div class="askc"></div><div class="vc"></div></div>';
    h += '<div class="dr spread" id="spr"></div>';
    for (let i = 0; i < LV; i++) h += '<div class="dr bid" data-b="' + i + '"><div></div><div class="bidc"></div><div class="px"></div><div class="askc"></div><div class="vc"></div></div>';
    $('dom').innerHTML = h;
    $('dom').insertAdjacentHTML('afterbegin', '<div class="dr" style="color:var(--dim);font-size:10px"><div>Δ lvl</div><div class="bidc">Bid</div><div class="px">Price</div><div class="askc">Ask</div><div class="vc">Vol</div></div>');
  }
  function renderDom() {
    if (!cur) return; const b = cur.book(), inst = cur.inst, d = inst.dec, tk = inst.tick;
    let mx = 1, sb = 0, sa = 0; for (let i = 0; i < LV; i++) { mx = Math.max(mx, b.bid[i], b.ask[i]); sb += b.bid[i]; sa += b.ask[i]; }
    const vol = k => { const L = Math.floor(k / eng.mult), c = eng.prof[L]; return c ? c[0] + c[1] : 0; }; // session vol by cluster
    const rows = $('dom').children;
    // rows[0]=header, 1..LV ask (top = deepest), LV+1 spread, then bids
    for (let i = 0; i < LV; i++) {
      const r = rows[1 + i], lvl = LV - 1 - i, k = b.bb + 1 + lvl, sz = b.ask[lvl];
      r.children[3].textContent = sz | 0; r.children[2].textContent = (k * tk).toFixed(d); r.children[4].textContent = abbr(vol(k));
      r.firstChild.innerHTML = ''; r.classList.toggle('wall', sz > mx * .7); setBar(r, sz / mx, 'ask'); iceMark(r, cur.iceA[k] > 0);
    }
    const sp = rows[1 + LV]; sp.textContent = 'last ' + cur.last.toFixed(d) + '  ·  book imb ' + ((sb - sa) / (sb + sa) * 100).toFixed(0) + '%';
    for (let i = 0; i < LV; i++) {
      const r = rows[2 + LV + i], k = b.bb - i, sz = b.bid[i];
      r.children[1].textContent = sz | 0; r.children[2].textContent = (k * tk).toFixed(d); r.children[4].textContent = abbr(vol(k));
      r.classList.toggle('wall', sz > mx * .7); setBar(r, sz / mx, 'bid'); iceMark(r, cur.iceB[k] > 0);
    }
    $('domInfo').textContent = 'bid ' + cur.bestBid().toFixed(d) + ' / ask ' + cur.bestAsk().toFixed(d);
  }
  const abbr = v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : v ? String(Math.round(v)) : '';
  function setBar(r, f) { let el = r.querySelector('.bar'); if (!el) { el = document.createElement('i'); el.className = 'bar'; r.appendChild(el); } el.style.width = (f * 50).toFixed(1) + '%'; }
  function iceMark(r, on) { let el = r.querySelector('.ib'); if (on && !el) { el = document.createElement('i'); el.className = 'ib'; el.title = 'hidden iceberg liquidity (simulator ground truth)'; r.appendChild(el); } else if (!on && el) el.remove(); }

  /* ---- tape / signals / stats ---- */
  const tape = [];
  function tapeAdd(tk) { tape.unshift(tk); if (tape.length > 80) tape.pop(); }
  $('tabs').onclick = e => { const t = e.target.dataset.t; if (!t) return; tab = t; [...$('tabs').children].forEach(b => b.classList.toggle('on', b.dataset.t === t)); renderTab(); };
  const tf = () => new Intl.DateTimeFormat('en-GB', { timeZone: cur.inst.tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  function renderTab() {
    if (!eng) return; const inst = cur.inst, d = inst.dec, fm = tf(); let h = '';
    if (tab === 'tape') {
      h = tape.map(t => `<div class="tr ${t.s >= inst.lot * eng.bigMult ? 'big' : ''}"><span style="color:var(--dim)">${fm.format(new Date(t.t))}</span><span class="${t.side > 0 ? 'up' : 'dn'}">${t.p.toFixed(d)}</span><span class="${t.side > 0 ? 'up' : 'dn'}">${t.s}</span></div>`).join('');
    } else if (tab === 'sig') {
      h = eng.signals.length ? eng.signals.map(s => `<div class="sg"><small>${fm.format(new Date(s.t))}</small><i style="color:${s.side > 0 ? 'var(--up)' : s.side < 0 ? 'var(--dn)' : '#fff'}">${s.type}</i>${s.msg}</div>`).join('') : '<div class="sg" style="color:var(--dim)">Waiting for signals… (stacked imbalances, absorption, icebergs, big prints, delta divergence)</div>';
    } else {
      if (!eng.bars.length) { $('tabBody').innerHTML = '<div class="sg" style="color:var(--dim)">Waiting for first trade…</div>'; return; }
      const b = eng.bars, ind = chart.compute(), last = b.length - 1, rg = ind.regime, pr = Engine.profile(eng.prof, .7);
      const tot = eng.ticks.reduce ? 0 : 0; let buy = 0, sell = 0; for (const x of b) { buy += x.buy; sell += x.sell; }
      const kv = (k, v, c) => `<div class="kv"><span>${k}</span><span class="${c || ''}">${v}</span></div>`;
      const m = eng.mult * inst.tick;
      h = kv('Instrument', inst.name) + kv('Last', cur.last.toFixed(d)) + kv('Session change', ((cur.last - eng.sessOpen) / eng.sessOpen * 100).toFixed(2) + '%', cur.last >= eng.sessOpen ? 'up' : 'dn')
        + kv('Volume', Math.round(buy + sell).toLocaleString()) + kv('Delta', Math.round(buy - sell).toLocaleString(), buy >= sell ? 'up' : 'dn') + kv('Buy / Sell %', (100 * buy / (buy + sell)).toFixed(1) + ' / ' + (100 * sell / (buy + sell)).toFixed(1))
        + kv('VWAP', b[last].vw.toFixed(d)) + (pr ? kv('Session POC', (pr.poc * m).toFixed(d)) + kv('Session VAH', ((pr.vah + 1) * m - inst.tick).toFixed(d)) + kv('Session VAL', (pr.val * m).toFixed(d)) : '')
        + kv('Regime', rg.lab[last] || '—', rg.lab[last] === 'TREND' ? 'up' : rg.lab[last] === 'CHOP' ? 'dn' : '') + kv('Efficiency ratio (20)', isNaN(rg.er[last]) ? '—' : rg.er[last].toFixed(2))
        + kv('Variance ratio (q=4)', isNaN(rg.vr[last]) ? '—' : rg.vr[last].toFixed(2)) + kv('Realised-vol percentile', isNaN(rg.rvp[last]) ? '—' : (rg.rvp[last] * 100).toFixed(0) + '%') + kv('ATR(14)', isNaN(ind.atr[last]) ? '—' : ind.atr[last].toFixed(d))
        + kv('Prints stored', eng.ticks.length.toLocaleString()) + kv('Timezone', inst.tz);
    }
    $('tabBody').innerHTML = h;
  }

  /* ---- live loop ---- */
  let lastReal = performance.now(), acc = 0;
  function loop() {
    const now = performance.now(), dtReal = now - lastReal; lastReal = now;
    const dt = dtReal * speed; simClock += dt;
    for (const k in sims) sims[k].advance(simClock);
    if (speed) chart && chart.invalidate();
    acc += dtReal; if (acc > 400) { stepQuotes(acc / 1000 * Math.max(1, speed)); updWatch(); renderDom(); if (tab !== 'sig') renderTab(); acc = 0; }
    $('clock').textContent = cur ? new Intl.DateTimeFormat('en-GB', { timeZone: cur.inst.tz, dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(new Date(cur.live ? Date.now() : simClock)) + ' ' + (cur.inst.tz === 'Asia/Tokyo' ? 'JST' : 'ET') : '';
    $('status').textContent = cur ? `${cur.inst.sym} · ${eng.bars.length} bars · ${eng.ticks.length.toLocaleString()} prints · ${Object.keys(sims).length} streams live` : '';
    requestAnimationFrame(loop);
  }


  /* ---- live Massive feed ---- */
  const live = { feed: null, authed: false, ticker: null, tickers: {} };
  function liveBook(inst) {
    const z = () => new Float64Array(64);
    return { live: true, inst, last: 0, D: 64, bid: z(), ask: z(), bb: 0, iceA: {}, iceB: {}, ticks: [], snaps: [], bq: null,
      book() { return { bb: this.bb, bid: this.bid, ask: this.ask, D: 64 }; },
      bestBid() { return this.bq ? this.bq.bp : this.last; }, bestAsk() { return this.bq ? this.bq.ap : this.last; } };
  }
  function tickerFor(inst) { return live.tickers[inst.sym] || frontContract(inst.sym); }
  function setMsg(t, bad) { $('dMsg').textContent = t; $('dMsg').style.color = bad ? 'var(--dn)' : 'var(--dim)'; }
  function setTag(t, live) { const f = $('feedTag'); f.textContent = t; f.style.color = live ? 'var(--up)' : 'var(--acc)'; f.style.borderColor = live ? '#14532f' : '#4d4012'; }
  function liveSub(inst) {
    const tkr = tickerFor(inst); live.ticker = tkr; live.feed.subscribe(tkr);
    setTag('LIVE · ' + tkr + (live.feed.url.indexOf('delayed') >= 0 ? ' · DELAYED' : ''), true);
    $('dAuto').textContent = 'auto: ' + frontContract(inst.sym);
  }
  function liveUnsub() { if (live.feed) live.feed.unsubscribe(); if (live.feed && live.authed) setTag('LIVE connected · ' + cur.inst.sym + ' simulated (not on futures feed)', false); else if (!live.feed) setTag('SIMULATED FEED', false); }
  function liveTrade(tk) {
    if (!cur || !cur.live) return;
    const inst = cur.inst, last = eng.ticks.length ? eng.ticks[eng.ticks.length - 1].t : 0;
    tk.t = Math.max(tk.t, last); tk.k = Math.round(tk.p / inst.tick); cur.last = tk.p;
    eng.ingest(tk); tapeAdd(tk);
  }
  function liveQuote(m) {
    if (!cur || !cur.live || m.sym !== live.ticker) return;
    const inst = cur.inst; cur.bq = m; cur.bb = Math.round(m.bp / inst.tick);
    cur.bid.fill(0); cur.ask.fill(0); cur.bid[0] = m.bs; cur.ask[0] = m.as; if (!cur.last) cur.last = (m.bp + m.ap) / 2;
  }
  function liveConnect() {
    const key = $('dKey').value.trim(); if (!key) return setMsg('Enter your Massive API key.', true);
    liveDisconnect(true);
    const url = $('dUrl').value.trim() || $('dFeed').value;
    if (store) try { store.setItem('of.feedUrl', $('dFeed').value); } catch (e) {}
    live.feed = new MassiveFeed({ url, key,
      onStatus: (s, msg) => {
        if (s === 'authed') { live.authed = true; setMsg('Authenticated. Trades + quotes stream for futures symbols (ES, NQ, YM, RTY, MES, MNQ, NKD).'); select(cur.inst.sym); }
        else if (s === 'error') { setMsg(msg, true); setTag('FEED ERROR', false); }
        else if (s === 'closed') { live.authed = false; if (live.feed) { setMsg('Disconnected (' + msg + ').', true); setTag('SIMULATED FEED', false); } }
        else setMsg(s + (msg ? ': ' + msg : ''));
      }, onTrade: liveTrade, onQuote: liveQuote });
    live.feed.connect();
  }
  function liveDisconnect(quiet) {
    if (live.feed) { const f = live.feed; live.feed = null; live.authed = false; f.close(); }
    if (!quiet) { setMsg('Disconnected. Back to simulated data.'); setTag('SIMULATED FEED', false); if (cur && cur.live) select(cur.inst.sym); }
  }
  $('dGo').onclick = liveConnect; $('dOff').onclick = () => liveDisconnect(false);
  $('dTicker').onchange = e => { const v = e.target.value.trim().toUpperCase(); if (cur) { if (v) live.tickers[cur.inst.sym] = v; else delete live.tickers[cur.inst.sym]; if (live.authed && cur.live) select(cur.inst.sym); } };
  $('dataBtn').onclick = ev => { ev.stopPropagation(); const m = $('dataMenu'), o = m.classList.contains('open'); document.querySelectorAll('.drop').forEach(d => d.classList.remove('open')); if (!o) m.classList.add('open'); };
  document.addEventListener('click', e => { if (e.target.closest('#dataMenu') || e.target.id === 'dataBtn') return; });
  window.OFLive = live;

  buildDom(); buildWatch();
  select(q.get('sym') || (store && store.getItem('of.sym')) || 'ES');
  if (q.get('tf')) { eng.setTF(+q.get('tf')); buildTF(); }
  requestAnimationFrame(loop);
})();
