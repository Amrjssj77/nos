import os,json,shutil
S="/tmp/claude-0/-home-user-nos/836a50bd-d838-5ba2-9cb7-da78e8d22f4e/scratchpad/tix"
P=S+"/proj/tix"
shutil.copy(S+"/style.css",P+"/assets/style.css");shutil.copy(S+"/app.js",P+"/assets/app.js")
sfx=json.load(open(S+"/sfx.json")) if os.path.exists(S+"/sfx.json") else []
F={"whoosh":"whoosh.wav","pop":"pop.wav","chime":"chime.wav","tick":"tick.wav"}
au=['<audio id="music" src="assets/music.mp3" data-start="0" data-duration="50" data-track-index="0" data-volume="0.55"></audio>']
tr=1;busy={}
for i,(k,t,v) in enumerate(sorted(sfx,key=lambda x:x[1])):
    # assign a free track
    for tk in range(1,12):
        if busy.get(tk,-9)<=t-0.5: busy[tk]=t;break
    au.append(f'<audio id="s{i}" src="assets/{F[k]}" data-start="{t}" data-duration="0.5" data-track-index="{tk}" data-volume="{round(0.55*v,2)}"></audio>')
html=f'''<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/><title>TixBazaar Brand Film</title>
<script src="assets/gsap.min.js"></script><link rel="stylesheet" href="assets/style.css"></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="50" data-width="1920" data-height="1080" data-fps="30">
<div id="tear"></div><div id="tear2"></div>
{chr(10).join(au)}
</div><script src="assets/app.js"></script><script>window.__timelines=window.__timelines||{{}};window.__timelines["main"]=tl;</script></body></html>'''
open(P+"/index.html","w").write(html)
print("sfx",len(sfx))
