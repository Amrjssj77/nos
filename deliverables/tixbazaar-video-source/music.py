import numpy as np, wave
sr=44100; D=50; BPM=120; beat=60/BPM
n=int(sr*D); L=np.zeros(n); R=np.zeros(n)
rng=np.random.default_rng(7)
def add(x,t,pan=0,g=1):
    i=int(t*sr); 
    if i>=n: return
    x=x[:n-i]*g; L[i:i+len(x)]+=x*(1-max(pan,0)); R[i:i+len(x)]+=x*(1+min(pan,0))
def env(len_s,a=.003,d=None):
    t=np.arange(int(len_s*sr))/sr; d=d or len_s/4
    return np.minimum(t/a,1)*np.exp(-t/d)
def kick():
    t=np.arange(int(.35*sr))/sr; f=45+90*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/sr
    return np.sin(ph)*np.exp(-t*9)
def hat():
    x=rng.standard_normal(int(.06*sr)); x=np.diff(x,prepend=0); return x*env(.06,.001,.012)*.5
def clap():
    x=rng.standard_normal(int(.22*sr)); x=np.convolve(x,np.ones(3)/3,'same'); return x*env(.22,.002,.05)*.6
def pluck(f,dur=.5):
    t=np.arange(int(dur*sr))/sr
    x=sum(np.sin(2*np.pi*f*k*t)*(1/k**1.4) for k in (1,2,3,4))*np.exp(-t*7)
    return x*.35
def bass(f,dur=.45):
    t=np.arange(int(dur*sr))/sr; return np.tanh(np.sin(2*np.pi*f*t)*2.2)*np.exp(-t*4.5)*.5
def pad(freqs,dur):
    t=np.arange(int(dur*sr))/sr; x=0
    for f in freqs:
        for d in (-.4,.4): x=x+np.sin(2*np.pi*(f+d)*t)
    a=np.minimum(t/1.2,1)*np.minimum((dur-t)/1.2,1)
    return x*a*.035
# progression Am F C G, bar=2s
A=220
roots=[A,174.61,261.63,196.0]
chords=[[220,261.63,329.63],[174.61,220,261.63],[261.63,329.63,392],[196,246.94,293.66]]
scale=[0,3,7,10,12,15]  # minor pent
bars=D//2
for b in range(bars):
    t0=b*2.0; ch=b%4
    add(pad(chords[ch],2.3),t0,0,1)
    if t0>=4 and t0<44:
        for k in range(4):
            add(kick(),t0+k*beat,0,.9)
        add(bass(roots[ch]/2),t0,0,1); add(bass(roots[ch]/2),t0+1.5*beat,0,.8); add(bass(roots[ch]/2),t0+3*beat,0,.8)
        for k in range(4): add(clap(),t0+k*beat+beat*0 if k in (1,3) else 99999,0,.8)
    if t0>=8 and t0<44:
        for k in range(8): add(hat(),t0+k*beat/2+beat/4,.3,.7)
    if t0>=4 and t0<46:
        for k in range(8):
            if (k+b)%3==0 or k%2==0:
                s=scale[(k*2+b*3)%len(scale)]; f=roots[ch]*2*2**(s/12)
                add(pluck(f,.5),t0+k*beat/2,(-.4 if k%2 else .4),.55)
    if t0<4:
        add(kick(),t0,0,.5)
    if t0>=44:
        add(pluck(roots[ch]*2,1.5),t0,0,.7)
# riser into 4s and 44? fade ends
m=np.maximum(np.abs(L).max(),np.abs(R).max()); L/=m;R/=m
fade=np.minimum(np.arange(n)/(sr*1.0),1)*np.minimum((n-np.arange(n))/(sr*2.0),1)
L*=fade*.9;R*=fade*.9
st=(np.stack([L,R],1)*32767).astype(np.int16)
w=wave.open("proj/tix/assets/music.wav","wb");w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(st.tobytes());w.close()
print("ok")
