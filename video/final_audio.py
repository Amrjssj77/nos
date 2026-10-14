import numpy as np,subprocess,wave
import sfx
from make_reels import REELS
SR=sfx.SR
def load(p):
    w=wave.open(p);return np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32767
mp=load('out/mix_p.wav')
for name,spec in REELS.items():
    parts=[];joins=[]
    for i,(a,b) in enumerate(spec['segs']):
        x=mp[int(a*SR):int(b*SR)].copy();n=len(x)
        fi=int(0.04*SR);fo=int(0.1*SR);x[:fi]*=np.linspace(0,1,fi);x[-fo:]*=np.linspace(1,0,fo)
        if i>0:
            joins.append(sum(len(p) for p in parts))
        parts.append(x)
    y=np.concatenate(parts)
    for j in joins:
        w=sfx.whoosh(0.4,0.9)*0.17;s=max(0,j-int(0.05*SR));y[s:s+len(w)]+=w[:len(y)-s]*0.8
    sfx.save(f'out/{name}_sfx.wav',np.tanh(y))
    subprocess.run(['ffmpeg','-y','-v','error','-i',f'out/{name}_sfx.wav','-c:a','aac','-b:a','160k',f'out/{name}_sfx.m4a'],check=True)
    subprocess.run(['ffmpeg','-y','-v','error','-i',f'out/{name}.mp4','-i',f'out/{name}_sfx.m4a','-map','0:v','-map','1:a','-c','copy','-shortest','-movflags','+faststart',f'out/{name}_sfx.mp4'],check=True)
# wide
for tag,br in (('128k','128k'),('48k','48k')):
    subprocess.run(['ffmpeg','-y','-v','error','-i','out/mix_w.wav','-c:a','aac','-b:a',br,f'out/mixw_{tag}.m4a'],check=True)
subprocess.run(['ffmpeg','-y','-v','error','-i','out/amanirenas_16x9_lite.mp4','-i','out/mixw_48k.m4a','-map','0:v','-map','1:a','-c','copy','-shortest','-movflags','+faststart','out/amanirenas_16x9_lite_sfx.mp4'],check=True)
subprocess.run(['ffmpeg','-y','-v','error','-i','out/amanirenas_16x9.mp4','-i','out/mixw_128k.m4a','-map','0:v','-map','1:a','-c','copy','-shortest','-movflags','+faststart','out/amanirenas_16x9_sfx.mp4'],check=True)
print('ok')
