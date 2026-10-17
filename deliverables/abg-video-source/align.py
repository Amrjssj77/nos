import re, json
text = open('plain.txt').read()
raw = text.split(); toks = []; i = 0
while i < len(raw):
    w = raw[i]
    if w == "الـ" and i + 1 < len(raw): w = w + " " + raw[i+1]; i += 1
    toks.append(w); i += 1
SENT = re.compile(r'[.؟?!]$'); SUB = re.compile(r'[،:]$')
sentences = []; cur = []
for t in toks:
    cur.append(t)
    if SENT.search(t): sentences.append(cur); cur = []
if cur: sentences.append(cur)
def chars(ws): return sum(len(re.sub(r'[^\w]', '', w)) for w in ws)
gaps = [tuple(map(float, l.split())) for l in open('sil2.txt')]
TOTAL_END = max(g[0] for g in gaps if g[0] < 779.9)  # start of final trailing gap
speech_start = gaps[0][1] if gaps[0][0] < 0.05 else 0.0
tot_chars = chars(toks)
tot_gap = sum(g[2] for g in gaps if g[0] > 0.05 and g[1] < TOTAL_END)
r = (TOTAL_END - speech_start - tot_gap) / tot_chars
print("sec/char", round(r, 4), "speech_start", speech_start, "end", TOTAL_END)

def dp_align(units, cands, t_start, t_end, bcost_fn, W=60):
    """units: list of char counts. cands: list of (s,e,d) sorted. Returns list of chosen cand indices (len(units)-1)."""
    n = len(units); m = len(cands)
    if n == 1: return []
    if m < n - 1: return None
    cum = []; acc = 0.0
    for c in cands: cum.append(acc); acc += c[2]
    coord = [c[0] - cum[j] - t_start for j, c in enumerate(cands)]   # speech coordinate of boundary j
    total_sp = (t_end - t_start) - acc
    INF = 1e18
    exp = [u * r for u in units]
    def dc(D, d): return ((D - d) ** 2) / (d + 0.6)
    dp = [[INF] * m for _ in range(n - 1)]; bp = [[-1] * m for _ in range(n - 1)]
    for j in range(m): dp[0][j] = dc(coord[j], exp[0]) + bcost_fn(cands[j][2])
    for i in range(1, n - 1):
        for j in range(i, m):
            best = INF; bk = -1
            for k in range(max(i - 1, j - W), j):
                if dp[i-1][k] >= INF: continue
                c = dp[i-1][k] + dc(coord[j] - coord[k], exp[i])
                if c < best: best = c; bk = k
            if bk >= 0: dp[i][j] = best + bcost_fn(cands[j][2]); bp[i][j] = bk
    bj = min((j for j in range(m) if dp[n-2][j] < INF), key=lambda j: dp[n-2][j] + dc(total_sp - coord[j], exp[n-1]))
    ch = [0] * (n - 1); j = bj
    for i in range(n - 2, -1, -1): ch[i] = j; j = bp[i][j]
    return ch

# level 1
l1c = [g for g in gaps if g[0] > 0.3 and g[1] < TOTAL_END and g[2] >= 0.2]
ch = dp_align([chars(s) for s in sentences], l1c, speech_start, TOTAL_END, lambda g: 2.5 * max(0.0, 0.34 - g))
sent_t = []
for i in range(len(sentences)):
    s = l1c[ch[i-1]][1] if i > 0 else speech_start
    e = l1c[ch[i]][0] if i < len(sentences) - 1 else TOTAL_END
    sent_t.append((s, e))
# level 2 + words
phrases = []; dev = []
for sent, (s, e) in zip(sentences, sent_t):
    subs = []; cur = []
    for t in sent:
        cur.append(t)
        if SUB.search(t): subs.append(cur); cur = []
    if cur: subs.append(cur)
    inner = [g for g in gaps if g[0] >= s - 0.001 and g[1] <= e + 0.001 and g[2] >= 0.09 and g[0] > s + 0.05 and g[1] < e - 0.05]
    ch2 = dp_align([chars(x) for x in subs], inner, s, e, lambda g: 1.0 * max(0.0, 0.2 - g)) if len(subs) > 1 else []
    if ch2 is None:  # fallback proportional
        tot = sum(chars(x) for x in subs); a = s; ch2 = None; bounds = []
        for x in subs[:-1]:
            a += (e - s) * chars(x) / tot; bounds.append((a, a))
        sub_t = []; prev = s
        for k, x in enumerate(subs):
            en = bounds[k][0] if k < len(subs) - 1 else e
            sub_t.append((prev, en)); prev = en
    else:
        sub_t = []
        for k, x in enumerate(subs):
            a = inner[ch2[k-1]][1] if k > 0 else s
            b = inner[ch2[k]][0] if k < len(subs) - 1 else e
            sub_t.append((a, b))
    for x, (a, b) in zip(subs, sub_t):
        gs = sorted([(max(g[0], a), min(g[1], b)) for g in gaps if g[1] > a and g[0] < b and (min(g[1], b) - max(g[0], a)) > 0.05])
        sp = max(0.12 * len(x), (b - a) - sum(q - p for p, q in gs))
        wts = [len(re.sub(r'[^\w]', '', w)) + 1.5 for w in x]; sw = sum(wts); acc2 = 0; words = []
        def wall(v, a=a, gs=gs):
            t = a; left = v
            for p, q in gs:
                room = p - t
                if room > 0 and left <= room: return t + left
                if room > 0: left -= room; t = p
                t = max(t, q)
            return t + left
        for w, wt in zip(x, wts):
            p0 = wall(acc2 / sw * sp); acc2 += wt; p1 = wall(acc2 / sw * sp)
            words.append({"t": w, "s": round(p0, 3), "e": round(p1, 3)})
        phrases.append({"s": round(a, 3), "e": round(b, 3), "w": words, "end": bool(SENT.search(x[-1]))})
        dev.append((b - a) / (chars(x) * r + 1e-9))
json.dump(phrases, open('build/align.json', 'w'), ensure_ascii=False)
bad = [(i, round(d, 2)) for i, d in enumerate(dev) if d > 1.9 or d < 0.5]
print("sentences", len(sentences), "phrases", len(phrases), "outliers", len(bad), bad[:30])
import statistics
print("dev median", round(statistics.median(dev), 2))
E=0
