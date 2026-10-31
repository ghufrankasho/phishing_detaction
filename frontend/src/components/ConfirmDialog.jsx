// src/components/ConfirmDialog.jsx
import { useEffect, useState } from "react";
import "../styles.css";

function DialogContent({
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

  // Close modal on Escape press
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const handleConfirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (e) {
      setError(e.message || "فشلت العملية");
      setBusy(false);
    }
  };

  const lines = details.filter(Boolean);

  return (
    <div className="cd-backdrop" onClick={() => !busy && onCancel()}>
      <div className="cd-card" dir="rtl" onClick={(e) => e.stopPropagation()}>
        {/* Top accent line */}
        <div className="cd-accent-bar" />

        <div className="cd-inner">
          {/* Yellow pixelated style warning icon */}
          <div className="cd-icon-container">
            <svg
              className="cd-icon"
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="#facc15"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h3 className="cd-title">{title}</h3>
          <p className="cd-message">{message}</p>

          {/* User details section */}
          {lines.length > 0 && (
            <div className="cd-details">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={`cd-detail-line ${i === 0 ? "cd-main-name" : "cd-sub-info"}`}
                >
                  {line}
                </div>
              ))}
            </div>
          )}

          {error && <p className="cd-error">{error}</p>}

          {/* Side-by-side action buttons */}
          <div className="cd-actions">
            <button
              type="button"
              className="cd-btn cd-confirm-btn"
              onClick={handleConfirm}
              disabled={busy}
            >
              {busy ? "..." : confirmText}
            </button>
            <button
              type="button"
              className="cd-btn cd-cancel-btn"
              onClick={onCancel}
              disabled={busy}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmDialog({
  open,
  title = "هل أنت متأكد من حذف هذا الموظف؟",
  message = ".هذا الإجراء لا يمكن التراجع عنه",
  details = [],
  confirmText = "حذف",
  cancelText = "إلغاء",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <DialogContent
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