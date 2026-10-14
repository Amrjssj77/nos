import json,math,sys,os,bisect,subprocess,random
import numpy as np
from PIL import Image,ImageDraw,ImageChops
from cfg import W,H,FPS
PL=json.load(open('plan.json'));B=PL['beats'];CH=PL['chunks'];T=PL['T']
BS=[b['start'] for b in B]
CS=[c['start'] for c in CH]
_cache={}
def load(p):
    im=_cache.get(p)
    if im is None:
        im=Image.open(p).convert('RGBA'); _cache[p]=im
        if len(_cache)>400: _cache.pop(next(iter(_cache)))
    return im
def clamp(x,a=0,b=1): return max(a,min(b,x))
def eo(p): return 1-(1-p)**3
def eb(p):
    c1=1.70158;c3=c1+1;return 1+c3*(p-1)**3+c1*(p-1)**2
def alpha_mul(im,a):
    if a>=0.999: return im
    r,g,b,al=im.split();al=al.point(lambda v:int(v*a));return Image.merge('RGBA',(r,g,b,al))
def pcenter(cv,im,cx,cy): cv.paste(im,(int(cx-im.width/2),int(cy-im.height/2)),im)
# map data
from build_html_assets import NILE,LL,xy
def mpt(lon,lat): x,y=xy(lon,lat);return (x+34,y+34)
def build_route(kind):
    NL=[mpt(*p) for p in NILE]; ia=10
    al=mpt(*LL['Alexandria'])
    if kind=='nile': pts=[al]+NL
    elif kind=='strike': pts=NL[::-1][:len(NL)-ia]
    elif kind=='campaign': pts=NL[ia:18]
    else: pts=NL[::-1]+[al]
    dots=[];prev=pts[0];dots.append(prev);acc=0
    for q in pts[1:]:
        seg=math.hypot(q[0]-prev[0],q[1]-prev[1]);u=0
        while u+14-acc<=seg:
            u+=14-acc;acc=0;f=u/seg;dots.append((prev[0]+(q[0]-prev[0])*f,prev[1]+(q[1]-prev[1])*f))
        acc+=seg-u;prev=q
    return dots
ROUTES={k:build_route(k) for k in('nile','strike','campaign','embassy')}
BASEMAP={'nile':'nile','strike':'nile','campaign':'campaign','embassy':'embassy'}
MAPKIND={'nile':'nile','aswan':'strike','campaign':'campaign','embassy':'embassy'}
def draw_layer(cv,L,t,d):
    ty=L['t'];a=L['a']
    if t<a: return
    if ty=='img':
        im=load(L['file']);p=clamp((t-a)/0.34)
        z0,z1=L['z'];sc=z0+(z1-z0)*clamp((t-a)/max(d-a,1))
        al=1.0
        if L['ent']=='slam':
            sc*=1+0.2*(1-eo(p));al=clamp(p*2.2)
        dy=0
        if L['ent']=='slide': dy=(1-eo(clamp((t-a)/0.45)))*140;al=clamp((t-a)/0.3)
        w=max(2,int(im.width*sc));h=max(2,int(im.height*sc))
        r=im.resize((w,h),Image.BILINEAR)
        r=alpha_mul(r,al)
        k=clamp((t-a)/max(d-a,1))
        pcenter(cv,r,L['pos'][0]+L['drift'][0]*k,L['pos'][1]+L['drift'][1]*k+dy)
    elif ty=='draw':
        im=load(L['file']);s=L['s']
        r=im.resize((int(im.width*s),int(im.height*s)),Image.BILINEAR)
        p=clamp((t-a)/L['dur']);w=max(1,int(r.width*eo(p)))
        r=r.crop((0,0,w,r.height))
        cv.paste(r,(int(L['pos'][0]-im.width*s/2),int(L['pos'][1]-im.height*s/2)),r)
    elif ty=='note':
        if t>=L['end']: return
        im=load(L['file']);p=clamp((t-a)/0.3);out=clamp((L['end']-t)/0.25)
        sc=0.6+0.4*eb(p) if p<1 else 1.0
        al=clamp(p*2)*out
        if L.get('dim'):
            dm=Image.new('RGBA',(W,H),(0,0,0,int(150*al)));cv.alpha_composite(dm) if cv.mode=='RGBA' else cv.paste(dm,(0,0),dm)
        r=im if abs(sc-1)<.01 else im.resize((int(im.width*sc),int(im.height*sc)),Image.BILINEAR)
        r=alpha_mul(r,al)
        pcenter(cv,r,L['pos'][0],L['pos'][1]+math.sin(t*1.6)*3)
    elif ty=='map':
        k=MAPKIND.get(L['kind'],L['kind']);base=load(f"assets/maps/{BASEMAP[k]}.png")
        p=clamp(t/0.4);sc=1+0.18*(1-eo(p))
        m=base.copy();dr=ImageDraw.Draw(m)
        dots=ROUTES[k];q=clamp((t-0.9)/max(d-3.5,3));n=int(eo(q)*len(dots))
        for (x,y) in dots[:n]: dr.ellipse([x-4,y-4,x+4,y+4],fill=(185,35,28,255))
        if n>0:
            x,y=dots[n-1];dr.ellipse([x-12,y-12,x+12,y+12],fill=(245,232,200,255),outline=(185,35,28,255),width=4)
        if sc>1.005: m=m.resize((int(m.width*sc),int(m.height*sc)),Image.BILINEAR)
        m=alpha_mul(m,clamp(p*2))
        pcenter(cv,m,360,500)
