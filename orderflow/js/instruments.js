/* Instrument universe. Prices are placeholder reference levels for the simulator
   (not live quotes). tick = min price increment; cluster = footprint rows per
   cluster in ticks; lot = average print size; rate = prints/sec; bk = book
   thickness (lower = more volatile). */
(function (G) {
  const US = 'America/New_York', JP = 'Asia/Tokyo';
  const I = (sym, name, grp, px, tick, cluster, lot, rate, bk, tz, dec) =>
    ({ sym, name, grp, px, tick, cluster, lot, rate, bk, tz: tz || US, dec: dec == null ? decs(tick) : dec });
  function decs(t) { const s = String(t); return s.indexOf('.') < 0 ? 0 : s.split('.')[1].length; }

  G.INSTRUMENTS = [
    // --- US index futures / CFDs
    I('ES',  'E-mini S&P 500',        'US Indices', 6900, 0.25, 2, 3, 14, 4),
    I('NQ',  'E-mini Nasdaq-100',     'US Indices', 25000, 0.25, 4, 2, 12, 4),
    I('YM',  'E-mini Dow',            'US Indices', 48000, 1,    2, 2, 8, 4),
    I('RTY', 'E-mini Russell 2000',   'US Indices', 2600, 0.1,   5, 2, 6, 4),
    I('MES', 'Micro E-mini S&P',      'US Indices', 6900, 0.25, 2, 6, 14, 4),
    I('MNQ', 'Micro E-mini Nasdaq',   'US Indices', 25000, 0.25, 4, 4, 12, 4),
    I('US500', 'S&P 500 (cash CFD)',  'US Indices', 6900, 0.1,  5, 2, 8, 3),
    I('US100', 'Nasdaq-100 (cash CFD)', 'US Indices', 25000, 0.1, 10, 2, 8, 3),
    I('US30',  'Dow 30 (cash CFD)',   'US Indices', 48000, 1,   3, 2, 8, 3),
    I('VIX', 'CBOE Volatility Index', 'US Indices', 16, 0.01,   5, 5, 5, 1.7),
    // --- Japan
    I('JP225', 'Nikkei 225 (CFD)',    'Japan', 50000, 1,   5, 2, 10, 3, JP),
    I('NKD',   'Nikkei 225 Futures (CME USD)', 'Japan', 50000, 5, 2, 2, 8, 4, JP),
    I('NK225M','Nikkei 225 Mini (OSE)', 'Japan', 50000, 5,  2, 3, 9, 4, JP),
    I('TOPIX', 'TOPIX Futures',       'Japan', 3500, 0.5,  4, 3, 7, 4, JP),
    I('EWJ',   'iShares MSCI Japan ETF', 'Japan', 80, 0.01, 3, 150, 6, 1.8),
    I('DXJ',   'WisdomTree Japan Hedged', 'Japan', 140, 0.01, 5, 120, 4, 1.8),
    I('USDJPY','USD/JPY',             'Japan', 152, 0.001, 10, 40, 12, 2.2, JP),
    // --- US broad market ETFs
    I('SPY', 'SPDR S&P 500',          'US ETFs', 690, 0.01, 5, 120, 20, 2.0),
    I('QQQ', 'Invesco QQQ (Nasdaq-100)', 'US ETFs', 600, 0.01, 5, 100, 18, 2.0),
    I('DIA', 'SPDR Dow Jones',        'US ETFs', 480, 0.01, 5, 60, 8, 2.0),
    I('IWM', 'iShares Russell 2000',  'US ETFs', 260, 0.01, 3, 150, 14, 2.0),
    I('VOO', 'Vanguard S&P 500',      'US ETFs', 635, 0.01, 5, 40, 8, 2.0),
    I('IVV', 'iShares Core S&P 500',  'US ETFs', 690, 0.01, 5, 30, 6, 2.0),
    I('VTI', 'Vanguard Total Market', 'US ETFs', 330, 0.01, 4, 50, 7, 2.0),
    I('MDY', 'SPDR S&P MidCap 400',   'US ETFs', 600, 0.01, 6, 40, 4, 2.0),
    I('SMH', 'VanEck Semiconductor',  'US ETFs', 330, 0.01, 6, 60, 9, 2.0),
    I('ARKK','ARK Innovation',        'US ETFs', 75, 0.01, 3, 150, 6, 1.8),
    // --- Sector ETFs
    I('XLK', 'Technology Select',     'Sectors', 280, 0.01, 4, 80, 8, 2.0),
    I('XLF', 'Financial Select',      'Sectors', 55, 0.01, 2, 300, 9, 1.8),
    I('XLE', 'Energy Select',         'Sectors', 90, 0.01, 3, 200, 7, 1.8),
    I('XLV', 'Health Care Select',    'Sectors', 150, 0.01, 4, 100, 5, 2.0),
    I('XLY', 'Consumer Discretionary','Sectors', 230, 0.01, 4, 80, 5, 2.0),
    I('XLP', 'Consumer Staples',      'Sectors', 80, 0.01, 3, 150, 4, 1.8),
    I('XLI', 'Industrial Select',     'Sectors', 150, 0.01, 4, 90, 5, 2.0),
    I('XLU', 'Utilities Select',      'Sectors', 85, 0.01, 3, 150, 5, 1.8),
    I('XLB', 'Materials Select',      'Sectors', 90, 0.01, 3, 120, 3, 1.8),
    I('XLRE','Real Estate Select',    'Sectors', 42, 0.01, 2, 250, 3, 1.7),
    I('XLC', 'Communication Services','Sectors', 110, 0.01, 4, 100, 4, 2.0),
    // --- Bonds / commodities / FX / intl / vol
    I('TLT', 'iShares 20+ Yr Treasury','Macro ETFs', 88, 0.01, 2, 300, 10, 1.7),
    I('IEF', 'iShares 7-10 Yr Treasury','Macro ETFs', 96, 0.01, 2, 200, 5, 1.7),
    I('SHY', 'iShares 1-3 Yr Treasury','Macro ETFs', 82, 0.01, 1, 400, 3, 1.2),
    I('HYG', 'iShares High Yield',    'Macro ETFs', 80, 0.01, 2, 400, 8, 1.7),
    I('LQD', 'iShares IG Corporate',  'Macro ETFs', 108, 0.01, 2, 250, 5, 1.7),
    I('GLD', 'SPDR Gold',             'Macro ETFs', 300, 0.01, 5, 80, 9, 2.0),
    I('SLV', 'iShares Silver',        'Macro ETFs', 40, 0.01, 3, 300, 8, 1.8),
    I('USO', 'US Oil Fund',           'Macro ETFs', 75, 0.01, 3, 200, 6, 1.8),
    I('UUP', 'Invesco US Dollar Bull','Macro ETFs', 28, 0.01, 2, 400, 3, 1.0),
    I('FXY', 'Invesco CurrencyShares Yen', 'Macro ETFs', 62, 0.01, 2, 200, 2, 1.0),
    I('EEM', 'iShares Emerging Mkts', 'Macro ETFs', 55, 0.01, 2, 400, 8, 1.8),
    I('EFA', 'iShares MSCI EAFE',     'Macro ETFs', 92, 0.01, 3, 200, 6, 1.8),
    I('FXI', 'iShares China Large-Cap','Macro ETFs', 40, 0.01, 2, 400, 6, 1.7),
    I('VXX', 'iPath VIX Short-Term',  'Macro ETFs', 45, 0.01, 3, 200, 7, 2.0),
    I('UVXY','ProShares Ultra VIX',   'Macro ETFs', 20, 0.01, 3, 400, 7, 2.0),
    I('TQQQ','ProShares UltraPro QQQ','Leveraged', 90, 0.01, 3, 300, 14, 1.2),
    I('SQQQ','ProShares UltraPro Short QQQ','Leveraged', 12, 0.01, 2, 800, 12, 1.2),
    I('SPXL','Direxion Daily S&P 3x Bull','Leveraged', 220, 0.01, 4, 100, 6, 1.2),
    I('SOXL','Direxion Daily Semi 3x Bull','Leveraged', 50, 0.01, 3, 300, 10, 1.2),
  ];
  G.INST_BY_SYM = {};
  G.INSTRUMENTS.forEach(i => (G.INST_BY_SYM[i.sym] = i));
})(typeof window !== 'undefined' ? window : globalThis);
