import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getErrorMessage } from "../api/getErrorMessage";
import { VERDICT_LABEL } from "../lib/labels";

const FIELD = {
  url: { label: "الرابط", placeholder: "https://example.com/..." },
  email: { label: "نص البريد", placeholder: "الصق نص البريد الإلكتروني هنا" },
  message: { label: "نص الرسالة", placeholder: "الصق نص الرسالة هنا" },
};

export default function NewScan() {
  const [kind, setKind] = useState("url");
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post("/scan", { kind, content });
      setResult(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "فشل الفحص"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="workspace">
        <form className="panel" onSubmit={handleScan}>
          <h3>فحص جديد</h3>

          <label htmlFor="content">{FIELD[kind].label}</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={FIELD[kind].placeholder}
            required
          />

          <div className="form-row">
            <div>
              <label htmlFor="kind">نوع المحتوى</label>
              <select id="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="url">رابط / نطاق</option>
                <option value="email">بريد إلكتروني</option>
                <option value="message">رسالة</option>
              </select>
            </div>
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "جارٍ الفحص..." : "افحص الآن"}
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          <p className="helper">الحد الأقصى 5000 حرف. تُحفظ نتيجة كل فحص في سجلّك.</p>
        </form>

        <section className="panel result">
          {!result ? (
            <p className="empty">ستظهر نتيجة الفحص هنا.</p>
          ) : (
            <>
              <div className="result-head">
                <h3>النتيجة: {VERDICT_LABEL[result.verdict]}</h3>
                <div className={`score ${result.verdict}`} title="نسبة الخطر">
                  {Math.round(result.score * 100)}%
                </div>
              </div>

              <p className={`verdict ${result.verdict}`}>{result.summary}</p>

              {result.indicators.length > 0 && (
                <div className="indicators">
                  {result.indicators.map((item) => (
                    <div className="indicator" key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                  ))}
                </div>
              )}

              <Link className="back-link" to={`/scans/${result.scan_id}`}>
                عرض التفاصيل الكاملة
              </Link>
            </>
          )}
        </section>
      </div>
    </>
  );
}