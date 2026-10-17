# Orderflow Terminal

Zero-dependency browser terminal (open `index.html`, or `python3 -m http.server` in this folder).

**Instruments (60):** US index futures/CFDs (ES, NQ, YM, RTY, MES, MNQ, US500/100/30, VIX), Japan (JP225, NKD, NK225M, TOPIX, EWJ, DXJ, USDJPY), US broad/sector/macro/leveraged ETFs (SPY, QQQ, DIA, IWM, VOO, XLK…XLC, TLT, HYG, GLD, SLV, USO, EEM, TQQQ…). Edit `js/instruments.js` to add more.

**Charts:** footprint (bid×ask per level, POC, diagonal + stacked imbalances), candles, liquidity heatmap, visible-range volume profile (POC/VA70), session POC/VAH/VAL, big-print bubbles, 5s–15m bars, adjustable cluster size.
**Indicators:** VWAP (+1/2σ bands), EMA 9/21, SMA 50, Bollinger; panes for Volume, Delta, Delta %, CVD, RSI, MACD, ATR, Regime (efficiency ratio + variance ratio + realised-vol percentile → TREND/CHOP/MIXED).
**Detectors:** absorption, icebergs, stacked imbalances, big prints, delta divergence → Signals tab.
**Panels:** watchlist, DOM ladder (depth bars, walls, book imbalance, session volume per price), time & sales, session stats.

## Data is simulated
No free tick-level bid/ask feed exists for these instruments, so `js/sim.js` generates a synthetic order book and trade stream (walls, icebergs, sweeps, pressure regimes). Prices are placeholder levels, not quotes. To use real data, feed prints `{t, p, k: round(p/tick), s, side: +1|-1, dq}` into `Engine.ingest()`; the engine/chart are independent of the simulator.

`node tests/engine.test.js` runs the engine/indicator tests.
