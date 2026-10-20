const root=document.getElementById("root");
const tl=gsap.timeline({paused:true});
window.__sfx=[];
function sfx(k,t,v){window.__sfx.push([k,+t.toFixed(2),v||1])}
function mk(cls,html,parent,style){const e=document.createElement("div");if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(style)e.style.cssText=style;(parent||root).appendChild(e);return e}
let seed=11;function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
const TEAL="#19b7a3",CORAL="#ff6a57";
const SC=[[0,4],[4,8],[8,14],[14,18],[18,24],[24,30],[30,34],[34,40],[40,44],[44,50]];
let sceneEls=[];
function scene(i,alt){
  const [a,b]=SC[i];const el=mk("sc"+(alt?" alt":""),"",root);el.id="s"+i;sceneEls.push(el);
  if(i==0){gsap.set(el,{opacity:1});}
  else{
    tl.set(el,{opacity:1,clipPath:"inset(0 100% 0 0)"},a-.02);
    tl.to(el,{clipPath:"inset(0 0% 0 0)",duration:.6,ease:"power3.inOut"},a);
    tl.set(el,{clipPath:"none"},a+.65);
    tl.fromTo("#tear",{x:-20,opacity:1},{x:1930,duration:.6,ease:"power3.inOut"},a);
    tl.fromTo("#tear2",{x:-260,opacity:1},{x:1700,duration:.6,ease:"power3.inOut"},a);
    tl.set("#tear,#tear2",{opacity:0},a+.62);
    sfx("whoosh",a-.05,.55);
  }
  if(i<SC.length-1) tl.set(el,{opacity:0},b+.7);
  streaks(el,a);
  return el;
}
function streaks(el,t0){
  const dur=(SC[sceneEls.indexOf(el)]||[0,6]);const L=dur[1]-dur[0]+1;
  for(let k=0;k<5;k++){
    const col=k%2?"rgba(255,106,87,.20)":"rgba(25,183,163,.17)";
    const s=mk("st","",el,`left:${-300+k*420}px;top:${140+k*190}px;background:linear-gradient(90deg,transparent,${col},transparent)`);
    s.style.height=(30+k*14)+"px";
    tl.fromTo(s,{x:-400,opacity:0},{x:500,opacity:1,duration:L,ease:"none"},t0);
  }
}
function pop(el,t,o){o=o||{};tl.fromTo(el,{opacity:0,scale:o.s??.6,y:o.y??30,rotation:o.r??0},{opacity:1,scale:1,y:0,rotation:0,duration:o.d??.5,ease:o.e||"back.out(1.7)"},t)}
function rise(el,t,o){o=o||{};tl.fromTo(el,{opacity:0,y:o.y??50,filter:"blur(12px)"},{opacity:1,y:0,filter:"blur(0px)",duration:o.d??.7,ease:"power3.out"},t)}
function slide(el,t,x,o){o=o||{};tl.fromTo(el,{opacity:0,x:x},{opacity:1,x:0,duration:o.d??.8,ease:"power3.out"},t)}
function fade(el,t,d){tl.to(el,{opacity:0,duration:d??.3},t)}
function chip(text,color,parent,style,dk){return mk("chip"+(dk?" dk":""),`<i style="background:${color}"></i>${text}`,parent,style)}
function bf(src,x,y,w,parent,url){
  const h=Math.round(w*900/1366)+34;
  const e=mk("bf",`<div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><u>${url||"tixbazaar.demo"}</u></div><img src="assets/img/${src}.jpg">`,parent,`left:${x}px;top:${y}px;width:${w}px;height:${h}px`);return e}
function phone(src,x,y,w,parent){const h=Math.round(w*844/390);return mk("ph",`<img src="assets/img/${src}.jpg" style="height:100%;object-fit:cover;object-position:top">`,parent,`left:${x}px;top:${y}px;width:${w}px;height:${h}px`)}
function label(t,parent,style){return mk("lab",t,parent,style)}
function ticketSVG(sz){return `<svg width="${sz}" height="${sz*.72}" viewBox="0 0 100 72"><defs><clipPath id="tk"><path d="M10 6h80a8 8 0 0 1 8 8v10a8 8 0 0 0 0 16v18a8 8 0 0 1-8 8H10a8 8 0 0 1-8-8V40a8 8 0 0 0 0-16V14a8 8 0 0 1 8-8z"/></clipPath></defs><g clip-path="url(#tk)"><rect width="100" height="72" fill="${TEAL}"/><rect x="62" width="40" height="72" fill="${CORAL}"/></g><line x1="62" y1="10" x2="62" y2="62" stroke="#0a1a1f" stroke-width="2.2" stroke-dasharray="4 4"/><text x="31" y="48" font-family="IN" font-weight="900" font-size="36" fill="#fff" text-anchor="middle">T</text></svg>`}
function wordmark(sz,parent,style){return mk("",`<span style="color:${TEAL}">Tix</span><span style="color:${CORAL}">Bazaar</span>`,parent,`font-family:IN;font-weight:900;font-size:${sz}px;letter-spacing:${-sz*.03}px;line-height:1;white-space:nowrap;${style||""}`)}

