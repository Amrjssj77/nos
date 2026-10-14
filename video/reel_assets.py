import build_html_assets as h,os
from playwright.sync_api import sync_playwright
os.makedirs('assets/reel',exist_ok=True)
T={'t1':('big',"THE *ONE-EYED* QUEEN WHO SHOOK ROME"),'t2':('big',"NAPATA FELL. WHY DID ROME *GIVE IN?*"),'cta':('cta',"FOLLOW FOR MORE|*HIDDEN STORIES*")}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args=['--no-sandbox','--allow-file-access-from-files']);pg=b.new_page(viewport={'width':900,'height':1000})
    for k,(kd,tx) in T.items(): h.shot(pg,h.note_html(kd,tx),f'assets/reel/{k}.png')
    b.close()
