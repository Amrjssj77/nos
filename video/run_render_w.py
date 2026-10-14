import os
os.environ['LAYOUT']='wide'
import render
from multiprocessing import Pool
N=int(render.T*render.FPS)+1
os.makedirs('segw',exist_ok=True)
K=32;step=(N+K-1)//K
jobs=[(i*step,min(N,(i+1)*step),f'segw/s{i:02d}.mp4') for i in range(K)]
with Pool(4) as p:
    for r in p.imap_unordered(render.render_range,jobs): print('done',r,flush=True)
open('segw/list.txt','w').write(''.join(f"file 's{i:02d}.mp4'\n" for i in range(K)))
print('ALL DONE',flush=True)