/* ============ S0 intro ============ */
(function(){
  const s=scene(0,false);
  // particle seats
  for(let i=0;i<48;i++){const d=mk("seat","",s,`left:${rnd()*1900}px;top:${rnd()*1050}px;width:14px;height:14px;border-radius:4px;background:${rnd()>.5?"rgba(25,183,163,.5)":"rgba(255,106,87,.45)"}`);
    tl.fromTo(d,{opacity:0,y:60,scale:.3},{opacity:1,y:-80,scale:1,duration:2+rnd()*2,ease:"sine.out"},rnd()*1.5);
    tl.to(d,{opacity:0,duration:.6},3.2);}
  label("PRODUCT REVIEW · PORTFOLIO 2026",s,"left:50%;top:150px;transform:translateX(-50%)");
  const tk=mk("",ticketSVG(240),s,"position:absolute;left:50%;top:50%;margin:-230px 0 0 -120px;line-height:0");
  gsap.set(tk,{transformPerspective:900});
  tl.fromTo(tk,{opacity:0,scale:.2,rotationY:-180,rotation:-30},{opacity:1,scale:1,rotationY:0,rotation:0,duration:.9,ease:"back.out(1.6)"},.3);
  sfx("pop",.7,.8);
  tl.to(tk,{x:-560,y:30,scale:.62,duration:.7,ease:"power3.inOut"},1.35);
  const wm=wordmark(230,s,"position:absolute;left:0;right:0;top:415px;text-align:center;padding-left:240px");
  const lets=[...wm.querySelectorAll("span")];
  const txt=["T","i","x","B","a","z","a","a","r"];
  wm.innerHTML=txt.map((c,i)=>`<span style="display:inline-block;color:${i<3?TEAL:CORAL}">${c}</span>`).join("");
  [...wm.children].forEach((c,i)=>tl.fromTo(c,{opacity:0,y:-120,rotation:-14,filter:"blur(10px)"},{opacity:1,y:0,rotation:0,filter:"blur(0px)",duration:.55,ease:"back.out(2)"},1.5+i*.07));
  sfx("pop",1.6,.6);
  const ar=mk("hd","تكس بازار<span style='color:#8fb0ad;font-weight:500'> · </span><span style='color:#fff'>منصة تذاكر الفعاليات</span>",s,"position:absolute;left:0;right:0;padding-left:240px;top:690px;text-align:center;font-size:62px;direction:rtl");
  rise(ar,2.0);
  const row=mk("",null,s,"position:absolute;left:0;right:0;top:850px;display:flex;justify-content:center;gap:18px;direction:ltr");
  [["3D · 360°",TEAL],["5:00 Hold",CORAL],["Live Show",TEAL],["Feature Toggles",CORAL],["Organizer Studio",TEAL]].forEach((c,i)=>{const e=chip(c[0],c[1],row);pop(e,2.35+i*.18,{y:40});sfx("pop",2.35+i*.18,.35)});
  tl.to(wm,{scale:1.03,duration:1.5,ease:"sine.inOut"},2.2);
})();

/* ============ S1 discover ============ */
(function(){
  const s=scene(1,true);const t=4.45;
  const stage=mk("",null,s,"position:absolute;inset:0;perspective:2000px");
  const f=bf("home_en",70,170,1060,stage,"tixbazaar.demo/events");gsap.set(f,{rotationY:14,rotationX:3,transformOrigin:"20% 50%"});
  const f2=bf("list",70,170,1060,stage,"tixbazaar.demo/events");gsap.set(f2,{rotationY:14,rotationX:3,transformOrigin:"20% 50%",opacity:0});
  tl.fromTo(f,{opacity:0,x:-200,rotationY:34},{opacity:1,x:0,rotationY:14,duration:.9,ease:"power3.out"},t);
  tl.to(f,{x:30,rotationY:8,duration:3,ease:"sine.inOut"},t+.9);
  tl.fromTo(f2,{opacity:0,y:60},{opacity:1,y:0,duration:.6,ease:"power2.out"},t+1.7);tl.to(f2,{x:30,rotationY:8,duration:1.8,ease:"sine.inOut"},t+2.3);
  tl.to(f,{opacity:0,duration:.3},t+2.2);
  const p=phone("phone",880,380,270,stage);gsap.set(p,{rotationY:-10});
  tl.fromTo(p,{opacity:0,y:200,rotation:6},{opacity:1,y:0,rotation:-2,duration:.9,ease:"back.out(1.4)"},t+.6);
  tl.to(p,{y:-14,duration:1.4,yoyo:true,repeat:2,ease:"sine.inOut"},t+1.6);
  label("DISCOVERY · HOME & LISTING",s,"right:90px;top:120px");
  const h=mk("hd","اكتشف الفعاليات<br><em>من أول نظرة</em>",s,"position:absolute;right:90px;top:170px;width:700px;font-size:80px");rise(h,t+.3);
  const rows=[["Hero carousel",TEAL],["Hot Events · Upcoming",CORAL],["بحث فوري",TEAL],["Filters جانبية",CORAL],["AR / EN · RTL",TEAL]];
  rows.forEach((r,i)=>{const e=chip(r[0],r[1],s,`position:absolute;right:90px;top:${500+i*90}px`);slide(e,t+.8+i*.22,160,{d:.6});sfx("pop",t+.9+i*.22,.35)});
})();

