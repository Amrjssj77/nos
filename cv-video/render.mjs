import {chromium} from 'playwright';import fs from 'fs';import path from 'path';
const FPS=30,DUR=45,out='frames';fs.mkdirSync(out,{recursive:true});
const only=process.argv[2]?process.argv[2].split(',').map(Number):null;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+path.resolve('index.html'));await p.evaluate(()=>document.fonts.ready);
const times=only||Array.from({length:FPS*DUR},(_,i)=>i/FPS);
for(const [i,t] of times.entries()){await p.evaluate(t=>seek(t),t);
 await p.screenshot({path:only?`${out}/chk_${t}.jpg`:`${out}/f${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:92})}
await b.close();
