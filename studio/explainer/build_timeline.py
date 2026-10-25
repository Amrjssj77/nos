#!/usr/bin/env python3
"""Maps script chunks onto the speech timing of the voice-over and writes timeline.js + envelope."""
import json, re, subprocess, sys, struct, wave, math

WAV = sys.argv[1]
FPS = 30

# (theme, illustration, section label, [(spoken text, headline with {highlight})...])
# usage: build_timeline.py <voice.wav> <beats.py> <out_dir>   (beats.py defines BEATS and optional SECS)
ns={}; exec(open(sys.argv[2]).read(), ns); BEATS=ns["BEATS"]; SECS=ns.get("SECS"); OUT=sys.argv[3]

# speech-active time map from silence detection
out = subprocess.run(["ffmpeg","-hide_banner","-i",WAV,"-af","silencedetect=noise=-38dB:d=0.22","-f","null","-"],capture_output=True,text=True).stderr
sil=[]; cur=None
for l in out.splitlines():
    m=re.search(r"silence_start: ([\d.]+)",l)
    if m: cur=float(m.group(1))
    m=re.search(r"silence_end: ([\d.]+)",l)
    if m: sil.append((cur if cur is not None else 0.0,float(m.group(1)))); cur=None
if cur is not None: sil.append((cur,None))
w=wave.open(WAV); N=w.getnframes(); sr=w.getframerate(); DUR=N/sr
raw=w.readframes(N); samples=struct.unpack("<%dh"%N,raw)
sil=[(s,e if e is not None else DUR) for s,e in sil]
# merge & invert
speech=[]; t=0.0
for s,e in sorted(sil):
    if s>t: speech.append((t,s))
    t=max(t,e)
if t<DUR: speech.append((t,DUR))
speech=[(a,b) for a,b in speech if b-a>0.05]
total_speech=sum(b-a for a,b in speech)
def speech_to_time(x):
    for a,b in speech:
        if x<=b-a: return a+x
        x-=(b-a)
    return speech[-1][1]

strip=lambda s: re.sub(r"\s","",s)
chunks=[(bi,ci) for bi,b in enumerate(BEATS) for ci,_ in enumerate(b[3])]
total_chars=sum(len(strip(c[0])) for b in BEATS for c in b[3])
pos=0; timeline=[]
for bi,(theme,ill,sec,cs) in enumerate(BEATS):
    chunks_out=[]
    for say,show in cs:
        n=len(strip(say))
        a=speech_to_time(total_speech*pos/total_chars)
        pos+=n
        b=speech_to_time(total_speech*pos/total_chars)
        chunks_out.append({"start":round(a,3),"end":round(b,3),"show":show})
    timeline.append({"theme":theme,"ill":ill,"sec":sec,"start":chunks_out[0]["start"],"chunks":chunks_out})
# snap chunk starts to the nearest real pause (silence end) within 0.9s, keeping order
ends=[e for _,e in sil]
prev=0.0
for b in timeline:
    for c in b["chunks"]:
        if c["start"]>0:
            near=min(ends,key=lambda e:abs(e-c["start"]))
            if abs(near-c["start"])<=1.2 and near>prev+0.4: c["start"]=round(near,3)
        prev=c["start"]
    b["start"]=b["chunks"][0]["start"]
for i,b in enumerate(timeline):
    b["start"]=0.0 if i==0 else b["start"]
    b["end"]=timeline[i+1]["start"] if i+1<len(timeline) else round(DUR,3)
    b["chunks"][-1]["end"]=b["end"]
    for j in range(len(b["chunks"])-1): b["chunks"][j]["end"]=b["chunks"][j+1]["start"]

# amplitude envelope, one value per video frame
hop=sr//FPS; env=[]
for i in range(int(DUR*FPS)+1):
    seg=samples[i*hop:(i+1)*hop]
    env.append(math.sqrt(sum(x*x for x in seg)/max(1,len(seg)))/32768)
mx=max(env) or 1
env=[round(min(1,(v/mx)**0.7),3) for v in env]
# light smoothing
sm=[round((env[max(0,i-1)]+2*env[i]+env[min(len(env)-1,i+1)])/4,3) for i in range(len(env))]
open(OUT+"/timeline.js","w").write("window.DURATION=%s;window.FPS=%d;window.TIMELINE=%s;window.ENV=%s;window.SECS=%s;\n"%(round(DUR,3),FPS,json.dumps(timeline,ensure_ascii=False),json.dumps(sm),json.dumps(SECS)))
print("dur",DUR,"speech",round(total_speech,1),"beats",len(timeline))
for b in timeline: print(round(b["start"],1),b["ill"],[c["show"][:22] for c in b["chunks"]][:1])