/* ============ S2 3D seat map ============ */
(function(){
  const s=scene(2,false);const t=8.4;
  const imgs=["hall1","hall2","hall3"];const tm=[8.0,10.0,12.0];
  imgs.forEach((n,i)=>{
    const e=mk("img","",s);e.innerHTML=`<img src="assets/img/${n}.jpg" style="width:2150px;height:1417px;object-fit:cover;display:block">`;
    e.style.cssText=`left:-120px;top:-170px;width:2150px;height:1417px;overflow:hidden;opacity:${i?0:1}`;
    const a=tm[i],b=a+2.2;
    if(i>0)tl.fromTo(e,{opacity:0},{opacity:1,duration:.5},a+ (i==1?.15:0));
    tl.fromTo(e.firstChild,{x:i%2?-110:110,scale:1.04},{x:i%2?110:-110,scale:1.14,duration:2.6,ease:"sine.inOut"},a);
    if(i<2)tl.set(e,{opacity:0},b+.55);
  });
  mk("dim","",s);
  mk("","",s,"position:absolute;inset:0;background:radial-gradient(900px 600px at 40% 55%,transparent,rgba(5,12,15,.55))");
  label("FEATURE 01 / 05 · 3D SEAT MAP 360°",s,"right:90px;top:120px");
  const h=mk("hd","قاعة حقيقية…<br><em>قبل أن تشتري</em> التذكرة",s,"position:absolute;right:90px;top:170px;width:840px;font-size:84px");rise(h,t+.2);
  // 360 ring
  const ring=mk("",`<svg width="190" height="190" viewBox="0 0 190 190" style="position:absolute;left:0;top:0"><circle cx="95" cy="95" r="84" fill="rgba(8,21,25,.55)" stroke="rgba(255,255,255,.2)" stroke-width="3"/></svg><svg id="arc" width="190" height="190" viewBox="0 0 190 190" style="position:absolute;left:0;top:0"><circle cx="95" cy="95" r="84" fill="none" stroke="${TEAL}" stroke-width="6" stroke-dasharray="90 440" stroke-linecap="round"/></svg><div style="position:absolute;left:0;right:0;top:66px;text-align:center;font-weight:900;font-size:42px;color:#fff">360°</div>`,s,"position:absolute;left:90px;top:100px;width:190px;height:190px");
  pop(ring,t,{s:.3});tl.to("#arc",{rotation:360,duration:5.6,ease:"none",transformOrigin:"50% 50%"},t);
  const c1=chip("View from seat · Balcony F12",CORAL,s,"position:absolute;left:90px;top:320px");pop(c1,t+.5);sfx("pop",t+.55,.4);
  const c2=chip("Red velvet · 312 seats",TEAL,s,"position:absolute;left:90px;top:400px");pop(c2,t+.85);sfx("pop",t+.9,.4);
  const c3=chip("Gyro look · drag-to-look",CORAL,s,"position:absolute;left:90px;top:480px");pop(c3,t+1.2);sfx("pop",t+1.25,.4);
  // cursor drag
  const cur=mk("",`<svg width="70" height="70" viewBox="0 0 24 24"><path d="M5 3l14 8-6 2 4 7-3 1.5-4-7-5 4z" fill="#fff" stroke="#0a1a1f" stroke-width="1"/></svg>`,s,"left:700px;top:700px");
  tl.fromTo(cur,{opacity:0},{opacity:1,duration:.3},t+.4);
  tl.fromTo(cur,{x:-120},{x:260,duration:1.6,ease:"sine.inOut",yoyo:true,repeat:2},t+.4);
  const trail=mk("","",s,`left:540px;top:742px;width:420px;height:4px;border-radius:3px;background:linear-gradient(90deg,transparent,${TEAL},transparent);transform-origin:0 50%`);
  tl.fromTo(trail,{opacity:0,scaleX:0},{opacity:.9,scaleX:1,duration:.8,ease:"power2.out"},t+.5);
  // 2D map card
  const m=mk("",`<img src="assets/img/map2d.jpg" style="width:100%;display:block"><div style="position:absolute;left:0;top:0;right:0;height:26px;background:#fff"></div>`,s,"position:absolute;right:90px;top:560px;width:560px;height:470px;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.6);");
  m.firstChild.style.cssText="width:100%;display:block;object-fit:cover;height:100%;object-position:0 30%";
  slide(m,t+1.4,300,{d:.9});
  const dot=mk("",null,s,`position:absolute;right:340px;top:760px;width:26px;height:26px;border-radius:50%;background:${CORAL};box-shadow:0 0 0 0 rgba(255,106,87,.7)`);
  pop(dot,t+2.3,{s:.2});tl.to(dot,{boxShadow:"0 0 0 40px rgba(255,106,87,0)",duration:.9,repeat:3,ease:"power2.out"},t+2.4);
  const tag=chip("2D ↔ 3D synced","#fff",s,"position:absolute;right:110px;top:990px");tag.style.display="none";
  const sc=mk("",`<span id="seatn">0</span><span style="font-size:36px;color:#8fb0ad;font-weight:700"> seats</span>`,s,"position:absolute;left:90px;top:640px;font-weight:900;font-size:150px;line-height:1;color:#fff;letter-spacing:-4px");
  const o={v:0};rise(sc,t+1);tl.to(o,{v:312,duration:1.6,ease:"power2.out",onUpdate:()=>{document.getElementById("seatn").textContent=Math.round(o.v)}},t+1.1);
})();

