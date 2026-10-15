import json,subprocess,glob,os,sys
U='/root/.claude/uploads/d1f26c98-864b-5b13-bc74-fa681b6282a7'
src={k:glob.glob(f'{U}/{v}-*.mp4')[0] for k,v in dict(an1='0e52526e',an2='b35094b2',an3='5216dc19',chatgpt='15e17ee6',money='97b73dd8',indrive='55620319',cg1='8d054c52',cg2='4afd2dc6',cg3='2e1801fa',cg4='968b678a',nozul='e516f116',medmap='c99285f5').items()}
AN=lambda s:'ANIMATION · '+s;
R={
'reel1-animations':dict(num='01',word='ANIMATIONS',fs=190,sub='TITLE SEQUENCES<br>PRODUCT FILMS<br>UI MOTION',d=2.2,clips=[
 ('an1',8,AN('CINEMATIC AD'),'Café story'),('an2',20,AN('STORYTELLING'),'Night scroll'),('an3',18,AN('HERITAGE FILM'),'Cairo tour'),
 ('chatgpt',1.5,AN('UI MOTION'),'ChatGPT'),('money',2,AN('FINTECH PROMO'),'Money Fellows'),('indrive',13,AN('APP PROMO'),'inDrive')]),
'reel2-cgi':dict(num='02',word='CGI',fs=380,sub='SCULPTING<br>LIGHTING<br>RENDERING',d=1.6,clips=[
 ('cg1',3,'CGI · AERIAL','Jet over the city'),('cg2',10,'CGI · FOOD','Fried chicken'),('cg3',6,'CGI · FOOD','Giant burger'),('cg4',5,'CGI · FOOD','Kebab storm'),
 ('cg1',12,'CGI · CHARACTER','Captain’s lunch'),('cg2',24,'CGI · FOOD','Bucket carriage'),('cg3',15,'CGI · CROWD','Burger frenzy'),('cg4',12,'CGI · FOOD','Street skewers')]),
'reel3-saas-web':dict(num='03',word='SaaS & WEB',fs=210,sub='DASHBOARDS<br>PRODUCT FLOWS<br>LANDING PAGES',d=2.2,clips=[
 ('nozul',6,'SaaS · WEB PLATFORM','Nozul'),('medmap',8,'SaaS · CLINIC MANAGEMENT','Medmap'),('nozul',30,'SaaS · WEB PLATFORM','Nozul'),
 ('medmap',35,'SaaS · CLINIC MANAGEMENT','Medmap'),('nozul',60,'SaaS · WEB PLATFORM','Nozul'),('medmap',60,'SaaS · CLINIC MANAGEMENT','Medmap')]),
'reel4-showreel':dict(num='04',word='SHOWREEL',fs=200,sub='MOTION / CGI / 3D<br>SAAS / WEB',d=1.6,clips=[
 ('an1',8,AN('CINEMATIC AD'),'Café story'),('cg1',3,'CGI · AERIAL','Jet over the city'),('nozul',6,'SaaS · WEB PLATFORM','Nozul'),('cg3',6,'CGI · FOOD','Giant burger'),
 ('chatgpt',1.5,AN('UI MOTION'),'ChatGPT'),('cg2',10,'CGI · FOOD','Fried chicken'),('medmap',8,'SaaS · CLINIC MANAGEMENT','Medmap'),('an3',18,AN('HERITAGE FILM'),'Cairo tour')]),
}
name=sys.argv[1];c=R[name];os.makedirs('work',exist_ok=True)
cfg=dict(c,clips=[dict(type=t,name=n) for _,_,t,n in c['clips']])
json.dump(cfg,open(f'work/{name}.json','w'))
if os.path.exists(f'work/{name}_ov/info.json'): info=json.load(open(f'work/{name}_ov/info.json'))
else:
    r=subprocess.check_output(['node','render_overlay.mjs',f'work/{name}.json',f'work/{name}_ov']).decode().strip().splitlines()[-1];info=json.loads(r);json.dump(info,open(f'work/{name}_ov/info.json','w'))
TT=info['TT'];d=c['d'];TOT=info['tot'];endd=TOT-TT-len(c['clips'])*d
# video graph
inp=[];fc=[];lab=[]
fc.append(f"color=c=0x0c0c0f:s=1080x1920:r=30:d={TT},setsar=1,format=yuv420p[t0]");lab.append('[t0]')
for i,(k,ss,_,_) in enumerate(c['clips']):
    inp+=['-ss',str(ss),'-t',str(d+.1),'-i',src[k]]
    fc.append(f"[{i}:v]fps=30,setsar=1,split[a{i}][b{i}];[a{i}]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40[bg{i}];[b{i}]scale=1080:1920:force_original_aspect_ratio=decrease[fg{i}];[bg{i}][fg{i}]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p,trim=duration={d},setpts=PTS-STARTPTS[v{i}]")
    lab.append(f'[v{i}]')
fc.append(f"color=c=0x0c0c0f:s=1080x1920:r=30:d={endd:.3f},setsar=1,format=yuv420p[te]");lab.append('[te]')
fc.append(''.join(lab)+f"concat=n={len(lab)}:v=1:a=0[base]")
open(f'work/{name}_fc.txt','w').write(';\n'.join(fc))
subprocess.run(['ffmpeg','-y','-loglevel','error',*inp,'-filter_complex_script',f'work/{name}_fc.txt','-map','[base]','-r','30','-t',str(TOT),'-c:v','libx264','-crf','16','-pix_fmt','yuv420p',f'work/{name}_base.mp4'],check=True)
# audio
ai=['-i','../audio/music.wav'];af=[];ll='[0]';n=1
wt=[TT,TT+len(c['clips'])*d]
for T in wt:
    ms=int((T-.4)*1000);ai+=['-i','../audio/whoosh.wav'];af.append(f'[{n}]adelay={ms}|{ms}[a{n}]');ll+=f'[a{n}]';n+=1
for i in range(1,len(c['clips'])):
    ms=int((TT+i*d)*1000);ai+=['-i','../audio/pop.wav'];af.append(f'[{n}]adelay={ms}|{ms}[a{n}]');ll+=f'[a{n}]';n+=1
af.append(f"{ll}amix=inputs={n}:normalize=0,afade=t=out:st={TOT-1.2:.2f}:d=1.2,alimiter=limit=0.95[o]")
open(f'work/{name}_af.txt','w').write(';'.join(af))
subprocess.run(['ffmpeg','-y','-loglevel','error',*ai,'-filter_complex_script',f'work/{name}_af.txt','-map','[o]','-t',str(TOT),f'work/{name}.wav'],check=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'work/{name}_base.mp4','-framerate','30','-i',f'work/{name}_ov/%05d.png','-i',f'work/{name}.wav','-filter_complex','[0][1]overlay=0:0:shortest=1[v]','-map','[v]','-map','2:a','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t',str(TOT),f'{name}.mp4'],check=True)
print(name,'done',TOT)
