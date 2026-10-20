import {chromium} from "playwright-core";import http from "http";import fs from "fs";import path from "path";
const root=process.cwd();const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split("?")[0]);if(p=="/")p="/index.html";const f=path.join(root,p);fs.readFile(f,(e,d)=>{if(e){r.statusCode=404;r.end();return}r.setHeader("Content-Type",f.endsWith(".js")||f.endsWith(".mjs")?"text/javascript":f.endsWith(".json")?"application/json":"text/html");r.end(d)})}).listen(8765);
const [w,t0,t1,fps,out]=[+process.argv[2],+process.argv[3],+process.argv[4],+process.argv[5],process.argv[6]];
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--use-angle=swiftshader","--use-gl=angle","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--enable-webgl"]});
const pg=await b.newPage({viewport:{width:w,height:process.env.PT?Math.round(w*16/9):Math.round(w*9/16)}});pg.on("console",m=>console.log("c:",m.text()));pg.on("pageerror",e=>console.log("err",e.message));
await pg.goto("http://localhost:8765/index.html?w="+w+(process.env.PT?"&p=1":""));await pg.waitForFunction("window.ready",null,{timeout:120000});
fs.mkdirSync(out,{recursive:true});let i=0;
for(let t=t0;t<=t1+1e-6;t+=1/fps){await pg.evaluate(t=>window.setT(t),t);const d=await pg.evaluate(()=>document.getElementById("c").toDataURL("image/png"));fs.writeFileSync(`${out}/f${String(i).padStart(4,"0")}.png`,Buffer.from(d.split(",")[1],"base64"));i++;console.log(i,t.toFixed(2));}
await b.close();srv.close();
