import re
import math
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

import joblib
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, Bidirectional, LSTM, Dropout, Dense
from tensorflow.keras.preprocessing.sequence import pad_sequences

# --- مسار النماذج ---
ML_DIR = Path(__file__).parent / "models"

# --- Label convention: which class means "safe" in each model ---
# Probability close to 1 for this label = safe, so phishing risk = 1 - P(safe)
URL_SAFE_LABEL = 1    # change to 0 if your URL model was trained with 0 = safe
LSTM_SAFE_LABEL = 1   # the LSTM's sigmoid output is P(safe)

# --- Thresholds on PHISHING risk (0 = safe, 1 = phishing) ---
URL_PHISHING_T = 0.6
 
LSTM_PHISHING_T = 0.6
 

# 1. تحميل نموذج الروابط (RandomForest)
try:
    _url_model = joblib.load(ML_DIR / "phishing_url_model.pkl")
except Exception as e:
    print(f"تحذير: تعذر تحميل نموذج الروابط: {e}")
    _url_model = None

# 2. تحميل نموذج الـ LSTM والـ Tokenizer
_lstm_model = None
_tokenizer = None
MAX_LEN = 250

try:
    _lstm_model = Sequential([
        Embedding(input_dim=20000, output_dim=128, input_length=MAX_LEN),
        Bidirectional(LSTM(64, return_sequences=True, dropout=0.3, recurrent_dropout=0.3)),
        Bidirectional(LSTM(32, dropout=0.3, recurrent_dropout=0.3)),
        Dropout(0.5),
        Dense(64, activation='relu'),
        Dropout(0.4),
        Dense(1, activation='sigmoid')
    ])
    _lstm_model.build(input_shape=(None, MAX_LEN))
    _lstm_model.load_weights(ML_DIR / "lstm_phishing.weights.h5")
    _tokenizer = joblib.load(ML_DIR / "lstm_tokenizer.pkl")
    print("تم تحميل هيكل وأوزان نموذج الـ LSTM والـ Tokenizer بنجاح.")
except Exception as e:
    print(f"تحذير: تعذر تحميل نموذج LSTM أو الأوزان: {e}")
    _lstm_model = None
    _tokenizer = None

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
    
    "phishing": "مؤشرات قوية على الاحتيال. لا تفتح الرابط ولا تشارك أي معلومات.",
}


def entropy(s):
    if not s:
        return 0
    c = Counter(s)
    return -sum(n / len(s) * math.log2(n / len(s)) for n in c.values())


def _verdict_from_risk(risk: float, phishing_t: float) -> str:
    """risk = phishing probability (close to 1 = phishing)."""
    if risk >= phishing_t:
        return "phishing"
     
    return "safe"


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

    return {
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
        "https": int(low.startswith("https://")),
    }


def _check_url_with_ml(content):
    if _url_model is None:
        return {"verdict": "safe", "score": 0.0, "summary": "نموذج الروابط غير محمل", "indicators": []}

    if "]" in content and "(" in content:
        content = content.split("]")[0].split("(")[-1].strip()
    else:
        content = content.strip()

    feats = _extract_comprehensive_features(content)
    row_data = [feats.get(name, 0) for name in EXACT_FEATURE_NAMES]
    row = pd.DataFrame([row_data], columns=EXACT_FEATURE_NAMES)

    proba = _url_model.predict_proba(row)[0]
    classes = list(_url_model.classes_)

    # P(safe) -> phishing risk
    safe_idx = classes.index(URL_SAFE_LABEL)
    safe_prob = float(proba[safe_idx])
    risk = 1.0 - safe_prob

    verdict = _verdict_from_risk(risk, URL_PHISHING_T)

    indicators = []
    if feats["https"] == 0:
        indicators.append({"title": "اتصال غير مشفّر", "detail": "الرابط لا يستخدم بروتوكول HTTPS الآمن."})
    if feats["is_ip"] == 1:
        indicators.append({"title": "عنوان IP مباشر", "detail": "الموقع يستخدم عنوان IP بدلاً من اسم نطاق موثوق."})
    if feats["has_keyword_host"] == 1 or feats["has_keyword_path"] == 1:
        indicators.append({"title": "كلمات حساسة في الرابط", "detail": "يحتوي الرابط على كلمات مفتاحية مرتبطة بعمليات تسجيل الدخول أو التحقق."})

    return {
        "verdict": verdict,
        "score": round(risk, 2),   # close to 1 = phishing
        "summary": SUMMARY[verdict],
        "indicators": indicators,
    }


def _check_text_with_lstm(content: str):
    if _lstm_model is None or _tokenizer is None:
        return {"verdict": "safe", "score": 0.0, "summary": "نموذج الـ LSTM غير محمل", "indicators": []}

    seq = _tokenizer.texts_to_sequences([content])
    padded = pad_sequences(seq, maxlen=MAX_LEN, padding='post', truncating='post')

    # Model output: close to 1 = safe
    safe_prob = float(_lstm_model.predict(padded, verbose=0)[0][0])
    risk = 1.0 - safe_prob   # close to 1 = phishing

    verdict = _verdict_from_risk(risk, LSTM_PHISHING_T)

    indicators = []
    if verdict != "safe":
        indicators.append({
            "title": "محتوى مشبوه (LSTM)",
            "detail": "أظهر تحليل التسلسل اللفظي للرسالة خصائص مطابقة لأنماط الاحتيال الإلكتروني."
        })

    return {
        "verdict": verdict,
        "score": round(risk, 2),   # close to 1 = phishing
        "summary": SUMMARY[verdict],
        "indicators": indicators,
    }


def analyze(kind, content):
    if kind == "url":
        return _check_url_with_ml(content)
    if kind in ("email", "message"):
        return _check_text_with_lstm(content)
    raise ValueError(f"Unsupported kind: {kind}")