"""
Temporary stand-in for the real detection models.

The web app only calls analyze(kind, content) and expects the dict described
below. When your real models are ready, replace the body of analyze() with a
call to them (a function or an HTTP request) and keep the same return shape,
so nothing else in the app has to change.

Returns:
    {
      "verdict": "safe" | "suspicious" | "phishing",
      "score": 0.0 - 1.0,            # risk level
      "summary": str,
      "indicators": [{"title": str, "detail": str}, ...],
    }
"""
import re
from urllib.parse import urlparse

URL_WORDS = ["login", "verify", "secure", "account", "update", "bank", "password", "confirm"]
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


def _has_any(text, words):
    """English words match as whole words; Arabic phrases match as substrings."""
    for w in words:
        if w.isascii():
            if re.search(rf"\b{re.escape(w)}\b", text):
                return True
        elif w in text:
            return True
    return False


def _result(flags):
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


def _check_url(content):
    has_scheme = "://" in content
    try:
        parsed = urlparse(content if has_scheme else "http://" + content)
        host = (parsed.hostname or "").lower()
    except ValueError:  # malformed link, e.g. an unmatched "[" or "]"
        return _result([(0.3, "رابط غير صالح", "الرابط مكتوب بصيغة غير صحيحة، وهذا شائع في الروابط المموّهة.")])
    lowered = content.lower()
    flags = []  # (points, title, detail)

    if has_scheme and parsed.scheme == "http":
        flags.append((0.2, "اتصال غير مشفّر", "الرابط يستخدم HTTP بدلاً من HTTPS."))
    if IP_RE.match(host):
        flags.append((0.35, "عنوان IP بدلاً من اسم موقع", "المواقع الموثوقة نادراً ما تستخدم عنوان IP مباشرة."))
    if "@" in content:
        flags.append((0.25, "الرمز @ داخل الرابط", "يُستخدم أحياناً لإخفاء الوجهة الحقيقية للرابط."))
    if len(content) > 75:
        flags.append((0.1, "رابط طويل جداً", "الروابط الطويلة تُستخدم لإخفاء الوجهة."))
    if host.count(".") > 3:
        flags.append((0.15, "نطاقات فرعية كثيرة", "كثرة النقاط في اسم الموقع قد تُقلّد موقعاً معروفاً."))
    if host.count("-") >= 2:
        flags.append((0.1, "شرطات كثيرة في اسم الموقع", "أسماء المواقع الاحتيالية تحتوي غالباً على عدة شرطات."))
    if "xn--" in host:
        flags.append((0.25, "حروف مموّهة في اسم الموقع", "قد يستخدم الموقع حروفاً تشبه حروفاً أخرى لتقليد موقع آخر."))
    if any(w in lowered for w in URL_WORDS):
        flags.append((0.15, "كلمات تطلب إجراءً حساساً", "مثل login أو verify أو account داخل الرابط."))

    return _result(flags)


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

    return _result(flags)


def analyze(kind, content):
    if kind == "url":
        return _check_url(content)
    return _check_message(content)