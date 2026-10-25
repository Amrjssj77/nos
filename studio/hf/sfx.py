#!/usr/bin/env python3
"""Soft sound-design under the voice: a quiet bed and a whoosh + pop on every scene change. usage: sfx.py <timeline.js> <out.wav>"""
import numpy as np, wave, sys, json, re
raw=open(sys.argv[1]).read(); D=float(re.search(r"window\.DURATION=([\d.]+)",raw).group(1))
tl=json.loads(re.search(r"window\.TIMELINE=(.*?);window\.",raw,re.S).group(1)); starts=[b["start"] for b in tl][1:]
SR=44100; N=int(SR*D); rng=np.random.default_rng(3); L=np.zeros(N); R=np.zeros(N); t=np.arange(N)/SR
def add(s,at,pan=0,g=1):
    i=int(at*SR); s=s[:max(0,N-i)]; L[i:i+len(s)]+=s*g*(1-max(0,pan)); R[i:i+len(s)]+=s*g*(1+min(0,pan))
def lp(x,a):
    y=np.empty_like(x); s=0.0
    for i in range(len(x)): s+=a*(x[i]-s); y[i]=s
    return y
def whoosh(d=.7,p=.5):
    n=int(d*SR); w=rng.standard_normal(n); k=np.linspace(0,1,n); env=np.sin(np.pi*k)**1.8
    return (lp(w,.04)*2.6+(w-lp(w,.25))*.25)*env*p
def pop(f=660):
    k=np.arange(int(.18*SR))/SR; return np.sin(2*np.pi*f*k)*np.exp(-k*28)*.35
bed=(np.sin(2*np.pi*55*t)+.5*np.sin(2*np.pi*82.4*t+1))*.035*(.7+.3*np.sin(2*np.pi*.1*t)); fade=np.clip(t/2,0,1)*np.clip((D-t)/2,0,1)
L+=bed*fade; R+=bed*fade
for i,s in enumerate(starts):
    add(whoosh(),max(0,s-.25),pan=(.3 if i%2 else -.3)); add(pop(520+40*(i%5)),s+.3,pan=.2)
m=max(abs(L).max(),abs(R).max()); L,R=L/m*.8,R/m*.8
w=wave.open(sys.argv[2],"wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([L,R],1)*32767).astype("<i2").tobytes()); w.close()