def compose(bi,t):
    b=B[bi];d=b['end']-b['start']
    cv=load(f"assets/bg/bg{b['bg']}.png").convert('RGB').copy() if False else BG(b['bg']).copy()
    cvr=cv
    # RGB canvas: layers pasted using masks
    for L in b['layers']: draw_layer(cvr,L,t,d)
    return cvr
_bg={}
def BG(i):
    if i not in _bg: _bg[i]=Image.open(f'assets/bg/bg{i}.png').convert('RGB')
    return _bg[i]
yy,xx=np.mgrid[0:H,0:W]
vig=(1-0.55*(((xx-W/2)/(W/2))**2+((yy-H/2)/(H/2))**2)/2)
vig=np.clip(vig,0.35,1)[...,None].astype(np.float32)
rng=np.random.RandomState(5)
GR=[rng.normal(0,5.5,(H,W,1)).astype(np.float32) for _ in range(6)]
JAG=np.cumsum(rng.normal(0,5,2000)).astype(np.float32);JAG-=np.linspace(JAG[0],JAG[-1],2000);JAG=np.clip(JAG,-30,30)
TR=0.5
def wipe(old,new,p,mode):
    p=eo(clamp(p))
    o=np.asarray(old);n=np.asarray(new)
    if mode==0:
        edge=(H+60)*(1-p)-30+JAG[:W][None,:]+0*yy
        Y=yy
    else:
        edge=(W+60)*(1-p)-30+JAG[:H][:,None]+0*xx
        Y=xx
    mnew=Y>=edge+10;strip=(Y>=edge)&(Y<edge+10)
    out=np.where(mnew[...,None],n,o)
    out=np.where(strip[...,None],np.array([232,220,190],np.uint8),out)
    return out
def caption(frame_img,t):
    i=bisect.bisect_right(CS,t)-1
    if i<0: return
    c=CH[i]
    if t>=c['end']+0.35: return
    im=load(f'assets/cap/{i}.png')
    p=clamp((t-c['start'])/0.12);sc=0.9+0.1*eo(p)
    if sc<0.999: im=im.resize((int(im.width*sc),int(im.height*sc)),Image.BILINEAR)
    frame_img.paste(im,(int(W/2-im.width/2),int(1020-im.height/2)),im)
def frame(f):
    t=f/FPS
    bi=max(0,bisect.bisect_right(BS,t)-1)
    lt=t-B[bi]['start']
    img=compose(bi,lt)
    arr=np.asarray(img)
    if bi>0 and lt<TR:
        old=compose(bi-1,B[bi-1]['end']-B[bi-1]['start'])
        arr=wipe(old,img,lt/TR,bi%2)
    im=Image.fromarray(np.ascontiguousarray(arr)) if not isinstance(arr,Image.Image) else arr
    im=im.copy()
    caption(im,t)
    # progress bar
    d=ImageDraw.Draw(im);d.rectangle([0,H-8,int(W*t/T),H],fill=(255,210,63))
    a=np.asarray(im,np.float32)*vig+GR[f%6]
    return np.clip(a,0,255).astype(np.uint8)
def render_range(args):
    f0,f1,out=args
    pr=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE)
    for f in range(f0,f1): pr.stdin.write(frame(f).tobytes())
    pr.stdin.close();pr.wait();return out
if __name__=='__main__':
    if sys.argv[1]=='test':
        import time
        for ts in sys.argv[2:]:
            t0=time.time();a=frame(int(float(ts)*FPS));Image.fromarray(a).save(f'assets/test_{ts}.png');print(ts,round(time.time()-t0,3),'s')
