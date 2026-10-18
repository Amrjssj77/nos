# -*- coding: utf-8 -*-
def S(typ, anchor, p=None, ev=None, vid=None): return {"type": typ, "anchor": anchor, "p": p or {}, "ev": ev or {}, "vid": vid}
SPEC = [
 S("hero", "نظام تشغيل متفصل", {"w": 680, "badge": "نظام على مقاسك", "bc": "coral"}, {}, ("desk1", 5)),
 S("vs2", "ده مستحيل مع نظام", {"a": {"icon": "laptop", "c": "ink", "name": "macOS", "tags": [["Closed source", "coral"], ["لا تعديل", "soft"]], "stamp": "lock"},
                              "b": {"icon": "monitor", "c": "blue", "name": "Windows", "tags": [["Closed source", "coral"], ["لا تعديل", "soft"]], "stamp": "lock"}},
   {"a": "macOS", "b": "ويندوز", "x0": "لأنهم", "x1": "مفتوحي"}),
 S("bigicon", "إنت مش بتقدر تغير", {"icon": "code", "c": "ink", "title": "مفيش وصول للكود", "sub": "مش بتقدر تعدّل فيه براحتك", "stamp": "lock"}, {"stamp": "ولا تعدل"}),
 S("bars", "يعني لو أبل نزلت", {"title": "بعد تحديث سيئ", "icon": "gauge", "ic": "coral", "rows": [
     {"label": "سرعة الجهاز", "pct": 22, "color": "#e5673f", "val": "↓ بطيء"}, {"label": "قدرتك على التغيير", "pct": 4, "color": "#16140f", "val": "0"}]},
   {"i0": "وبطأ", "i1": "اتورطت"}),
 S("adwin", "ولو قرروا يحطوا إعلان", {}, {"ad": "إعلان", "lock": "لازم تشوف"}),
 S("hero", "لكن بما إن Omarchy", {"w": 700, "badge": "Open source + AI-first", "bc": "ink"}, {"t0": "مفتوح المصدر", "t1": "وتقدر تعدل", "t2": "متكامل", "t3": "وكلاء", "badge": "بالكامل"}, ("desk1", 30)),
 S("chat", "فأنا ببساطة", {"title": "AI Agent", "lines": [
     {"who": "me", "text": "غيّر لون الحاجة دي، وغيّر طريقة عملها، وعدّل النظام ده بيشتغل إزاي", "dur": 4.5},
     {"who": "ai", "text": "تمام! بعدّل دلوقتي", "dur": 1.2}]}, {"m0": "غير لون", "m1": "إزاي"}),
 S("enter", "أدوس Enter", {}, {"enter": "Enter", "done": "اتنفذ"}, ("wall", 6)),
 S("morph", "ونظام التشغيل كله", {}, {}, ("wall", 14)),
 S("bigicon", "ده نظام التشغيل الوحيد", {"icon": "trophy", "c": "coral", "title": "الوحيد على الكوكب", "sub": "تخصيص فائق وشخصي", "tags": [["Open source", "green"], ["AI-first", "coral"]]}, {"i0": "فائق", "i1": "بالشكل"}),
 S("cards3", "بص بقى كل توزيعات", {"cards": [
     {"icon": "terminal", "c": "ink", "title": "توزيعات لينكس التانية", "sub": "مفتوحة المصدر برضه", "tag": "Open source", "tagc": "green"},
     {"icon": "code", "c": "blue", "title": "نفس التعديلات ممكنة", "sub": "من الناحية التقنية"}], "h": 300}, {"i0": 0.5, "i1": "وبالتالي"}),
 S("bars", "أنا كنت بتفرج", {"title": "كلام DHH عن التوزيعات التانية", "sub": "حاجة كان بيكررها كتير في مقابلاته", "icon": "user", "ic": "ink", "rows": [
     {"label": "حماس للذكاء الاصطناعي", "pct": 22, "color": "#3b6fe0", "val": "قليل"}, {"label": "تكامل حقيقي مع AI", "pct": 14, "color": "#3b6fe0", "val": "ضعيف"}]},
   {"i0": "متحمسة", "i1": "تكامل"}),
 S("bars", "لكن Omarchy مختلف", {"title": "Omarchy · DHH", "icon": "spark", "ic": "coral", "rows": [
     {"label": "حماس للذكاء الاصطناعي", "pct": 96, "color": "#1f9d6b", "val": "عالي"}, {"label": "استخدامه في كل حاجة", "pct": 92, "color": "#1f9d6b", "val": "عالي"}]},
   {"i0": "متحمس", "i1": "وبيشجع"}),
 S("bigicon", "ولو إنت بتتفرج", {"icon": "user", "c": "ink", "title": "إنت كمان متحمّس للـ AI", "sub": "غالبًا", "tags": [["YouTube", "soft"], ["AI", "coral"]]}, {"i0": 1.0, "i1": 2.0}),
 S("cards3", "وعشان كده هو بنى", {"cards": [
     {"icon": "spark", "c": "coral", "title": "كل حاجة متوافقة مع الـ AI", "sub": "من الأساس"},
     {"icon": "layers", "c": "ink", "title": "ومتكاملة معاه", "sub": "داخل النظام نفسه"}], "h": 300}, {"i0": "متوافقة", "i1": "ومتكاملة"}),
 S("equation", "فلما تجمع بين", {"a": {"icon": "spark", "c": "coral", "label": "تكامل مع الـ AI"}, "b": {"icon": "code", "c": "ink", "label": "مفتوح المصدر"},
     "r": {"icon": "laptop", "c": "green", "label": "نظام مذهل ومخصّص"}, "vw": 430}, {"a": "التكامل", "b": "وبين", "r": "هتحصل"}, ("slides", 0)),
 S("devices", "طيب إيه أجهزة", {"items": [{"icon": "laptop", "c": "ink", "name": "Laptop"}, {"icon": "monitor", "c": "blue", "name": "Desktop"}, {"icon": "laptop", "c": "coral", "name": "جهاز قديم"}], "big": "تقريبًا أي كمبيوتر"}, {"big": "تقريبا"}),
 S("counter", "هما حرفيا بيعرضوا", {"icon": "memory", "ic": "ink", "n": 2, "unit": " GB", "label": "رامات بس", "sub": "والنظام شغّال عليه"}, {"num": "2 جيجابايت"}),
 S("counter", "أنا شخصيا زي ما", {"icon": "laptop", "ic": "ink", "n": 7, "unit": " سنين", "label": "جهاز Alienware في الدولاب", "fs": 150,
     "side": [["clock", "coral", "مرمي 7 سنين"], ["trash", "ink", "عليه تراب"], ["spark", "green", "اشتغل عليه Omarchy"]]}, {"num": "7", "s0": "مرمي", "s1": "عليه تراب", "s2": "تقدر تشغل"}),
 S("counter", "وDHH كمان بيرشح", {"icon": "laptop", "ic": "blue", "pre": "$", "n": 600, "label": "Dell XPS", "sub": "ترشيح DHH", "fs": 170}, {"num": "600"}),
 S("fwvid", "وأنا لسه جايب", {"tag": "Framework laptop", "note": "مش إعلان مدفوع"}, {"tag": "Framework", "note": "إعلان"}, ("fw", 10)),
 S("counter", "لكن الفكرة إنك", {"icon": "laptop", "ic": "coral", "n": 15, "unit": " سنة", "label": "عمر الجهاز مش مشكلة", "fs": 170}, {"num": "15"}),
 S("steps", "طيب هتثبته إزاي", {"steps": [
     {"icon": "download", "c": "ink", "title": "نزّل النظام"}, {"icon": "usb", "c": "coral", "title": "Flashing للفلاشة", "sub": "تجهّزها بملفات النظام"}, {"icon": "laptop", "c": "green", "title": "شغّل الكمبيوتر منها", "sub": "وثبّت النظام"}]},
   {"i0": "فلاشة", "i1": "Flashing", "i2": "تشغل"}),
 S("counter", "ولو إنت مش عارف", {"icon": "spark", "ic": "coral", "n": 14000, "unit": "+", "label": "وكيل ذكاء اصطناعي تستعين بيهم", "fs": 160}, {"num": "14"}),
 S("chat", "كل اللي عليك", {"title": "AI Agent", "lines": [
     {"who": "me", "text": "أنا عايز أثبّت Omarchy على الكمبيوتر التاني بتاعي، وعندي فلاشة USB. ممكن تمشّي معايا خطوة بخطوة؟", "dur": 6},
     {"who": "ai", "text": "أكيد! نبدأ بالخطوة الأولى", "dur": 1.5}]}, {"m0": "أنا عايز", "m1": "وهو هيساعدك"}),
 S("steps", "أنا شخصيا شبكت", {"steps": [
     {"icon": "usb", "c": "ink", "title": "شبّكت الفلاشة في الماك"}, {"icon": "download", "c": "coral", "title": "الـ AI حمّل النظام وحطّه على الفلاشة"}, {"icon": "laptop", "c": "green", "title": "مشّاني خطوة بخطوة لحد التثبيت"}]},
   {"i0": "شبكت", "i1": "يحمل", "i2": "مشاني"}),
 S("bigicon", "والأجمل بقى", {"icon": "laptop", "c": "ink", "title": "الماك بيجهّز اللي هيستغنى عنه!", "tags": [["macOS", "soft"], ["→ Omarchy", "coral"]], "stamp": "heart", "stampc": "coral"}, {"stamp": "المسكين"}),
 S("bigicon", "زي حبيبتك السابقة", {"icon": "heart", "c": "coral", "title": "معلش يا ماك", "sub": "زي حبيبتك السابقة بالظبط", "stamp": "x", "stampc": "ink"}, {"stamp": "معلش"}),
 S("hero", "أنا دلوقتي بقيت", {"w": 700, "badge": "نظامي الأساسي", "bc": "green", "tiles": [["star", "coral", -460, -140], ["shield", "green", 450, -120], ["clock", "ink", -440, 130], ["heart", "coral", 450, 140]]}, {"badge": "الأساسي"}, ("desk2", 60)),
 S("steps", "لكن بص لو عندك", {"sw": 240, "steps": [
     {"icon": "laptop", "c": "ink", "title": "جهاز قديم"}, {"icon": "folder", "c": "blue", "title": "نسخة احتياطية"}, {"icon": "terminal", "c": "coral", "title": "جرّب النظام"}, {"icon": "check", "c": "green", "title": "قرّر"}]},
   {"i0": "جهاز قديم", "i1": "نسخة احتياطية", "i2": "جرب النظام", "i3": "لو عجبك"}),
 S("chart", "وأنا واثق جدا", {"title": "الإنتاجية بتزيد"}, {"grow": "إنتاجيتي"}),
 S("bigicon", "أنا شايف إنك بتبدأ", {"icon": "rocket", "c": "coral", "title": "بتواكب المستقبل", "tags": [["Omarchy", "ink"]]}, {"i0": 1.0}),
 S("stack", "تخيل إن عندك", {"layers": [
     {"icon": "spark", "c": "coral", "title": "نموذج لغوي محلي", "sub": "Local LLM", "tag": "Open source"},
     {"icon": "layers", "c": "blue", "title": "منصة إدارة الوكلاء", "sub": "AI Agent Harness", "tag": "Open source"},
     {"icon": "laptop", "c": "green", "title": "نظام التشغيل", "sub": "Omarchy", "tag": "Open source"}]},
   {"i0": "نموذج لغوي", "i1": "منصة", "i2": "على نظام تشغيل"}, ("desk1", 100)),
 S("cards3", "ده معناه إن عندك", {"cards": [
     {"icon": "spark", "c": "coral", "title": "ذكاء اصطناعي", "sub": "تخصّصه بالكامل"}, {"icon": "cpu", "c": "ink", "title": "قدرة حوسبة", "sub": "تتحكم فيها"}, {"icon": "laptop", "c": "green", "title": "نظام تشغيل", "sub": "تعدّله وتشكّله"}], "h": 300},
   {"i0": "ذكاء", "i1": "وقدرة", "i2": "ونظام"}),
 S("bigicon", "وده بيوصلك", {"icon": "sliders", "c": "coral", "title": "أقصى تخصيص ممكن", "sub": "كل جزء متصمّم على مقاسك", "tags": [["من غير إضافات مش محتاجها", "ink"]]}, {"i0": "من غير"}),
 S("bigicon", "أنا مؤمن إن ده هو مستقبل", {"icon": "star", "c": "blue", "title": "مستقبل استخدام الكمبيوتر", "tags": [["أنجز أكبر قدر من الشغل", "green"]]}, {"i0": "تنجز"}),
 S("hero", "لكن بصراحة أنا كمان", {"w": 700, "badge": "أكتر طريقة ممتعة", "bc": "coral", "tiles": [["smile", "coral", -460, -140], ["spark", "blue", 450, -130], ["heart", "coral", -440, 130], ["star", "green", 450, 140]]}, {"badge": "ممتعة"}, ("wall", 7)),
 S("cta", "طيب هل اتعلمت", {"head": "اتعلمت حاجة جديدة؟"}, {"sub": "اشتراك", "bell": "الإشعارات", "like": 6.0}),
 S("cards3", "ممكن كمان أبدأ", {"cards": [
     {"icon": "spark", "c": "coral", "title": "الذكاء الاصطناعي", "sub": "تركيز القناة"}, {"icon": "cpu", "c": "ink", "title": "الهاردوير", "sub": "أجهزة وتجارب"}, {"icon": "code", "c": "green", "title": "البرمجيات مفتوحة المصدر", "sub": "اللي بحبها"}], "h": 300},
   {"i0": "الذكاء", "i1": "الهاردوير", "i2": "والبرمجيات"}),
 S("bigicon", "قولولي في التعليقات", {"icon": "comment", "c": "blue", "title": "رأيك في التعليقات؟", "sub": "هتكمّلوا لو اتكلمت أكتر عن الهاردوير والبرمجيات؟"}, {}),
 S("cta", "ولو اتعلمت أي حاجة", {}, {"like": "لايك", "sub": 0.3, "bell": 0.8}),
 S("outro", "إحنا بنتعلم مع بعض", {}, {}),
]
