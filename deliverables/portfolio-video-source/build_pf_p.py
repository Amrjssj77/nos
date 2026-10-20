import os
P="/tmp/claude-0/-home-user-nos/836a50bd-d838-5ba2-9cb7-da78e8d22f4e/scratchpad/pf/proj/portfolio_p"
DUR=36
W=[("Regular",400),("Medium",500),("SemiBold",600),("Bold",700),("ExtraBold",800),("Black",900)]
fonts="\n".join(f'@font-face{{font-family:"IN";font-weight:{n};src:url("assets/fonts/Inter-{k}.otf")}}' for k,n in W)

whoosh=[2.4,3.9,5.2,9.0,10.4,11.8,13.2,14.6,16.0,19.0,20.4,23.6,27.4,31.4]
pops=[20.9,21.85,22.8,24.0,24.9,25.8,26.7,6.0,9.5]
ticks=[28.9+0.3*i for i in range(8)]+[27.5,27.9,28.3]
chimes=[32.0]
au=[]
au.append(f'<audio id="music" src="assets/music.mp3" data-start="0" data-duration="{DUR}" data-track-index="0" data-volume="0.4"></audio>')
tr=1
def add(n,src,ts,vol):
    global tr
    for i,t in enumerate(ts):
        au.append(f'<audio id="{n}{i}" src="assets/{src}" data-start="{t}" data-duration="0.5" data-track-index="{tr}" data-volume="{vol}"></audio>')
        tr=tr%6+1
add("w","whoosh.wav",whoosh,0.35); add("p","pop.wav",pops,0.45); add("k","tick.wav",ticks,0.5); add("c","chime.wav",chimes,0.5)
audio="\n".join(au)