/* ============ S3 5:00 hold ============ */
(function(){
  const s=scene(3,true);const t=14.45;
  label("FEATURE 02 / 05 · 5-MINUTE SEAT HOLD",s,"right:90px;top:120px");
  const h=mk("hd","<em>5 دقائق</em> محجوزة لك<br>فعلًا",s,"position:absolute;right:90px;top:170px;width:900px;font-size:92px");rise(h,t+.2);
  const ring=mk("",`<svg width="520" height="520" viewBox="0 0 340 340"><circle cx="170" cy="170" r="150" fill="rgba(5,15,18,.5)" stroke="rgba(255,255,255,.12)" stroke-width="16"/><circle id="rg" cx="170" cy="170" r="150" fill="none" stroke="${TEAL}" stroke-width="16" stroke-linecap="round" stroke-dasharray="942" stroke-dashoffset="0" transform="rotate(-90 170 170)"/></svg><div id="cd" style="position:absolute;left:0;right:0;top:170px;text-align:center;font-weight:900;font-size:130px;letter-spacing:-3px;color:#fff;font-variant-numeric:tabular-nums">5:00</div><div style="position:absolute;left:0;right:0;top:320px;text-align:center;font-weight:700;font-size:26px;color:#8fb0ad;letter-spacing:4px">SERVER-SIDE HOLD</div>`,s,"left:90px;top:230px;width:520px;height:520px");
  pop(ring,t+.3,{s:.4});
  const cnt={v:300};
  tl.to(cnt,{v:0,duration:2.7,ease:"power1.in",onUpdate:()=>{const v=Math.max(0,Math.round(cnt.v));document.getElementById("cd").textContent=Math.floor(v/60)+":"+String(v%60).padStart(2,"0")}},t+1);
  tl.to("#rg",{strokeDashoffset:942,duration:2.7,ease:"power1.in"},t+1);
  tl.to("#rg",{stroke:CORAL,duration:.4},t+3.2);
  for(let i=0;i<14;i++)sfx("tick",t+1.1+i*.19,.45);
  const sp=chip("×120 speed",CORAL,s,"position:absolute;left:210px;top:800px");pop(sp,t+1);
  // seat grid
  const g=mk("",null,s,"position:absolute;left:760px;top:430px;width:1040px;height:520px");
  const seats=[];
  for(let r=0;r<8;r++)for(let c=0;c<17;c++){const e=mk("seat","",g,`left:${c*60+ (r%2)*0}px;top:${r*58}px;width:44px;height:44px;border-radius:12px 12px 8px 8px;background:rgba(25,183,163,.28)`);seats.push(e);
    tl.fromTo(e,{opacity:0,scale:.2},{opacity:1,scale:1,duration:.35,ease:"back.out(2)"},t+.4+(r*17+c)*.006);}
  [[3,6],[3,7],[3,8],[3,9]].forEach(([r,c],k)=>{const e=seats[r*17+c];
    tl.to(e,{background:CORAL,scale:1.25,boxShadow:"0 0 30px rgba(255,106,87,.9)",duration:.35,ease:"back.out(3)"},t+1.2+k*.18);sfx("pop",t+1.2+k*.18,.4);
    tl.to(e,{background:"rgba(25,183,163,.28)",scale:1,boxShadow:"0 0 0 rgba(0,0,0,0)",duration:.4},t+3.7);
    tl.to(e,{background:"#fff",duration:.12,yoyo:true,repeat:3},t+3.7);});
  // others blocked
  [[2,5],[2,6],[2,10],[4,4],[4,11],[5,8]].forEach(([r,c])=>tl.to(seats[r*17+c],{background:"rgba(255,255,255,.12)",duration:.2},t+1.4));
  const toast=mk("",`<div style="width:46px;height:46px;border-radius:50%;background:${CORAL};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px">O</div><div><div style="font-weight:700;font-size:26px">Omar_K is waiting for these seats</div><div style="font-size:19px;color:#8fb0ad;margin-top:2px">DEMO · simulated message</div></div>`,s,"position:absolute;left:790px;top:330px;display:flex;gap:18px;align-items:center;padding:16px 28px;border-radius:20px;background:rgba(255,255,255,.09);border:2px solid rgba(255,255,255,.16)");
  slide(toast,t+2.0,300,{d:.7});sfx("chime",t+2.05,.4);
  const rel=chip("Auto-release on expiry",TEAL,s,"position:absolute;left:1380px;top:340px");pop(rel,t+3.7);sfx("pop",t+3.7,.5);
  const wl=chip("Waitlist notified","#fff",s,"position:absolute;left:1380px;top:978px");wl.style.top="985px";wl.style.left="790px";pop(wl,t+3.9);
  const bar=mk("",`<img src="assets/img/holdbar.jpg" style="width:100%;display:block;border-radius:14px">`,s,"position:absolute;left:90px;top:990px;width:650px");
  rise(bar,t+.9,{y:40});
})();

