#!/usr/bin/env python3
"""Synthesises the sound design (whooshes on camera whips, riser, title hit, shard tinkles) as a 44.1k stereo wav."""
import numpy as np, wave, sys
SR=44100; D=19.0; N=int(SR*D); rng=np.random.default_rng(7)
t=np.arange(N)/SR; L=np.zeros(N); R=np.zeros(N)
def add(sig,at,pan=0.0,gain=1.0):
    i=int(at*SR); sig=sig[:max(0,N-i)]; 
    if len(sig)==0: return
    L[i:i+len(sig)]+=sig*gain*(1-max(0,pan)); R[i:i+len(sig)]+=sig*gain*(1+min(0,pan))
def lp(x,a):  # one-pole lowpass
    y=np.empty_like(x); s=0.0
    for i in range(len(x)): s+=a*(x[i]-s); y[i]=s
    return y
def whoosh(dur,peak=.45,bright=.6,up=False):
    n=int(dur*SR); w=rng.standard_normal(n)
    k=np.linspace(0,1,n); env=np.sin(np.pi*k)**1.8 if not up else k**2.2*np.sin(np.pi*np.minimum(1,k*1.02))
    soft=lp(w,.03); mix=soft*(1-bright)+ (w-lp(w,.2))*bright*.8
    sweep=np.sin(2*np.pi*np.cumsum(np.linspace(180,900 if up else 520,n))/SR)*.12
    return (mix*3.0+sweep)*env*peak
def boom(dur=2.2):
    n=int(dur*SR); k=np.arange(n)/SR; f=70*np.exp(-k*1.4)+38
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-k*1.6)*.9 + rng.standard_normal(n)*np.exp(-k*9)*.35
def ping(f,dur=.5):
    k=np.arange(int(dur*SR))/SR; return (np.sin(2*np.pi*f*k)+.4*np.sin(2*np.pi*f*2.01*k))*np.exp(-k*9)*.12
def tick(): 
    k=np.arange(int(.05*SR))/SR; return np.sin(2*np.pi*1800*k)*np.exp(-k*90)*.08
# bed
pad=(np.sin(2*np.pi*55*t)+.6*np.sin(2*np.pi*82.4*t+1)+.4*np.sin(2*np.pi*110.6*t))*.05*(.7+.3*np.sin(2*np.pi*.12*t))
swell=np.clip(t/3,0,1)*np.clip((D-t)/2.5,0,1)
L+=pad*swell; R+=pad*swell
# beat ticks (120bpm), louder as it builds
for i,b in enumerate(np.arange(0.5,15.4,.5)): add(tick(),b,pan=(-.3 if i%2 else .3),gain=.6+min(1,b/15)*.9)
# whooshes on camera whips (match CAM keyframes in index.html)
for at,dur,up,pan in [(0.0,.9,False,.2),(1.95,.8,False,-.3),(4.4,.8,False,.3),(5.3,.8,False,-.3),(7.4,1.0,False,.3),(12.4,1.3,False,-.2),(13.4,1.2,False,.2)]:
    add(whoosh(dur,.5,.55,up),at,pan)
# riser into title, hit, shimmer
add(whoosh(1.7,.8,.75,True),14.0,0); k=np.arange(int(1.7*SR))/SR; add(np.sin(2*np.pi*np.cumsum(np.linspace(220,1900,len(k)))/SR)*np.linspace(0,.18,len(k))**1.5,14.0)
add(boom(),15.7,0,.95)
add(whoosh(1.4,.5,.9,False),15.65,0)
for f,at in zip([1568,2093,2637,3136,1760,2349,2794,3520,2093,1568],[15.8,15.95,16.1,16.3,16.5,16.75,17.0,17.3,17.7,18.1]): add(ping(f),at,pan=rng.uniform(-.7,.7))
# cube pops
for at in [3.2,3.45,8.1,9.0,10.1,11.2]: add(ping(880,.25)*1.5,at,pan=.2)
m=max(np.abs(L).max(),np.abs(R).max()); L,R=L/m*.85,R/m*.85
fade=np.clip((D-t)/1.2,0,1); L*=fade; R*=fade
out=(np.stack([L,R],1)*32767).astype('<i2')
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print("ok",D)
