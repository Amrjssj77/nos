import json,random,bisect
from cfg import *
random.seed(3)
al=json.load(open('align.json'));S=al['sents'];T=1853.664
chunks=json.load(open(f'chunks{SUF}.json'))
DOODLES={0:['crown','arrow','star'],1:['quest','circle','under'],2:['boat','pyramid','bow','arrow'],3:['pyramid','crown','hourglass','arrow'],4:['ankh','eye','bow','pyramid'],5:['column','sword','arrow','crown'],6:['quest','eye','circle'],7:['sword','x','arrow'],8:['sword','x','arrow','boat'],9:['boat','arrow','hourglass'],10:['eye','circle','arrow'],11:['crown','ankh','star'],12:['crown','star','arrow']}
def secsents(sec): return [i for i,s in enumerate(S) if s['sec']==sec]
beats=[]
callmap={}  # sentence idx -> list of (callidx)
for ci,(sec,trig,kind,text) in enumerate(CALL):
    found=None
    for i in secsents(sec):
        if trig in S[i]['text']: found=i;break
    if found is None: print('WARN trigger not found',sec,trig);continue
    callmap.setdefault(found,[]).append(ci)
mapstart={}
for sec,(trig,kind) in MAPS.items():
    if not trig: continue
    for i in secsents(sec):
        if trig in S[i]['text']: mapstart[i]=kind;break
    else: print('WARN map trig',sec,trig)
bi=0
for sec in range(13):
    ids=secsents(sec);k=0;pool=POOL[sec];pi=0
    while k<len(ids):
        first=ids[k];is_map=first in mapstart
        mn=17.0 if is_map else 8.0
        j=k;st=S[first]['start']
        while j<len(ids):
            en=S[ids[j]]['end']
            j+=1
            if en-st>=mn: break
            if j<len(ids) and ids[j] in mapstart: break
        # avoid tiny trailing beat
        if len(ids)-j>0 and S[ids[-1]]['end']-S[ids[j]]['start']<5 : j=len(ids)
        grp=ids[k:j];k=j
        b=dict(sec=sec,sents=grp,start=S[grp[0]]['start'],end=None)
        b['kind']='map' if is_map else 'photo'
        if is_map: b['map']=mapstart[first]
        else:
            b['crop']=pool[pi%len(pool)];pi+=1
            b['crop2']=pool[(pi+1)%len(pool)] if (SUF or random.random()<.55) else None
        b['bg']=bi%3;b['idx']=bi;bi+=1
        beats.append(b)
# continuous timing
beats[0]['start']=0.0
for i,b in enumerate(beats): b['end']=beats[i+1]['start'] if i+1<len(beats) else T
# layers
pos_d=LAY['doodle']
for b in beats:
    L=[];d=b['end']-b['start'];sec=b['sec'];i=b['idx']
    b['tag']=sec
    if b['kind']=='photo':
        big_side=1 if i%2==0 else -1
        cx=360+big_side*0
        L.append(dict(t='img',file=f"assets/cards{SUF}/{b['crop']}_L.png",pos=[LAY['card'][0]+random.randint(-12,12),LAY['card'][1]+random.randint(-10,10)],a=0.0,z=[1.0,1.07],drift=[random.randint(-10,10),random.randint(-8,8)],ent='slam'))
        if b['crop2'] and d>(4 if SUF else 6):
            side=random.choice([-1,1])
            L.append(dict(t='img',file=f"assets/cards{SUF}/{b['crop2']}_S.png",pos=list(random.choice(LAY['card2'])) if SUF else [360+side*190,745+random.randint(-25,10)],a=1.2+random.random()*1.2,z=[1.0,1.04],drift=[0,-6],ent='slide'))
        dn=random.choice(DOODLES[sec]);dp=random.choice(pos_d)
        L.append(dict(t='draw',file=f'assets/icons/{dn}.png',pos=list(dp),a=min(1.5+random.random()*1.5,d-1.0),s=random.uniform(.55,.8),dur=.7))
    else:
        L.append(dict(t='map',kind=b['map'],a=0.0,dur=d))
        if SUF: L.append(dict(t='img',file=f"assets/cards{SUF}/{POOL[sec][i%len(POOL[sec])]}_S.png",pos=[1000,300],a=1.0,z=[1.0,1.05],drift=[0,-8],ent='slide'))
    # callouts
    nslot=0
    for si in b['sents']:
        for ci in callmap.get(si,[]):
            sec_,trig,kind,text=CALL[ci]
            a=max(0.0,S[si]['start']-b['start'])+ (0.1 if kind in('big','title') else 0.25)
            ent=min(7.0 if kind=='note' else 4.2 if kind=='big' else 6.5, d-a)
            if kind=='note':
                slots=LAY['slots']
                pos=slots[nslot%len(slots)];nslot+=1
                L.append(dict(t='note',file=f'assets/notes/{ci}.png',pos=list(pos),a=a,end=a+ent,kind=kind))
            elif kind=='date':
                L.append(dict(t='note',file=f'assets/notes/{ci}.png',pos=list(LAY['date']),a=a,end=a+min(ent,6),kind=kind))
            elif kind in('big','title'):
                L.append(dict(t='note',file=f'assets/notes/{ci}.png',pos=list(LAY['big']),a=a,end=a+ent,kind=kind,dim=True))
            else:
                L.append(dict(t='note',file=f'assets/notes/{ci}.png',pos=list(LAY['cta']),a=a,end=a+ent,kind=kind,dim=True))
    b['layers']=L
json.dump(dict(beats=beats,chunks=chunks,T=T),open(f'plan{SUF}.json','w'),indent=1)
print(len(beats),'beats; avg',T/len(beats))
import collections
print(collections.Counter(b['kind'] for b in beats))
print([ (b['idx'],round(b['end']-b['start'],1)) for b in beats if b['kind']=='map'])