/* ============ S4 checkout / tickets ============ */
(function(){
  const s=scene(4,false);const t=18.45;
  label("CHECKOUT · MOCK PAYMENTS · E-TICKETS",s,"right:90px;top:90px");
  const h=mk("hd","دفع آمن… <em>بلا بيانات بطاقات</em>",s,"position:absolute;right:90px;top:130px;width:1400px;font-size:76px;left:auto");rise(h,t+.2);
  const stage=mk("",null,s,"position:absolute;inset:0;perspective:2200px");
  const fr=[["pay",80,300,640,"1 · الدفع",8],["conf",640,330,640,"2 · التأكيد",-2],["tickets",1200,300,640,"3 · تذكرة QR",-8]];
  fr.forEach((f,i)=>{const e=bf(f[0],f[1],f[2],f[3],stage,"tixbazaar.demo/checkout");gsap.set(e,{rotationY:f[5]*1.4,transformOrigin:"50% 50%"});
    const a=t+.7+i*.8;tl.fromTo(e,{opacity:0,y:140,rotationY:f[5]*3,scale:.8},{opacity:1,y:0,rotationY:f[5]*1.4,scale:1,duration:.8,ease:"back.out(1.3)"},a);sfx("pop",a+.1,.5);
    const n=mk("",f[4],s,`position:absolute;left:${f[1]}px;top:${f[2]-52}px;font-weight:800;font-size:30px;color:${TEAL};direction:rtl`);rise(n,a+.2,{y:20});
    tl.to(e,{y:-12,duration:1.3,yoyo:true,repeat:3,ease:"sine.inOut"},a+.9);
  });
  // QR beam on tickets
  const beam=mk("",null,s,`position:absolute;left:1200px;top:380px;width:640px;height:6px;background:linear-gradient(90deg,transparent,${TEAL},transparent);box-shadow:0 0 30px ${TEAL};opacity:0`);
  tl.fromTo(beam,{y:0,opacity:1},{y:300,duration:.9,ease:"sine.inOut",yoyo:true,repeat:1},t+3.1);tl.set(beam,{opacity:0},t+4.9);
  const stamp=mk("",`✓ Checked in`,s,`position:absolute;left:1470px;top:640px;padding:12px 26px;border:5px solid ${TEAL};border-radius:14px;color:${TEAL};font-weight:900;font-size:44px;background:rgba(5,15,18,.85);transform:rotate(-9deg)`);
  tl.fromTo(stamp,{opacity:0,scale:2.4},{opacity:1,scale:1,duration:.3,ease:"power4.in"},t+4.8);sfx("pop",t+5.05,.9);
  // split bill
  const tot=chip("EGP 2,400","#fff",s,"position:absolute;left:90px;top:860px;font-size:40px;font-weight:900");pop(tot,t+3);
  const sb=label("SPLIT THE BILL · 2–6 PEOPLE",s,"left:90px;top:820px");rise(sb,t+2.9,{y:20});
  const names=["A","B","C","D"];
  names.forEach((nm,i)=>{const x=480+i*190;
    const av=mk("",nm,s,`position:absolute;left:${x}px;top:850px;width:84px;height:84px;border-radius:50%;background:${i%2?CORAL:TEAL};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:36px`);
    const am=mk("","600",s,`position:absolute;left:${x-6}px;top:945px;width:96px;text-align:center;font-weight:800;font-size:26px;color:#fff`);
    pop(av,t+3.4+i*.2);rise(am,t+3.8+i*.2,{y:20});
    const coin=mk("","",s,`position:absolute;left:300px;top:880px;width:26px;height:26px;border-radius:50%;background:#ffd166`);
    tl.fromTo(coin,{opacity:1,x:0,y:0},{x:x-290,y:-6,opacity:0,duration:.6,ease:"power2.inOut"},t+3.5+i*.2);sfx("pop",t+3.5+i*.2,.25);
  });
  const c1=chip("5% service fee · visible",TEAL,s,"position:absolute;right:90px;top:830px;");pop(c1,t+4.1);
  const c2=chip("Resale ≤ 120% · new QR",CORAL,s,"position:absolute;right:90px;top:910px;");pop(c2,t+4.4);
  const c3=chip("No card data · DEMO","#fff",s,"position:absolute;right:90px;top:990px;");pop(c3,t+4.7);
})();

