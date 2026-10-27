// src/components/ConfirmDialog.jsx
import { useEffect, useRef, useState } from "react";

function BoxContent({
  title,
  message,
  details,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);

  // bring the box into view when it appears
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleConfirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm(); // the parent hides the box on success
    } catch (e) {
      setError(e.message || "فشلت العملية");
      setBusy(false);
    }
  };

  const lines = details.filter(Boolean);

  return (
    <div className="cd-inline" ref={ref}>
      <div className="cd-box" dir="rtl">
        <div className="cd-inner">
          <svg className="cd-icon" viewBox="0 0 64 64" width="56" height="56">
            <path d="M32 4 2 58h60L32 4z" fill="#f5c518" stroke="#b8890b" strokeWidth="2" strokeLinejoin="round" />
            <rect x="29" y="22" width="6" height="20" rx="2" fill="#1a1a1a" />
            <circle cx="32" cy="49" r="3.5" fill="#1a1a1a" />
          </svg>

          <h3 className="cd-title">{title}</h3>
          <p className="cd-message">{message}</p>

          {lines.length > 0 && (
            <div className="cd-details">
              {lines.map((line, i) => (
                <div key={i} className={i === 0 ? "cd-main" : ""}>{line}</div>
              ))}
            </div>
          )}

          {error && <p className="cd-error">{error}</p>}

          <div className="cd-actions">
            <button className="cd-btn cd-cancel" onClick={onCancel} disabled={busy}>
              {cancelText}
            </button>
            <button className="cd-btn cd-delete" onClick={handleConfirm} disabled={busy}>
              {busy ? "..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmDialog({
  open,
  title = "هل أنت متأكد من الحذف؟",
  message = "هذا الإجراء لا يمكن التراجع عنه.",
  details = [],
  confirmText = "حذف",
  cancelText = "إلغاء",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <BoxContent
      title={title}
      message={message}
      details={details}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}