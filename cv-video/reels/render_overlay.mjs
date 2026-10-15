import {chromium} from 'playwright';import fs from 'fs';import path from 'path';
const cfg=JSON.parse(fs.readFileSync(process.argv[2]));const out=process.argv[3];fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+path.resolve('overlay.html'));await p.evaluate(()=>document.fonts.ready);
const tot=await p.evaluate(c=>init(c),cfg);const n=Math.round(tot*30);
for(let i=0;i<n;i++){await p.evaluate(t=>seek(t),i/30);await p.screenshot({path:`${out}/${String(i).padStart(5,'0')}.png`,omitBackground:true})}
console.log(JSON.stringify({tot,n,TT:cfg.title||1.6}));await b.close();
