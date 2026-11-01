export default function ConfirmDialog({
  open,
  title,
  message,
  details = [],
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const shownDetails = details.filter(Boolean);

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          color: "#111",
          padding: "24px",
          borderRadius: "10px",
          width: "min(420px, 90%)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {message && <p>{message}</p>}

        {shownDetails.length > 0 && (
          <ul style={{ paddingInlineStart: "18px", color: "#555" }}>
            {shownDetails.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", cursor: "pointer" }}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}