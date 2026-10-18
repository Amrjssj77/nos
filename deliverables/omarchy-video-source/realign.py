import json, re, numpy as np, statistics
D = json.load(open('asr_out.json'))
text = open('script.txt').read()
DIAC = re.compile(r'[ً-ْٰـ]')
MAP = {'أ':'ا','إ':'ا','آ':'ا','ى':'ي','ة':'ه','ؤ':'و','ئ':'ي'}
def normc(c):
    c = MAP.get(c, c)
    return c.lower()
KEEP = re.compile(r'[ء-ي0-9a-zA-Z]')
# ASR char stream with times
A = []; AT = []
toks = D['tokens']; ts = D['timestamps']
for k, (tk, t) in enumerate(zip(toks, ts)):
    cs = [normc(c) for c in DIAC.sub('', tk) if KEEP.match(MAP.get(c, c))]
    if not cs: continue
    tn = ts[k+1] if k+1 < len(ts) else t + 0.2
    span = min(max(tn - t, 0.04), 0.5)
    for i, c in enumerate(cs):
        A.append(c); AT.append(t + span * i / len(cs))
# script words
raw = text.split(); words = []; i = 0
while i < len(raw):
    w = raw[i]
    if w == "الـ" and i + 1 < len(raw): w = w + " " + raw[i+1]; i += 1
    words.append(w); i += 1
S = []; SW = []   # script chars and word index
for wi, w in enumerate(words):
    for c in DIAC.sub('', w):
        c2 = MAP.get(c, c)
        if KEEP.match(c2): S.append(c2.lower()); SW.append(wi)
n, m = len(S), len(A)
print("script chars", n, "asr chars", m)
# digit handling: ASR digits like '3' won't match spelled script; fine.
# banded DP
BAND = 700
INF = 10**9
ratio = m / n
prev = None
back = np.zeros((n+1, 2*BAND+1), dtype=np.int8)  # 0 diag,1 up(skip script char),2 left(skip asr char)
def jrange(i):
    c = int(i * ratio); return max(0, c - BAND), min(m, c + BAND)
rows = {}
lo0, hi0 = jrange(0)
cur = {j: j for j in range(lo0, hi0+1)}  # cost of aligning empty script prefix with asr prefix
rows[0] = (lo0, cur)
for i in range(1, n+1):
    lo, hi = jrange(i); plo, pcur = rows[i-1]
    cur = {}
    for j in range(lo, hi+1):
        best = INF; bt = 1
        # up: script char i skipped (cost 1) from (i-1, j)
        if j in pcur: best = pcur[j] + 1; bt = 1
        # diag
        if j >= 1 and (j-1) in pcur:
            c = pcur[j-1] + (0 if S[i-1] == A[j-1] else 1)
            if c < best: best = c; bt = 0
        # left: asr char skipped from (i, j-1)
        if (j-1) in cur:
            c = cur[j-1] + 1
            if c < best: best = c; bt = 2
        cur[j] = best; back[i, j - lo] = bt
    rows[i] = (lo, cur)
    if i-2 in rows: del rows[i-2]
    # keep back info by lo offset stored separately
# need lo per row for backtrace
los = [jrange(i)[0] for i in range(n+1)]
# traceback from (n, m or best j)
lo, cur = rows[n]
j = min(cur, key=lambda jj: cur[jj] + (m - jj) * 0.2) if True else m
i = n; match = [None] * n
while i > 0:
    lo_i = los[i]
    bt = back[i, j - lo_i]
    if bt == 0:
        match[i-1] = j-1; i -= 1; j -= 1
    elif bt == 1:
        i -= 1
    else:
        j -= 1
    if j < 0: break
matched = sum(1 for x in match if x is not None and S[match.index(x)] == A[x]) if False else None
ok = sum(1 for k, x in enumerate(match) if x is not None and S[k] == A[x])
print("exact char matches", ok, "of", n, round(ok/n, 3))
# char times: matched -> AT[x]; unmatched interpolate
ct = [None] * n
for k, x in enumerate(match):
    if x is not None and S[k] == A[x]: ct[k] = AT[x]
# interpolate
idx = [k for k in range(n) if ct[k] is not None]
for a, b in zip(idx, idx[1:]):
    for k in range(a+1, b): ct[k] = ct[a] + (ct[b] - ct[a]) * (k - a) / (b - a)
for k in range(0, idx[0]): ct[k] = ct[idx[0]] - 0.07 * (idx[0] - k)
for k in range(idx[-1]+1, n): ct[k] = ct[idx[-1]] + 0.07 * (k - idx[-1])
# monotonic
for k in range(1, n):
    if ct[k] < ct[k-1]: ct[k] = ct[k-1]
# word times
wst = {}; wen = {}
for k, wi in enumerate(SW):
    wst.setdefault(wi, ct[k]); wen[wi] = ct[k]
json.dump({"words": words, "ws": [wst[i] for i in range(len(words))], "we": [wen[i] for i in range(len(words))]}, open('word_times_raw.json', 'w'), ensure_ascii=False)
print("sample", [(words[i], round(wst[i], 2)) for i in range(0, 12)])
