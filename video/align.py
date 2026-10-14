import re,json,sys,numpy as np
S='/tmp/claude-0/-home-user-nos/6ede6675-7874-557f-9f63-4883d71029fd/scratchpad/'
# silences
st=[];en=[]
for l in open(S+'sil.txt'):
    m=re.search(r'silence_start: ([\d.-]+)',l)
    if m: st.append(float(m.group(1)))
    m=re.search(r'silence_end: ([\d.]+) \| silence_duration: ([\d.]+)',l)
    if m: en.append((float(m.group(1)),float(m.group(2))))
cands=[]  # (mid time, dur)
for s,(e,d) in zip(st,en):
    cands.append(((max(s,0)+e)/2,d,max(s,0),e))
T=1853.664
# sentences
secs=[];cur=None
for line in open('script.txt',encoding='utf8'):
    line=line.strip()
    if line.startswith('@@'): cur=[line[3:],[]]; secs.append(cur); continue
    if not line: continue
    parts=re.split(r'(?<=[.?!])\s+(?=[A-Z0-9])',line)
    cur[1]+= [p for p in parts if p]
sents=[(i,s) for i,(n,L) in enumerate(secs) for s in L]
W=np.array([len(re.findall(r"[\w'’-]+",s)) for _,s in sents],float)
# approx weights: words + 0.5 punctuation pause weight
punc=np.array([s.count(',')+s.count(':')*1.0 for _,s in sents])
w=W+0.45*punc+1.2   # +1.2 for end pause
cum=np.concatenate([[0],np.cumsum(w)])
speech_start=cands[0][3] if cands and cands[0][2]<0.5 else 0
t0=speech_start; t1=T
exp=t0+(cum/cum[-1])*(t1-t0)   # expected end times
c=np.array([x[0] for x in cands]); dur=np.array([x[1] for x in cands])
# keep candidates with dur>=0.25 as sentence boundaries primarily
N=len(sents)
# DP over sentences choosing boundary candidate index
INF=1e18
K=len(c)
# restrict: for sentence i boundary within +-40s of expected
best=[None]*N
prev_cost=None
costs=[];back=[]
rate=(t1-t0)/cum[-1]
for i in range(N):
    lo=np.searchsorted(c,exp[i+1]-45); hi=np.searchsorted(c,exp[i+1]+45)
    idx=np.arange(lo,hi)
    if i==N-1: idx=np.array([K-1]) if False else idx
    cost=np.full(len(idx),INF); bk=np.zeros(len(idx),int)
    for a,k in enumerate(idx):
        seglen_exp=w[i]*rate
        if i==0:
            seg=c[k]-t0; cost[a]=((seg-seglen_exp)/max(seglen_exp,1))**2*w[i] - 0.6*min(dur[k],1.0)
        else:
            pidx,pcost=costs[-1]
            ok=pidx<k
            if not ok.any(): continue
            segs=c[k]-c[pidx[ok]]
            cc=pcost[ok]+((segs-seglen_exp)/max(seglen_exp,1))**2*w[i]*1.0 - 0.6*min(dur[k],1.0)
            j=np.argmin(cc); cost[a]=cc[j]; bk[a]=np.where(ok)[0][j]
    costs.append((idx,cost)); back.append(bk)
# last sentence ends at T
idx,cost=costs[-1]; a=np.argmin(cost)
chosen=[0]*N; chosen[-1]=idx[a]
for i in range(N-1,0,-1):
    a=np.where(costs[i][0]==chosen[i])[0][0]
    pa=back[i][a]
    chosen[i-1]=costs[i-1][0][pa]
ends=[c[k] for k in chosen]; ends[-1]=T
starts=[t0]+[x for x in ends[:-1]]
# refine: start of sentence = silence end of previous boundary; end = silence start of its boundary
out=[]
for i,(si,s) in enumerate(sents):
    k=chosen[i]
    e=cands[k][2] if i<N-1 else T
    sidx=chosen[i-1] if i>0 else None
    b=cands[sidx][3] if sidx is not None else t0
    out.append(dict(sec=si,text=s,start=round(b,3),end=round(e,3),words=int(W[i])))
json.dump(dict(secs=[n for n,_ in secs],sents=out),open('align.json','w'),indent=1,ensure_ascii=False)
# diagnostics: words/sec per sentence
r=[(o['words']/(o['end']-o['start'])) for o in out if o['words']>3]
print(N,'sentences; wps mean',np.mean(r),'min',np.min(r),'max',np.max(r),'std',np.std(r))
bad=[(o['start'],o['text'][:50],round(o['words']/(o['end']-o['start']),2)) for o in out if o['words']>3 and (o['words']/(o['end']-o['start'])<1.6 or o['words']/(o['end']-o['start'])>3.8)]
print(len(bad)); print(bad[:15])
for si in range(13):
    ss=[o for o in out if o['sec']==si]; print(si, round(ss[0]['start']), round(ss[-1]['end']))