/* ============ S5 live show ============ */
(function(){
  const s=scene(5,true);const t=24.45;
  label("FEATURE 03 / 05 · LIVE SHOW · SSE",s,"right:90px;top:90px");
  const h=mk("hd","الجمهور <em>يشارك</em> في العرض",s,"position:absolute;right:90px;top:130px;width:1400px;font-size:80px;left:auto");rise(h,t+.2);
  const stage=mk("",null,s,"position:absolute;inset:0;perspective:2400px");
  const fx=60,fy=330,fw=1120,fh=630;
  const frame=mk("",null,stage,`position:absolute;left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px;border-radius:22px;overflow:hidden;background:#000;box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 1.5px rgba(255,255,255,.14)`);
  const names=[["vote",0],["winner",2.0],["camel",3.5],["end2",4.8]];
  names.forEach(([n,a],i)=>{const e=mk("",`<img src="assets/img/${n}.jpg" style="width:100%;height:100%;object-fit:cover">`,frame,"position:absolute;inset:0;"+(i?"opacity:0":""));
    if(i){tl.fromTo(e,{opacity:0,x:60},{opacity:1,x:0,duration:.5,ease:"power2.out"},t+.6+a);}
    if(i<3)tl.set(e,{opacity:0},t+.6+names[i+1][1]+.55);});
  gsap.set(frame,{rotationY:8,rotationX:2,transformPerspective:2400});
  tl.fromTo(frame,{opacity:0,x:-200,rotationY:26},{opacity:1,x:0,rotationY:8,duration:.9,ease:"power3.out"},t+.5);
  tl.to(frame,{rotationY:2,duration:5,ease:"sine.inOut"},t+1.4);
  // timer ring
  const tr=mk("",`<svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="55" fill="rgba(5,15,18,.8)" stroke="rgba(255,255,255,.15)" stroke-width="9"/><circle id="vr" cx="65" cy="65" r="55" fill="none" stroke="${CORAL}" stroke-width="9" stroke-linecap="round" stroke-dasharray="346" transform="rotate(-90 65 65)"/><text id="vt" x="65" y="78" font-family="IN" font-weight="900" font-size="40" fill="#fff" text-anchor="middle">15s</text></svg>`,s,`position:absolute;left:${fx+fw-95}px;top:${fy-50}px`);
  pop(tr,t+1);const tc={v:15};tl.to(tc,{v:0,duration:2,ease:"none",onUpdate:()=>{document.getElementById("vt").textContent=Math.ceil(tc.v)+"s"}},t+.7);tl.to("#vr",{strokeDashoffset:346,duration:2,ease:"none"},t+.7);
  // phones
  const p1=phone("pv1",1260,330,250,stage);const p2=phone("pv2",1550,400,250,stage);
  [p1,p2].forEach((p,i)=>{tl.fromTo(p,{opacity:0,y:240,rotation:i?8:-8},{opacity:1,y:0,rotation:i?3:-3,duration:.9,ease:"back.out(1.3)"},t+1.2+i*.3);tl.to(p,{y:-14,duration:1.3,yoyo:true,repeat:3,ease:"sine.inOut"},t+2.2+i*.2);sfx("pop",t+1.3+i*.3,.4)});
  // confetti on winner
  const cols=[TEAL,CORAL,"#ffd166","#fff","#7aa7ff"];
  for(let i=0;i<46;i++){const e=mk("","",s,`position:absolute;left:${fx+rnd()*fw}px;top:${fy+10}px;width:${8+rnd()*10}px;height:${14+rnd()*14}px;background:${cols[i%5]};opacity:0;border-radius:2px`);
    const a=t+2.6+rnd()*.5;
    tl.fromTo(e,{opacity:1,y:0,rotation:0},{y:240+rnd()*350,x:(rnd()-.5)*220,rotation:rnd()*720-360,opacity:0,duration:1.5+rnd(),ease:"power1.in"},a);}
  sfx("chime",t+2.6,.5);sfx("pop",t+2.6,.6);
  // stage chips
  const row=mk("",null,s,"position:absolute;left:60px;top:240px;display:flex;gap:16px");
  const ch=[["Song voting",TEAL,0.6],["Stand-up audience input",CORAL,4.1],["Alternative endings",TEAL,5.4]];
  ch.forEach(([tx,c,a],i)=>{const e=chip(tx,c,row,"",true);pop(e,t+.5+i*.2,{y:20});
    tl.to(e,{background:"#fff",color:"#0b1d22",duration:.25},t+a);
    if(i<2)tl.to(e,{background:"rgba(255,255,255,.07)",color:"#fff",duration:.25},t+ch[i+1][2]);});
  const sh=chip("AR/EN profanity filter",CORAL,s,"position:absolute;left:300px;top:1000px");sh.style.top="990px";sh.style.left="60px";pop(sh,t+4.1);sfx("pop",t+4.1,.5);
  const sh2=chip("1 vote / account · device",TEAL,s,"position:absolute;left:500px;top:990px");pop(sh2,t+2.0);
})();

