import json,os,random,math,re,zlib
import numpy as np
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance,ImageChops
from cfg import *
from common import *
random.seed(7);np.random.seed(7)
os.makedirs('assets/cards',exist_ok=True);os.makedirs('assets/icons',exist_ok=True);os.makedirs('assets/notes',exist_ok=True);os.makedirs('assets/cap',exist_ok=True);os.makedirs('assets/bg',exist_ok=True);os.makedirs('assets/maps',exist_ok=True)
SRC={'story':Image.open('assets/story.png').convert('RGB'),'poster':Image.open('assets/poster.png').convert('RGB')}

# ---------- backgrounds ----------
def fbm(h,w,octs=5):
    a=np.zeros((h,w),np.float32);amp=1;tot=0
    for o in range(octs):
        s=2**(o+2)
        small=np.random.rand(max(2,h//(256//s*1)+2) if False else s*3, s*2).astype(np.float32)
        im=Image.fromarray((small*255).astype(np.uint8)).resize((w,h),Image.BICUBIC)
        a+=np.asarray(im,np.float32)/255*amp;tot+=amp;amp*=0.5
    return a/tot
def make_bg(i,base):
    n=fbm(H,W)
    fib=np.random.rand(H,W).astype(np.float32)
    fibim=Image.fromarray((fib*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    fib=np.asarray(fibim,np.float32)/255
    lum=0.75+0.5*n+0.4*(fib-0.5)
    arr=np.zeros((H,W,3),np.float32)
    for c in range(3): arr[...,c]=base[c]*lum
    img=Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
    d=ImageDraw.Draw(img,'RGBA')
    # random paper scraps (low alpha) for layered feel
    for _ in range(9):
        x=random.randint(-80,W-100);y=random.randint(-60,H-120);w=random.randint(160,420);h=random.randint(120,360)
        ang=random.uniform(-12,12);col=random.choice([(70,58,44,38),(48,40,32,50),(88,70,50,30)])
        lay=Image.new('RGBA',(w,h),col)
        lay=lay.rotate(ang,expand=True,resample=Image.BICUBIC)
        img.paste(lay,(x,y),lay)
    # scratches
    for _ in range(40):
        x=random.randint(0,W);y=random.randint(0,H);l=random.randint(30,160);a=random.uniform(0,math.pi)
        d.line([x,y,x+l*math.cos(a),y+l*math.sin(a)],fill=(200,180,150,random.randint(6,16)),width=1)
    img.save(f'assets/bg/bg{i}.png')
for i,b in enumerate([(34,29,25),(40,31,22),(26,26,28)]): make_bg(i,b)

# ---------- photo cards ----------
def torn_poly(w,h,j=3,step=14):
    pts=[]
    for x in range(0,w,step): pts.append((x,random.uniform(0,j)))
    for y in range(0,h,step): pts.append((w-random.uniform(0,j),y))
    for x in range(w,0,-step): pts.append((x,h-random.uniform(0,j)))
    for y in range(h,0,-step): pts.append((random.uniform(0,j),y))
    return pts
def grade(im):
    im=ImageEnhance.Contrast(im).enhance(1.12);im=ImageEnhance.Color(im).enhance(0.92)
    arr=np.asarray(im,np.float32); arr[...,0]*=1.04; arr[...,2]*=0.93
    g=np.random.normal(0,5,arr.shape[:2]).astype(np.float32)[...,None]
    arr=arr+g
    return Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
def tape(w=120,h=38,ang=0):
    t=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(t)
    pts=[(0,random.uniform(0,4)),(w,random.uniform(0,4)),(w-random.uniform(0,5),h),(random.uniform(0,5),h)]
    d.polygon([(0,2),(6,0),(w-6,3),(w,0),(w-4,h/2),(w,h),(6,h-2),(0,h)],fill=(222,200,150,170))
    for k in range(0,w,6): d.line([k,0,k,h],fill=(200,175,125,35))
    return t.rotate(ang,expand=True,resample=Image.BICUBIC)
def make_card(name,size,style,seed):
    random.seed(seed);np.random.seed(seed)
    src,box=CROPS[name];im=SRC[src].crop(box)
    tw={'L':640,'S':400}[size]
    asp=im.height/im.width
    th=int(tw*asp)
    maxh={'L':700,'S':440}[size]
    if th>maxh: th=maxh; tw=int(th/asp)
    im=im.resize((tw*2,th*2),Image.LANCZOS).filter(ImageFilter.UnsharpMask(2,80,2)).resize((tw,th),Image.LANCZOS)
    im=grade(im)
    # vignette inside
    pad=14;bot=14 if style=='torn' else 58
    cw,ch=tw+2*pad,th+pad+bot
    paper=Image.new('RGBA',(cw,ch),(236,225,198,255))
    # paper noise
    nz=np.random.normal(0,6,(ch,cw)).astype(np.float32)
    pa=np.asarray(paper,np.float32);pa[...,:3]+=nz[...,None];paper=Image.fromarray(np.clip(pa,0,255).astype(np.uint8))
    paper.paste(im,(pad,pad))
    mask=Image.new('L',(cw,ch),0);ImageDraw.Draw(mask).polygon(torn_poly(cw,ch,4 if style=='torn' else 1.2),fill=255)
    paper.putalpha(mask)
    P=34
    out=Image.new('RGBA',(cw+2*P,ch+2*P),(0,0,0,0))
    sh=Image.new('RGBA',out.size,(0,0,0,0));sh.paste((0,0,0,150),(P+8,P+12),mask)
    sh=sh.filter(ImageFilter.GaussianBlur(10))
    out=Image.alpha_composite(out,sh);out.paste(paper,(P,P),paper)
    # tape
    t1=tape(110,34,random.uniform(-35,-20));t2=tape(110,34,random.uniform(20,35))
    if style=='torn':
        out.alpha_composite(t1,(P-30,P-18));out.alpha_composite(t2,(P+cw-90,P-18))
    else:
        t=tape(130,34,random.uniform(-6,6));out.alpha_composite(t,(P+cw//2-65,P-20))
    out=out.rotate(random.uniform(-2.6,2.6),expand=True,resample=Image.BICUBIC)
    out.save(f'assets/cards/{name}_{size}.png')
for n in CROPS:
    make_card(n,'L','torn' if zlib.crc32(n.encode())%2==0 else 'pol',zlib.crc32(n.encode())%1000)
    make_card(n,'S','pol' if zlib.crc32(n.encode())%2==0 else 'torn',zlib.crc32(n.encode())%1000+1)
print('cards done')
