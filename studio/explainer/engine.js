
const HANDLE = window.HANDLE || "";
const D = window.DURATION, TL = window.TIMELINE, ENV = window.ENV, FPS = window.FPS;
const ICON_EXTRA = window.ICONX || {};
document.getElementById("stage").dataset.duration = D;
document.getElementById("handle").textContent = HANDLE;

const ICON = {
  sheets:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  gmail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  slack:'<path d="M9 3L7 21M17 3l-2 18M4 9h17M3 15h17"/>',
  drive:'<path d="M12 4l9 15H3z"/><path d="M12 4L7.5 12M12 4l4.5 8"/>',
  database:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',
  plug:'<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>',
  spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
};
Object.assign(ICON, window.ICONX || {});
const ic = (n, s=26, c="currentColor", w=1.8) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const el = (cls, html, css, parent) => { const d=document.createElement("div"); d.className=cls; d.innerHTML=html||""; if(css) d.style.cssText=css; if(parent) parent.appendChild(d); return d; };
const hlText = s => s.replace(/\{([^}]+)\}/g, '<span class="hl">$1</span>');

/* ---------- illustrations: each returns a gsap timeline ---------- */
const ILL = {
  timer(r) {
    const c = el("card","",`left:130px;top:30px;width:460px;height:250px;`,r);
    c.innerHTML = `<div class="mono" style="padding:14px 20px;font-size:12px;color:#9a9486;display:flex;justify-content:space-between"><span>// timer</span><span>slide 01</span></div>
      <div class="mono" id="tm" style="text-align:center;font-size:84px;font-weight:700;color:#17150f;margin-top:22px;letter-spacing:-.02em">01:30</div>
      <div style="display:flex;justify-content:center;gap:18px;margin-top:10px"><span class="pill" style="background:#17150f;color:#c6f03a">API</span><span class="pill" style="background:#e8452c;color:#fff">MCP</span></div>`;
    const tm = c.querySelector("#tm"), o={v:90};
    return gsap.timeline().from(c,{y:40,opacity:0,scale:.92,duration:.6,ease:"back.out(1.6)"})
      .to(o,{v:62,duration:3.5,ease:"none",onUpdate(){const s=Math.round(o.v);tm.textContent=String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");}},0.2);
  },
  trend(r) {
    const tl = gsap.timeline(); const bars=[60,95,80,140,190,250];
    const base=el("","",`position:absolute;left:150px;top:300px;width:420px;height:2px;background:#cfc7b8`,r);
    bars.forEach((h,i)=>{ const b=el("",'',`position:absolute;left:${160+i*66}px;top:${300-h}px;width:44px;height:${h}px;border-radius:8px 8px 0 0;background:${i>=4?'#e8452c':'#17150f'}`,r); b.style.transformOrigin="50% 100%"; tl.from(b,{scaleY:0,duration:.55,ease:"power3.out"},i*.18); });
    const chip=el("chip w","AI",`left:430px;top:10px;`,r); tl.from(chip,{scale:0,duration:.4,ease:"back.out(2)"},1.3);
    return tl;
  },
  apps(r, alt) {
    const tl = gsap.timeline();
    const a=el("card",`<div class="lbl rtl" style="top:92px;font-size:24px;font-weight:700;color:#17150f">برنامج</div>`,`left:40px;top:90px;width:210px;height:150px;`,r);
    const b=el("card",`<div class="lbl rtl" style="top:92px;font-size:24px;font-weight:700;color:#17150f">برنامج تاني</div>`,`left:470px;top:90px;width:210px;height:150px;`,r);
    [a,b].forEach(x=>{ x.insertAdjacentHTML("afterbegin",`<div style="position:absolute;left:16px;top:14px;display:flex;gap:6px"><i style="width:9px;height:9px;border-radius:50%;background:#ff5f57"></i><i style="width:9px;height:9px;border-radius:50%;background:#febc2e"></i><i style="width:9px;height:9px;border-radius:50%;background:#28c840"></i></div><div style="position:absolute;left:18px;top:40px;width:120px;height:8px;border-radius:4px;background:#e4ded2"></div><div style="position:absolute;left:18px;top:58px;width:80px;height:8px;border-radius:4px;background:#ece7df"></div>`); });
    const line=el("","",`position:absolute;left:250px;top:164px;width:220px;height:0;border-top:3px dashed #e8452c`,r);
    const pill=el("chip","",`left:292px;top:138px;height:50px;background:#0b0c0b;color:#fff;border-radius:999px;font:700 20px/50px "Mono",monospace;`,r); pill.textContent = alt? "مترجم":"API"; if(alt){pill.style.fontFamily='Plex';}
    tl.from(a,{x:-60,opacity:0,duration:.5,ease:"power3.out"}).from(b,{x:60,opacity:0,duration:.5,ease:"power3.out"},0).from(line,{scaleX:0,duration:.5},0.4).from(pill,{scale:0,duration:.4,ease:"back.out(2)"},.7);
    const dot=el("","",`position:absolute;left:246px;top:158px;width:14px;height:14px;border-radius:50%;background:#e8452c`,r);
    tl.fromTo(dot,{x:0},{x:216,duration:1.1,ease:"none",repeat:3,yoyo:true},0.9);
    return tl;
  },
  apps2(r){ return ILL.apps(r,true); },
  tools(r) {
    const tl = gsap.timeline(); const t=[["sheets","sheets"],["gmail","gmail"],["calendar","calendar"],["slack","slack"],["drive","drive"],["database","database"]];
    t.forEach(([i,n],k)=>{ const x=70+(k%3)*195, y=60+Math.floor(k/3)*150;
      const d=el("tile",`${ic(i,34,"#e9e7de")}<div class="lbl" style="top:78px;color:#8d9186">${n}</div><i style="position:absolute;right:12px;top:12px;width:12px;height:5px;border-radius:3px;background:#c6f03a"></i>`,`left:${x}px;top:${y}px;width:170px;height:122px;display:flex;align-items:flex-start;justify-content:center;padding-top:24px;box-sizing:border-box;`,r);
      tl.from(d,{y:30,opacity:0,scale:.9,duration:.45,ease:"back.out(1.7)"},k*.12); });
    return tl;
  },
  plugs(r) {
    const tl=gsap.timeline(); const shapes=[
      '<rect x="14" y="14" width="30" height="30" rx="4" fill="#e8452c"/>',
      '<path d="M29 12L47 46H11z" fill="#e8452c"/>',
      '<circle cx="29" cy="29" r="17" fill="#e8452c"/>'];
    shapes.forEach((s,i)=>{ const d=el("tile",`${ic("phone",64,"#e9e7de",1.4)}<svg width="58" height="58" viewBox="0 0 58 58" style="position:absolute;left:61px;top:104px">${s}</svg>`,`left:${60+i*210}px;top:50px;width:186px;height:190px;display:flex;justify-content:center;padding-top:22px;box-sizing:border-box;`,r); tl.from(d,{y:40,opacity:0,duration:.5,ease:"power3.out"},i*.2); });
    const p=el("pill","≠ كلهم مختلفين",`left:250px;top:268px;background:#e8452c;color:#fff;font-family:Plex;`,r); tl.from(p,{scale:0,duration:.4,ease:"back.out(2)"},1.2);
    return tl;
  },
  code(r) {
    const tl=gsap.timeline(); const c=el("code",`<div class="bar"><span>integrations.js</span><span style="color:#e8452c">code ×3</span></div><pre><span class="c-fn">connect</span>(email, <span class="c-a">circle_plug</span>)\n<span class="c-fn">connect</span>(files, <span class="c-a">triangle_plug</span>)\n<span class="c-fn">connect</span>(data,  <span class="c-a">square_plug</span>)<span style="color:#e8452c">▌</span></pre>`,"",r);
    tl.from(c,{y:40,opacity:0,duration:.5,ease:"power3.out"}); return tl;
  },
  codeerr(r) {
    const tl=gsap.timeline(); const c=el("code",`<div class="bar"><span>integrations.js</span><span style="color:#ff6a50">update v2.0 ✕</span></div><pre><span class="c-r">Error:</span> connect() is not a function\n<span class="c-fn">connect</span>(email, <span class="c-r">circle_plug</span>)\n<span style="color:#7d8087">// needs rewrite from scratch</span></pre>`,"",r);
    const x=el("","<svg width='96' height='96' viewBox='0 0 96 96'><circle cx='48' cy='48' r='44' fill='#e8452c'/><path d='M32 32l32 32M64 32L32 64' stroke='#fff' stroke-width='9' stroke-linecap='round'/></svg>",`position:absolute;left:310px;top:240px`,r);
    tl.from(c,{x:-40,opacity:0,duration:.5}).from(x,{scale:0,rotation:-60,duration:.5,ease:"back.out(2.4)"},1.0).to(c,{x:"+=6",duration:.05,repeat:5,yoyo:true},1.0); return tl;
  },
  mcp(r) {
    const tl=gsap.timeline(); const a=el("chip w",ic("spark",22,"#e8452c")+" AI",`left:150px;top:90px;display:flex;align-items:center;gap:8px;`,r), b=el("chip b","MCP",`left:370px;top:90px;font-size:30px;`,r);
    const halo=el("","",`position:absolute;left:330px;top:40px;width:200px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(198,240,58,.5),transparent 68%)`,r);
    tl.from(a,{x:-80,opacity:0,duration:.5,ease:"power3.out"}).from(b,{scale:0,duration:.6,ease:"back.out(2.4)"},.4).from(halo,{opacity:0,scale:.3,duration:.8},.5).to(halo,{scale:1.2,opacity:.6,duration:1,repeat:5,yoyo:true},1.2);
    return tl;
  },
  oneplug(r) {
    const tl=gsap.timeline(); const a=el("chip w",ic("spark",22,"#e8452c")+" AI",`left:70px;top:130px;display:flex;align-items:center;gap:8px;`,r), b=el("chip b","MCP",`left:520px;top:130px;font-size:28px;`,r);
    const ln=el("","",`position:absolute;left:190px;top:154px;width:330px;height:3px;background:#c6f03a`,r);
    const pg=el("","",`position:absolute;left:310px;top:80px;width:90px;height:150px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#0b0c0b;border:1px solid #c6f03a;color:#c6f03a`,r); pg.innerHTML=ic("plug",50,"#c6f03a",1.6);
    tl.from(a,{x:-60,opacity:0,duration:.45}).from(b,{x:60,opacity:0,duration:.45},0).from(ln,{scaleX:0,transformOrigin:"0 50%",duration:.6},.4).from(pg,{scale:0,duration:.5,ease:"back.out(2.4)"},.8); return tl;
  },
  hub(r) {
    const tl=gsap.timeline(); const t=["sheets","gmail","calendar","slack","drive","database"];
    const ctr=el("","",`position:absolute;left:310px;top:140px;width:100px;height:100px;border-radius:50%;background:#c6f03a;display:flex;align-items:center;justify-content:center;font:800 30px Inter;color:#0b0c0b;box-shadow:0 0 60px rgba(198,240,58,.6)`,r); ctr.textContent="AI";
    tl.from(ctr,{scale:0,duration:.5,ease:"back.out(2)"});
    t.forEach((n,i)=>{ const ang=(-90+i*60)*Math.PI/180, cx=360+Math.cos(ang)*(i%3===1||i%3===2?250:240)*(i===0||i===3?0.01:1)+0, cy=190+Math.sin(ang)*150;
      const x=360+Math.cos(ang)*250, y=190+Math.sin(ang)*158;
      const ln=el("","",`position:absolute;left:360px;top:190px;width:${Math.hypot(x-360,(y-190))}px;height:2px;background:linear-gradient(90deg,#c6f03a,rgba(198,240,58,.1));transform-origin:0 50%;transform:rotate(${Math.atan2(y-190,x-360)}rad)`,r);
      const d=el("tile",ic(n,28,"#e9e7de"),`left:${x-30}px;top:${y-30}px;width:60px;height:60px;display:flex;align-items:center;justify-content:center;`,r);
      tl.from(ln,{scaleX:0,duration:.4},.3+i*.12).from(d,{scale:0,duration:.4,ease:"back.out(2)"},.4+i*.12); });
    return tl;
  },
  nope(r) {
    const tl=gsap.timeline(); const a=el("chip b","MCP",`left:150px;top:100px;font-size:30px;`,r), b=el("chip w","API",`left:440px;top:100px;font-size:30px;`,r);
    const x=el("","<svg width='110' height='110' viewBox='0 0 96 96'><circle cx='48' cy='48' r='44' fill='#e8452c'/><path d='M32 32l32 32M64 32L32 64' stroke='#fff' stroke-width='9' stroke-linecap='round'/></svg>",`position:absolute;left:305px;top:70px`,r);
    tl.from(a,{x:-60,opacity:0,duration:.45}).from(b,{x:60,opacity:0,duration:.45},0).from(x,{scale:0,rotation:-80,duration:.55,ease:"back.out(2.6)"},1.2); return tl;
  },
  layers(r) {
    const tl=gsap.timeline(); const L=[["AI","#ffffff","#0b0c0b",30],["MCP layer","#c6f03a","#0b0c0b",150],["API","#2a2d29","#e9e7de",270]];
    L.forEach(([t,bg,fg,y],i)=>{ const d=el("",t,`position:absolute;left:${130+i*0}px;top:${y-30}px;width:460px;height:100px;border-radius:18px;background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;font:800 32px Inter;transform:skewX(-8deg)`,r); tl.from(d,{y:-60,opacity:0,duration:.5,ease:"power3.out"},(2-i)*.35); });
    return tl;
  },
  radar(r) {
    const tl=gsap.timeline(); const rings=[300,210,120].map((s,i)=>el("","",`position:absolute;left:${360-s/2}px;top:${190-s/2*0.8}px;width:${s}px;height:${s*0.8}px;border-radius:50%;border:1.5px solid rgba(198,240,58,${.18+i*.12})`,r));
    rings.forEach((x,i)=>tl.from(x,{scale:.2,opacity:0,duration:.6,ease:"power2.out"},i*.2));
    const a=el("chip w",ic("spark",22,"#e8452c")+" AI",`left:90px;top:80px;display:flex;align-items:center;gap:8px;`,r), m=el("chip b","MCP",`left:500px;top:90px;font-size:28px;`,r), app=el("tile","التطبيق بتاعك",`left:260px;top:240px;width:200px;height:54px;line-height:54px;text-align:center;font:700 20px/54px Plex;direction:rtl`,r);
    tl.from(a,{scale:0,duration:.4,ease:"back.out(2)"},.6).from(m,{scale:0,duration:.4,ease:"back.out(2)"},.8).from(app,{y:30,opacity:0,duration:.4},1.0);
    tl.to(rings,{opacity:.35,scale:1.04,duration:.9,repeat:7,yoyo:true,stagger:.15},1.2); return tl;
  },
  plugin(r) {
    const tl=gsap.timeline(); const c=el("code",`<div class="bar"><span>read_files.js</span><span>200 lines</span></div><pre style="opacity:.55"><span class="c-fn">parse</span>(path)\n<span class="c-fn">auth</span>(token)\n<span class="c-fn">read</span>(stream)</pre>`,`left:40px;top:50px;width:330px;height:210px;font-size:18px`,r);
    const ln=el("","",`position:absolute;left:60px;top:166px;width:290px;height:4px;background:#e8452c;transform:rotate(-8deg)`,r);
    const arr=el("","→",`position:absolute;left:386px;top:122px;font:700 44px Inter;color:#17150f`,r);
    const m=el("chip b","MCP "+"",`left:450px;top:112px;font-size:30px;`,r);
    tl.from(c,{x:-40,opacity:0,duration:.5}).from(ln,{scaleX:0,transformOrigin:"0 50%",duration:.4},.7).from(arr,{x:-20,opacity:0,duration:.3},1.0).from(m,{scale:0,duration:.5,ease:"back.out(2.4)"},1.3); return tl;
  },
  actions(r) {
    const tl=gsap.timeline(); const rows=[["calendar","calendar","يحجز ميعاد"],["slack","slack","يبعت رسالة"],["database","database","يسحب تقرير"]];
    rows.forEach(([i,n,t],k)=>{ const d=el("tile",`<div style="position:absolute;left:20px;top:17px">${ic(i,26,"#e9e7de")}</div><div class="mono" style="position:absolute;left:62px;top:22px;font-size:15px;color:#8d9186">${n}</div><div class="rtl" style="position:absolute;right:72px;top:11px;font:700 24px/38px Plex;color:#f4f1e8;direction:rtl">${t}</div><div style="position:absolute;right:16px;top:14px;width:32px;height:32px;border-radius:50%;background:#c6f03a;display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0b0c0b" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></div>`,`left:110px;top:${40+k*100}px;width:500px;height:62px;`,r);
      tl.from(d,{x:-60,opacity:0,duration:.45,ease:"power3.out"},k*1.0+.1); });
    return tl;
  },
  charger(r) {
    const tl=gsap.timeline();
    const g=el("","",`position:absolute;left:260px;top:30px;width:200px;height:300px`,r);
    g.innerHTML=`<svg width="200" height="300" viewBox="0 0 200 300" fill="none"><rect x="60" y="20" width="80" height="90" rx="14" fill="#f4f1e8"/><rect x="82" y="110" width="36" height="34" fill="#9a9a90"/><rect x="72" y="144" width="56" height="22" rx="4" fill="#c6f03a"/><path d="M100 166 C 100 210, 150 210, 150 250" stroke="#f4f1e8" stroke-width="7" stroke-linecap="round"/></svg>`;
    tl.from(g,{y:-80,opacity:0,duration:.6,ease:"bounce.out"}); return tl;
  },
  phones_old(r) { return ILL._phones(r,true); },
  phones_new(r) { return ILL._phones(r,false); },
  _phones(r, old) {
    const tl=gsap.timeline(); const names=old?["نوكيا","سامسونج","آيفون"]:["USB-C","USB-C","USB-C"];
    const shapes=old?['<rect x="10" y="10" width="26" height="26" rx="4" fill="#e8452c"/>','<path d="M23 8L38 38H8z" fill="#e8452c"/>','<circle cx="23" cy="23" r="15" fill="#e8452c"/>']:Array(3).fill('<rect x="2" y="14" width="42" height="18" rx="9" fill="#c6f03a"/>');
    shapes.forEach((s,i)=>{ const d=el("tile",`${ic("phone",70,"#e9e7de",1.4)}<svg width="46" height="46" viewBox="0 0 46 46" style="position:absolute;left:70px;top:112px">${s}</svg>`,`left:${50+i*220}px;top:40px;width:186px;height:170px;display:flex;justify-content:center;padding-top:20px;box-sizing:border-box;`,r); tl.from(d,{y:40,opacity:0,duration:.45,ease:"power3.out"},i*.2); });
    const p=el("pill",old?"= API":"= MCP",`left:${old?250:250}px;top:238px;background:${old?'#e8452c':'#c6f03a'};color:${old?'#fff':'#0b0c0b'};`,r), q=el("pill",old?"الأول":"USB Type-C",`left:${old?330:340}px;top:238px;background:#fff;color:#0b0c0b;font-family:${old?'Plex':'Mono'};`,r);
    tl.from([p,q],{scale:0,duration:.4,ease:"back.out(2)",stagger:.15},.9); return tl;
  },
  follow(r) {
    const tl=gsap.timeline(); const c=el("card","",`left:110px;top:40px;width:500px;height:210px;`,r);
    c.innerHTML=`<div class="mono" style="position:absolute;left:18px;top:14px;font-size:12px;color:#9a9486">// follow</div>
      <div style="position:absolute;left:24px;top:48px;width:72px;height:72px;border-radius:50%;overflow:hidden;background:#dfe9f5;border:3px solid #e8452c"><svg viewBox="104 80 192 200" width="100%" height="100%" style="display:block"><use href="#head"/></svg></div>
      <div class="mono" style="position:absolute;left:112px;top:58px;font-size:24px;font-weight:700;color:#17150f">${HANDLE}</div>
      <div class="mono" style="position:absolute;left:112px;top:92px;font-size:13px;color:#9a9486">AI · explained simply</div>
      <div id="fbtn" class="mono" style="position:absolute;left:24px;right:24px;top:140px;height:48px;border-radius:10px;background:#e8452c;color:#fff;text-align:center;font:700 19px/48px Mono,monospace">Follow +</div>`;
    const b=c.querySelector("#fbtn");
    tl.from(c,{y:50,opacity:0,duration:.55,ease:"back.out(1.5)"});
    const o={p:0};
    tl.to(o,{p:1,duration:.2,onUpdate(){ const on=o.p>0.5; b.textContent=on?"Following ✓":"Follow +"; b.style.background=on?"#e8e3d9":"#e8452c"; b.style.color=on?"#17150f":"#fff"; }},3.0);
    return tl;
  },
};

Object.assign(ILL, window.ILLX || {});
/* ---------- build scenes ---------- */
const scenesEl = document.getElementById("scenes");
const master = gsap.timeline({ paused:true });
const scenes = TL.map((b,bi) => {
  const s = el("scene "+b.theme,"","",scenesEl);
  const illEl = el("ill","","",s); const heads = el("heads","","",s);
  master.add(ILL[b.ill](illEl, b.theme), b.start+0.15);
  const chunkEls = b.chunks.map(c => { const h = el("head",hlText(c.show),"",heads);
    master.fromTo(h,{y:34,opacity:0},{y:0,opacity:1,duration:.4,ease:"power3.out",immediateRender:false},c.start);
    const hl=h.querySelectorAll(".hl"); if(hl.length) master.fromTo(hl,{scale:.75},{scale:1,duration:.45,ease:"back.out(2.6)",immediateRender:false},c.start+.12);
    return h; });
  return { s, chunkEls, b };
});


/* ---------- cartoon presenter (flat SVG, driven by voice envelope) ---------- */
const SKIN="#c98a5e", SKIN_D="#a96c46", SKIN_L="#dba273", HAIR="#17100d", BLUE="#2f7fd0", BLUE_D="#2064b3", BLUE_L="#4a95e6";
function curls(cx,cy,rx,ry,a0,a1,n,r,seed){ let o="",x=seed; const rnd=()=>{x=(x*9301+49297)%233280;return x/233280;};
  for(let i=0;i<n;i++){ const a=(a0+(a1-a0)*i/(n-1))*Math.PI/180, j=rnd()*4-2;
    o+=`<circle cx="${(cx+Math.cos(a)*(rx+j)).toFixed(1)}" cy="${(cy+Math.sin(a)*(ry+j)).toFixed(1)}" r="${(r+rnd()*4).toFixed(1)}"/>`; } return o; }
const finger=(x,len,rot)=>`<rect x="${x-4.6}" y="24" width="9.2" height="${len}" rx="4.6" fill="url(#gSkin)" stroke="${SKIN_D}" stroke-opacity=".35" stroke-width="1" transform="rotate(${rot} ${x} 24)"/>`;
const handSVG = `
  <g class="h-open"><rect x="-19" y="-2" width="38" height="38" rx="15" fill="url(#gSkin)"/>
    ${finger(-13.5,30,7)}${finger(-4.5,37,2)}${finger(4.5,35,-3)}${finger(13.5,27,-8)}
    <rect x="-27" y="8" width="10" height="28" rx="5" fill="url(#gSkin)" stroke="${SKIN_D}" stroke-opacity=".35" transform="rotate(38 -22 12)"/></g>
  <g class="h-point"><rect x="-19" y="-2" width="38" height="38" rx="16" fill="url(#gSkin)"/>
    <rect x="-13" y="24" width="9.2" height="42" rx="4.6" fill="url(#gSkin)" stroke="${SKIN_D}" stroke-opacity=".35" transform="rotate(4 -9 24)"/>
    <rect x="-3" y="26" width="22" height="10" rx="5" fill="${SKIN_D}" opacity=".35"/><rect x="-27" y="10" width="10" height="24" rx="5" fill="url(#gSkin)" transform="rotate(34 -22 12)"/></g>
  <g class="h-fist"><rect x="-20" y="-2" width="40" height="42" rx="17" fill="url(#gSkin)"/>
    <path d="M-14 34 H14 M-14 26 H14" stroke="${SKIN_D}" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>
    <rect x="-25" y="-10" width="11" height="40" rx="5.5" fill="url(#gSkin)" transform="rotate(-8 -20 8)"/></g>`;
const armSVG = (id,px,sx) => `<g transform="translate(${px} 404) scale(${sx} 1)"><g id="${id}j"><g id="${id}">
    <rect x="-17" y="24" width="34" height="62" rx="16" fill="url(#gSkin)"/>
    <rect x="-32" y="-22" width="64" height="82" rx="30" fill="url(#gBlue)"/><path d="M-32 44 Q0 54 32 44 L32 58 Q0 68 -32 58 Z" fill="${BLUE_D}" opacity=".55"/>
    <g id="${id}f" transform="translate(0 74)"><rect x="-16" y="-8" width="32" height="92" rx="16" fill="url(#gSkin)"/><circle r="17" fill="url(#gSkin)"/><g id="${id}h" transform="translate(0 80)">${handSVG}</g></g>
  </g></g></g>`;
document.getElementById("pres").innerHTML = `<svg viewBox="0 0 400 620">
  <defs>
    <radialGradient id="gSkin" cx=".42" cy=".38" r=".8"><stop offset="0" stop-color="${SKIN_L}"/><stop offset=".6" stop-color="${SKIN}"/><stop offset="1" stop-color="${SKIN_D}"/></radialGradient>
    <linearGradient id="gBlue" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${BLUE_L}"/><stop offset=".55" stop-color="${BLUE}"/><stop offset="1" stop-color="${BLUE_D}"/></linearGradient>
    <linearGradient id="gMetal" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#eef1f4"/><stop offset="1" stop-color="#8b929b"/></linearGradient>
    <linearGradient id="gNeck" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${SKIN_D}"/><stop offset=".5" stop-color="${SKIN}"/></linearGradient>
    <linearGradient id="gBeard" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3b2a22" stop-opacity=".78"/><stop offset="1" stop-color="#26180f" stop-opacity=".9"/></linearGradient>
  </defs>
  <g id="body">
    <path d="M30 640 L46 452 C50 402 92 362 150 352 L250 352 C308 362 350 402 354 452 L370 640 Z" fill="url(#gBlue)"/>
    <path d="M150 352 C160 400 130 470 118 640 L30 640 L46 452 C50 402 92 362 150 352Z" fill="${BLUE_D}" opacity=".28"/>
    <path d="M250 352 C240 420 262 500 270 640 L370 640 L354 452 C350 402 308 362 250 352Z" fill="${BLUE_D}" opacity=".18"/>
    <path d="M120 470 C150 520 150 580 140 640 M280 470 C250 520 252 580 262 640" stroke="${BLUE_D}" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M156 340 L244 340 L244 352 L156 352Z" fill="${SKIN_D}"/>
    <path id="neck" d="M164 262 L236 262 L240 352 L160 352 Z" fill="url(#gNeck)"/>
    <path d="M154 346 L200 430 L246 346 L236 340 L200 404 L164 340 Z" fill="${BLUE_D}"/>
    <path d="M164 342 L236 342 L200 412 Z" fill="${SKIN}"/>
    <path d="M176 342 L224 342 L200 388 Z" fill="${SKIN_L}" opacity=".35"/>
    <path d="M162 334 C150 392 176 476 208 500" stroke="#15171a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M238 334 C250 392 238 468 216 498" stroke="#15171a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M212 498 C214 520 216 530 216 540" stroke="#15171a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="156" y="326" width="9" height="16" rx="4" fill="url(#gMetal)"/><rect x="235" y="326" width="9" height="16" rx="4" fill="url(#gMetal)"/>
    <circle cx="216" cy="560" r="23" fill="#7d848d"/><circle cx="216" cy="560" r="19" fill="url(#gMetal)"/><circle cx="216" cy="560" r="8" fill="#8b929b"/>
    <rect x="262" y="468" width="58" height="62" rx="9" fill="none" stroke="${BLUE_D}" stroke-opacity=".7" stroke-width="3"/>
    <rect x="296" y="450" width="6" height="30" rx="3" fill="#1a1d21"/><rect x="302" y="448" width="7" height="14" rx="3" fill="#e8e8e8"/>
    <rect x="228" y="364" width="9" height="16" rx="3" fill="#111"/>
    ${armSVG("aL",86,-1)}${armSVG("aR",314,1)}
  </g>
  <g id="head">
   <g id="headin">
    <g fill="${HAIR}" id="hairBack">${curls(200,150,86,78,172,368,24,17,7)}<ellipse cx="200" cy="150" rx="82" ry="70"/></g>
    <g id="ears"><ellipse cx="120" cy="196" rx="14" ry="22" fill="url(#gSkin)"/><ellipse cx="124" cy="198" rx="6" ry="12" fill="${SKIN_D}" opacity=".6"/>
      <ellipse cx="280" cy="196" rx="14" ry="22" fill="url(#gSkin)"/><ellipse cx="276" cy="198" rx="6" ry="12" fill="${SKIN_D}" opacity=".6"/></g>
    <path d="M122 168 C122 114 158 96 200 96 C242 96 278 114 278 168 C278 222 262 262 236 284 C224 294 212 298 200 298 C188 298 176 294 164 284 C138 262 122 222 122 168 Z" fill="url(#gSkin)"/>
    <path d="M130 168 C132 128 162 108 200 108 C238 108 268 128 270 168 C250 142 226 132 200 132 C174 132 150 142 130 168Z" fill="${SKIN_D}" opacity=".30"/>
    <path d="M124 186 C126 238 150 278 200 298 C250 278 274 238 276 186 C272 212 262 236 246 248 C232 242 216 241 200 241 C184 241 168 242 154 248 C138 236 128 212 124 186Z" fill="url(#gBeard)"/>
    <path d="M168 246 C180 238 190 241 200 244 C210 241 220 238 232 246 C220 250 210 248 200 250 C190 248 180 250 168 246Z" fill="#2b1c14" opacity=".9"/>
    <g fill="${HAIR}" id="hairFront">${curls(200,120,68,16,190,350,14,15,19)}</g>
    <path d="M127 170 C125 184 127 196 132 203 C135 199 136 195 136 190 C134 182 134 174 137 168Z M273 170 C275 184 273 196 268 203 C265 199 264 195 264 190 C266 182 266 174 263 168Z" fill="${HAIR}" opacity=".7"/>
    <g fill="#4a362c" opacity=".55"><circle cx="168" cy="92" r="6"/><circle cx="210" cy="86" r="7"/><circle cx="246" cy="98" r="6"/><circle cx="144" cy="108" r="5"/><circle cx="228" cy="110" r="5"/></g>
    <g id="brows" fill="${HAIR}"><path id="bL" d="M141 164 Q165 146 192 156 L191 166 Q166 158 146 174Z"/><path id="bR" d="M259 164 Q235 146 208 156 L209 166 Q234 158 254 174Z"/></g>
    <g id="eyes">
      <g id="eL"><path d="M148 186 Q166 166 186 184 Q168 198 148 186Z" fill="#fff"/><circle id="pL" cx="167" cy="183" r="9" fill="#4b2c1c"/><circle cx="167" cy="183" r="4.5" fill="#150c08"/><circle cx="170" cy="180" r="2.2" fill="#fff"/><path d="M147 186 Q166 164 187 184" stroke="${HAIR}" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>
      <g id="eR"><path d="M214 184 Q234 166 252 186 Q232 198 214 184Z" fill="#fff"/><circle id="pR" cx="233" cy="183" r="9" fill="#4b2c1c"/><circle cx="233" cy="183" r="4.5" fill="#150c08"/><circle cx="236" cy="180" r="2.2" fill="#fff"/><path d="M213 184 Q234 164 253 186" stroke="${HAIR}" stroke-width="3.4" fill="none" stroke-linecap="round"/></g></g>
    <path d="M152 194 Q166 204 182 194 M218 194 Q234 204 248 194" stroke="${SKIN_D}" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M200 176 C198 200 192 214 186 224 C194 234 208 234 216 224 C210 220 206 210 206 198Z" fill="${SKIN_D}" opacity=".45"/>
    <path d="M190 226 Q200 231 210 226" stroke="${SKIN_D}" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="192" cy="226" r="2.2" fill="#6b4126"/><circle cx="208" cy="226" r="2.2" fill="#6b4126"/>
    <ellipse cx="148" cy="226" rx="15" ry="10" fill="#e2805a" opacity=".22"/><ellipse cx="252" cy="226" rx="15" ry="10" fill="#e2805a" opacity=".22"/>
    <path d="M150 238 Q160 246 168 250 M250 238 Q240 246 232 250" stroke="#26180f" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
    <clipPath id="mclip"><path id="mpathC" d=""/></clipPath>
    <path id="mpath" d="" fill="#4a1a1a"/>
    <g clip-path="url(#mclip)"><rect x="160" y="248" width="80" height="14" fill="#fff"/><ellipse id="tongue" cx="200" cy="278" rx="18" ry="9" fill="#d9605f"/></g>
    <path id="mlip" d="" fill="none" stroke="#7a3326" stroke-width="3.2" stroke-linejoin="round"/>
    <ellipse cx="190" cy="236" rx="30" ry="14" fill="#fff" opacity=".06"/>
   </g>
  </g>
</svg>`;
const A = { L:{u:8,f:-18,hand:"idle"}, R:{u:8,f:-18,hand:"idle"} };
const POSE = { // [left, right]: outward arm angle, extra forearm curl, hand
  timer:[["idle"],["point",125,35]], trend:[["idle"],["open",140,10]], apps:[["idle"],["point",112,40]], apps2:[["open",140,10],["idle"]],
  tools:[["open",118,32],["open",118,32]], plugs:[["open",58,78],["open",58,78]], code:[["idle"],["point",118,38]], codeerr:[["open",138,22],["open",138,22]],
  mcp:[["open",152,14],["open",152,14]], oneplug:[["idle"],["point",125,35]], hub:[["open",118,32],["open",118,32]], nope:[["idle"],["open",118,10]],
  layers:[["open",58,78],["open",58,78]], radar:[["open",140,10],["point",112,40]], plugin:[["idle"],["point",120,38]], actions:[["open",118,32],["open",118,32]],
  charger:[["idle"],["point",125,35]], phones_old:[["open",70,70],["open",70,70]], phones_new:[["open",150,14],["open",150,14]], follow:[["idle"],["fist",120,35]] };
const IDLE=["idle",8,-18];
Object.assign(POSE, window.POSEX || {});
TL.forEach(b => { const p=POSE[b.ill]||[["idle"],["idle"]];
  [["L",p[0]],["R",p[1]]].forEach(([k,v]) => { const q=v[0]==="idle"?IDLE:v;
    master.to(A[k],{u:q[1],f:q[2],duration:.55,ease:"power2.inOut"},b.start+0.05); }); });
const $ = id => document.getElementById(id);
const arms={L:{g:$("aL"),j:$("aLj"),f:$("aLf"),h:$("aLh")},R:{g:$("aR"),j:$("aRj"),f:$("aRf"),h:$("aRh")}};
function mouth(o,t){
  const w=27-o*6*(.5+.5*Math.sin(t*17)), top=259, depth=4+o*32, cy=top+depth;
  const d=`M${200-w} ${top} Q200 ${top-5} ${200+w} ${top} Q200 ${cy+7} ${200-w} ${top} Z`;
  $("mpath").setAttribute("d",d); $("mpathC").setAttribute("d",d); $("mlip").setAttribute("d",d);
  $("tongue").setAttribute("cy",String(cy-4));
}
function animateChar(t,bi,e){
  mouth(Math.min(1,e*1.25),t);
  const raise=(()=>{ const b=TL[bi]; let st=b.start; b.chunks.forEach(c=>{ if(c.start<=t) st=c.start; }); return 7*Math.max(0,1-(t-st)/.5); })();
  $("brows").setAttribute("transform",`translate(0 ${-raise-e*2})`);
  const ph=(t%3.4), blink=ph<.14?Math.max(.08,Math.abs(ph-.07)/.07):1;
  $("eyes").setAttribute("transform",`translate(0 ${183*(1-blink)}) scale(1 ${blink})`);
  $("pL").setAttribute("cx",167+Math.sin(t*.7)*3); $("pR").setAttribute("cx",233+Math.sin(t*.7)*3);
  gsap.set($("headin"),{ svgOrigin:"200 320", rotation:Math.sin(t*1.3)*2.2+Math.sin(t*5.1)*e*1.8, y:-e*5, x:Math.sin(t*.9)*3 });
  ["L","R"].forEach((k,i)=>{ const ar=arms[k], p=A[k], b=TL[bi], pose=(POSE[b.ill]||[["idle"],["idle"]])[i], hand=pose[0]==="idle"?"idle":pose[0];
    const raised=p.u>40, wob=raised?Math.sin(t*3+(i?1.7:0))*3.5*(0.5+e):Math.sin(t*1.2+i)*1.5;
    gsap.set(ar.g,{svgOrigin:"0 0",rotation:-p.u}); gsap.set(ar.f,{svgOrigin:"0 0",rotation:-p.f});
    gsap.set(ar.j,{rotation:wob}); 
    ar.h.querySelector(".h-open").style.display=(hand==="open"||hand==="idle")?"":"none";
    ar.h.querySelector(".h-point").style.display=hand==="point"?"":"none";
    ar.h.querySelector(".h-fist").style.display=hand==="fist"?"":"none"; });
}

const bgL=document.getElementById("bgL"), bgD=document.getElementById("bgD"), glow=document.getElementById("glow"), pres=document.getElementById("pres");
const hudL=document.getElementById("hudL"), hudR=document.getElementById("hudR");
const SECS = window.SECS || ["hook","the API","the problem","the MCP","the difference","remember","follow"];
const secIdx = n => Math.max(1,SECS.indexOf(n)+1);

function frame(t) {
  let bi = TL.findIndex((b,i)=> t>=b.start && (i===TL.length-1 || t<TL[i+1].start)); if (bi<0) bi=0;
  const b=TL[bi], prev=TL[Math.max(0,bi-1)], local=t-b.start;
  const dark = b.theme==="dark" ? 1 : 0, pd = prev.theme==="dark" ? 1 : 0;
  const k = bi===0 ? 1 : Math.min(1, local/0.3);
  const dv = pd + (dark-pd)*k;                    // 0..1 dark amount
  bgD.style.opacity = dv; bgL.style.opacity = 1;
  scenes.forEach((x,i)=>{ x.s.style.display = i===bi?"block":"none"; if(i===bi) x.chunkEls.forEach((h,ci)=>{ const c=b.chunks[ci]; h.style.display=(t>=c.start && t<c.end)?"block":"none"; }); });
  const fg = dv>.5 ? "#e9e7de" : "#17150f", ac = dv>.5 ? "#c6f03a" : "#e8452c";
  hudL.innerHTML = `<span style="color:${fg};opacity:.55">SEC</span> <b style="color:${ac}">${String(Math.min(30,Math.round(t/D*30))).padStart(2,"0")}/30</b>`;
  hudR.innerHTML = `<span style="color:${fg}">// 0${secIdx(b.sec)} — ${b.sec}</span>`;
  hudR.style.color = fg; document.getElementById("handle").style.color = fg;
  glow.style.background = dv>.5 ? "radial-gradient(circle,rgba(198,240,58,.55),rgba(198,240,58,0) 68%)" : "radial-gradient(circle,rgba(232,69,44,.35),rgba(232,69,44,0) 68%)";
  const e = ENV[Math.min(ENV.length-1, Math.round(t*FPS))] || 0;
  gsap.set(pres,{ y:Math.sin(t*1.6)*3-e*4, scale:1+e*.01 });
  animateChar(t,bi,e);
  gsap.set(glow,{ scale:1+e*.08 });
}
const px={t:0};
master.to(px,{t:D,duration:D,ease:"none",onUpdate(){ frame(px.t); }},0);
master.eventCallback("onUpdate",()=>frame(px.t));
master.duration(D);
frame(0);
window.__tl = master;
const q = new URLSearchParams(location.search).get("t");
if (q !== null) master.seek(parseFloat(q));
