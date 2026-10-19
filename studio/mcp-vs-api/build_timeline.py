#!/usr/bin/env python3
"""Maps script chunks onto the speech timing of the voice-over and writes timeline.js + envelope."""
import json, re, subprocess, sys, struct, wave, math

WAV = sys.argv[1]
FPS = 30

# (theme, illustration, section label, [(spoken text, headline with {highlight})...])
BEATS = [
 ("light","timer","hook",[("تعالى في دقيقة ونص أعرفك الفرق ما بين الـ API والـ MCP،","أعرّفك الفرق ما بين الـ {API} والـ {MCP}")]),
 ("light","trend","hook",[("وليه المصطلح ده قالب الدنيا","وليه المصطلح ده {قالب الدنيا}"),("في عالم الذكاء الاصطناعي الفترة دي.","في عالم {الذكاء الاصطناعي}")]),
 ("light","apps","the API",[("زمان، ولحد دلوقتي، أي برنامج عشان يكلم برنامج تاني","أي برنامج عشان يكلّم برنامج تاني"),("كان بيحتاج حاجة اسمها API،","محتاج حاجة اسمها {API}")]),
 ("light","apps2","the API",[("اعتبره كده زي مترجم أو موصل بين تطبيقين.","زي {مترجم} بين تطبيقين")]),
 ("dark","tools","the problem",[("المشكلة بقى إن كل خدمة أو تطبيق،","المشكلة إن كل خدمة"),("زي جيميل أو سلاك أو جوجل شيتس أو الداتابيز بتاعتك،","زي {جيميل} و{سلاك} و{الداتابيز}"),("ليها الـ API الخاص بيها،","ليها {API} خاص بيها")]),
 ("dark","plugs","the problem",[("يعني كل واحدة ليها فيشة شكل، وطريقة توصيل مختلفة تماماً.","كل واحدة {فيشة} مختلفة")]),
 ("light","code","the problem",[("فالمبرمج عشان يخلي الذكاء الاصطناعي يدخل يجيب معلومة من الإيميل ويسجلها في شيت مثلاً،","عشان الـ AI يجيب معلومة من الإيميل ويسجلها"),("كان لازم يقعد يكتب كود مخصوص لكل أداة فيهم،","لازم يكتب {كود} لكل واحدة")]),
 ("light","codeerr","the problem",[("ولو أداة عملت تحديث، الكود ممكن يضرب ويحتاج يتعدل من الأول.","ولو حصل تحديث {الكود يضرب}")]),
 ("dark","mcp","the MCP",[("هنا بقى ظهر الـ MCP، أو الـ Model Context Protocol.","هنا ظهر الـ {MCP}")]),
 ("dark","oneplug","the MCP",[("إيه فكرته؟ ببساطة هو عبارة عن فيشة واحدة موحدة للذكاء الاصطناعي،","فيشة {واحدة} موحدة للذكاء الاصطناعي")]),
 ("dark","hub","the MCP",[("عشان يقدر يكلم بيها أي أداة هو عاوزها،","عشان يقدر يكلّم أي أداة"),("ويستخدمها لوحده وبنفسه","ويستخدمها {لوحده}"),("بدون ما يحتاج يكلم البرنامج كله أو نكتبله توصيلة مخصوص لكل حركة.","بدون ما يكلّم البرنامج كله")]),
 ("light","nope","the difference",[("طب هل الـ MCP بيلغي الـ API؟ لأ،","هل الـ MCP بيلغي الـ API؟ {لأ}")]),
 ("dark","layers","the difference",[("الـ MCP بيجي كـ layer أو طبقة زيادة ذكية فوق الـ API،","{طبقة} ذكية فوق الـ API")]),
 ("dark","radar","the difference",[("وظيفتها إنها توحد اللغة اللي الذكاء الاصطناعي بيفهمها،","توحّد {اللغة} اللي الـ AI بيفهمها"),("فبيخليه يقدر يكلم التطبيق بتاعك ويفهم الأدوات اللي جواه ويتعامل معاها بشكل أوسع وأشمل وأسرع بكتير.","ويتعامل مع الأدوات {أسرع بكتير}")]),
 ("light","plugin","the difference",[("يعني مثلاً بدل ما تقعد تبرمج إزاي الذكاء الاصطناعي يقرأ ملفاتك،","بدل ما تبرمج إزاي يقرأ ملفاتك"),("إنت بس بتركب فيشة الـ MCP،","ركّب فيشة {MCP}")]),
 ("dark","actions","the difference",[("وهو لوحده بيفهم إزاي يدخل على الكالندر يحجز ميعاد،","يدخل {الكالندر} يحجز ميعاد"),("أو يبعت رسالة على سلاك،","أو يبعت رسالة على {سلاك}"),("أو يسحب تقرير من الداتابيز في ثواني.","أو يسحب تقرير في {ثواني}")]),
 ("dark","charger","remember",[("افتكرها دايمًا كده إن هي بالظبط زي الشواحن؛","افتكرها زي {الشواحن}")]),
 ("dark","phones_old","remember",[("الأول كان كل موبايل له شاحن شكل،","الأول كل موبايل له {شاحن} شكل"),("نوكيا غير سامسونج غير آيفون، وكنت لازم تشيل شاحن لكل جهاز،","وكنت تشيل شاحن لكل جهاز")]),
 ("dark","phones_new","remember",[("دلوقتي بقى عندنا وصلة USB Type-C،","دلوقتي {USB Type-C}"),("هي فيشة واحدة وشكل واحد بيشحن وينقل داتا لكل الموبايلات والأجهزة مهما كان نوعها.","شكل {واحد} لكل الموبايلات")]),
 ("light","follow","follow",[("لو عجبتك واستفدت من المعلومات ديت متنساش تتابعني","متنساش {تتابعني}"),("وتشارك الفيديو مع صحابك المهتمين بالتكنولوجيا والبرمجة،","وتشارك الفيديو مع صحابك"),("وبس كده، سلام","{سلام}")]),
]

