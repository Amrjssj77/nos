import json,sys,subprocess,numpy as np
from PIL import Image
import render
from cfg import W,H,FPS
S=json.load(open('align.json'))['sents']
AUD='/root/.claude/uploads/6ede6675-7874-557f-9f63-4883d71029fd/2768747c-Generated-Audio-October-14-2026.mp3'
def seg(a,b): return (round(S[a]['start']-0.06,3),round(S[b]['end']+0.25,3))
REELS={
 'reel1':dict(segs=[(4.65,74.6)],title='t1'),
 'reel2':dict(segs=[seg(310,312),seg(316,317),seg(321,323),seg(325,325),seg(330,333),seg(335,336),seg(339,341),seg(343,343)],title='t2'),
}
def ov(im,name,cx,cy,t,t0,t1,dim=False):
    if not(t0<=t<t1): return im
    a=render.clamp((t-t0)/0.3)*render.clamp((t1-t)/0.25)
    n=render.load(f'assets/reel/{name}.png');sc=0.6+0.4*render.eb(render.clamp((t-t0)/0.3))
    r=n.resize((int(n.width*sc),int(n.height*sc)),Image.BILINEAR);r=render.alpha_mul(r,a)
    im=im.convert('RGBA')
    if dim:
        d=Image.new('RGBA',im.size,(0,0,0,int(140*a)));im=Image.alpha_composite(im,d)
    im.paste(r,(int(cx-r.width/2),int(cy-r.height/2)),r);return im.convert('RGB')
def make(name,spec):
    segs=spec['segs'];tot=sum(b-a for a,b in segs);nf=int(tot*FPS)
    out=f'out/{name}.mp4'
    # audio
    fc=''
    for i,(a,b) in enumerate(segs):
        d=b-a;fc+=f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={d-0.1:.3f}:d=0.1[a{i}];"
    fc+=''.join(f'[a{i}]' for i in range(len(segs)))+f'concat=n={len(segs)}:v=0:a=1[aout]'
    subprocess.run(['ffmpeg','-y','-v','error','-i',AUD,'-filter_complex',fc,'-map','[aout]','-c:a','aac','-b:a','160k','out/_a.m4a'],check=True)
    pr=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i','out/_a.m4a','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-c:a','copy','-shortest','-movflags','+faststart',out],stdin=subprocess.PIPE)
    done=0;prev=None
    for si,(a,b) in enumerate(segs):
        n=int((b-a)*FPS);last=None
        for k in range(n):
            t=a+k/FPS;rel=(done+k)/FPS
            arr=render.frame(0,t=t,prog=rel/tot)
            if si>0 and k<int(0.35*FPS): arr=render.wipe(prev,arr,k/(0.35*FPS),si%2)
            arr=np.ascontiguousarray(arr);last=arr
            im=Image.fromarray(arr)
            im=ov(im,spec['title'],W/2,300,rel,0.2,3.6)
            im=ov(im,'cta',W/2,560,rel,tot-4.0,tot,dim=True)
            pr.stdin.write(np.asarray(im).tobytes())
        prev=last;done+=n
    pr.stdin.close();pr.wait();print(name,round(tot,1),'s',flush=True)
if __name__=='__main__':
    for k in sys.argv[1:]: make(k,REELS[k])
