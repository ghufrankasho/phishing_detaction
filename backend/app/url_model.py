import re
import math
from pathlib import Path
from urllib.parse import urlparse
from collections import Counter

import joblib
import pandas as pd

# تحديد مسار مجلد models بداخل مجلد app
ML_DIR = Path(__file__).parent / "models"

# تحميل النموذج وملف الميزات
_model = joblib.load(ML_DIR / "phishing_url_model.pkl")
FEATURES = joblib.load(ML_DIR / "url_model_features.pkl")  # يحافظ على الترتيب الدقيق للأعمدة

KEYWORDS = r"login|secure|update|banking|verify|signin|account|confirm|webscr"
PHISHING_LABEL = 1  # 1 تعني Phishing

def entropy(s):
    if not s:
        return 0
    c = Counter(s)
    return -sum(n / len(s) * math.log2(n / len(s)) for n in c.values())

def extract_comprehensive_features(url: str) -> dict:
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

def predict_url(url: str) -> float:
    """إرجاع احتمالية أن يكون الرابط تصيداً احتيالياً، من 0.0 إلى 1.0."""
    feats = extract_comprehensive_features(url)
    
    # بناء DataFrame بنفس ترتيب الأعمدة المخزن في url_model_features.pkl
    row = pd.DataFrame([[feats.get(name, 0) for name in FEATURES]], columns=FEATURES)
    
    proba = _model.predict_proba(row)[0]
    
    # التأكد من مؤشر فئة الـ Phishing
    if PHISHING_LABEL in list(_model.classes_):
        idx = list(_model.classes_).index(PHISHING_LABEL)
        return float(proba[idx])
    return float(proba[1])