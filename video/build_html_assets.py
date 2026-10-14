import json,random,math,re,os,html
from playwright.sync_api import sync_playwright
from cfg import *
from common import *
random.seed(11)
FD=os.path.abspath('fonts/node_modules/@fontsource')
def ff(fam,file,w=400): return f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('file://{FD}/{file}') format('woff2');}}"
FONTS=''.join([ff('Caveat','caveat/files/caveat-latin-700-normal.woff2',700),ff('Marker','permanent-marker/files/permanent-marker-latin-400-normal.woff2'),
 ff('Elite','special-elite/files/special-elite-latin-400-normal.woff2'),ff('Oswald','oswald/files/oswald-latin-700-normal.woff2',700),ff('Playfair','playfair-display/files/playfair-display-latin-900-normal.woff2',900)])
def torn_clip(n_top=16,n_side=8,j=1.6):
    pts=[]
    for i in range(n_top+1): pts.append((100*i/n_top,random.uniform(0,j)))
    for i in range(1,n_side): pts.append((100-random.uniform(0,j),100*i/n_side))
    for i in range(n_top,-1,-1): pts.append((100*i/n_top,100-random.uniform(0,j)))
    for i in range(n_side-1,0,-1): pts.append((random.uniform(0,j),100*i/n_side))
    return 'polygon('+','.join(f'{x:.1f}% {y:.1f}%' for x,y in pts)+')'
def hl(t,cls='hl'):
    t=html.escape(t)
    return re.sub(r'\*(.+?)\*',lambda m:f'<span class="{cls}">{m.group(1)}</span>',t)
CSS=FONTS+"""
html,body{margin:0;background:transparent}
.wrap{display:inline-block;padding:34px;filter:drop-shadow(6px 10px 8px rgba(0,0,0,.55));}
.paper{position:relative;background:#eee3c6 linear-gradient(135deg,rgba(255,255,255,.35),rgba(120,90,40,.12));color:#1b1611;}
.hl{background:linear-gradient(transparent 52%,#ffd23f 52%,#ffd23f 92%,transparent 92%);padding:0 4px}
.tape{position:absolute;width:110px;height:34px;background:rgba(222,200,150,.78);}
.note .paper{font-family:Caveat;font-weight:700;font-size:46px;line-height:1.05;padding:26px 36px 28px;max-width:480px;}
.note .sub{font-size:32px;opacity:.8;margin-top:6px}
.date .paper{background:#d9c299 linear-gradient(135deg,rgba(255,255,255,.25),rgba(90,60,20,.18));font-family:Elite;padding:18px 40px 20px;text-align:center}
.date .big{font-size:76px;letter-spacing:-1px;color:#8a1f14}
.date .sub{font-family:Caveat;font-weight:700;font-size:40px;margin-top:2px}
.big .paper{background:#14100c;color:#f6ecd4;font-family:Marker;font-size:66px;line-height:1.06;padding:26px 44px;text-align:center;max-width:620px}
.big .hl{background:none;color:#ffd23f}
.title .paper{padding:22px 40px 18px;text-align:center}
.title .a{font-family:Marker;font-size:84px;letter-spacing:1px}
.title .b{font-family:Caveat;font-weight:700;font-size:48px;background:#ffd23f;display:inline-block;padding:0 22px;transform:rotate(-1.5deg);margin-top:4px}
.cta .paper{background:#ffd23f;font-family:Marker;font-size:56px;line-height:1.05;padding:30px 46px;text-align:center;color:#111;}
.cta .hl{background:none;color:#a3180f}
"""
def note_html(kind,text):
    clip=torn_clip(); rot=random.uniform(-3,3)
    if kind=='note':
        parts=text.split('|');body=hl(parts[0])+(f'<div class="sub">{hl(parts[1])}</div>' if len(parts)>1 else '')
        inner=f'<div class="paper" style="clip-path:{clip}">{body}</div><div class="tape" style="left:-8px;top:-10px;transform:rotate(-30deg)"></div>'
    elif kind=='date':
        a,b=(text.split('|')+[''])[:2]
        inner=f'<div class="paper" style="clip-path:{clip}"><div class="big">{html.escape(a)}</div><div class="sub">{html.escape(b)}</div></div>'
    elif kind=='big':
        inner=f'<div class="paper" style="clip-path:{clip}">{hl(text)}</div>'
    elif kind=='title':
        a,b=text.split('|')
        inner=f'<div class="paper" style="clip-path:{clip}"><div class="a">{html.escape(a)}</div><div class="b">{html.escape(b)}</div></div>'
    elif kind=='cta':
        a,b=text.split('|')
        inner=f'<div class="paper" style="clip-path:{clip}">{html.escape(a)}<br>{hl(b)}</div>'
    return f'<div class="wrap {kind}" id="el" style="transform:rotate({rot:.1f}deg)">{inner}</div>'
