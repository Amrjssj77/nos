/* Massive (ex-Polygon) futures WebSocket adapter.
   Docs: wss://socket.massive.com/futures (real-time) / wss://delayed.massive.com/futures
   Auth {"action":"auth","params":KEY}; subscribe T.<ticker> (trades) + Q.<ticker> (BBO quotes).
   The feed has no aggressor flag, so side is inferred (quote rule, then tick rule). */
(function (G) {
  const MONTHS = [[3, 'H'], [6, 'M'], [9, 'U'], [12, 'Z']];
  /* Front quarterly contract, e.g. ESZ6. Rolls on the 15th of the expiry month. */
  function frontContract(root, now) {
    const d = new Date(now || Date.now()), m = d.getUTCMonth() + 1, day = d.getUTCDate();
    let y = d.getUTCFullYear();
    for (const [qm, code] of MONTHS) if (qm > m || (qm === m && day < 15)) return root + code + (y % 10);
    return root + 'H' + ((y + 1) % 10);
  }
  /* Instruments the Massive futures feed can serve (CME roots). */
  const ROOTS = { ES: 1, NQ: 1, YM: 1, RTY: 1, MES: 1, MNQ: 1, NKD: 1 };

  function MassiveFeed(o) {
    this.url = o.url; this.key = o.key; this.h = o; this.ws = null; this.authed = false;
    this.subs = []; this.pending = null; this.q = {}; this.last = {};
  }
  const P = MassiveFeed.prototype;
  P.connect = function () {
    this.h.onStatus('connecting', this.url);
    const ws = (this.ws = new WebSocket(this.url));
    ws.onopen = () => ws.send(JSON.stringify({ action: 'auth', params: this.key }));
    ws.onmessage = ev => {
      let arr; try { arr = JSON.parse(ev.data); } catch (e) { return; }
      (Array.isArray(arr) ? arr : [arr]).forEach(m => this.msg(m));
    };
    ws.onerror = () => this.h.onStatus('error', 'WebSocket error (network, CORS/CSP or bad URL)');
    ws.onclose = e => { this.authed = false; this.h.onStatus('closed', 'closed ' + (e && e.code || '')); };
  };
  P.msg = function (m) {
    if (m.ev === 'status') {
      if (m.status === 'auth_success') { this.authed = true; this.h.onStatus('authed', m.message); if (this.pending) this.subscribe(this.pending); }
      else if (m.status === 'auth_failed' || /fail|error|max_conn|not authorized/i.test(m.status + ' ' + m.message)) this.h.onStatus('error', m.status + ': ' + m.message);
      else this.h.onStatus('info', m.status + ': ' + m.message);
    } else if (m.ev === 'Q') {
      this.q[m.sym] = { bp: m.bp, bs: m.bs, ap: m.ap, as: m.as, t: m.t };
      this.h.onQuote && this.h.onQuote(m);
    } else if (m.ev === 'T') {
      const tk = this.classify(m); if (tk) this.h.onTrade(tk, m);
    }
  };
  /* Quote rule (at/through ask = buy, at/through bid = sell), else tick rule. */
  P.classify = function (m) {
    if (!(m.s > 0) || !isFinite(m.p)) return null;
    const q = this.q[m.sym], st = this.last[m.sym] || (this.last[m.sym] = { p: m.p, side: 1 });
    let side = 0, dq = m.s;
    if (q && q.ap && m.p >= q.ap) { side = 1; dq = q.as; }
    else if (q && q.bp && m.p <= q.bp) { side = -1; dq = q.bs; }
    else side = m.p > st.p ? 1 : m.p < st.p ? -1 : st.side;
    st.p = m.p; st.side = side;
    return { t: m.t, p: m.p, s: m.s, side, dq: dq || m.s };
  };
  P.send = function (o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); };
  P.subscribe = function (ticker) {
    this.pending = ticker; if (!this.authed) return;
    this.unsubscribe(); this.subs = ['T.' + ticker, 'Q.' + ticker];
    this.send({ action: 'subscribe', params: this.subs.join(',') });
  };
  P.unsubscribe = function () { if (this.subs.length) this.send({ action: 'unsubscribe', params: this.subs.join(',') }); this.subs = []; };
  P.close = function () { this.pending = null; try { this.ws && this.ws.close(); } catch (e) {} };

  G.MassiveFeed = MassiveFeed; G.MassiveRoots = ROOTS; G.frontContract = frontContract;
})(typeof window !== 'undefined' ? window : globalThis);