/* ============ S6 feature toggles ============ */
(function(){
  const s=scene(6,false);const t=30.45;
  label("FEATURE 04 / 05 · ADMIN FEATURE TOGGLES",s,"right:90px;top:90px");
  const h=mk("hd","مفاتيح <em>تشغيل</em> لكل ميزة",s,"position:absolute;right:90px;top:130px;width:1400px;font-size:80px;left:auto");rise(h,t+.2);
  const stage=mk("",null,s,"position:absolute;inset:0;perspective:2200px");
  const f=bf("feats",70,300,930,stage,"tixbazaar.demo/admin/features");gsap.set(f,{rotationY:10,rotationX:2});
  tl.fromTo(f,{opacity:0,x:-200,rotationY:30},{opacity:1,x:0,rotationY:10,duration:.9,ease:"power3.out"},t+.4);
  tl.to(f,{scale:1.06,transformOrigin:"20% 30%",duration:3,ease:"sine.inOut"},t+1.2);
  const rows=[["Dynamic pricing  +10% → +25%",.5],["Resale marketplace  ≤120%",.95],["Split bill  2–6",1.4],["Waitlists",1.85],["Live voting · Endings",2.3]];
  rows.forEach((r,i)=>{const e=mk("trow",`<span>${r[0]}</span><div class="sw" id="sw${i}"></div>`,s,`left:1290px;top:${290+i*100}px;width:560px`);
    slide(e,t+r[1],300,{d:.6});
    tl.to("#sw"+i,{background:TEAL,duration:.2},t+r[1]+.7);
    tl.to(`#sw${i}`,{"--x":1,duration:.01},t+r[1]+.7);
    sfx("pop",t+r[1]+.72,.45);
  });
  // knob animate: use ::after unsupported; add real knob
  rows.forEach((r,i)=>{const k=mk("","",document.getElementById("sw"+i),"position:absolute;left:5px;top:5px;width:42px;height:42px;border-radius:50%;background:#fff;z-index:2;box-shadow:0 2px 6px rgba(0,0,0,.3)");tl.to(k,{x:44,duration:.25,ease:"back.out(2)"},t+r[1]+.7)});
  const badge=chip("demand +25%",CORAL,s,"position:absolute;left:1290px;top:810px");pop(badge,t+2.7);
  const aud=mk("bf",`<img src="assets/img/audit.jpg" style="display:block;width:100%">`,s,"left:1290px;top:870px;width:380px;height:160px;overflow:hidden");
  aud.firstChild.style.cssText="display:block;width:100%;object-fit:cover;object-position:0 15%;height:100%";
  tl.fromTo(aud,{opacity:0,y:100},{opacity:1,y:0,duration:.7,ease:"power3.out"},t+2.4);
  const lg=chip("Every action logged","#fff",s,"position:absolute;left:1700px;top:915px;font-size:24px;padding:10px 20px 10px 14px");lg.style.left="1690px";lg.style.top="930px";lg.style.fontSize="22px";pop(lg,t+3.0);
  const c1=chip("Instant · site-wide",TEAL,s,"position:absolute;left:90px;top:970px");pop(c1,t+1.2);
  const c2=chip("Audit-logged",CORAL,s,"position:absolute;left:480px;top:970px");pop(c2,t+1.5);
})();

/* ============ S7 organizer ============ */
(function(){
  const s=scene(7,true);const t=34.45;
  label("FEATURE 05 / 05 · ORGANIZER DASHBOARD",s,"right:90px;top:90px");
  const h=mk("hd","ابنِ <em>قاعتك</em> في دقائق",s,"position:absolute;right:90px;top:130px;width:1400px;font-size:80px;left:auto");rise(h,t+.2);
  const stage=mk("",null,s,"position:absolute;inset:0;perspective:2200px");
  const fr=[["dash",70,330,560,12],["editor",650,380,560,0],["checkin",1230,330,560,-12]];
  const F=[];
  fr.forEach((f,i)=>{const e=bf(f[0]==="editor"?"builder":f[0],f[1],f[2],f[3],stage,"tixbazaar.demo/admin");gsap.set(e,{rotationY:f[4]});F.push(e);
    const a=t+.6+i*.5;tl.fromTo(e,{opacity:0,y:200,scale:.7},{opacity:1,y:0,scale:1,duration:.8,ease:"back.out(1.4)"},a);sfx("pop",a+.1,.5);
    tl.to(e,{y:-10,duration:1.2,yoyo:true,repeat:1,ease:"sine.inOut"},a+.9);});
  [["Overview · sales","dash"],["Seat-map builder","b"],["QR check-in · rejects duplicates","c"]].forEach((c,i)=>{const e=chip(c[0],i%2?CORAL:TEAL,s,`position:absolute;left:${[130,740,1250][i]}px;top:${[330+403+30,380+403+30,330+403+30][i]}px;font-size:24px`);pop(e,t+1.5+i*.4);tl.to(e,{opacity:0,y:40,duration:.4},t+3.0)});
  [...F].forEach(e=>tl.to(e,{opacity:0,scale:.6,y:-120,duration:.5,ease:"power2.in"},t+3.0));
  // coverflow
  const T=["t1","t2","t3","t4","t5"];
  const cf=mk("",null,s,"position:absolute;left:0;top:300px;width:1920px;height:640px;perspective:2200px");
  const ring=mk("",null,cf,"position:absolute;left:50%;top:60px;width:0;height:0;transform-style:preserve-3d");
  const R=620;
  T.forEach((n,i)=>{const e=mk("",`<img src="assets/img/${n}.jpg" style="width:100%;height:100%;object-fit:cover;display:block">`,ring,`position:absolute;left:-260px;top:0;width:520px;height:457px;border-radius:22px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.6);border:3px solid rgba(255,255,255,.2);backface-visibility:hidden`);
    gsap.set(e,{rotationY:i*60,z:R,transformOrigin:`50% 50% ${-R}px`});});
  gsap.set(ring,{z:-R,rotationY:0});
  tl.fromTo(cf,{opacity:0,y:100},{opacity:1,y:0,duration:.7,ease:"power3.out"},t+3.3);
  tl.to(ring,{rotationY:-240,duration:2.6,ease:"power2.inOut"},t+3.6);
  for(let i=0;i<4;i++)sfx("pop",t+3.9+i*.5,.3);
  const c1=chip("5 hall templates · live 2D/3D preview",TEAL,s,"position:absolute;left:50%;top:960px;transform:translateX(-50%)");pop(c1,t+4.0);
  gsap.set(c1,{xPercent:-50,x:0});c1.style.transform="";c1.style.left="50%";
  const lt=["Flat · 312","Stadium","Cabaret","Arena","Theatre"];
})();

