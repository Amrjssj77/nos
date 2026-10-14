import json,sys,subprocess,numpy as np,wave
SR=24000
rng=np.random.RandomState(42)
def bp(x,lo,hi):
    X=np.fft.rfft(x);f=np.fft.rfftfreq(len(x),1/SR);X[(f<lo)|(f>hi)]=0;return np.fft.irfft(X,len(x))
def env_attack_decay(n,peak=0.35,pw=1.5):
    t=np.linspace(0,1,n);up=np.minimum(t/peak,1);dn=np.clip((1-t)/(1-peak),0,1)**pw;return np.sin(up*np.pi/2)*dn
def whoosh(d=0.45,amp=1.0):
    n=int(d*SR);x=bp(rng.randn(n),500,6500)
    t=np.arange(n)/SR;flutter=1+0.35*np.sin(2*np.pi*38*t+rng.rand()*6)
    x=x*flutter*env_attack_decay(n,0.4,1.8);return x/np.abs(x).max()*amp
def flip(amp=1.0):
    out=np.zeros(int(0.28*SR))
    for off in (0.0,0.07,0.15):
        n=int(0.05*SR);c=bp(rng.randn(n),1500,9000)*np.exp(-np.linspace(0,7,n));o=int(off*SR);out[o:o+n]+=c*(0.9-off)
    return out/np.abs(out).max()*amp
def pop(amp=1.0,low=150):
    n=int(0.16*SR);t=np.arange(n)/SR;f=low*np.exp(-t*14)+60
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*28)
    c=bp(rng.randn(n),1200,7000)*np.exp(-t*160)*0.5
    y=x+c;return y/np.abs(y).max()*amp
def thud(amp=1.0):
    n=int(0.45*SR);t=np.arange(n)/SR;f=70*np.exp(-t*7)+38
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*8)
    c=bp(rng.randn(n),300,3000)*np.exp(-t*40)*0.5
    y=x+c;return y/np.abs(y).max()*amp
def scribble(d=0.7,amp=1.0):
    n=int(d*SR);t=np.arange(n)/SR;x=bp(rng.randn(n),2500,8500)
    m=np.abs(np.sin(2*np.pi*(9+4*np.sin(t*5))*t*0.5))**0.7
    e=np.minimum(t/0.05,1)*np.clip((d-t)/0.08,0,1);y=x*m*e;return y/np.abs(y).max()*amp
def events(plan):
    P=json.load(open(plan));ev=[]
    for i,b in enumerate(P['beats']):
        if i>0: ev.append((b['start']-0.04,'whoosh',0.9 if i%2 else 0.8))
        for L in b['layers']:
            t=b['start']+L['a']
            if L['t']=='draw': ev.append((t,'scribble',0.55))
            elif L['t']=='img' and L.get('ent')=='slide': ev.append((t,'flip',0.7))
            elif L['t']=='note':
                k=L.get('kind')
                if k=='note': ev.append((t,'pop',0.8))
                elif k=='date': ev.append((t,'thud',0.7))
                else: ev.append((t,'thud',1.0));ev.append((t-0.05,'whoosh',0.5))
            elif L['t']=='map': ev.append((t+0.9,'scribble',0.45))
    return ev,P['T']
def build(plan,vo,out):
    ev,T=events(plan);n=len(vo);sfx=np.zeros(n+SR*3,np.float32)
    for t,kind,a in sorted(ev):
        s={'whoosh':lambda:whoosh(0.45,a),'flip':lambda:flip(a),'pop':lambda:pop(a),'thud':lambda:thud(a),'scribble':lambda:scribble(0.7,a)}[kind]()
        i=int(max(0,t)*SR);sfx[i:i+len(s)]+=s[:len(sfx)-i]
    sfx=sfx[:n]
    # duck under voice
    e=np.abs(vo);k=int(0.06*SR);w=np.ones(k)/k
    es=np.convolve(e,w,'same');es=np.convolve(es,np.ones(int(0.25*SR))/int(0.25*SR),'same')
    g=1-0.8*np.clip(es/0.10,0,1)
    mix=vo*0.85+sfx*g*0.17
    mix=np.tanh(mix*1.0)  # soft limit
    return mix.astype(np.float32),sfx*0.17
def save(path,x):
    with wave.open(path,'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(x,-1,1)*32767).astype(np.int16).tobytes())
if __name__=='__main__':
    vo=np.fromfile('out/vo.f32',np.float32)
    for plan,name in (('plan.json','p'),('planw.json','w')):
        mix,s=build(plan,vo,name);save(f'out/mix_{name}.wav',mix);np.save(f'out/sfxraw_{name}.npy',s)
        print(name,'mix peak',np.abs(mix).max(),'sfx peak raw',np.abs(s).max())
