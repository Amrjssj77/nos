import json,subprocess,glob,os,sys
U='/root/.claude/uploads/d1f26c98-864b-5b13-bc74-fa681b6282a7'
ids=dict(an1='0e52526e',an2='b35094b2',an3='5216dc19',chatgpt='15e17ee6',money='97b73dd8',indrive='55620319',cg1='8d054c52',cg2='4afd2dc6',cg3='2e1801fa',cg4='968b678a',nozul='e516f116',medmap='c99285f5')
src={k:glob.glob(f'{U}/{v}-*.mp4')[0] for k,v in ids.items()}
ANI=['Concept & script','Storyboard & shot design','Animate & composite','Colour, sound & final edit']
CGI=['Concept & references','Sculpt & model','Lighting & rendering','Composite & finish']
UIM=['Brand & product flow','UI design','Motion & transitions','Export & delivery']
SAAS=['Understand the product','Design the interface','Build the motion walkthrough','Export & delivery']
W=[
('an1','ANIMATIONS','ANIMATION · CINEMATIC AD','Café story',8,'A cinematic café ad: street life, steaming tea and the first bite, made to make you hungry.',ANI,None),
('an2','ANIMATIONS','ANIMATION · STORYTELLING','Night scroll',20,'A short story about late-night scrolling, shot like a thriller: one phone, one dark room, one uneasy feeling.',ANI,None),
('an3','ANIMATIONS','ANIMATION · HERITAGE FILM','Cairo tour',18,'A heritage tour film: a ticket, a palace and three friends exploring Egypt’s history.',ANI,None),
('chatgpt','ANIMATIONS','ANIMATION · UI MOTION','ChatGPT',1.5,'An Arabic UI-motion promo: three prompts, three phone screens, one clear idea per scene.',UIM,None),
('money','ANIMATIONS','ANIMATION · FINTECH PROMO','Money Fellows',2,'A fintech promo: bold Arabic headlines, a card, and the app flow in clean motion.',UIM,None),
('indrive','ANIMATIONS','ANIMATION · APP PROMO','inDrive',13,'An Arabic app promo: order, pick your driver and ride, told through animated UI.',UIM,None),
('cg1','CGI','CGI · AERIAL','Jet over the city',3,'A CGI jet taxiing through city streets and over a cathedral square, with a captain enjoying pizza in the cockpit.',CGI,150),
('cg2','CGI','CGI · FOOD','Fried chicken',10,'Food CGI: a giant fried-chicken bucket rides a horse carriage, driven by a mascot.',CGI,None),
('cg3','CGI','CGI · FOOD','Giant burger',6,'Food CGI: a giant burger lands in front of the restaurant and the crowd goes wild.',CGI,None),
('cg4','CGI','CGI · FOOD','Kebab storm',5,'Food CGI: skewers of kebab fall onto a night street in front of the restaurant.',CGI,None),
('nozul','SaaS & WEB','SaaS · WEB PLATFORM','Nozul',6,'A product video for Nozul, a hotel management system: sign in, rooms calendar and work schedules.',SAAS,None),
('medmap','SaaS & WEB','SaaS · CLINIC MANAGEMENT','Medmap',8,'A product video for Medmap, a clinic management system: patient history, visits and doctor schedules.',SAAS,None)]
only=sys.argv[1:] or [w[0] for w in W]
os.makedirs('works',exist_ok=True);os.makedirs('work',exist_ok=True)
CD=5.0
for idx,w in enumerate(W):
    k,cat,typ,name,ss,desc,steps,fs=w
    if k not in only: continue
    nm=f'work{idx+1:02d}-{k}';cfg=dict(num=f'{idx+1:02d}',total=len(W),name=name,type=typ,cat=cat,desc=desc,steps=steps,clipd=CD)
    if fs:cfg['fs']=fs
    json.dump(cfg,open(f'work/{nm}.json','w'))
    ov=f'work/{nm}_ov';subprocess.run(['rm','-rf',ov])
    r=subprocess.check_output(['node','render_overlay.mjs',f'work/{nm}.json',ov]).decode().strip().splitlines()[-1];info=json.loads(r);TOT=info['tot']
    t1=1.2;t3=t1+CD+4;endd=2.5
    fc=f"color=c=0x0c0c0f:s=1080x1920:r=30:d={t1},setsar=1,format=yuv420p[a];\n[0:v]fps=30,setsar=1,split[x][y];[x]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40[bg];[y]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p,trim=duration={CD},setpts=PTS-STARTPTS[b];\ncolor=c=0x0c0c0f:s=1080x1920:r=30:d=6.5,setsar=1,format=yuv420p[c];\n[a][b][c]concat=n=3:v=1:a=0[base]"
    open(f'work/{nm}_fc.txt','w').write(fc)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(ss),'-t',str(CD+.2),'-i',src[k],'-filter_complex_script',f'work/{nm}_fc.txt','-map','[base]','-r','30','-t',str(TOT),'-c:v','libx264','-crf','16','-pix_fmt','yuv420p',f'work/{nm}_base.mp4'],check=True)
    # audio
    ai=['-i','../audio/music.wav'];af=[];ll='[0]';n=1
    for T,f in [(t1-.3,'whoosh'),(t1+CD-.3,'whoosh'),(t3-.3,'whoosh'),(t1+.3,'pop')]:
        ms=int(max(0,T)*1000);ai+=['-i',f'../audio/{f}.wav'];af.append(f'[{n}]adelay={ms}|{ms}[a{n}]');ll+=f'[a{n}]';n+=1
    af.append(f"{ll}amix=inputs={n}:normalize=0,afade=t=out:st={TOT-1:.2f}:d=1,alimiter=limit=0.95[o]")
    open(f'work/{nm}_af.txt','w').write(';'.join(af))
    subprocess.run(['ffmpeg','-y','-loglevel','error',*ai,'-filter_complex_script',f'work/{nm}_af.txt','-map','[o]','-t',str(TOT),f'work/{nm}.wav'],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'work/{nm}_base.mp4','-framerate','30','-i',f'{ov}/%05d.png','-i',f'work/{nm}.wav','-filter_complex','[0][1]overlay=0:0:shortest=1[v]','-map','[v]','-map','2:a','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t',str(TOT),f'works/{nm}.mp4'],check=True)
    subprocess.run(['rm','-rf',ov])
    print(nm,'done',TOT,flush=True)
