import re
from urllib.parse import urlparse
from pathlib import Path
import joblib
import pandas as pd
from collections import Counter

# --- تحميل نموذج الـ ML الخاص بالروابط ---
ML_DIR = Path(__file__).parent / "models"
try:
    _url_model = joblib.load(ML_DIR / "phishing_url_model.pkl")
    
except Exception:
    _url_model = None
    _url_features = None
EXACT_FEATURE_NAMES = [
    "host_len", "dot_count", "dash_count", "digit_count", "digit_ratio", 
    "longest_label", "entropy", "has_keyword_host", "is_ip", 
    "url_len", "path_len", "slash_count", "has_path", "has_query", 
    "has_keyword_path", "https"
]
KEYWORDS = r"login|secure|update|banking|verify|signin|account|confirm|webscr"
URGENCY = ["عاجل", "urgent", "immediately", "خلال 24", "تعليق", "suspended", "تحقق"]
SENSITIVE = ["كلمة المرور", "password", "otp", "رمز التحقق", "رقم البطاقة", "card number"]
PRIZE = ["جائزة", "prize", "winner", "ربحت", "مليون"]

IP_RE = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")
LINK_RE = re.compile(r"https?://\S+|www\.\S+", re.I)

SUMMARY = {
    "safe": "لم نجد مؤشرات واضحة على الاحتيال. ومع ذلك، تحقق دائماً من المصدر.",
    "suspicious": "هناك مؤشرات مريبة. لا تُدخل بياناتك قبل التأكد من المصدر.",
    "phishing": "مؤشرات قوية على الاحتيال. لا تفتح الرابط ولا تشارك أي معلومات.",
}

def entropy(s):
    if not s:
        return 0
    c = Counter(s)
    return -sum(n / len(s) * math.log2(n / len(s)) for n in c.values()) if 'math' in globals() else 0

import math

def _extract_comprehensive_features(url: str) -> dict:
    u = str(url).strip()
    low = u.lower()
    v = u if "://" in u else "http://" + u
    
    try:
        p = urlparse(v)
        hostname = (p.hostname or "").lower()
        path = (p.path or "")
        query = (p.query or "")
    except ValueError:
        hostname, path, query = "", "", ""
        
    host_n = re.sub(r"^www\.", "", hostname)
    digits = sum(ch.isdigit() for ch in host_n)
    
    # يجب أن تتطابق تماماً مع الميزات التي دربنا النموذج عليها
    features = {
        "host_len": len(host_n),
        "dot_count": host_n.count("."),
        "dash_count": host_n.count("-"),
        "digit_count": digits,
        "digit_ratio": digits / len(host_n) if len(host_n) > 0 else 0,
        "longest_label": max((len(l) for l in host_n.split(".")), default=0),
        "entropy": entropy(host_n),
        "has_keyword_host": int(bool(re.search(KEYWORDS, host_n))),
        "is_ip": int(bool(re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", host_n))),
        "url_len": len(u),
        "path_len": len(path),
        "slash_count": u.count("/"),
        "has_path": int(len(path) > 1),
        "has_query": int(bool(query)),
        "has_keyword_path": int(bool(re.search(KEYWORDS, path + query))),
        "https": int(low.startswith("https://"))
    }
    return features


def _check_url_with_ml(content):
    if _url_model is None:
        return {"verdict": "safe", "score": 0.0, "summary": "النموذج غير محمل", "indicators": []}
    
    # تنظيف النص إذا احتوى على أقواس أو ماركداون
    if "]" in content and "(" in content:
        content = content.split("]")[0].split("(")[-1].strip()
    else:
        content = content.strip()
    
    feats = _extract_comprehensive_features(content)
    
    # بناء الصف بالترتيب الثابت والصحيح تماماً
    row_data = [feats.get(name, 0) for name in EXACT_FEATURE_NAMES]
    row = pd.DataFrame([row_data], columns=EXACT_FEATURE_NAMES)
    
    proba = _url_model.predict_proba(row)[0]
    phishing_idx = list(_url_model.classes_).index(1) if 1 in list(_url_model.classes_) else 1
    score = float(proba[phishing_idx])
    
    if score >= 0.6:
        verdict = "phishing"
    elif score >= 0.3:
        verdict = "suspicious"
    else:
        verdict = "safe"
        
    indicators = []
    if feats["https"] == 0:
        indicators.append({"title": "اتصال غير مشفّر", "detail": "الرابط لا يستخدم بروتوكول HTTPS الآمن."})
    if feats["is_ip"] == 1:
        indicators.append({"title": "عنوان IP مباشر", "detail": "الموقع يستخدم عنوان IP بدلاً من اسم نطاق موثوق."})
    if feats["has_keyword_host"] == 1 or feats["has_keyword_path"] == 1:
        indicators.append({"title": "كلمات حساسة في الرابط", "detail": "يحتوي الرابط على كلمات مفتاحية مرتبطة بعمليات تسجيل الدخول أو التحقق."})

    return {
        "verdict": verdict,
        "score": round(score, 2),
        "summary": SUMMARY[verdict],
        "indicators": indicators,
    }

def _has_any(text, words):
    for w in words:
        if w.isascii():
            if re.search(rf"\b{re.escape(w)}\b", text):
                return True
        elif w in text:
            return True
    return False


def _check_message(content):
    lowered = content.lower()
    flags = []

    if _has_any(lowered, URGENCY):
        flags.append((0.3, "أسلوب استعجال", "الرسالة تضغط عليك للتصرّف بسرعة."))
    if _has_any(lowered, SENSITIVE):
        flags.append((0.35, "طلب معلومات حسّاسة", "الجهات الموثوقة لا تطلب كلمة المرور أو الرموز عبر الرسائل."))
    if _has_any(lowered, PRIZE):
        flags.append((0.25, "وعد بجائزة أو مكسب", "الجوائز المفاجئة أسلوب شائع في الاحتيال."))
    if LINK_RE.search(content):
        flags.append((0.1, "يحتوي على رابط", "افحص الرابط بشكل منفصل قبل فتحه."))
        
    score = round(min(sum(points for points, _, _ in flags), 1.0), 2)
    if score >= 0.6:
        verdict = "phishing"
    elif score >= 0.3:
        verdict = "suspicious"
    else:
        verdict = "safe"
        
    return {
        "verdict": verdict,
        "score": score,
        "summary": SUMMARY[verdict],
        "indicators": [{"title": t, "detail": d} for _, t, d in flags],
    }


def analyze(kind, content):
    if kind == "url":
        return _check_url_with_ml(content)
    return _check_message(content)