/* ============ S8 stats ============ */
(function(){
  const s=scene(8,false);const t=40.45;
  label("BUILT FOR REAL EVENTS",s,"right:90px;top:90px");
  const h=mk("hd","كل ده في <em>منصة واحدة</em>",s,"position:absolute;right:90px;top:130px;width:1400px;font-size:80px;left:auto");rise(h,t+.2);
  const data=[["3","Roles · User / Organizer / Admin",TEAL],["AR·EN","Full RTL · bilingual",CORAL],["5:00","Server-side seat hold",TEAL],["SSE","Real-time live show",CORAL],["3D","three.js · 360°",CORAL],["120%","Resale price cap",TEAL],["2–6","Split the bill",CORAL],["100%","Audit logged",TEAL]];
  data.forEach((d,i)=>{const x=115+(i%4)*430,y=320+Math.floor(i/4)*270;
    const e=mk("tile",`<div class="v" style="color:${d[2]}">${d[0]}</div><div class="k">${d[1]}</div>`,s,`left:${x}px;top:${y}px`);
    tl.fromTo(e,{opacity:0,scale:.5,rotationX:80,y:60},{opacity:1,scale:1,rotationX:0,y:0,duration:.6,ease:"back.out(1.6)"},t+.5+i*.14);sfx("pop",t+.55+i*.14,.3);});
  const mq=mk("",null,s,"position:absolute;left:0;top:890px;height:90px;white-space:nowrap;display:flex;gap:18px;align-items:center");
  const items=["Gift tickets","Loyalty points","Apple / Google Wallet","Discount coupons","Group bookings","VIP upsells","Ticket transfer","Referral rewards","Event recommendations","Post-event reviews"];
  const lb=label("COMING NEXT →",s,"left:115px;top:850px");rise(lb,t+1.8,{y:20});
  items.concat(items).forEach((it,i)=>chip(it,i%2?CORAL:TEAL,mq,"font-size:26px"));
  tl.fromTo(mq,{x:0,opacity:0},{x:-1900,opacity:1,duration:4.5,ease:"none"},t+1.6);
  tl.fromTo(mq,{opacity:0},{opacity:1,duration:.4},t+1.6);
})();

/* ============ S9 closing ============ */
(function(){
  const s=scene(9,true);const t=44.45;
  for(let i=0;i<36;i++){const d=mk("seat","",s,`left:${rnd()*1900}px;top:${rnd()*1050}px;width:12px;height:12px;border-radius:4px;background:${rnd()>.5?"rgba(25,183,163,.6)":"rgba(255,106,87,.55)"}`);
    tl.fromTo(d,{opacity:0,y:60},{opacity:1,y:-120,duration:3+rnd()*2,ease:"sine.out"},t+rnd());}
  const tk=mk("",ticketSVG(200),s,"position:absolute;left:50%;top:150px;margin-left:-100px;line-height:0");gsap.set(tk,{transformPerspective:900});
  tl.fromTo(tk,{opacity:0,scale:.2,rotationY:180},{opacity:1,scale:1,rotationY:0,duration:.9,ease:"back.out(1.6)"},t+.3);sfx("pop",t+.6,.7);
  const wm=wordmark(230,s,"position:absolute;left:0;right:0;top:360px;text-align:center");
  rise(wm,t+.8);
  const hd=mk("hd","تجربة حجز <em>تستحق</em> العرض",s,"position:absolute;left:0;right:0;top:620px;text-align:center;font-size:86px;direction:rtl");rise(hd,t+1.4);
  const row=mk("",null,s,"position:absolute;left:0;right:0;top:790px;display:flex;justify-content:center;gap:16px;direction:ltr");
  [["3D · 360°",TEAL],["5:00 Hold",CORAL],["Live Show",TEAL],["Feature Toggles",CORAL],["Organizer Studio",TEAL]].forEach((c,i)=>{const e=chip(c[0],c[1],row,"font-size:26px",true);pop(e,t+2+i*.15,{y:30})});
  const by=mk("","<span style='color:#8fb0ad'>Built by</span> <b style='color:#fff'>goat 31</b> <span style='color:#8fb0ad'>· London</span>",s,"position:absolute;left:0;right:0;top:920px;text-align:center;font-size:34px;font-weight:600");rise(by,t+2.9,{y:20});
  const dm=mk("","DEMO · fictional events &amp; simulated payments · no card data",s,"position:absolute;left:0;right:0;top:1000px;text-align:center;font-size:22px;letter-spacing:2px;color:#6f8f8c");rise(dm,t+3.2,{y:10});
  sfx("chime",t+1.5,.6);
})();
window.__timelines=window.__timelines||{};window.__timelines["main"]=tl;