ICONS={
 'crown':'<path d="M30 150 L22 72 L70 112 L100 52 L130 112 L178 72 L170 150 Z M34 170 L166 170"/>',
 'arrow':'<path d="M28 165 C55 70 115 40 168 62"/><path d="M146 36 L170 62 L140 78"/>',
 'circle':'<path d="M100 22 C160 18 188 70 176 118 C162 172 80 186 38 150 C0 112 22 40 90 26 C120 20 150 30 162 44" stroke="#e0392b" stroke-width="9"/>',
 'under':'<path d="M10 120 C50 100 90 140 130 112 C150 98 170 118 192 104" stroke="#e0392b" stroke-width="10"/>',
 'x':'<path d="M40 40 L160 160 M160 40 L40 160" stroke="#e0392b" stroke-width="16"/>',
 'star':'<path d="M100 20 L122 76 L182 80 L136 118 L152 176 L100 144 L48 176 L64 118 L18 80 L78 76 Z"/>',
 'pyramid':'<path d="M20 160 L100 30 L180 160 Z M100 30 L100 160 M60 95 L140 95"/>',
 'column':'<path d="M45 40 L155 40 M60 52 L140 52 M70 56 L70 150 M100 56 L100 150 M130 56 L130 150 M50 160 L150 160 M40 176 L160 176"/>',
 'boat':'<path d="M20 120 L180 120 C170 160 130 172 100 172 C70 172 30 160 20 120 Z M100 120 L100 30 M100 34 L158 108 L100 108"/>',
 'sword':'<path d="M100 20 L116 130 L84 130 Z M60 136 L140 136 M100 136 L100 176"/>',
 'eye':'<path d="M18 96 C60 40 140 40 182 96 C140 152 60 152 18 96 Z M100 74 a22 22 0 1 0 0.1 0 M100 118 L88 176 M126 108 C150 128 160 150 178 160"/>',
 'ankh':'<path d="M100 20 C50 20 50 100 100 100 C150 100 150 20 100 20 Z M100 100 L100 180 M50 128 L150 128"/>',
 'hourglass':'<path d="M44 24 L156 24 M44 176 L156 176 M52 24 C52 80 100 90 100 100 C100 110 52 120 52 176 M148 24 C148 80 100 90 100 100 C100 110 148 120 148 176"/>',
 'bow':'<path d="M60 20 C170 60 170 140 60 180 M60 20 L60 180 M20 100 L150 100 M128 82 L152 100 L128 118"/>',
 'pin':'<path d="M100 180 C60 120 40 100 40 76 a60 60 0 0 1 120 0 C160 100 140 120 100 180 Z M100 76 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0"/>',
 'quest':'<path d="M60 70 C60 20 150 20 150 72 C150 108 104 104 104 140 M104 168 L104 176" stroke-width="12"/>',
 'excl':'<path d="M100 22 L100 120 M100 160 L100 168" stroke-width="16"/>',
}
def icon_html(name):
    col='#f3e8cf'
    return f'<svg id="el" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="{col}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(3px 4px 3px rgba(0,0,0,.6))">{ICONS[name]}</svg>'
