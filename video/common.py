import re,json
KEY=set("amanirenas kush kushite kushites rome roman romans kandake augustus caesar petronius strabo napata meroë meroe aswan philae elephantine nile egypt queen piye taharqa assyria samos pselchis premnis syene octavian cleopatra alexandria garstang ferlini akinidad amanishakheto amanitore aksum hamadab".split())
def is_key(tok):
    t=re.sub(r"[^\w]",'',tok).lower()
    return t in KEY or re.fullmatch(r"\d+",t) is not None or t in('bc','ad')
def make_chunks(sents,maxw=6):
    """returns list of dict(text,start,end,sent)"""
    out=[]
    for si,s in enumerate(sents):
        toks=s['text'].split()
        # split points preferring punctuation
        groups=[];cur=[]
        for t in toks:
            cur.append(t)
            if len(cur)>=maxw or (t[-1] in ',:;?!.' and len(cur)>=3):
                groups.append(cur);cur=[]
        if cur:
            if groups and len(cur)<=2: groups[-1]+=cur
            else: groups.append(cur)
        wts=[sum(len(x)+2 for x in g) for g in groups]; tot=sum(wts)
        a=s['start']; d=(s['end']-s['start'])
        acc=0
        for g,wt in zip(groups,wts):
            st=a+d*acc/tot; acc+=wt; en=a+d*acc/tot
            out.append(dict(text=' '.join(g),start=st,end=en,sent=si))
    return out
