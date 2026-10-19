'use strict';
/* مَقْعَد | MAQAD — working prototype. State lives in localStorage; payments are simulated. */

/* ---------- constants & helpers ---------- */
const KEY = 'maqad.v1';
const CAT = { music: 'موسيقى', sports: 'رياضة', comedy: 'كوميديا', theatre: 'مسرح', culture: 'ثقافة وتقنية' };
const TIER_NAME = { vip: 'VIP', gold: 'ذهبي', silver: 'فضي', gen: 'عام' };
const TIER_COLOR = { vip: '#d9ff3d', gold: '#ffb84d', silver: '#8fb3ff', gen: '#7cffc4' };
const ROWS = 'ABCDEFGHIJKLMN'.split('');
const HOLD_MS = 10 * 60 * 1000;
const MAX_SEATS = 8;
const PROMOS = { WELCOME10: { pct: 10 }, EID25: { pct: 25, max: 150 } };
const VENUES = [
  { id: 'v1', name: 'قاعة الواحة', city: 'الرياض' },
  { id: 'v2', name: 'مسرح الكورنيش', city: 'جدة' },
  { id: 'v3', name: 'ملعب الصقر', city: 'جدة' },
  { id: 'v4', name: 'ساحة الأفق', city: 'الدمام' },
  { id: 'v5', name: 'مركز المعارض', city: 'الرياض' },
  { id: 'v6', name: 'كورنيش الخبر', city: 'الخبر' },
];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => `<span class="num">${Math.round(n).toLocaleString('en-US')}</span> ر.س`;
const mtxt = n => `${Math.round(n).toLocaleString('en-US')} ر.س`;
const uid = p => p + Math.random().toString(36).slice(2, 8).toUpperCase();
const DF = new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
const DS = new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn', { day: 'numeric', month: 'short' });
const fdate = t => DF.format(new Date(t));
const pad = n => String(n).padStart(2, '0');
function rng(str) {
  let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } h = h || 1;
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
}
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

/* ---------- seat layout (shared by seated venues) ---------- */
const rowTier = r => r < 3 ? 'vip' : r < 8 ? 'gold' : 'silver';
const rowCount = r => r < 3 ? 10 : r < 8 ? 14 : 18;
const SEATS = [];
ROWS.forEach((L, r) => {
  const n = rowCount(r), y = 112 + r * 26 + (r >= 3 ? 12 : 0) + (r >= 8 ? 12 : 0);
  for (let j = 0; j < n; j++) SEATS.push({ id: L + (j + 1), row: L, r, n: j + 1, tier: rowTier(r), x: (560 - n * 28) / 2 + j * 28, y });
});
const SEAT_BY_ID = Object.fromEntries(SEATS.map(s => [s.id, s]));

/* ---------- seeded events ---------- */
const NOW0 = Date.now();
function at(days, hour) { const d = new Date(); d.setHours(hour, 0, 0, 0); return d.getTime() + days * 864e5; }
const seatedTiers = (v, g, s) => [{ k: 'vip', price: v }, { k: 'gold', price: g }, { k: 'silver', price: s }];
const SEED_EVENTS = [
  { id: 'e1', title: 'ليلة الطرب الكبرى', performer: 'فرقة الأصيل', cat: 'music', city: 'الرياض', venueId: 'v1', seated: true, hue: 285, tiers: seatedTiers(520, 330, 220), desc: 'أمسية غنائية كاملة مع فرقة موسيقية حية وإضاءة مسرحية، تستعيد أجمل ما غُني في الستينات والسبعينات.', ses: [[2, 21, .72], [3, 21, .35]] },
  { id: 'e2', title: 'كلاسيكو الدوري: الصقور × النمور', performer: 'الصقور × النمور', cat: 'sports', city: 'جدة', venueId: 'v3', seated: true, hue: 150, tiers: seatedTiers(300, 180, 90), desc: 'القمة المنتظرة في الجولة الحاسمة من الدوري. الأبواب تفتح قبل المباراة بساعتين.', ses: [[9, 20, .88]] },
  { id: 'e3', title: 'ستاند أب: ضحكة بعد منتصف الليل', performer: 'ثلاثي الضحك', cat: 'comedy', city: 'الرياض', venueId: 'v1', seated: true, hue: 28, tiers: seatedTiers(240, 160, 100), desc: 'ثلاثة كوميديين وساعتان من الضحك المتواصل. للعمر 16 سنة فأكثر.', ses: [['today', 0, .42], [6, 22, .2]] },
  { id: 'e4', title: 'مهرجان نور الإلكتروني', performer: '١٢ فناناً', cat: 'music', city: 'الدمام', venueId: 'v4', seated: false, hue: 190, tiers: [{ k: 'vip', price: 450, cap: 150 }, { k: 'gen', price: 180, cap: 1200 }], desc: 'ليلة مفتوحة تحت السماء مع ثلاث منصات موسيقية وعروض ضوئية. دخول عام وساحة VIP قرب المنصة الرئيسية.', ses: [[41, 19, .15], [42, 19, .1]] },
  { id: 'e5', title: 'مسرحية صدى الذاكرة', performer: 'مسرح الحكاية', cat: 'theatre', city: 'جدة', venueId: 'v2', seated: true, hue: 345, tiers: seatedTiers(280, 190, 120), desc: 'عمل مسرحي عن رجل يستعيد ذكريات مدينته القديمة. العرض الأول مكتمل، والعرض الثاني متاح.', ses: [[4, 20, 1], [11, 20, .3]] },
  { id: 'e6', title: 'قمة المستقبل التقنية', performer: '٤٠ متحدثاً', cat: 'culture', city: 'الرياض', venueId: 'v5', seated: false, hue: 215, tiers: [{ k: 'vip', price: 900, cap: 200 }, { k: 'gen', price: 300, cap: 2000 }], desc: 'يومان من الجلسات وورش العمل حول الذكاء الاصطناعي والتجارة الرقمية، مع معرض للشركات الناشئة.', ses: [[33, 9, .55]] },
  { id: 'e7', title: 'ماراثون الكورنيش', performer: '١٠ كم', cat: 'sports', city: 'الخبر', venueId: 'v6', seated: false, hue: 95, tiers: [{ k: 'gen', price: 60, cap: 3000 }], desc: 'سباق جري على امتداد الكورنيش لجميع المستويات. يشمل القميص وميدالية الإنجاز.', ses: [[18, 5, .6]] },
  { id: 'e8', title: 'أمسية الأوركسترا الشرقية', performer: 'أوركسترا المدينة', cat: 'music', city: 'الرياض', venueId: 'v1', seated: true, hue: 40, tiers: seatedTiers(420, 260, 170), desc: 'مقطوعات شرقية كلاسيكية بقيادة المايسترو، في قاعة مصممة لأفضل صوت.', ses: [[14, 20, .5]] },
].map(e => ({ ...e, organizerId: 'o1', status: 'published', motif: 'm-' + e.cat, ses: e.ses.map(([d, h, ratio], i) => ({ id: `${e.id}-s${i}`, ratio, at: d === 'today' ? Math.ceil((NOW0 + 3 * 36e5) / 36e5) * 36e5 : at(d, h) })) }));

