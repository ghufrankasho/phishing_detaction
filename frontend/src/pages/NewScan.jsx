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

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  opacity: 0,
  overflow: "hidden",
};

export default function NewScan() {
  const [kind, setKind] = useState("url");
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null); // temporary URL of the chosen image
  const [fileName, setFileName] = useState("");

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

  const uploadQr = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("الملف ليس صورة");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);

    setError("");
    setResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/scan/barcode", formData);
      setResult(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "فشل فحص الباركود"));
    } finally {
      setLoading(false);
    }
  };

  const onPick = (e) => {
    uploadQr(e.target.files?.[0]);
    e.target.value = ""; // lets the user pick the same file again
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!loading) uploadQr(e.dataTransfer.files?.[0]);
  };

  const dropzoneStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "22px 16px",
    marginTop: 8,
    border: `2px dashed ${dragOver ? "#0e7490" : "#9ccfd8"}`,
    borderRadius: 14,
    background: dragOver ? "#e0f7fa" : "#f5fbfd",
    color: "#35516b",
    textAlign: "center",
    cursor: loading ? "wait" : "pointer",
    transition: "all 0.15s ease",
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

          <p style={{ margin: "18px 0 0", textAlign: "center", color: "#7a8ea3" }}>
            ── أو ──
          </p>

          <label
            htmlFor="qr"
            style={dropzoneStyle}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {preview ? (
              <img
                src={preview}
                alt="معاينة الباركود"
                style={{
                  width: 110,
                  height: 110,
                  objectFit: "contain",
                  borderRadius: 10,
                  background: "#fff",
                  border: "1px solid #d6e6ec",
                }}
              />
            ) : (
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="1.6">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" />
              </svg>
            )}

            <strong style={{ color: "#0e7490" }}>
              {loading ? "جارٍ قراءة الباركود..." : "افحص باركود (QR)"}
            </strong>
            <span style={{ fontSize: 13 }}>
              {fileName && !loading
                ? fileName
                : "اسحب الصورة هنا أو اضغط للاختيار"}
            </span>
          </label>
          <input
            id="qr"
            type="file"
            accept="image/*"
            onChange={onPick}
            disabled={loading}
            style={visuallyHidden}
          />

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

              {result.content && (
                <p
                  className="helper"
                  dir="ltr"
                  style={{
                    wordBreak: "break-all",
                    background: "#f5fbfd",
                    border: "1px solid #d6e6ec",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                >
                  {result.content}
                </p>
              )}

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