html=f'''<!doctype html>
<html lang="en" dir="ltr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/><title>Amro Ismat Portfolio Reel</title>
<script src="assets/gsap.min.js"></script>
<style>
{fonts}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1080px;height:1920px;overflow:hidden;background:#ececee}}
#root{{position:relative;width:1080px;height:1920px;overflow:hidden;font-family:"IN",Helvetica,Arial,sans-serif;color:#1a1a1c}}
.sc{{position:absolute;inset:0;opacity:0;overflow:hidden}}
.light{{background:radial-gradient(1300px 800px at 50% 42%,#f6f6f8,#e4e4e8 75%,#d6d6db)}}
.dark{{background:radial-gradient(1200px 760px at 50% 45%,#1d1d21,#0b0b0d 78%)}}
.red{{background:radial-gradient(1200px 800px at 50% 40%,#f00008,#c40006 80%)}}
.t{{position:absolute;left:50%;top:50%;white-space:nowrap;font-weight:500;font-size:96px;letter-spacing:-.5px}}
.sm{{font-size:60px}}
.r{{color:#d90012}}
.fl{{position:absolute;white-space:nowrap;font-weight:500;font-size:38px;color:#444}}
.fl.r{{color:#d90012}}
.card{{position:absolute;left:50%;top:50%;width:860px;height:960px;border-radius:20px;overflow:hidden;background:#000;box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.08)}}
.card video{{width:100%;height:100%;object-fit:cover;object-position:50% 30%;display:block}}
.dots{{position:absolute;left:16px;top:12px;display:flex;gap:8px;z-index:3}}
.dots i{{width:13px;height:13px;border-radius:50%;display:block}}
.slot{{position:relative;width:1000px;height:230px}}
.stk{{position:absolute;left:0;right:0;margin:0 auto;width:max-content;top:10px;background:linear-gradient(#ffc61a,#f2a900);color:#17140a;font-weight:700;font-size:118px;line-height:1;padding:14px 34px 18px;border-radius:12px;white-space:nowrap;box-shadow:0 14px 26px rgba(0,0,0,.28),inset 0 -5px 0 rgba(0,0,0,.1);transform-origin:50% 50%}}
.stk span{{display:inline-block;transform:scaleX(.88);transform-origin:0 50%}}
.row{{position:absolute;left:50%;top:50%;display:flex;flex-direction:column;align-items:center;gap:20px;transform:translate(-50%,-50%)}}
.row .lab{{font-size:120px;font-weight:500;color:#2a2a2d;letter-spacing:-1px}}
.pill{{position:absolute;left:50%;top:50%;background:#fff;border-radius:46px;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px rgba(0,0,0,.35),inset 0 0 0 4px #fff}}
.pill b{{font-weight:900;font-size:112px;letter-spacing:1px;color:#111;white-space:nowrap}}
.egy{{font-family:"IN";font-weight:900;font-size:330px;letter-spacing:-6px;color:#e3000f;-webkit-text-stroke:10px #fff;paint-order:stroke fill;text-shadow:12px 12px 0 #111}}
.ct{{position:absolute;left:50%;white-space:nowrap;font-weight:500;color:#9a9aa3;font-size:30px}}
.ct.w{{color:#fff}}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920" data-fps="30">

<div class="sc light" id="s0"></div>
<div class="sc light" id="s1"><div class="t" id="hello">hello</div></div>
<div class="sc light" id="s2"><div class="t" id="iam">i am</div></div>
<div class="sc dark" id="s3">
  <div class="t sm" id="nL" style="left:540px;top:250px;color:#eee;font-size:72px">Amro</div>
  <div class="t sm r" id="nR" style="left:540px;top:1680px;font-size:72px;color:#ff2a38">Ismat</div>
  <div class="card" id="card"><div class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div></div>
</div>
<div class="sc red" id="s4"><div class="t" id="your" style="color:#fff;font-weight:700;font-size:88px">your</div><div class="pill" id="pill"><b id="ptxt">PARTNER</b></div></div>
<div class="sc light" id="s5"><div class="t" id="rolebox"></div></div>
<div class="sc light" id="s6"><div class="t" id="basedin">based in</div></div>
<div class="sc" id="s7" style="background:#fff">
</div>
<div class="sc light" id="s8"><div class="t" id="nowat" style="font-size:92px">now at</div><div class="t r" id="goat" style="top:1000px;font-size:230px;font-weight:800;letter-spacing:-3px">GOAT31</div></div>
<div class="sc light" id="s9"><div class="row" id="row9"><div class="lab">I help</div><div class="slot" id="slot9"></div></div></div>
<div class="sc light" id="s10"><div class="row" id="row10"><div class="lab">I do</div><div class="slot" id="slot10"></div></div></div>
<div class="sc light" id="s11"><div class="t" id="so" style="font-size:96px">so</div></div>
<div class="sc light" id="s12"><div class="t sm" id="lets" style="font-size:78px;font-weight:500;width:900px;text-align:center;white-space:normal;line-height:1.25"></div></div>
<div class="sc dark" id="s13">
  <div class="t" id="dm" style="color:#fff;font-weight:800;font-size:150px;top:760px">DM me now.</div>
  <div class="ct w" id="c1" style="top:1000px;font-size:62px;font-weight:600">www.amroismat.online</div>
  <div class="ct" id="c2" style="top:1110px;font-size:44px">Info@amroismat.online</div>
  <div class="ct" id="c3" style="top:1190px;font-size:44px">01500400025</div>
  <div class="ct" id="c4" style="top:1270px;font-size:38px">linkedin.com/in/amro-ismat-8667b53a5</div>
</div>

<video id="vegy" src="assets/clips/egypt.mp4" data-start="16.0" data-duration="3.0" data-media-start="0" muted playsinline></video>
<video id="vsel" src="assets/clips/selfie.mp4" data-start="5.2" data-duration="3.8" data-media-start="0.4" muted playsinline></video>
{audio}
</div>
<script>
const tl=gsap.timeline({{paused:true}});
const $=s=>document.querySelector(s);
const C=(el,x)=>gsap.set(el,{{xPercent:-50,yPercent:-50,...(x||{{}})}});
function scene(id,a,b){{tl.set(id,{{opacity:1}},a);tl.set(id,{{opacity:0}},b);}}
function wIn(el,t,o){{o=o||{{}};tl.fromTo(el,{{opacity:0,y:o.y??26,rotation:o.rot??-7,filter:"blur(10px)",scale:o.s??1}},{{opacity:1,y:0,rotation:0,filter:"blur(0px)",scale:1,duration:o.d??.5,ease:"power3.out"}},t);}}
function wOut(el,t,d){{tl.to(el,{{opacity:0,filter:"blur(8px)",y:-14,duration:d??.25,ease:"power2.in"}},t);}}
const S=[[0,2.4],[2.4,3.9],[3.9,5.2],[5.2,9.0],[9.0,10.4],[10.4,14.6],[14.6,16.0],[16.0,19.0],[19.0,20.4],[20.4,23.6],[23.6,27.4],[27.4,28.8],[28.8,31.4],[31.4,{DUR}]];
S.forEach((s,i)=>scene("#s"+i,s[0],s[1]));
document.getElementById("s0").style.opacity=1;

// S0 floating words
const fw=[["motion",300,300,1],["designer",1380,250,0],["CGI",460,700,0],["3D",1500,640,1],["SaaS",880,200,0],["web",760,800,0],["product",1180,820,1],["UI",240,520,0],["render",1620,440,0],["amro ismat",960,540,1]];
fw.forEach((f,i)=>{{const e=document.createElement("div");e.className="fl"+(f[3]?" r":"");e.textContent=f[0];e.style.left=(f[1]*.5625)+"px";e.style.top=(f[2]*1.78)+"px";if(i==9){{e.style.fontSize="54px";e.style.fontWeight="700"}}$("#s0").appendChild(e);
  tl.fromTo(e,{{opacity:0,rotation:(i%2?-1:1)*(25+i*4),scale:.4,x:(i%2?-1:1)*160,y:90,filter:"blur(8px)"}},{{opacity:1,rotation:(i%2?-6:6),scale:1,x:0,y:0,filter:"blur(1px)",duration:.7,ease:"power3.out"}},0.12+i*.1);
  tl.to(e,{{x:(i%2?40:-40),y:-24,rotation:(i%2?4:-4),duration:1.2,ease:"sine.inOut"}},.9);
  tl.to(e,{{opacity:0,scale:.6,filter:"blur(10px)",x:(540-f[1]*.5625)*.35,y:(960-f[2]*1.78)*.35,duration:.4,ease:"power2.in"}},1.95);}});

// S1 hello / S2 i am
C("#hello");wIn("#hello",2.42,{{rot:-9,d:.6}});wOut("#hello",3.65);
C("#iam");wIn("#iam",3.92,{{rot:6}});wOut("#iam",4.95);

// S3 photo card
const vid=document.getElementById("vsel");const card=document.getElementById("card");
vid.style.cssText="width:100%;height:100%;object-fit:cover;object-position:50% 30%;display:block";card.appendChild(vid);
C("#card");C("#nL");C("#nR");
tl.fromTo("#card",{{opacity:0,scale:.55,y:80,rotation:-3}},{{opacity:1,scale:1,y:0,rotation:0,duration:.6,ease:"back.out(1.5)"}},5.25);
tl.to("#card",{{scale:1.04,duration:3.5,ease:"sine.inOut"}},5.9);
tl.fromTo("#nL",{{opacity:0,y:-60}},{{opacity:1,y:0,duration:.5,ease:"power3.out"}},5.5);
tl.fromTo("#nR",{{opacity:0,y:60}},{{opacity:1,y:0,duration:.5,ease:"power3.out"}},5.6);

// S4 your PARTNER
C("#your",{{top:780}});C("#pill",{{width:120,height:60,opacity:0}});
tl.to("#pill",{{opacity:1,duration:.15}},9.05);
tl.to("#pill",{{width:780,height:210,duration:.55,ease:"expo.out"}},9.1);
tl.fromTo("#ptxt",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.35,ease:"power3.out"}},9.5);
tl.fromTo("#your",{{opacity:0,y:-30}},{{opacity:1,y:0,duration:.4,ease:"power3.out"}},9.45);
tl.to("#pill",{{rotation:-3,duration:.5,ease:"sine.inOut"}},9.7);

// S5 roles
const rb=$("#rolebox");C(rb);
const roles=[["motion","designer",10.4],["CGI","artist",11.8],["product","designer",13.2]];
roles.forEach((r,i)=>{{const d=document.createElement("div");d.className="t";d.style.cssText="font-size:118px;font-weight:600";d.innerHTML=r[0]+' <span class="r">'+r[1]+'</span>';$("#s5").appendChild(d);C(d);
  tl.fromTo(d,{{opacity:0,y:50,filter:"blur(12px)"}},{{opacity:1,y:0,filter:"blur(0px)",duration:.4,ease:"power3.out"}},r[2]);
  if(i<2)tl.to(d,{{opacity:0,y:-50,filter:"blur(12px)",duration:.3,ease:"power2.in"}},r[2]+1.1);}});

// S6 based in
C("#basedin");tl.fromTo("#basedin",{{opacity:0,rotation:-14,y:40,filter:"blur(8px)"}},{{opacity:1,rotation:0,y:0,filter:"blur(0px)",duration:.7,ease:"power3.out"}},14.65);

// S7 Egypt (3D rendered clip)
const ve=document.getElementById("vegy");ve.style.cssText="position:absolute;left:0;top:0;width:1080px;height:1920px;object-fit:cover";$("#s7").appendChild(ve);
tl.fromTo(ve,{{scale:1.08,filter:"blur(10px)"}},{{scale:1,filter:"blur(0px)",duration:.35,ease:"power2.out"}},16.0);

// S8 now at
C("#nowat",{{top:800}});C("#goat");gsap.set("#goat",{{top:1000}});
wIn("#nowat",19.05,{{rot:-6}});tl.fromTo("#goat",{{opacity:0,scale:.6,filter:"blur(14px)"}},{{opacity:1,scale:1,filter:"blur(0px)",duration:.5,ease:"back.out(1.4)"}},19.35);

// stickers
function stickers(slotSel,rowSel,items,t0,gap){{
  const slot=$(slotSel);const els=items.map((s,i)=>{{const d=document.createElement("div");d.className="stk";d.innerHTML="<span>"+s+"</span>";d.style.zIndex=10+i;slot.appendChild(d);gsap.set(d,{{opacity:0}});return d}});
  gsap.set(rowSel,{{xPercent:-50,yPercent:-50,left:"50%",top:"50%",x:0,y:0,transform:"none"}});
  els.forEach((d,i)=>{{const t=t0+i*gap;
    tl.fromTo(d,{{opacity:0,x:80,rotation:5,filter:"blur(8px)",scale:.92}},{{opacity:1,x:0,rotation:-2,filter:"blur(0px)",scale:1,duration:.45,ease:"back.out(1.4)"}},t);
    for(let j=0;j<i;j++){{tl.to(els[j],{{y:"+=64",rotation:"+=10",x:"+=22",opacity:Math.max(.55,1-(i-j)*.18),duration:.4,ease:"power3.out"}},t);}}
  }});
  return els;
}}
const rl=$("#row9"),rl2=$("#row10");
gsap.set(".row",{{transform:"none"}});
stickers("#slot9","#row9",["Brands","Startups","Creators"],20.55,.95);
stickers("#slot10","#row10",["Motion Design","CGI & 3D","SaaS Design","Web Design"],23.8,.88);
const lab9=document.querySelector("#row9 .lab"),lab10=document.querySelector("#row10 .lab");
wIn(lab9,20.45,{{rot:-5}});wIn(lab10,23.65,{{rot:-5}});

// S11 so ...
C("#so");wIn("#so",27.45);
let dotsEl=document.createElement("span");dotsEl.textContent="";
[".",".","."].forEach((ch,i)=>{{const sp=document.createElement("span");sp.textContent=" "+ch;sp.style.opacity=0;$("#so").appendChild(sp);tl.set(sp,{{opacity:1}},27.5+i*.38);}});
// S12 typed line
const L="Let's create something people won't forget.".split(" ");const lets=$("#lets");C(lets);
L.forEach((w,i)=>{{const sp=document.createElement("span");sp.textContent=w+(i<L.length-1?" ":"");sp.style.cssText="display:inline-block;white-space:pre";lets.appendChild(sp);
  tl.fromTo(sp,{{opacity:0,y:14,filter:"blur(6px)"}},{{opacity:1,y:0,filter:"blur(0px)",duration:.25,ease:"power2.out"}},28.9+i*.3);}});
tl.to(lets,{{opacity:0,filter:"blur(8px)",duration:.3}},31.05);

// S13 DM
C("#dm",{{top:760}});wIn("#dm",31.5,{{rot:-4,d:.6}});
[["#c1",32.1],["#c2",32.45],["#c3",32.7],["#c4",32.95]].forEach(x=>{{C(x[0]);tl.fromTo(x[0],{{opacity:0,y:20,filter:"blur(6px)"}},{{opacity:1,y:0,filter:"blur(0px)",duration:.45,ease:"power3.out"}},x[1]);}});
tl.to("#dm",{{scale:1.03,duration:3,ease:"sine.inOut"}},32.2);
window.__timelines=window.__timelines||{{}};window.__timelines["main"]=tl;
</script></body></html>'''
open(os.path.join(P,"index.html"),"w").write(html)
print("ok")