/* ---------- state ---------- */
function fresh() {
  const seeded = [
    { id: 'L1', evId: 'e1', sid: 'e1-s0', tier: 'gold', seat: 'E7', price: 330, max: 330, seller: 'مستخدم موثّق' },
    { id: 'L2', evId: 'e1', sid: 'e1-s0', tier: 'silver', seat: 'K12', price: 210, max: 220, seller: 'مستخدم موثّق' },
    { id: 'L3', evId: 'e3', sid: 'e3-s1', tier: 'vip', seat: 'B4', price: 240, max: 240, seller: 'مستخدم موثّق' },
  ];
  seeded.forEach(l => { l.seed = true; });
  return { user: null, users: [], sold: {}, released: {}, gaSold: {}, holds: {}, activeHold: null, orders: [], payments: [], tickets: [], listings: seeded, waitlist: [], groups: {}, favs: [], points: { bal: 0, life: 0, tx: [] }, notifs: [], userEvents: [], overrides: {}, scans: [], audit: [], promoUsed: [], prefs: { push: true, email: true, offers: false } };
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
S = { ...fresh(), ...S };
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
const UI = { ck: null, sel: new Set(), qty: {}, ses: {}, focusSeat: null, zoom: 1, pop: null, filt: {}, tab: {} };

/* ---------- domain: events, inventory, pricing ---------- */
const allEvents = () => [...SEED_EVENTS.map(e => ({ ...e, status: S.overrides[e.id] || e.status })), ...S.userEvents];
const evById = id => allEvents().find(e => e.id === id);
const publicEvents = () => allEvents().filter(e => e.status === 'published');
const venueOf = ev => VENUES.find(v => v.id === ev.venueId) || { name: '', city: ev.city };
const sesById = id => { for (const e of allEvents()) { const s = e.ses.find(x => x.id === id); if (s) return { ev: e, ses: s }; } return null; };
const upcoming = ev => ev.ses.filter(s => s.at > Date.now()).sort((a, b) => a.at - b.at);
const nextSes = ev => upcoming(ev)[0] || ev.ses[0];
const tierOf = (ev, k) => ev.tiers.find(t => t.k === k);

const seedCache = {};
function seedSold(ses) {
  if (seedCache[ses.id]) return seedCache[ses.id];
  const r = rng(ses.id), set = new Set();
  SEATS.forEach(s => { if (ses.ratio >= 1 || r() < ses.ratio * (1.3 - .05 * s.r)) set.add(s.id); });
  return seedCache[ses.id] = set;
}
function soldSet(ses) {
  const out = new Set(), rel = S.released[ses.id] || [];
  seedSold(ses).forEach(x => { if (!rel.includes(x)) out.add(x); });
  Object.keys(S.sold[ses.id] || {}).forEach(x => out.add(x));
  S.listings.forEach(l => { if (l.sid === ses.id && l.seat) out.add(l.seat); });
  return out;
}
function liveHolds(sid, except) { return Object.values(S.holds).filter(h => h.sid === sid && h.exp > Date.now() && h.token !== except); }
function heldSeats(sid, except) { const s = new Set(); liveHolds(sid, except).forEach(h => (h.seats || []).forEach(x => s.add(x))); return s; }
function gaTaken(ses, k, except) {
  const ev = sesById(ses.id).ev, cap = tierOf(ev, k).cap;
  const sold = Math.round(cap * ses.ratio) + ((S.gaSold[ses.id] || {})[k] || 0);
  const held = liveHolds(ses.id, except).reduce((a, h) => a + ((h.qty || {})[k] || 0), 0);
  return { cap, sold, held, free: Math.max(0, cap - sold - held) };
}
function occupancy(ev, ses) {
  if (ev.seated) return soldSet(ses).size / SEATS.length;
  let c = 0, s = 0; ev.tiers.forEach(t => { const g = gaTaken(ses, t.k); c += g.cap; s += g.sold; }); return s / c;
}
const isSoldOut = (ev, ses) => ev.seated ? soldSet(ses).size >= SEATS.length : ev.tiers.every(t => gaTaken(ses, t.k).sold >= t.cap);
function dyn(ev, ses, k) {
  const base = tierOf(ev, k).price, occ = occupancy(ev, ses), days = (ses.at - Date.now()) / 864e5;
  if (occ > .85) return { price: Math.round(base * 1.15), tag: 'طلب مرتفع', cls: 'w', base };
  if (days > 30) return { price: Math.round(base * .85), tag: 'حجز مبكر −15%', cls: 'g', base };
  if (days < 3 && occ < .6) return { price: Math.round(base * .8), tag: 'خصم اللحظة الأخيرة −20%', cls: 'g', base };
  return { price: base, tag: '', cls: '', base };
}
const fromPrice = (ev, ses) => Math.min(...ev.tiers.map(t => dyn(ev, ses, t.k).price));

/* ---------- holds, orders, tickets ---------- */
function gc() {
  const now = Date.now(); let ch = false;
  Object.values(S.holds).forEach(h => {
    if (h.exp > now) return;
    const g = S.groups[h.orderId];
    if (g && g.status === 'open') { g.status = 'expired'; const o = S.orders.find(x => x.id === h.orderId); if (o) { o.status = 'cancelled'; o.note = 'انتهت مهلة الدفع الجماعي وأُعيدت المبالغ المدفوعة'; } notify('انتهت مهلة الدفع الجماعي', `ألغي الطلب ${h.orderId} وأُعيدت المبالغ.`); }
    delete S.holds[h.token]; ch = true;
  });
  if (S.activeHold && !S.holds[S.activeHold]) { S.activeHold = null; ch = true; }
  if (ch) save();
}
function releaseActive() { if (S.activeHold) { const h = S.holds[S.activeHold]; if (!(h && h.orderId)) delete S.holds[S.activeHold]; S.activeHold = null; save(); } }
function createHold(ev, ses, seats, qty) {
  releaseActive();
  if (ev.seated) {
    const sold = soldSet(ses), held = heldSeats(ses.id);
    const bad = seats.filter(s => sold.has(s) || held.has(s));
    if (bad.length) return { err: `المقاعد ${bad.join('، ')} لم تعد متاحة. اختر مقاعد أخرى.` };
  } else {
    for (const k in qty) if (qty[k] > gaTaken(ses, k).free) return { err: `لم يتبقَّ العدد المطلوب في فئة ${TIER_NAME[k]}.` };
  }
  const h = { token: uid('H'), sid: ses.id, evId: ev.id, seats, qty, exp: Date.now() + HOLD_MS };
  S.holds[h.token] = h; S.activeHold = h.token; save(); return { hold: h };
}
function holdItems(h) {
  const { ev, ses } = sesById(h.sid), items = [];
  if (ev.seated) h.seats.forEach(id => { const s = SEAT_BY_ID[id]; items.push({ k: s.tier, seat: id, label: `صف ${s.row} · مقعد ${s.n}`, unit: dyn(ev, ses, s.tier).price }); });
  else Object.entries(h.qty).forEach(([k, n]) => { for (let i = 0; i < n; i++) items.push({ k, seat: null, label: `دخول ${TIER_NAME[k]}`, unit: dyn(ev, ses, k).price }); });
  return items;
}
function quote(h, ck) {
  const items = holdItems(h), sub = items.reduce((a, i) => a + i.unit, 0), fee = Math.round(sub * .05);
  let discount = 0, promoMsg = '';
  if (ck.promo) {
    const p = PROMOS[ck.promo];
    if (!p) promoMsg = 'الكود غير صحيح.';
    else if (S.promoUsed.includes(ck.promo)) promoMsg = 'استخدمت هذا الكود من قبل.';
    else { discount = Math.min(Math.round(sub * p.pct / 100), p.max || 1e9); promoMsg = `تم تطبيق الخصم ${p.pct}%`; }
  }
  let ptsUsed = 0;
  if (ck.points) { const maxPts = Math.floor((sub - discount) * .5 * 10); ptsUsed = Math.floor(Math.min(S.points.bal, maxPts) / 100) * 100; }
  const pointsDisc = ptsUsed / 10, taxable = sub - discount - pointsDisc + fee, vat = Math.round(taxable * .15);
  return { items, sub, fee, discount, promoMsg, ptsUsed, pointsDisc, vat, total: taxable + vat };
}
function addPoints(n, reason) { S.points.bal += n; if (n > 0) S.points.life += n; S.points.tx.unshift({ at: Date.now(), n, reason, bal: S.points.bal }); }
const tierLevel = () => S.points.life >= 1500 ? 'بلاتيني' : S.points.life >= 500 ? 'ذهبي' : 'فضي';
function notify(title, body) { S.notifs.unshift({ id: uid('N'), at: Date.now(), title, body, read: false }); save(); }
function audit(action, detail) { S.audit.unshift({ at: Date.now(), who: S.user ? S.user.name : 'النظام', action, detail }); }
function newTicket(o, item, ev, ses, userId, unit) {
  const t = { id: uid('T-'), orderId: o.id, evId: ev.id, sid: ses.id, tier: item.k, seat: item.seat, label: item.label, unit, status: 'active', secret: uid('S'), userId };
  S.tickets.push(t); return t;
}
const qrText = t => `MAQAD|${t.id}|${hash(t.secret + t.id)}`;
function commitInventory(h, ticketsFor) {
  const { ses } = sesById(h.sid); S.sold[ses.id] = S.sold[ses.id] || {}; S.gaSold[ses.id] = S.gaSold[ses.id] || {};
  ticketsFor.forEach(t => { if (t.seat) S.sold[ses.id][t.seat] = t.id; else S.gaSold[ses.id][t.tier] = (S.gaSold[ses.id][t.tier] || 0) + 1; });
}
function finalizeOrder(o) {
  const h = S.holds[o.holdToken]; if (!h || o.status === 'paid') return;
  const { ev, ses } = sesById(o.sid), tk = [];
  o.items.forEach(i => tk.push(newTicket(o, i, ev, ses, o.userId, i.unit)));
  commitInventory(h, tk); delete S.holds[h.token]; if (S.activeHold === h.token) S.activeHold = null;
  o.status = 'paid'; o.paidAt = Date.now();
  if (o.promo) S.promoUsed.push(o.promo);
  if (o.ptsUsed) addPoints(-o.ptsUsed, `استبدال نقاط في الطلب ${o.id}`);
  const earn = Math.floor(o.total / 10); o.earned = earn; if (earn) addPoints(earn, `حجز ${ev.title}`);
  notify('تم تأكيد حجزك', `${ev.title} · ${tk.length} تذكرة. تجدها في محفظة التذاكر.`);
  audit('order.paid', o.id); save();
}
function refundPct(ses) { const hrs = (ses.at - Date.now()) / 36e5; return hrs > 48 ? 1 : hrs > 24 ? .5 : 0; }
function cancelOrder(o) {
  const { ses } = sesById(o.sid), pct = refundPct(ses), mine = S.tickets.filter(t => t.orderId === o.id && t.status === 'active');
  mine.forEach(t => { t.status = 'cancelled'; if (t.seat) delete (S.sold[t.sid] || {})[t.seat]; else S.gaSold[t.sid][t.tier]--; });
  S.listings = S.listings.filter(l => !mine.some(t => t.id === l.ticketId));
  o.status = pct ? 'refunded' : 'cancelled'; o.refund = Math.round(o.total * pct);
  if (o.earned) addPoints(-Math.min(o.earned, S.points.bal), `عكس نقاط الطلب ${o.id}`);
  if (o.ptsUsed) addPoints(o.ptsUsed, `إرجاع نقاط الطلب ${o.id}`);
  S.payments.push({ id: uid('P'), orderId: o.id, amount: -o.refund, method: o.method, status: 'refunded', at: Date.now() });
  audit('order.cancel', `${o.id} refund ${o.refund}`); offerWaitlist(ses.id); save();
}
function offerWaitlist(sid) {
  const w = S.waitlist.find(x => x.sid === sid && x.status === 'waiting');
  if (w) { notify('توفرت تذكرة!', 'ظهر مقعد في قائمة انتظارك. أمامك 10 دقائق لحجزه.'); }
}

/* ---------- auth ---------- */
const needLogin = () => { if (!S.user) { openLogin(); return true; } return false; };
function openLogin(step = 1, phone = '', name = '') {
  modal(`<h3>${step === 1 ? 'تسجيل الدخول أو إنشاء حساب' : 'أدخل رمز التحقق'}</h3>
  ${step === 1 ? `<label class="f">الاسم<input id="lg-name" value="${esc(name)}" placeholder="مثال: سارة العتيبي" autocomplete="name"></label>
  <label class="f">رقم الجوال<input id="lg-phone" inputmode="tel" value="${esc(phone)}" placeholder="05XXXXXXXX" autocomplete="tel"></label>
  <button class="btn primary" data-act="lg-send">إرسال رمز التحقق</button>`
  : `<p class="muted">أرسلنا رمزاً إلى <span class="num">${esc(phone)}</span>. في هذه النسخة التجريبية الرمز هو <b class="num">123456</b>.</p>
  <label class="f">رمز التحقق<input id="lg-otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></label>
  <p class="err-t" id="lg-err"></p><button class="btn primary" data-act="lg-verify" data-phone="${esc(phone)}" data-name="${esc(name)}">تحقق ودخول</button>`}
  <button class="btn" data-act="close">إغلاق</button>`);
}

/* ---------- UI primitives ---------- */
function modal(html) { const m = $('#modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.classList.add('open'); setTimeout(() => $('#modal input, #modal button')?.focus(), 30); }
function closeModal() { $('#modal').classList.remove('open'); $('#modal').innerHTML = ''; }
function toast(msg, err) { const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 4200); }
function go(path) { if (location.hash === '#' + path) render(); else location.hash = path; }
const badgeStatus = s => ({ published: ['منشورة', 'g'], review: ['قيد المراجعة', 'w'], draft: ['مسودة', 'n'], rejected: ['مرفوضة', 'r'] }[s] || [s, 'n']);

function posterHTML(ev, ses, opts = {}) {
  const d = new Date(ses.at);
  return `<div class="poster ${ev.motif || 'm-' + ev.cat}" style="--h:${ev.hue}">
    <div class="top"><span class="datebox">${d.getDate()}<small>${DS.format(d).replace(/\d+\s*/, '')}</small></span>
    ${opts.fav ? `<button class="fav ${S.favs.includes(ev.id) ? 'on' : ''}" data-act="fav" data-id="${ev.id}" aria-label="إضافة إلى المفضلة">${S.favs.includes(ev.id) ? '♥' : '♡'}</button>` : ''}</div>
    <div class="pt">${esc(ev.title)}</div></div>`;
}
function eventCard(ev, reason) {
  const ses = nextSes(ev), out = isSoldOut(ev, ses), occ = occupancy(ev, ses), p = out ? null : fromPrice(ev, ses);
  const badge = out ? '<span class="badge r">اكتمل</span>' : occ > .85 ? '<span class="badge w">آخر المقاعد</span>' : occ > .6 ? '<span class="badge">الأكثر طلباً</span>' : '';
  return `<article class="ev">
    ${posterHTML(ev, ses, { fav: true })}
    <a class="body" href="#/event/${ev.id}" style="color:inherit">
      <div class="row sb"><span class="meta">${CAT[ev.cat]} · ${esc(ev.city)}</span>${badge}</div>
      <div class="meta">${esc(venueOf(ev).name)} · ${fdate(ses.at)}</div>
      ${reason ? `<div class="badge g" style="justify-self:start">${esc(reason)}</div>` : ''}
      <div class="price"><span>${out ? 'انضم لقائمة الانتظار' : `من ${money(p)}`}</span><span class="btn sm primary">${out ? 'التفاصيل' : 'احجز'}</span></div>
    </a></article>`;
}

/* ---------- recommendations ---------- */
function recommend() {
  const cats = {};
  S.favs.forEach(id => { const e = evById(id); if (e) cats[e.cat] = (cats[e.cat] || 0) + 2; });
  S.tickets.filter(t => t.userId === S.user?.id).forEach(t => { const e = evById(t.evId); if (e) cats[e.cat] = (cats[e.cat] || 0) + 3; });
  const owned = new Set(S.tickets.filter(t => t.status === 'active').map(t => t.evId));
  return publicEvents().filter(e => !owned.has(e.id) && upcoming(e).length).map(e => {
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    const score = (cats[e.cat] || 0) * 10 + occupancy(e, nextSes(e)) * 5;
    return { e, score, reason: cats[e.cat] ? `لأنك تفضّل ${CAT[e.cat]}` : (top ? '' : 'رائج الآن') };
  }).sort((a, b) => b.score - a.score).slice(0, 4);
}

/* ---------- views ---------- */
const VIEWS = {};
VIEWS.home = () => {
  const evs = publicEvents().filter(e => upcoming(e).length), soon = evs.filter(e => nextSes(e).at - Date.now() < 864e5);
  const trending = [...evs].sort((a, b) => occupancy(b, nextSes(b)) - occupancy(a, nextSes(a))).slice(0, 4);
  const viz = Array.from({ length: 72 }, (_, i) => `<i class="${[9, 10, 23, 24, 25, 40, 41, 52].includes(i) ? 'p' : (i % 7 === 3 || i % 11 === 0) ? 's' : ''}"></i>`).join('');
  return `<section class="hero"><div>
    <span class="badge">منصة حجز الفعاليات</span>
    <h1 style="margin-top:12px">احجز <em>مكانك</em> صح</h1>
    <p class="lead">اختر مقعدك بدقة على الخريطة، شاهد منظوره قبل أن تدفع، وقسّم الفاتورة مع أصدقائك. وإن تغيّرت خطتك، أعد بيع تذكرتك رسمياً وبأمان.</p>
    <form class="searchbar" data-form="search"><input id="hs-q" placeholder="ابحث عن فعالية أو فنان أو مدينة" aria-label="بحث"><button class="btn primary">بحث</button></form>
    <div class="row" style="margin-top:16px">${Object.entries(CAT).map(([k, v]) => `<a class="chip" href="#/events?cat=${k}">${v}</a>`).join('')}</div>
  </div><div class="seatviz" aria-hidden="true">${viz}</div></section>
  <div class="usp"><div><b>مقعد دقيق</b><span class="muted">خريطة تفاعلية بحالة لحظية وحجز مؤقت 10 دقائق.</span></div>
  <div><b>إعادة بيع رسمية</b><span class="muted">بسعر لا يتجاوز الأصلي، وتذكرة جديدة للمشتري.</span></div>
  <div><b>تقسيم الفاتورة</b><span class="muted">رابط دفع لكل صديق، والتذاكر تصدر عند اكتمال الدفع.</span></div>
  <div><b>قائمة انتظار</b><span class="muted">أول من يُبلَّغ عند توفر مقعد في فعالية مكتملة.</span></div></div>
  ${soon.length ? `<section class="sec"><div class="sec-head"><h2>خلال 24 ساعة</h2></div><div class="grid cards">${soon.map(e => eventCard(e)).join('')}</div></section>` : ''}
  <section class="sec"><div class="sec-head"><h2>${S.favs.length || S.tickets.length ? 'مقترحة لك' : 'رائجة الآن'}</h2><a href="#/events">كل الفعاليات ←</a></div>
  <div class="grid cards">${(S.favs.length || S.tickets.length ? recommend().map(r => eventCard(r.e, r.reason)) : trending.map(e => eventCard(e, 'رائج'))).join('')}</div></section>
  <section class="sec"><div class="sec-head"><h2>قريباً</h2></div><div class="grid cards">${[...evs].sort((a, b) => nextSes(a).at - nextSes(b).at).map(e => eventCard(e)).join('')}</div></section>`;
};

VIEWS.events = (_, qs) => {
  const f = { q: qs.q || '', cat: qs.cat || '', city: qs.city || '', max: qs.max || '', when: qs.when || '', sort: qs.sort || 'soon' };
  const cities = [...new Set(publicEvents().map(e => e.city))];
  const now = Date.now();
  let list = publicEvents().filter(e => upcoming(e).length).filter(e => {
    const s = nextSes(e), hay = [e.title, e.performer, e.city, venueOf(e).name, CAT[e.cat]].join(' ');
    return (!f.q || hay.includes(f.q)) && (!f.cat || e.cat === f.cat) && (!f.city || e.city === f.city) && (!f.max || fromPrice(e, s) <= +f.max)
      && (!f.when || s.at - now < ({ today: 864e5, week: 7 * 864e5, month: 30 * 864e5 }[f.when]));
  });
  list.sort((a, b) => f.sort === 'price' ? fromPrice(a, nextSes(a)) - fromPrice(b, nextSes(b)) : f.sort === 'pop' ? occupancy(b, nextSes(b)) - occupancy(a, nextSes(a)) : nextSes(a).at - nextSes(b).at);
  return `<section class="sec"><h2>الفعاليات</h2>
  <div class="row">${[['', 'الكل'], ...Object.entries(CAT)].map(([k, v]) => `<button class="chip ${f.cat === k ? 'on' : ''}" data-act="filter" data-k="cat" data-v="${k}">${v}</button>`).join('')}</div>
  <div class="filters card">
    <label class="f">بحث<input id="f-q" value="${esc(f.q)}" placeholder="الاسم أو الفنان أو المدينة" data-filter="q"></label>
    <label class="f">المدينة<select data-filter="city"><option value="">الكل</option>${cities.map(c => `<option ${f.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    <label class="f">الموعد<select data-filter="when">${[['', 'أي وقت'], ['today', 'خلال 24 ساعة'], ['week', 'هذا الأسبوع'], ['month', 'هذا الشهر']].map(([k, v]) => `<option value="${k}" ${f.when === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="f">أعلى سعر (ر.س)<input type="number" min="0" value="${esc(f.max)}" placeholder="بدون حد" data-filter="max"></label>
    <label class="f">الترتيب<select data-filter="sort">${[['soon', 'الأقرب'], ['price', 'الأرخص'], ['pop', 'الأكثر طلباً']].map(([k, v]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  </div>
  <p class="muted">${list.length} فعالية</p>
  ${list.length ? `<div class="grid cards">${list.map(e => eventCard(e)).join('')}</div>` : '<div class="empty">لا توجد نتائج. جرّب تخفيف الفلاتر.</div>'}</section>`;
};

VIEWS.event = ([, id], qs) => {
  const ev = evById(id); if (!ev || (ev.status !== 'published' && S.user?.role === 'user')) return '<div class="empty">الفعالية غير موجودة.</div>';
  const ses = ev.ses.find(s => s.id === qs.s) || nextSes(ev), out = isSoldOut(ev, ses), v = venueOf(ev);
  const listings = S.listings.filter(l => l.sid === ses.id);
  const wl = S.waitlist.find(w => w.sid === ses.id && w.userId === S.user?.id && w.status !== 'done');
  return `<div class="crumb"><a href="#/events">الفعاليات</a> / ${esc(ev.title)}</div>
  <section class="ehero">${posterHTML(ev, ses, { fav: true })}
  <div><span class="badge">${CAT[ev.cat]}</span> ${ev.status !== 'published' ? `<span class="badge w">${badgeStatus(ev.status)[0]}</span>` : ''}
    <h2 style="margin-block:10px">${esc(ev.title)}</h2><p class="muted">${esc(ev.desc)}</p>
    <dl class="facts"><div><dt>الموعد</dt><dd>${fdate(ses.at)}</dd></div><div><dt>المكان</dt><dd>${esc(v.name)}، ${esc(ev.city)}</dd></div><div><dt>الفنان</dt><dd>${esc(ev.performer)}</dd></div>
    <div><dt>الحجز</dt><dd>${ev.seated ? 'مقاعد محددة على الخريطة' : 'دخول عام بالعدد'}</dd></div><div><dt>الإلغاء</dt><dd>استرجاع كامل قبل 48 ساعة، و50% قبل 24 ساعة</dd></div></dl>
    ${ev.ses.length > 1 ? `<div class="sess" role="tablist">${ev.ses.map(s => `<button class="${s.id === ses.id ? 'on' : ''}" data-act="ses" data-id="${ev.id}" data-s="${s.id}">${fdate(s.at)}${isSoldOut(ev, s) ? ' <span class="badge r">اكتمل</span>' : ''}</button>`).join('')}</div>` : ''}
  </div></section>
  <div class="grid g2">
    <div class="card"><h3>الأسعار والفئات</h3>${ev.tiers.map(t => { const d = dyn(ev, ses, t.k), left = ev.seated ? SEATS.filter(s => s.tier === t.k && !soldSet(ses).has(s.id)).length : gaTaken(ses, t.k).free;
      return `<div class="tier"><span><i class="sw" style="--c:${TIER_COLOR[t.k]}"></i><b>${TIER_NAME[t.k]}</b> <span class="muted">· متبقي ${left}</span></span><span>${d.tag ? `<span class="badge ${d.cls}">${d.tag}</span> ` : ''}${d.price !== d.base ? `<s class="muted num">${d.base}</s> ` : ''}<b>${money(d.price)}</b></span></div>`; }).join('')}
      <p class="muted" style="margin-top:10px;font-size:13px">يظهر السعر النهائي مع الرسوم (5%) وضريبة القيمة المضافة (15%) قبل الدفع.</p>
      <div style="margin-top:12px">${out ? (wl ? `<div class="notice">أنت في قائمة الانتظار · الترتيب <b>${S.waitlist.filter(w => w.sid === ses.id && w.status === 'waiting').indexOf(wl) + 1}</b>. <a href="#/account/waitlist">إدارة</a></div>` : `<button class="btn primary block" data-act="join-wl" data-s="${ses.id}">انضم لقائمة الانتظار</button>`) : `<a class="btn primary block" href="#/book/${ses.id}">${ev.seated ? 'اختر مقاعدك' : 'احجز الآن'}</a>`}</div></div>
    <div class="card"><h3>سوق إعادة البيع الرسمي</h3>
      ${listings.length ? listings.map(l => `<div class="tier"><span><b>${TIER_NAME[l.tier]}</b> · ${l.seat ? `مقعد ${l.seat}` : 'دخول'}</span><span><b>${money(l.price)}</b> <button class="btn sm" data-act="buy-resale" data-id="${l.id}">اشترِ</button></span></div>`).join('') : '<p class="muted">لا توجد تذاكر معروضة حالياً لهذه الجلسة.</p>'}
      <p class="muted" style="font-size:13px;margin-top:10px">كل التذاكر المعاد بيعها تُصدر من جديد برمز QR خاص بالمشتري، وسعرها لا يتجاوز السعر الأصلي.</p></div>
  </div>`;
};

VIEWS.book = ([, sid]) => {
  const f = sesById(sid); if (!f) return '<div class="empty">الجلسة غير موجودة.</div>';
  const { ev, ses } = f;
  if (ev.status !== 'published') return '<div class="empty">هذه الفعالية غير منشورة بعد.</div>';
  if (isSoldOut(ev, ses)) return `<div class="empty">اكتملت هذه الجلسة. <a href="#/event/${ev.id}?s=${ses.id}">انضم لقائمة الانتظار</a></div>`;
  if (ses.at < Date.now()) return '<div class="empty">انتهى موعد هذه الجلسة.</div>';
  const legend = ev.tiers.map(t => `<span><i style="--c:${TIER_COLOR[t.k]}"></i>${TIER_NAME[t.k]} ${mtxt(dyn(ev, ses, t.k).price)}</span>`).join('');
  return `<div class="crumb"><a href="#/event/${ev.id}">${esc(ev.title)}</a> / اختيار ${ev.seated ? 'المقاعد' : 'التذاكر'} · ${fdate(ses.at)}</div>
  <section class="book"><div class="grid" style="gap:12px;min-width:0">
    <div class="row sb"><h2>${ev.seated ? 'خريطة المقاعد' : 'عدد التذاكر'}</h2>
    ${ev.seated ? `<div class="row"><button class="btn sm" data-act="zoom" data-d="-0.25" aria-label="تصغير">−</button><button class="btn sm" data-act="zoom" data-d="0.25" aria-label="تكبير">+</button></div>` : ''}</div>
    <div class="legend">${legend}${ev.seated ? '<span><i style="--c:#fff"></i>مختار</span><span><i style="--c:#2a3647"></i>غير متاح</span>' : ''}</div>
    ${ev.seated ? `<div class="mapbox" id="mapbox">${seatMapSVG(ev, ses)}</div>` : gaPicker(ev, ses)}
  </div>
  <aside class="side" id="bk-side">${bookSide(ev, ses)}</aside></section>`;
};
function seatMapSVG(ev, ses) {
  const sold = soldSet(ses), held = heldSeats(ses.id, S.activeHold), w = Math.round(560 * UI.zoom);
  let out = `<svg viewBox="0 0 560 500" style="width:${w}px" id="seatmap" role="group" aria-label="خريطة المقاعد"><defs><linearGradient id="stg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9ff3d" stop-opacity=".5"/><stop offset="1" stop-color="#d9ff3d" stop-opacity="0"/></linearGradient></defs>
  <path d="M60 14 H500 Q530 14 524 44 L520 70 H40 L36 44 Q30 14 60 14Z" fill="url(#stg)" stroke="rgba(217,255,61,.4)"/><text x="280" y="50" text-anchor="middle" fill="#eef4ff" font-size="15" font-weight="700" letter-spacing="4">المسرح</text>`;
  ROWS.forEach((L, r) => { const y = 112 + r * 26 + (r >= 3 ? 12 : 0) + (r >= 8 ? 12 : 0); out += `<text class="rowlbl" x="18" y="${y + 14}" text-anchor="middle">${L}</text><text class="rowlbl" x="542" y="${y + 14}" text-anchor="middle">${L}</text>`; });
  SEATS.forEach(s => {
    const st = sold.has(s.id) ? 'sold' : held.has(s.id) ? 'held' : '', on = UI.sel.has(s.id) ? ' sel' : '', p = dyn(ev, ses, s.tier).price;
    out += `<rect class="seat ${st}${on}" data-seat="${s.id}" x="${s.x + 3}" y="${s.y}" width="22" height="21" rx="6" style="--c:${TIER_COLOR[s.tier]}" tabindex="${st ? -1 : 0}" role="button" aria-label="صف ${s.row} مقعد ${s.n} ${TIER_NAME[s.tier]} ${p} ريال ${st ? 'غير متاح' : ''}"><title>صف ${s.row} · مقعد ${s.n} · ${TIER_NAME[s.tier]} · ${p} ر.س</title></rect>`;
  });
  return out + '</svg>';
}
function gaPicker(ev, ses) {
  return `<div class="card">${ev.tiers.map(t => { const g = gaTaken(ses, t.k, S.activeHold), d = dyn(ev, ses, t.k);
    return `<div class="tier"><span><i class="sw" style="--c:${TIER_COLOR[t.k]}"></i><b>${TIER_NAME[t.k]}</b><br><span class="muted">${g.free ? `متبقي ${g.free}` : 'نفدت'}${d.tag ? ` · ${d.tag}` : ''}</span></span>
    <span class="row"><b>${money(d.price)}</b><span class="stepper"><button data-act="qty" data-k="${t.k}" data-d="-1" aria-label="إنقاص">−</button><b id="q-${t.k}">${UI.qty[t.k] || 0}</b><button data-act="qty" data-k="${t.k}" data-d="1" aria-label="زيادة">+</button></span></span></div>`; }).join('')}</div>`;
}
function bookSide(ev, ses) {
  let items = [];
  if (ev.seated) items = [...UI.sel].map(id => { const s = SEAT_BY_ID[id]; return { k: s.tier, label: `صف ${s.row} · مقعد ${s.n}`, unit: dyn(ev, ses, s.tier).price }; });
  else Object.entries(UI.qty).forEach(([k, n]) => { for (let i = 0; i < n; i++) items.push({ k, label: `دخول ${TIER_NAME[k]}`, unit: dyn(ev, ses, k).price }); });
  const sub = items.reduce((a, i) => a + i.unit, 0), fs = UI.focusSeat && SEAT_BY_ID[UI.focusSeat];
  return `${ev.seated ? `<div class="card"><h3>منظور المقعد</h3><div class="viewbox">${seatView(fs, ev)}</div>
    <p class="muted" style="font-size:12px;margin:8px 0 0">${fs ? `صف ${fs.row} · مقعد ${fs.n}. ` : 'مرّر على مقعد أو اخترْه. '}منظور تقريبي بحسب المسافة والزاوية. الصور البانورامية 360° تُربط بصور كل قاعة عند توفرها.</p></div>` : ''}
  <div class="card"><h3>ملخص الحجز</h3>
    ${items.length ? items.map(i => `<div class="line"><span><i class="sw" style="--c:${TIER_COLOR[i.k]}"></i>${i.label}</span><span>${money(i.unit)}</span></div>`).join('') + `<div class="line total"><span>المجموع</span><span>${money(sub)}</span></div>` : `<p class="muted">${ev.seated ? `اختر حتى ${MAX_SEATS} مقاعد.` : `اختر حتى ${MAX_SEATS} تذاكر.`}</p>`}
    <p class="err-t" id="bk-err"></p>
    <button class="btn primary block" data-act="hold" data-s="${ses.id}" ${items.length ? '' : 'disabled'}>متابعة إلى الدفع</button>
    <p class="muted" style="font-size:12px;margin:8px 0 0">نحجز لك المقاعد لمدة 10 دقائق عند المتابعة.</p></div>`;
}
function seatView(s, ev) {
  const d = s ? s.r : 6, off = s ? (s.x + 14 - 280) / 280 : 0, sc = 1 - d * .045, w = 300 * sc, x = 160 - w / 2 + off * 70 * (1 - d * .02);
  const heads = Array.from({ length: 14 }, (_, i) => `<circle cx="${12 + i * 24 + (i % 2) * 6}" cy="${150 + (i % 3) * 6}" r="${9 + (i % 3)}" fill="#0b1420"/>`).join('');
  return `<svg viewBox="0 0 320 180" role="img" aria-label="منظور تقريبي من المقعد"><defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101c2c"/><stop offset="1" stop-color="#040a10"/></linearGradient><radialGradient id="sp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d9ff3d" stop-opacity=".55"/><stop offset="1" stop-color="#d9ff3d" stop-opacity="0"/></radialGradient></defs>
  <rect width="320" height="180" fill="url(#vg)"/><ellipse cx="${x + w / 2}" cy="${50 + d * 1.2}" rx="${w * .6}" ry="${40 * sc}" fill="url(#sp)"/>
  <rect x="${x}" y="${60 + d * 1.5}" width="${w}" height="${28 * sc}" rx="3" fill="hsl(${ev.hue} 60% 30%)" stroke="#d9ff3d" stroke-opacity=".5"/>
  <rect x="${x + w * .1}" y="${60 + d * 1.5 - 18 * sc}" width="${w * .8}" height="${18 * sc}" fill="hsl(${ev.hue} 50% 18%)"/>${heads}</svg>`;
}

VIEWS.checkout = () => {
  const h = S.holds[S.activeHold]; if (!h) return '<div class="empty">لا يوجد حجز نشط. <a href="#/events">تصفح الفعاليات</a></div>';
  if (needLogin()) return '<div class="empty">سجّل الدخول لإكمال الدفع.</div>';
  const { ev, ses } = sesById(h.sid), ck = UI.ck = UI.ck && UI.ck.token === h.token ? UI.ck : { token: h.token, promo: '', points: false, method: 'card', split: 0 };
  const q = quote(h, ck);
  return `<div class="crumb"><a href="#/book/${ses.id}">← تعديل الاختيار</a></div>
  <section class="book"><div class="grid" style="min-width:0">
    <div class="card"><h2>الدفع</h2>
      <div class="pay-tabs" style="margin-block:14px">${[['card', 'بطاقة'], ['mada', 'مدى'], ['apple', 'Apple Pay']].map(([k, v]) => `<button class="chip ${ck.method === k ? 'on' : ''}" data-act="method" data-k="${k}">${v}</button>`).join('')}</div>
      <div class="paybox" id="paybox">${ck.method === 'apple' ? '<div class="notice">سيظهر طلب التحقق من Apple Pay عند الضغط على الدفع (محاكاة).</div>' : `
        <label class="f">رقم البطاقة<input id="cc-n" inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="cc-number" maxlength="19"></label>
        <div class="grid g2"><label class="f">الانتهاء<input id="cc-e" placeholder="MM/YY" autocomplete="cc-exp" maxlength="5"></label><label class="f">CVC<input id="cc-c" inputmode="numeric" maxlength="4" autocomplete="cc-csc"></label></div>
        <p class="muted" style="font-size:12px;margin:0">لا نخزّن بيانات البطاقة. الرقم المنتهي بـ 0000 يحاكي فشل الدفع.</p>`}
        <p class="err-t" id="pay-err"></p></div></div>
    <div class="card"><h3>تقسيم الفاتورة مع أصدقائك</h3><p class="muted">تُصدر التذاكر بعد أن يدفع الجميع ضمن مهلة الحجز. تدفع أنت حصتك الآن.</p>
      <div class="row">${[0, 2, 3, 4, 5].map(n => `<button class="chip ${ck.split === n ? 'on' : ''}" data-act="split" data-n="${n}">${n ? `${n} أشخاص` : 'بدون تقسيم'}</button>`).join('')}</div></div>
  </div>
  <aside class="side"><div class="card"><div class="row sb"><h3>${esc(ev.title)}</h3><span class="timer" data-timer="${h.exp}"></span></div><p class="muted">${fdate(ses.at)}</p>
    ${q.items.map(i => `<div class="line"><span><i class="sw" style="--c:${TIER_COLOR[i.k]}"></i>${i.label}</span><span>${money(i.unit)}</span></div>`).join('')}
    <div class="line"><span class="muted">رسوم الخدمة 5%</span><span>${money(q.fee)}</span></div>
    ${q.discount ? `<div class="line disc"><span>خصم الكود</span><span>−${money(q.discount)}</span></div>` : ''}
    ${q.pointsDisc ? `<div class="line disc"><span>نقاط الولاء (${q.ptsUsed})</span><span>−${money(q.pointsDisc)}</span></div>` : ''}
    <div class="line"><span class="muted">ضريبة القيمة المضافة 15%</span><span>${money(q.vat)}</span></div>
    <div class="line total"><span>الإجمالي</span><span>${money(q.total)}</span></div>
    ${ck.split ? `<div class="notice">حصتك الآن: <b>${money(Math.ceil(q.total / (ck.split + 1)))}</b> من ${ck.split + 1} أشخاص</div>` : ''}
    <div class="row" style="margin-top:12px;flex-wrap:nowrap"><input id="promo" placeholder="كود خصم (WELCOME10)" value="${esc(ck.promo)}" aria-label="كود الخصم"><button class="btn sm" data-act="promo">تطبيق</button></div>
    ${ck.promo ? `<p class="${q.discount ? 'muted' : 'err-t'}" style="font-size:13px">${q.promoMsg}</p>` : ''}
    <label class="row" style="margin-block:10px;font-size:14px"><input type="checkbox" style="width:auto" id="usepts" data-act="points" ${ck.points ? 'checked' : ''}> استخدم نقاطي (${S.points.bal} نقطة، كل 100 نقطة = 10 ر.س)</label>
    <button class="btn primary block" data-act="pay" id="paybtn">${ck.split ? 'ادفع حصتي وأنشئ الروابط' : `ادفع ${mtxt(q.total)}`}</button></div></aside></section>`;
};

VIEWS.order = ([, id]) => {
  const o = S.orders.find(x => x.id === id); if (!o) return '<div class="empty">الطلب غير موجود.</div>';
  const { ev, ses } = sesById(o.sid), tks = S.tickets.filter(t => t.orderId === o.id), g = S.groups[o.id];
  const stT = { paid: ['مدفوع', 'g'], awaiting_group: ['بانتظار دفع الأصدقاء', 'w'], cancelled: ['ملغي', 'r'], refunded: ['مسترجع', 'n'] }[o.status];
  return `<section class="sec"><div class="row sb"><h2>${o.status === 'paid' ? 'تم الحجز بنجاح' : 'الطلب ' + o.id}</h2><span class="badge ${stT[1]}">${stT[0]}</span></div>
  <div class="card"><h3>${esc(ev.title)}</h3><p class="muted">${fdate(ses.at)} · ${esc(venueOf(ev).name)}</p>
    <div class="line"><span>الإجمالي المدفوع</span><b>${money(o.total)}</b></div>${o.earned ? `<div class="line disc"><span>نقاط مكتسبة</span><span>+${o.earned}</span></div>` : ''}
    ${o.refund != null ? `<div class="line"><span>المسترجع</span><b>${money(o.refund)}</b></div>` : ''}${o.note ? `<p class="muted">${esc(o.note)}</p>` : ''}</div>
  ${g ? groupCard(o, g) : ''}
  ${tks.length ? `<div class="grid g2">${tks.map(ticketCard).join('')}</div>` : ''}
  <div class="row"><a class="btn primary" href="#/tickets">محفظة التذاكر</a>${o.status === 'paid' && o.method !== 'resale' && ses.at > Date.now() ? `<button class="btn danger" data-act="cancel-order" data-id="${o.id}">إلغاء الطلب (استرجاع ${Math.round(refundPct(ses) * 100)}%)</button>` : ''}</div></section>`;
};
function groupCard(o, g) {
  return `<div class="card"><h3>الدفع الجماعي</h3><p class="muted">تنتهي المهلة ${g.status === 'open' ? 'خلال <span class="timer" style="font-size:15px" data-timer="' + g.exp + '"></span>' : '(انتهت)'}.</p>
  ${g.members.map(m => `<div class="tier"><span>${esc(m.name)}${m.owner ? ' (أنت)' : ''} · ${money(m.amount)}</span>${m.paid ? '<span class="badge g">دفع</span>' : `<span class="row"><button class="btn sm" data-act="copy" data-t="${esc(location.href.split('#')[0])}#/pay/${m.token}">نسخ الرابط</button><button class="btn sm" data-act="friend-pay" data-t="${m.token}">محاكاة دفعه</button></span>`}</div>`).join('')}</div>`;
}
VIEWS.pay = ([, token]) => {
  let m, g;
  for (const og of Object.values(S.groups)) { const f = og.members.find(x => x.token === token); if (f) { m = f; g = og; } }
  if (!m) return '<div class="empty">رابط الدفع غير صالح.</div>';
  const o = S.orders.find(x => x.id === g.orderId), { ev } = sesById(o.sid);
  return `<section class="sec" style="max-width:520px;margin:auto"><div class="card"><h2>حصتك في حجز ${esc(ev.title)}</h2><p class="muted">دعاك ${esc(S.users.find(u => u.id === o.userId)?.name || 'صديقك')} للمشاركة في الدفع.</p>
  <div class="kpi" style="margin-block:12px">${money(m.amount)}</div>
  ${m.paid ? '<span class="badge g">تم الدفع</span>' : g.status !== 'open' ? '<span class="badge r">انتهت المهلة</span>' : `<button class="btn primary block" data-act="friend-pay" data-t="${token}">ادفع حصتي (محاكاة)</button>`}</div></section>`;
};

function ticketCard(t) {
  const ev = evById(t.evId), f = sesById(t.sid), ses = f.ses, st = { active: 'صالحة', used: 'مستخدمة', listed: 'معروضة للبيع', cancelled: 'ملغاة', resold: 'أُعيد بيعها' }[t.status];
  return `<div class="card tk"><div><span class="badge n">${t.id}</span> <b class="status-${t.status}">${st}</b><h3 style="margin-top:6px">${esc(ev.title)}</h3>
    <p class="muted" style="margin:0">${fdate(ses.at)}<br>${esc(venueOf(ev).name)} · ${TIER_NAME[t.tier]} · ${t.seat ? `مقعد ${t.seat}` : 'دخول عام'}</p>
    <div class="row" style="margin-top:10px">${t.status === 'active' ? `<button class="btn sm" data-act="qr" data-id="${t.id}">عرض QR</button><button class="btn sm" data-act="wallet" data-id="${t.id}">إضافة للمحفظة</button>${ses.at > Date.now() ? `<button class="btn sm" data-act="resale" data-id="${t.id}">أعد البيع</button>` : ''}` : ''}
    ${t.status === 'listed' ? `<button class="btn sm danger" data-act="unlist" data-id="${t.id}">إلغاء العرض</button>` : ''}</div></div>
    <div class="stub"><div class="muted" style="font-size:12px">${t.seat ? 'المقعد' : 'الفئة'}</div><div class="kpi" style="font-size:26px">${t.seat || TIER_NAME[t.tier]}</div></div></div>`;
}
VIEWS.tickets = () => {
  if (needLogin()) return '<div class="empty">سجّل الدخول لعرض تذاكرك.</div>';
  const mine = S.tickets.filter(t => t.userId === S.user.id), tab = UI.tab.tk || 'up', now = Date.now();
  const groups = { up: mine.filter(t => ['active', 'listed'].includes(t.status) && sesById(t.sid).ses.at > now), past: mine.filter(t => t.status === 'used' || (t.status === 'active' && sesById(t.sid).ses.at <= now)), can: mine.filter(t => ['cancelled', 'resold'].includes(t.status)) };
  return `<section class="sec"><h2>محفظة التذاكر</h2>
  <div class="tabs">${[['up', 'القادمة'], ['past', 'السابقة'], ['can', 'الملغاة والمباعة']].map(([k, v]) => `<button class="chip ${tab === k ? 'on' : ''}" data-act="tab" data-g="tk" data-k="${k}">${v} (${groups[k].length})</button>`).join('')}</div>
  ${groups[tab].length ? `<div class="grid g2">${groups[tab].map(ticketCard).join('')}</div>` : '<div class="empty">لا توجد تذاكر هنا. <a href="#/events">اكتشف فعاليات</a></div>'}
  <h3 style="margin-top:20px">طلباتي</h3><div class="scroll-x"><table><thead><tr><th>الطلب</th><th>الفعالية</th><th>الحالة</th><th>الإجمالي</th><th></th></tr></thead><tbody>
  ${S.orders.filter(o => o.userId === S.user.id).map(o => `<tr><td class="num">${o.id}</td><td>${esc(sesById(o.sid).ev.title)}</td><td>${o.status}</td><td>${money(o.total)}</td><td><a href="#/order/${o.id}">عرض</a></td></tr>`).join('') || '<tr><td colspan="5" class="muted">لا توجد طلبات.</td></tr>'}</tbody></table></div></section>`;
};

VIEWS.resale = () => {
  const ls = S.listings.filter(l => { const f = sesById(l.sid); return f && f.ses.at > Date.now(); });
  return `<section class="sec"><h2>سوق إعادة البيع الرسمي</h2><p class="muted">تذاكر من مستخدمين موثّقين، بسعر لا يتجاوز سعر الشراء الأصلي. عند الشراء تُلغى التذكرة القديمة وتصدر لك تذكرة جديدة.</p>
  ${ls.length ? `<div class="grid g3">${ls.map(l => { const { ev, ses } = sesById(l.sid); return `<div class="card"><span class="badge g">${TIER_NAME[l.tier]}</span><h3 style="margin-block:8px 4px">${esc(ev.title)}</h3><p class="muted">${fdate(ses.at)}<br>${l.seat ? `مقعد ${l.seat}` : 'دخول عام'} · ${esc(l.seller)}</p>
  <div class="row sb"><div><b class="kpi" style="font-size:24px">${money(l.price)}</b>${l.price < l.max ? `<br><s class="muted">${mtxt(l.max)}</s>` : ''}</div><button class="btn primary" data-act="buy-resale" data-id="${l.id}">اشترِ</button></div></div>`; }).join('')}</div>` : '<div class="empty">لا توجد عروض حالياً.</div>'}</section>`;
};

VIEWS.account = ([, sub]) => {
  if (needLogin()) return '<div class="empty">سجّل الدخول للوصول إلى حسابك.</div>';
  sub = sub || 'profile';
  const tabs = [['profile', 'حسابي'], ['loyalty', 'نقاط الولاء'], ['favorites', 'المفضلة'], ['waitlist', 'قوائم الانتظار']];
  let body = '';
  if (sub === 'profile') body = `<div class="card grid"><label class="f">الاسم<input id="pf-name" value="${esc(S.user.name)}"></label><label class="f">الجوال<input value="${esc(S.user.phone)}" disabled></label>
    <label class="row"><input type="checkbox" style="width:auto" data-pref="push" ${S.prefs.push ? 'checked' : ''}> إشعارات التطبيق</label>
    <label class="row"><input type="checkbox" style="width:auto" data-pref="email" ${S.prefs.email ? 'checked' : ''}> إشعارات البريد</label>
    <label class="row"><input type="checkbox" style="width:auto" data-pref="offers" ${S.prefs.offers ? 'checked' : ''}> العروض والتوصيات</label>
    <button class="btn primary" data-act="save-profile">حفظ</button></div>
    <div class="card"><h3>الدور التجريبي</h3><p class="muted">لتجربة لوحات المنظم والإدارة والماسح بدون نظام صلاحيات حقيقي.</p>
    <div class="row">${[['user', 'مستخدم'], ['organizer', 'منظم'], ['admin', 'مدير المنصة']].map(([k, v]) => `<button class="chip ${S.user.role === k ? 'on' : ''}" data-act="role" data-k="${k}">${v}</button>`).join('')}</div></div>
    <button class="btn danger" data-act="logout">تسجيل الخروج</button>`;
  if (sub === 'loyalty') { const L = S.points.life, next = L >= 1500 ? null : L >= 500 ? 1500 : 500;
    body = `<div class="card"><div class="row sb"><div><div class="muted">الرصيد</div><div class="kpi">${S.points.bal}</div></div><span class="badge">${tierLevel()}</span></div>
    ${next ? `<div class="bar" style="margin-top:12px"><i style="width:${Math.min(100, L / next * 100)}%"></i></div><p class="muted" style="font-size:13px">${next - L} نقطة للمستوى التالي</p>` : ''}
    <p class="muted">تكسب نقطة لكل 10 ر.س. كل 100 نقطة تساوي خصم 10 ر.س في صفحة الدفع، بحد أقصى 50% من قيمة التذاكر.</p></div>
    <div class="card"><h3>الحركات</h3>${S.points.tx.map(t => `<div class="line"><span>${esc(t.reason)}<br><small class="muted">${fdate(t.at)}</small></span><b class="${t.n > 0 ? 'status-active' : 'status-cancelled'} num">${t.n > 0 ? '+' : ''}${t.n}</b></div>`).join('') || '<p class="muted">لا توجد حركات بعد.</p>'}</div>`; }
  if (sub === 'favorites') { const fv = S.favs.map(evById).filter(Boolean); body = fv.length ? `<div class="grid cards">${fv.map(e => eventCard(e)).join('')}</div>` : '<div class="empty">لم تضف فعاليات للمفضلة.</div>'; }
  if (sub === 'waitlist') { const w = S.waitlist.filter(x => x.userId === S.user.id);
    body = w.length ? w.map(x => { const { ev, ses } = sesById(x.sid), pos = S.waitlist.filter(y => y.sid === x.sid && y.status === 'waiting').indexOf(x) + 1;
      return `<div class="card row sb"><div><h3>${esc(ev.title)}</h3><p class="muted" style="margin:0">${fdate(ses.at)} · ${x.status === 'waiting' ? `ترتيبك ${pos}` : x.status === 'offered' ? 'لديك عرض!' : 'انتهت'}</p></div>
      <div class="row">${x.status === 'waiting' ? `<button class="btn sm" data-act="wl-sim" data-id="${x.id}">محاكاة توفر مقعد</button>` : ''}${x.status === 'offered' ? `<span class="timer" style="font-size:16px" data-timer="${x.offerExp}"></span><a class="btn sm primary" href="#/checkout" data-act="wl-take" data-id="${x.id}">أكمل الحجز</a>` : ''}${x.status !== 'done' ? `<button class="btn sm danger" data-act="wl-leave" data-id="${x.id}">مغادرة</button>` : ''}</div></div>`; }).join('') : '<div class="empty">لست في أي قائمة انتظار.</div>'; }
  return `<section class="sec"><h2>${esc(S.user.name)}</h2><div class="tabs">${tabs.map(([k, v]) => `<a class="chip ${sub === k ? 'on' : ''}" href="#/account/${k}">${v}</a>`).join('')}</div><div class="grid" style="gap:14px">${body}</div></section>`;
};

/* organizer */
const myEvents = () => allEvents().filter(e => e.organizerId === 'o1');
function evStats(ev) {
  const per = {}; let rev = 0, sold = 0, cap = 0;
  ev.ses.forEach(ses => ev.tiers.forEach(t => {
    let n, c;
    if (ev.seated) { const tierSeats = SEATS.filter(s => s.tier === t.k); c = tierSeats.length; const so = soldSet(ses); n = tierSeats.filter(s => so.has(s.id)).length; } else { const g = gaTaken(ses, t.k); c = g.cap; n = g.sold; }
    per[t.k] = per[t.k] || { n: 0, c: 0 }; per[t.k].n += n; per[t.k].c += c; sold += n; cap += c; rev += n * t.price;
  }));
  return { per, rev, sold, cap };
}
VIEWS.organizer = ([, sub]) => {
  if (!S.user || S.user.role === 'user') return '<div class="empty">هذه الصفحة للمنظمين. فعّل دور المنظم من <a href="#/account/profile">حسابي</a>.</div>';
  if (sub === 'new') return organizerForm();
  const evs = myEvents(), st = evs.map(e => ({ e, s: evStats(e) })), tot = st.reduce((a, x) => ({ sold: a.sold + x.s.sold, rev: a.rev + x.s.rev, cap: a.cap + x.s.cap }), { sold: 0, rev: 0, cap: 0 });
  return `<section class="sec"><div class="row sb"><h2>لوحة المنظم</h2><a class="btn primary" href="#/organizer/new">فعالية جديدة</a></div>
  <div class="grid g4"><div class="card"><div class="muted">تذاكر مباعة</div><div class="kpi">${tot.sold}</div></div><div class="card"><div class="muted">الإيرادات (تقديري)</div><div class="kpi" style="font-size:26px">${money(tot.rev)}</div></div>
  <div class="card"><div class="muted">نسبة الإشغال</div><div class="kpi">${tot.cap ? Math.round(tot.sold / tot.cap * 100) : 0}%</div></div><div class="card"><div class="muted">فعاليات</div><div class="kpi">${evs.length}</div></div></div>
  <p class="muted" style="font-size:13px">تشمل الأرقام مبيعات تجريبية مبدئية بالإضافة إلى حجوزاتك في هذا المتصفح.</p>
  <div class="card"><h3>المبيعات حسب الفئة</h3><div class="hbars">${st.map(({ e, s }) => `<div><b>${esc(e.title)}</b>${Object.entries(s.per).map(([k, v]) => `<div class="r"><span><i class="sw" style="--c:${TIER_COLOR[k]}"></i>${TIER_NAME[k]}</span><div class="bar"><i style="width:${v.c ? v.n / v.c * 100 : 0}%"></i></div><span class="num">${v.n}/${v.c}</span></div>`).join('')}</div>`).join('')}</div></div>
  <div class="card scroll-x"><h3>فعالياتي</h3><table><thead><tr><th>الفعالية</th><th>الحالة</th><th>الجلسات</th><th></th></tr></thead><tbody>${evs.map(e => { const b = badgeStatus(e.status); return `<tr><td>${esc(e.title)}</td><td><span class="badge ${b[1]}">${b[0]}</span></td><td>${e.ses.length}</td><td>${e.status === 'draft' ? `<button class="btn sm primary" data-act="submit-ev" data-id="${e.id}">إرسال للمراجعة</button>` : `<a href="#/event/${e.id}">عرض</a>`}${e.rejectReason ? ` <span class="err-t">${esc(e.rejectReason)}</span>` : ''}</td></tr>`; }).join('')}</tbody></table></div></section>`;
};
function organizerForm() {
  return `<section class="sec" style="max-width:760px"><div class="crumb"><a href="#/organizer">← لوحة المنظم</a></div><h2>إنشاء فعالية</h2>
  <form class="card grid" data-form="newev">
    <label class="f">العنوان<input name="title" required maxlength="80"></label>
    <div class="grid g2"><label class="f">التصنيف<select name="cat">${Object.entries(CAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <label class="f">المكان<select name="venue">${VENUES.map(v => `<option value="${v.id}">${v.name} · ${v.city}</option>`).join('')}</select></label></div>
    <div class="grid g2"><label class="f">الموعد<input type="datetime-local" name="when" required></label><label class="f">الفنان / الجهة<input name="performer" required></label></div>
    <label class="f">الوصف<textarea name="desc" required></textarea></label>
    <label class="f">نوع الحجز<select name="seated" id="ev-seated"><option value="1">مقاعد محددة (خريطة VIP / ذهبي / فضي)</option><option value="0">دخول عام بالعدد</option></select></label>
    <div class="grid g3"><label class="f">سعر VIP<input type="number" name="pv" min="1" value="400" required></label><label class="f">سعر ذهبي / عام<input type="number" name="pg" min="1" value="250" required></label><label class="f">سعر فضي<input type="number" name="ps" min="1" value="150" required></label></div>
    <div class="grid g2"><label class="f">سعة VIP (للدخول العام)<input type="number" name="cv" min="1" value="100"></label><label class="f">سعة عامة (للدخول العام)<input type="number" name="cg" min="1" value="800"></label></div>
    <p class="err-t" id="ne-err"></p>
    <div class="row"><button class="btn primary" name="mode" value="review">إرسال للمراجعة</button><button class="btn" name="mode" value="draft">حفظ كمسودة</button></div></form></section>`;
}

VIEWS.admin = ([, sub]) => {
  if (!S.user || S.user.role !== 'admin') return '<div class="empty">هذه الصفحة لمدير المنصة. فعّل الدور من <a href="#/account/profile">حسابي</a>.</div>';
  const pend = S.userEvents.filter(e => e.status === 'review'), tabs = [['pending', 'الموافقات'], ['orders', 'الطلبات'], ['payments', 'المدفوعات'], ['users', 'المستخدمون'], ['audit', 'سجل التدقيق']];
  sub = sub || 'pending'; let body = '';
  if (sub === 'pending') body = pend.length ? pend.map(e => `<div class="card row sb"><div><h3>${esc(e.title)}</h3><p class="muted" style="margin:0">${CAT[e.cat]} · ${esc(e.city)} · ${fdate(e.ses[0].at)}</p></div><div class="row"><a class="btn sm" href="#/event/${e.id}">معاينة</a><button class="btn sm primary" data-act="approve" data-id="${e.id}">موافقة</button><button class="btn sm danger" data-act="reject" data-id="${e.id}">رفض</button></div></div>`).join('') : '<div class="empty">لا توجد فعاليات بانتظار المراجعة.</div>';
  const tbl = (h, rows) => `<div class="card scroll-x"><table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${h.length}" class="muted">لا توجد بيانات.</td></tr>`}</tbody></table></div>`;
  if (sub === 'orders') body = tbl(['الطلب', 'الفعالية', 'الحالة', 'الإجمالي', 'التاريخ'], S.orders.map(o => [`<span class="num">${o.id}</span>`, esc(sesById(o.sid).ev.title), o.status, money(o.total), fdate(o.createdAt)]));
  if (sub === 'payments') body = tbl(['العملية', 'الطلب', 'الطريقة', 'المبلغ', 'الحالة'], S.payments.map(p => [`<span class="num">${p.id}</span>`, `<span class="num">${p.orderId}</span>`, p.method, money(p.amount), p.status]));
  if (sub === 'users') body = tbl(['الاسم', 'الجوال', 'الدور'], S.users.map(u => [esc(u.name), `<span class="num">${esc(u.phone)}</span>`, u.role]));
  if (sub === 'audit') body = tbl(['الوقت', 'المنفّذ', 'الإجراء', 'التفاصيل'], S.audit.slice(0, 80).map(a => [fdate(a.at), esc(a.who), a.action, esc(a.detail)]));
  return `<section class="sec"><h2>لوحة الإدارة</h2><div class="tabs">${tabs.map(([k, v]) => `<a class="chip ${sub === k ? 'on' : ''}" href="#/admin/${k}">${v}${k === 'pending' ? ` (${pend.length})` : ''}</a>`).join('')}</div><div class="grid" style="gap:12px">${body}</div></section>`;
};

VIEWS.scanner = () => {
  if (!S.user || S.user.role === 'user') return '<div class="empty">الماسح لموظفي البوابات والمنظمين. فعّل دور المنظم من <a href="#/account/profile">حسابي</a>.</div>';
  const evs = myEvents().filter(e => e.status === 'published'), sid = UI.scanSid || evs[0]?.ses[0].id;
  const mine = S.tickets.filter(t => t.status === 'active' && t.sid === sid);
  return `<section class="sec" style="max-width:720px"><h2>ماسح التذاكر</h2>
  <label class="f">الجلسة<select id="sc-ses" data-act-change="scan-ses">${evs.flatMap(e => e.ses.map(s => `<option value="${s.id}" ${s.id === sid ? 'selected' : ''}>${esc(e.title)} · ${fdate(s.at)}</option>`)).join('')}</select></label>
  <form class="card grid" data-form="scan"><label class="f">رمز QR أو معرّف التذكرة<input id="sc-code" placeholder="MAQAD|T-XXXXXX|…" autocomplete="off"></label><button class="btn primary">تحقق</button>
  ${mine.length ? `<div class="muted" style="font-size:13px">تذاكر صالحة في هذا المتصفح للتجربة:</div><div class="row">${mine.map(t => `<button type="button" class="chip" data-act="scan-fill" data-code="${esc(qrText(t))}">${t.id}</button>`).join('')}</div>` : ''}</form>
  <div id="sc-res"></div>
  <div class="card"><h3>آخر عمليات المسح</h3>${S.scans.slice(0, 8).map(x => `<div class="line"><span>${esc(x.id)}</span><span class="${x.ok ? 'status-active' : 'status-cancelled'}">${esc(x.msg)}</span></div>`).join('') || '<p class="muted">لا توجد عمليات.</p>'}</div></section>`;
};
VIEWS.docs = () => '<div class="empty">وثيقة المشروع الكاملة (PRD، ERD، البنية، الـ APIs): <a href="spec.html">فتح الوثيقة</a></div>';
VIEWS.reset = () => { localStorage.removeItem(KEY); S = fresh(); UI.sel.clear(); setTimeout(() => go('/'), 0); return '<div class="empty">تمت إعادة الضبط.</div>'; };

/* ---------- chrome ---------- */
function topbar() {
  const r = route().parts[0] || 'home', role = S.user?.role, un = S.notifs.filter(n => !n.read).length;
  const links = [['events', 'الفعاليات', '#/events'], ['resale', 'إعادة البيع', '#/resale'], ['tickets', 'تذاكري', '#/tickets']];
  if (role === 'organizer' || role === 'admin') links.push(['organizer', 'المنظم', '#/organizer'], ['scanner', 'الماسح', '#/scanner']);
  if (role === 'admin') links.push(['admin', 'الإدارة', '#/admin']);
  $('#topbar').innerHTML = `<a class="brand" href="#/"><span class="brand-badge">م</span>مَقْعَد <small class="muted" style="font-weight:500;font-size:12px">MAQAD</small></a>
  <nav class="nav" aria-label="التنقل">${links.map(([k, v, h]) => `<a href="${h}" class="${r === k ? 'on' : ''}">${v}</a>`).join('')}</nav>
  <div class="tools" style="position:relative"><button class="icon-btn" data-act="bell" aria-label="الإشعارات">🔔${un ? `<span class="dot">${un}</span>` : ''}</button>
  ${S.user ? `<a class="btn sm" href="#/account">${esc(S.user.name.split(' ')[0])}</a>` : '<button class="btn sm primary" data-act="login">دخول</button>'}
  ${UI.pop === 'bell' ? `<div class="pop">${S.notifs.length ? S.notifs.slice(0, 12).map(n => `<div class="n ${n.read ? '' : 'un'}"><b>${esc(n.title)}</b><br><span class="muted">${esc(n.body)}</span></div>`).join('') : '<div class="n muted">لا توجد إشعارات.</div>'}</div>` : ''}</div>`;
  const h = S.holds[S.activeHold];
  $('#hold-slot').innerHTML = h && r !== 'checkout' ? `<div class="holdbar">مقاعدك محجوزة <span class="timer" style="font-size:16px;color:#061018" data-timer="${h.exp}"></span><a href="#/checkout">أكمل الدفع</a></div>` : '';
}
function route() { const raw = location.hash.slice(1) || '/'; const [p, q] = raw.split('?'); return { parts: p.split('/').filter(Boolean), qs: Object.fromEntries(new URLSearchParams(q || '')) }; }
let lastPath = '';
function render() {
  gc();
  const { parts, qs } = route(), name = parts[0] || 'home', v = VIEWS[name];
  $('#app').innerHTML = v ? v(parts, qs) : '<div class="empty">الصفحة غير موجودة. <a href="#/">الرئيسية</a></div>';
  topbar(); tick();
  if (name === 'book') { const f = sesById(parts[1]); if (f && f.ev.seated && !UI.ses[parts[1]]) { UI.sel.clear(); UI.ses[parts[1]] = 1; } }
  if (lastPath !== location.hash) { window.scrollTo(0, 0); lastPath = location.hash; }
}
function tick() {
  $$('[data-timer]').forEach(el => {
    const ms = +el.dataset.timer - Date.now();
    if (ms <= 0) { el.textContent = '00:00'; return; }
    el.textContent = `${pad(Math.floor(ms / 6e4))}:${pad(Math.floor(ms / 1e3) % 60)}`; el.classList.toggle('low', ms < 6e4);
  });
  const h = S.holds[S.activeHold];
  if (S.activeHold && h && h.exp <= Date.now()) { gc(); toast('انتهت مهلة الحجز وأُعيدت المقاعد.', true); render(); }
}
setInterval(tick, 1000);

/* ---------- actions ---------- */
function drawQR(t) {
  const box = $('#qrbox'); if (!box) return;
  try { box.innerHTML = ''; new QRCode(box, { text: qrText(t), width: 180, height: 180, colorDark: '#000000', colorLight: '#ffffff' }); }
  catch (e) { box.textContent = qrText(t); }
  if (typeof QRCode === 'undefined') box.textContent = qrText(t);
}
function scanTicket(code, sid) {
  const parts = code.trim().split('|'), id = parts.length === 3 ? parts[1] : code.trim(), t = S.tickets.find(x => x.id === id);
  let ok = false, msg;
  if (!t) msg = 'تذكرة غير معروفة';
  else if (parts.length === 3 && parts[2] !== hash(t.secret + t.id)) msg = 'رمز غير صالح';
  else if (t.sid !== sid) msg = 'تذكرة لفعالية أو جلسة أخرى';
  else if (t.status === 'used') msg = `مستخدمة مسبقاً (${fdate(t.usedAt)})`;
  else if (t.status !== 'active') msg = 'التذكرة غير صالحة (' + ({ listed: 'معروضة للبيع', cancelled: 'ملغاة', resold: 'أُعيد بيعها' }[t.status] || t.status) + ')';
  else { ok = true; t.status = 'used'; t.usedAt = Date.now(); msg = `صالحة · ${t.seat ? 'مقعد ' + t.seat : TIER_NAME[t.tier]}`; }
  S.scans.unshift({ id: t ? t.id : code.slice(0, 18), ok, msg, at: Date.now() }); audit('scan', `${id} ${ok ? 'ok' : msg}`); save();
  return { ok, msg };
}
function processPayment(done) {
  const btn = $('#paybtn'); btn.disabled = true; btn.textContent = 'جارٍ المعالجة…'; $('#pay-err').textContent = '';
  setTimeout(() => done(), 1100);
}
const ACTS = {
  close: closeModal,
  login: () => openLogin(),
  'lg-send': () => { const name = $('#lg-name').value.trim(), phone = $('#lg-phone').value.trim(); if (name.length < 2 || !/^\+?\d{9,14}$/.test(phone.replace(/\s/g, ''))) return toast('أدخل اسماً ورقم جوال صحيحاً', true); openLogin(2, phone, name); },
  'lg-verify': el => { if ($('#lg-otp').value !== '123456') return void ($('#lg-err').textContent = 'الرمز غير صحيح. أعد المحاولة.');
    let u = S.users.find(x => x.phone === el.dataset.phone); if (!u) { u = { id: uid('U'), name: el.dataset.name, phone: el.dataset.phone, role: 'user' }; S.users.push(u); if (S.users.length === 1) { notify('أهلاً بك في مَقْعَد', 'كود WELCOME10 يمنحك خصم 10% على أول حجز.'); } }
    S.user = u; audit('login', u.phone); save(); closeModal(); toast('أهلاً ' + u.name); render(); },
  logout: () => { S.user = null; save(); go('/'); },
  role: el => { S.user.role = el.dataset.k; S.users.find(u => u.id === S.user.id).role = el.dataset.k; save(); render(); },
  'save-profile': () => { const n = $('#pf-name').value.trim(); if (n.length < 2) return toast('الاسم قصير', true); S.user.name = n; S.users.find(u => u.id === S.user.id).name = n; save(); toast('تم الحفظ'); render(); },
  bell: () => { UI.pop = UI.pop ? null : 'bell'; if (UI.pop) { S.notifs.forEach(n => { n.read = true; }); save(); } topbar(); },
  fav: (el, e) => { e.preventDefault(); e.stopPropagation(); const id = el.dataset.id, i = S.favs.indexOf(id); i < 0 ? S.favs.push(id) : S.favs.splice(i, 1); save(); render(); },
  ses: el => go(`/event/${el.dataset.id}?s=${el.dataset.s}`),
  filter: el => { const q = route().qs; q[el.dataset.k] = el.dataset.v; go('/events?' + new URLSearchParams(Object.entries(q).filter(([, v]) => v))); },
  zoom: el => { UI.zoom = Math.max(.75, Math.min(2.2, UI.zoom + +el.dataset.d)); const s = $('#seatmap'); if (s) s.style.width = Math.round(560 * UI.zoom) + 'px'; },
  qty: el => { const k = el.dataset.k, tot = Object.values(UI.qty).reduce((a, b) => a + b, 0), d = +el.dataset.d, f = sesById(route().parts[1]), cur = UI.qty[k] || 0;
    if (d > 0 && (tot >= MAX_SEATS || cur >= gaTaken(f.ses, k, S.activeHold).free)) return toast(tot >= MAX_SEATS ? `الحد الأقصى ${MAX_SEATS} تذاكر` : 'لا توجد تذاكر إضافية في هذه الفئة', true);
    UI.qty[k] = Math.max(0, cur + d); $('#q-' + k).textContent = UI.qty[k]; $('#bk-side').innerHTML = bookSide(f.ev, f.ses); },
  hold: () => { if (needLogin()) return; const f = sesById(route().parts[1]); const r = createHold(f.ev, f.ses, [...UI.sel], Object.fromEntries(Object.entries(UI.qty).filter(([, n]) => n)));
    if (r.err) { $('#bk-err').textContent = r.err; UI.sel.forEach(id => { if (soldSet(f.ses).has(id) || heldSeats(f.ses.id).has(id)) UI.sel.delete(id); }); return render(); }
    UI.sel.clear(); UI.qty = {}; UI.ck = null; go('/checkout'); },
  method: el => { UI.ck.method = el.dataset.k; render(); },
  split: el => { UI.ck.split = +el.dataset.n; render(); },
  promo: () => { UI.ck.promo = $('#promo').value.trim().toUpperCase(); render(); },
  points: el => { UI.ck.points = el.checked; render(); },
  pay: () => {
    const h = S.holds[S.activeHold]; if (!h) return; const ck = UI.ck, q = quote(h, ck), err = $('#pay-err');
    let digits = '';
    if (ck.method !== 'apple') { digits = $('#cc-n').value.replace(/\D/g, ''); if (digits.length < 12 || !/^\d{2}\/\d{2}$/.test($('#cc-e').value) || $('#cc-c').value.length < 3) return void (err.textContent = 'تحقق من رقم البطاقة وتاريخ الانتهاء ورمز CVC.'); }
    const share = ck.split ? Math.ceil(q.total / (ck.split + 1)) : q.total, hasOrder = h.orderId;
    processPayment(() => {
      if (digits.endsWith('0000')) { S.payments.push({ id: uid('P'), orderId: h.orderId || '-', amount: share, method: ck.method, status: 'failed', at: Date.now() }); save(); render(); return void ($('#pay-err').textContent = 'فشلت عملية الدفع: رفض المصرف البطاقة. يمكنك إعادة المحاولة قبل انتهاء المهلة.'); }
      if (hasOrder) return;
      const o = { id: uid('MQ-'), userId: S.user.id, evId: h.evId, sid: h.sid, items: q.items, total: q.total, fee: q.fee, vat: q.vat, discount: q.discount, promo: q.discount ? ck.promo : '', ptsUsed: q.ptsUsed, method: ck.method, holdToken: h.token, createdAt: Date.now(), status: 'pending' };
      S.orders.unshift(o); S.payments.push({ id: uid('P'), orderId: o.id, amount: share, method: ck.method, status: 'success', at: Date.now() });
      if (ck.split) {
        const n = ck.split + 1, each = Math.floor(q.total / n);
        h.orderId = o.id; o.status = 'awaiting_group';
        S.groups[o.id] = { orderId: o.id, status: 'open', exp: h.exp, members: Array.from({ length: n }, (_, i) => ({ name: i ? `صديق ${i}` : S.user.name, amount: i ? each : q.total - each * (n - 1), token: uid('G'), paid: i === 0, owner: i === 0 })) };
        S.activeHold = null; UI.ck = null; audit('order.split', o.id); save(); toast('أنشئنا روابط الدفع لأصدقائك'); return go('/order/' + o.id);
      }
      finalizeOrder(o); UI.ck = null; go('/order/' + o.id); toast('تم الدفع وإصدار التذاكر');
    });
  },
  'friend-pay': el => { for (const g of Object.values(S.groups)) { const m = g.members.find(x => x.token === el.dataset.t); if (!m) continue;
      if (g.status !== 'open') return toast('انتهت مهلة الدفع الجماعي', true); m.paid = true; S.payments.push({ id: uid('P'), orderId: g.orderId, amount: m.amount, method: 'link', status: 'success', at: Date.now() });
      if (g.members.every(x => x.paid)) { g.status = 'done'; const o = S.orders.find(x => x.id === g.orderId); finalizeOrder(o); toast('اكتمل الدفع وصدرت التذاكر'); } else toast('تم تسجيل الدفعة'); save(); if (route().parts[0] === 'pay') go('/order/' + g.orderId); else render(); } },
  copy: el => { const t = el.dataset.t; (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => toast('تم النسخ'), () => toast(t)); },
  'cancel-order': el => { const o = S.orders.find(x => x.id === el.dataset.id), p = Math.round(refundPct(sesById(o.sid).ses) * 100);
    modal(`<h3>إلغاء الطلب ${o.id}</h3><p>سيُسترجع <b>${p}%</b> من المبلغ (${mtxt(o.total * p / 100)}) وتُلغى كل التذاكر وتتحرر المقاعد.</p><div class="row"><button class="btn danger" data-act="cancel-yes" data-id="${o.id}">تأكيد الإلغاء</button><button class="btn" data-act="close">رجوع</button></div>`); },
  'cancel-yes': el => { cancelOrder(S.orders.find(x => x.id === el.dataset.id)); closeModal(); toast('تم الإلغاء'); render(); },
  qr: el => { const t = S.tickets.find(x => x.id === el.dataset.id); modal(`<h3>${esc(evById(t.evId).title)}</h3><p class="muted">${t.seat ? 'مقعد ' + t.seat : 'دخول عام'} · ${TIER_NAME[t.tier]}</p><div class="qrbox" id="qrbox"></div><p class="muted num" style="text-align:center;font-size:12px">${t.id}</p><button class="btn" data-act="close">إغلاق</button>`); drawQR(t); },
  wallet: () => toast('إضافة Apple/Google Wallet تُفعَّل عند ربط حساب المُصدِر في النسخة الإنتاجية.'),
  resale: el => { const t = S.tickets.find(x => x.id === el.dataset.id);
    modal(`<h3>أعد بيع تذكرتك</h3><p class="muted">أقصى سعر مسموح: ${mtxt(t.unit)} (سعر الشراء). ستُقفل التذكرة أثناء العرض.</p><label class="f">سعر البيع (ر.س)<input id="rs-price" type="number" min="1" max="${t.unit}" value="${t.unit}"></label><p class="err-t" id="rs-err"></p><div class="row"><button class="btn primary" data-act="resale-go" data-id="${t.id}">اعرض للبيع</button><button class="btn" data-act="close">إلغاء</button></div>`); },
  'resale-go': el => { const t = S.tickets.find(x => x.id === el.dataset.id), p = Math.round(+$('#rs-price').value);
    if (!(p > 0) || p > t.unit) return void ($('#rs-err').textContent = `السعر يجب أن يكون بين 1 و ${t.unit} ر.س.`);
    t.status = 'listed'; S.listings.push({ id: uid('L'), ticketId: t.id, evId: t.evId, sid: t.sid, tier: t.tier, seat: t.seat, price: p, max: t.unit, seller: S.user.name }); audit('resale.list', t.id); save(); closeModal(); toast('عُرضت تذكرتك في السوق'); render(); },
  unlist: el => { const t = S.tickets.find(x => x.id === el.dataset.id); t.status = 'active'; S.listings = S.listings.filter(l => l.ticketId !== t.id); save(); toast('أُلغي العرض'); render(); },
  'buy-resale': el => { if (needLogin()) return; const l = S.listings.find(x => x.id === el.dataset.id); if (!l) return toast('العرض لم يعد متاحاً', true);
    const fee = Math.round(l.price * .05), vat = Math.round((l.price + fee) * .15), total = l.price + fee + vat;
    modal(`<h3>شراء تذكرة معاد بيعها</h3><p class="muted">${esc(evById(l.evId).title)} · ${l.seat ? 'مقعد ' + l.seat : 'دخول عام'}</p>
    <div class="line"><span>السعر</span><span>${money(l.price)}</span></div><div class="line"><span class="muted">رسوم 5%</span><span>${money(fee)}</span></div><div class="line"><span class="muted">ضريبة 15%</span><span>${money(vat)}</span></div><div class="line total"><span>الإجمالي</span><span>${money(total)}</span></div>
    <div class="row"><button class="btn primary" data-act="buy-yes" data-id="${l.id}" data-total="${total}">ادفع (محاكاة)</button><button class="btn" data-act="close">إلغاء</button></div>`); },
  'buy-yes': el => { const l = S.listings.find(x => x.id === el.dataset.id); if (!l) { closeModal(); return toast('العرض لم يعد متاحاً', true); }
    const { ev, ses } = sesById(l.sid), o = { id: uid('MQ-'), userId: S.user.id, evId: ev.id, sid: ses.id, total: +el.dataset.total, status: 'paid', method: 'resale', createdAt: Date.now(), items: [] };
    const old = S.tickets.find(t => t.id === l.ticketId); if (old) old.status = 'resold';
    const nt = newTicket(o, { k: l.tier, seat: l.seat, label: l.seat ? 'مقعد ' + l.seat : 'دخول' }, ev, ses, S.user.id, l.price);
    S.sold[ses.id] = S.sold[ses.id] || {}; if (l.seat) S.sold[ses.id][l.seat] = nt.id;
    if (!old && !l.seat) { /* general admission seed listing keeps counts unchanged */ }
    S.orders.unshift(o); S.payments.push({ id: uid('P'), orderId: o.id, amount: o.total, method: 'resale', status: 'success', at: Date.now() });
    S.listings = S.listings.filter(x => x.id !== l.id); notify('اشتريت تذكرة من السوق الرسمي', `${ev.title} · ${l.seat ? 'مقعد ' + l.seat : 'دخول'}`); audit('resale.buy', nt.id); save(); closeModal(); toast('تمت عملية الشراء وصدرت تذكرتك'); go('/order/' + o.id); },
  'join-wl': el => { if (needLogin()) return; S.waitlist.push({ id: uid('W'), sid: el.dataset.s, userId: S.user.id, status: 'waiting', at: Date.now() }); save(); toast('أُضفت إلى قائمة الانتظار'); render(); },
  'wl-leave': el => { S.waitlist = S.waitlist.filter(w => w.id !== el.dataset.id); save(); render(); },
  'wl-sim': el => { const w = S.waitlist.find(x => x.id === el.dataset.id), { ev, ses } = sesById(w.sid);
    const free = [...seedSold(ses)].find(x => !(S.released[ses.id] || []).includes(x) && !(S.sold[ses.id] || {})[x]);
    if (!free) return toast('لا توجد مقاعد قابلة للتحرير', true);
    (S.released[ses.id] = S.released[ses.id] || []).push(free); releaseActive();
    const hd = { token: uid('H'), sid: ses.id, evId: ev.id, seats: [free], qty: {}, exp: Date.now() + HOLD_MS }; S.holds[hd.token] = hd; w.status = 'offered'; w.offerExp = hd.exp; w.holdToken = hd.token;
    notify('توفر مقعد لك!', `${ev.title}: مقعد ${free} محجوز لك 10 دقائق.`); save(); render(); },
  'wl-take': el => { const w = S.waitlist.find(x => x.id === el.dataset.id); if (w && S.holds[w.holdToken]) { S.activeHold = w.holdToken; UI.ck = null; w.status = 'done'; save(); } },
  tab: el => { UI.tab[el.dataset.g] = el.dataset.k; render(); },
  'submit-ev': el => { const e = S.userEvents.find(x => x.id === el.dataset.id); e.status = 'review'; audit('event.submit', e.id); notify('أُرسلت فعاليتك للمراجعة', e.title); save(); render(); },
  approve: el => { const e = S.userEvents.find(x => x.id === el.dataset.id); e.status = 'published'; audit('event.approve', e.id); save(); toast('نُشرت الفعالية'); render(); },
  reject: el => modal(`<h3>سبب الرفض</h3><input id="rj-r" placeholder="مثال: صور الموقع غير واضحة"><div class="row"><button class="btn danger" data-act="reject-yes" data-id="${el.dataset.id}">رفض</button><button class="btn" data-act="close">إلغاء</button></div>`),
  'reject-yes': el => { const e = S.userEvents.find(x => x.id === el.dataset.id); e.status = 'rejected'; e.rejectReason = $('#rj-r').value || 'غير مستوفية للشروط'; audit('event.reject', e.id + ' ' + e.rejectReason); save(); closeModal(); render(); },
  'scan-fill': el => { $('#sc-code').value = el.dataset.code; },
};
document.addEventListener('click', e => {
  const m = $('#modal'); if (e.target === m) return closeModal();
  const seat = e.target.closest('[data-seat]'); if (seat) return pickSeat(seat);
  const el = e.target.closest('[data-act]'); if (!el) { if (UI.pop && !e.target.closest('.pop')) { UI.pop = null; topbar(); } return; }
  const a = ACTS[el.dataset.act]; if (a) { if (el.tagName === 'A' && el.dataset.act !== 'wl-take') e.preventDefault(); a(el, e); if (el.dataset.act === 'wl-take') return; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); if (UI.pop) { UI.pop = null; topbar(); } }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-seat]')) { e.preventDefault(); pickSeat(e.target); }
});
function pickSeat(el) {
  const f = sesById(route().parts[1]); if (!f || el.classList.contains('sold') || el.classList.contains('held')) return;
  const id = el.dataset.seat; UI.focusSeat = id;
  if (UI.sel.has(id)) { UI.sel.delete(id); el.classList.remove('sel'); }
  else { if (UI.sel.size >= MAX_SEATS) return toast(`الحد الأقصى ${MAX_SEATS} مقاعد`, true); UI.sel.add(id); el.classList.add('sel'); }
  $('#bk-side').innerHTML = bookSide(f.ev, f.ses);
}
document.addEventListener('mouseover', e => {
  const s = e.target.closest?.('[data-seat]'); if (!s || UI.focusSeat === s.dataset.seat) return;
  UI.focusSeat = s.dataset.seat; const box = $('.viewbox'); const f = sesById(route().parts[1]); if (box && f) box.innerHTML = seatView(SEAT_BY_ID[UI.focusSeat], f.ev);
});
document.addEventListener('submit', e => {
  const form = e.target.closest('[data-form]'); if (!form) return; e.preventDefault();
  const k = form.dataset.form;
  if (k === 'search') go('/events?q=' + encodeURIComponent($('#hs-q').value.trim()));
  if (k === 'scan') { const f = scanTicket($('#sc-code').value, UI.scanSid || $('#sc-ses').value); $('#sc-res').innerHTML = `<div class="card" style="border-color:${f.ok ? 'var(--accent-2)' : 'var(--danger)'}"><div class="kpi" style="color:${f.ok ? 'var(--accent-2)' : 'var(--danger)'}">${f.ok ? 'مسموح بالدخول' : 'مرفوضة'}</div><p>${esc(f.msg)}</p></div>`; }
  if (k === 'newev') {
    const fd = new FormData(form), mode = e.submitter?.value || 'review', when = new Date(fd.get('when')).getTime(), seated = fd.get('seated') === '1', v = VENUES.find(x => x.id === fd.get('venue'));
    if (!(when > Date.now())) return void ($('#ne-err').textContent = 'اختر موعداً في المستقبل.');
    const id = uid('e'), tiers = seated ? seatedTiers(+fd.get('pv'), +fd.get('pg'), +fd.get('ps')) : [{ k: 'vip', price: +fd.get('pv'), cap: +fd.get('cv') }, { k: 'gen', price: +fd.get('pg'), cap: +fd.get('cg') }];
    const cat = fd.get('cat'); S.userEvents.push({ id, title: fd.get('title'), performer: fd.get('performer'), cat, city: v.city, venueId: v.id, seated, hue: Math.floor(Math.random() * 360), tiers, desc: fd.get('desc'), organizerId: 'o1', status: mode === 'draft' ? 'draft' : 'review', motif: 'm-' + cat, ses: [{ id: id + '-s0', ratio: 0, at: when }] });
    audit('event.create', id); save(); toast(mode === 'draft' ? 'حُفظت المسودة' : 'أُرسلت للمراجعة'); go('/organizer');
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.filter) { const q = route().qs; q[t.dataset.filter] = t.value; go('/events?' + new URLSearchParams(Object.entries(q).filter(([, v]) => v))); }
  if (t.dataset.pref) { S.prefs[t.dataset.pref] = t.checked; save(); }
  if (t.dataset.actChange === 'scan-ses') { UI.scanSid = t.value; render(); }
  if (t.dataset.act === 'points') ACTS.points(t);
});
let ft; document.addEventListener('input', e => { if (e.target.dataset?.filter === 'q') { clearTimeout(ft); ft = setTimeout(() => { const q = route().qs; q.q = e.target.value; go('/events?' + new URLSearchParams(Object.entries(q).filter(([, v]) => v))); setTimeout(() => { const i = $('#f-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 350); }
  if (e.target.id === 'cc-n') { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); }
  if (e.target.id === 'cc-e') { let v = e.target.value.replace(/\D/g, '').slice(0, 4); e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; } });
window.addEventListener('hashchange', () => { UI.pop = null; if (!location.hash.startsWith('#/book')) { UI.sel.clear(); UI.qty = {}; } render(); });
window.addEventListener('storage', e => { if (e.key === KEY) { try { S = { ...fresh(), ...JSON.parse(e.newValue) }; render(); } catch (x) { /* ignore */ } } });
render();