# --- map ---
LL={'Alexandria':(29.92,31.2),'Giza':(31.13,29.98),'Thebes':(32.65,25.7),'Aswan':(32.9,24.1),'Pselchis':(32.7,23.1),'Premnis':(32.0,22.65),'Napata':(31.8,18.55),'Meroë':(33.7,16.9)}
NILE=[(31.3,31.45),(31.25,30.05),(30.9,29.1),(30.75,28.1),(31.2,27.2),(31.7,26.55),(32.7,26.15),(32.65,25.7),(32.55,25.3),(32.87,24.98),(32.9,24.1),(32.7,23.1),(32.0,22.65),(31.3,21.8),(30.6,20.6),(30.4,19.6),(30.5,19.2),(31.8,18.55),(33.3,19.5),(33.95,18.0),(33.99,17.7),(33.7,16.9)]
RED=[(32.5,29.95),(33.2,28.3),(33.8,27.2),(34.28,26.1),(34.9,25.05),(35.5,23.9),(36.1,22.2),(37.2,19.6),(38.5,18.0),(40.1,16.2)]
MW,MH=600,800
def xy(lon,lat): return ((lon-28.7)*52.5,(31.8-lat)*51.0)
PIN_SETS={'nile':['Alexandria','Giza','Thebes','Aswan','Meroë'],'campaign':['Aswan','Pselchis','Premnis','Napata','Meroë'],'embassy':['Meroë','Aswan','Alexandria']}
LBL={'Alexandria':'ALEXANDRIA','Giza':'GIZA','Thebes':'THEBES','Aswan':'ASWAN · PHILAE','Pselchis':'PSELCHIS','Premnis':'PREMNIS','Napata':'NAPATA','Meroë':'MEROË'}
def map_html(kind):
    pts=' '.join(f'{xy(*p)[0]:.0f},{xy(*p)[1]:.0f}' for p in NILE)
    red=' '.join(f'{xy(*p)[0]:.0f},{xy(*p)[1]:.0f}' for p in RED)+f' {MW},{MH} {MW},0 {xy(32.5,31.8)[0]:.0f},0 {xy(32.5,29.95)[0]:.0f},{xy(32.5,29.95)[1]:.0f}'
    med=f'0,0 {MW},0 {MW},{xy(0,31.25)[1]:.0f} 0,{xy(0,31.25)[1]:.0f}'
    labels=''
    for n in PIN_SETS[kind]:
        x,y=xy(*LL[n]); right=n not in('Alexandria','Premnis')
        lx=x+16 if right else x-16
        anchor='start' if right else 'end'
        labels+=f'<circle cx="{x:.0f}" cy="{y:.0f}" r="9" fill="#b3261e" stroke="#2a1a12" stroke-width="3"/><text x="{lx:.0f}" y="{y+8:.0f}" text-anchor="{anchor}" font-family="Elite" font-size="26" fill="#1d150e">{LBL[n]}</text>'
    extra=''
    if kind=='embassy': extra='<path d="M150 40 C120 20 90 14 60 8" stroke="#b3261e" stroke-width="5" stroke-dasharray="3 12" stroke-linecap="round" fill="none"/><text x="20" y="62" font-family="Caveat" font-weight="700" font-size="38" fill="#8a1f14">→ SAMOS, Greece (off map)</text>'
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{MW}" height="{MH}" viewBox="0 0 {MW} {MH}">
    <rect width="{MW}" height="{MH}" fill="#e8d9b3"/>
    <polygon points="{med}" fill="#b9c4bd" opacity=".75"/><polygon points="{red}" fill="#b9c4bd" opacity=".75"/>
    <text x="{MW-170}" y="{MH-250}" font-family="Elite" font-size="22" fill="#6c7a76" transform="rotate(-62 {MW-170} {MH-250})">RED SEA</text>
    <text x="160" y="30" font-family="Elite" font-size="20" fill="#6c7a76">MEDITERRANEAN</text>
    <text x="40" y="{MH-60}" font-family="Elite" font-size="22" fill="#9a8458" opacity=".8">N U B I A · K U S H</text>
    <polyline points="{pts}" fill="none" stroke="#6d8aa0" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>
    <polyline points="{pts}" fill="none" stroke="#9ab6c8" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
    <text x="{xy(31.9,22.0)[0]:.0f}" y="{xy(31.9,22.0)[1]:.0f}" font-family="Caveat" font-weight="700" font-size="36" fill="#41627a" transform="rotate(-80 {xy(31.9,22.0)[0]:.0f} {xy(31.9,22.0)[1]:.0f})">THE NILE</text>
    {labels}{extra}
    <text x="14" y="{MH-14}" font-family="Elite" font-size="16" fill="#7a6a48">schematic map · not to scale</text></svg>'''
    return f'<div class="wrap" id="el" style="padding:34px"><div style="clip-path:{torn_clip(18,20,0.9)};background:#e8d9b3;width:{MW}px;height:{MH}px">{svg}</div></div>'
def shot(pg,htmltxt,path):
    open('/tmp/_t.html','w').write(f'<style>{CSS}</style><body>{htmltxt}</body>');pg.goto('file:///tmp/_t.html');pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(20)
    pg.locator('#el').screenshot(path=path,omit_background=True)
if __name__=='__main__':
    al=json.load(open('align.json'))
    chunks=make_chunks(al['sents'],LAY['chunk'])
    json.dump(chunks,open(f'chunks{SUF}.json','w'))
    os.makedirs(f'assets/cap{SUF}',exist_ok=True)
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args=['--no-sandbox','--allow-file-access-from-files']);pg=b.new_page(viewport={'width':900,'height':1000})
        if not SUF:
            for n in ICONS: shot(pg,icon_html(n),f'assets/icons/{n}.png')
            for k in ('nile','campaign','embassy'): shot(pg,map_html(k),f'assets/maps/{k}.png')
            for i,c in enumerate(CALL):
                shot(pg,note_html(c[2],c[3]),f'assets/notes/{i}.png')
        cap_css="""<style>@font-face{font-family:Oswald;font-weight:700;src:url('file://%s/oswald/files/oswald-latin-700-normal.woff2')}
        .cap{display:inline-block;width:%dpx;text-align:center;font-family:Oswald;font-weight:700;font-size:%dpx;line-height:1.12;color:#fff;text-transform:uppercase;letter-spacing:.5px;paint-order:stroke fill;-webkit-text-stroke:9px #000;padding:6px 10px}
        .k{color:#ffd23f}</style>"""%(FD,LAY['capw'],50 if not SUF else 46)
        for i,c in enumerate(chunks):
            toks=c['text'].split()
            s=' '.join(f'<span class="k">{html.escape(t)}</span>' if is_key(t) else html.escape(t) for t in toks)
            open('/tmp/_t.html','w').write(cap_css+f'<body style="margin:0;background:transparent"><div class="cap" id="el">{s}</div></body>');pg.goto('file:///tmp/_t.html');pg.evaluate("document.fonts.ready")
            pg.locator('#el').screenshot(path=f'assets/cap{SUF}/{i}.png',omit_background=True)
        b.close()
    print(len(chunks),'caption chunks')