# speech-active time map from silence detection
out = subprocess.run(["ffmpeg","-hide_banner","-i",WAV,"-af","silencedetect=noise=-38dB:d=0.22","-f","null","-"],capture_output=True,text=True).stderr
sil=[]; cur=None
for l in out.splitlines():
    m=re.search(r"silence_start: ([\d.]+)",l)
    if m: cur=float(m.group(1))
    m=re.search(r"silence_end: ([\d.]+)",l)
    if m: sil.append((cur if cur is not None else 0.0,float(m.group(1)))); cur=None
if cur is not None: sil.append((cur,None))
w=wave.open(WAV); N=w.getnframes(); sr=w.getframerate(); DUR=N/sr
raw=w.readframes(N); samples=struct.unpack("<%dh"%N,raw)
sil=[(s,e if e is not None else DUR) for s,e in sil]
# merge & invert
speech=[]; t=0.0
for s,e in sorted(sil):
    if s>t: speech.append((t,s))
    t=max(t,e)
if t<DUR: speech.append((t,DUR))
speech=[(a,b) for a,b in speech if b-a>0.05]
total_speech=sum(b-a for a,b in speech)
def speech_to_time(x):
    for a,b in speech:
        if x<=b-a: return a+x
        x-=(b-a)
    return speech[-1][1]

strip=lambda s: re.sub(r"\s","",s)
chunks=[(bi,ci) for bi,b in enumerate(BEATS) for ci,_ in enumerate(b[3])]
total_chars=sum(len(strip(c[0])) for b in BEATS for c in b[3])
pos=0; timeline=[]
for bi,(theme,ill,sec,cs) in enumerate(BEATS):
    chunks_out=[]
    for say,show in cs:
        n=len(strip(say))
        a=speech_to_time(total_speech*pos/total_chars)
        pos+=n
        b=speech_to_time(total_speech*pos/total_chars)
        chunks_out.append({"start":round(a,3),"end":round(b,3),"show":show})
    timeline.append({"theme":theme,"ill":ill,"sec":sec,"start":chunks_out[0]["start"],"chunks":chunks_out})
# snap chunk starts to the nearest real pause (silence end) within 0.9s, keeping order
ends=[e for _,e in sil]
prev=0.0
for b in timeline:
    for c in b["chunks"]:
        if c["start"]>0:
            near=min(ends,key=lambda e:abs(e-c["start"]))
            if abs(near-c["start"])<=1.2 and near>prev+0.4: c["start"]=round(near,3)
        prev=c["start"]
    b["start"]=b["chunks"][0]["start"]
for i,b in enumerate(timeline):
    b["start"]=0.0 if i==0 else b["start"]
    b["end"]=timeline[i+1]["start"] if i+1<len(timeline) else round(DUR,3)
    b["chunks"][-1]["end"]=b["end"]
    for j in range(len(b["chunks"])-1): b["chunks"][j]["end"]=b["chunks"][j+1]["start"]

# amplitude envelope, one value per video frame
hop=sr//FPS; env=[]
for i in range(int(DUR*FPS)+1):
    seg=samples[i*hop:(i+1)*hop]
    env.append(math.sqrt(sum(x*x for x in seg)/max(1,len(seg)))/32768)
mx=max(env) or 1
env=[round(min(1,(v/mx)**0.7),3) for v in env]
# light smoothing
sm=[round((env[max(0,i-1)]+2*env[i]+env[min(len(env)-1,i+1)])/4,3) for i in range(len(env))]
open("timeline.js","w").write("window.DURATION=%s;window.FPS=%d;window.TIMELINE=%s;window.ENV=%s;\n"%(round(DUR,3),FPS,json.dumps(timeline,ensure_ascii=False),json.dumps(sm)))
print("dur",DUR,"speech",round(total_speech,1),"beats",len(timeline))
for b in timeline: print(round(b["start"],1),b["ill"],[c["show"][:22] for c in b["chunks"]][:1])
