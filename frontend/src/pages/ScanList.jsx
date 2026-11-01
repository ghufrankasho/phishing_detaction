import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getErrorMessage } from "../api/getErrorMessage";
import VerdictBadge from "../components/VerdictBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatDate } from "../lib/labels";

const LIMIT = 10;

export default function ScanList({ kind, title }) {
  const [verdict, setVerdict] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false); // controls the dialog
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    setSelected([]);
    api
      .get("/scans", {
        params: { kind, verdict: verdict || undefined, page, limit: LIMIT },
      })
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(getErrorMessage(err, "تعذّر تحميل القائمة")));
    return () => {
      cancelled = true;
    };
  }, [kind, verdict, page, reloadKey]);

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const isUrl = kind === "url";

  const pageIds = data ? data.items.map((s) => s.id) : [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelected(allSelected ? [] : pageIds);
  };

  // Runs when the user clicks "Delete" inside the dialog
  const confirmDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.post("/scans/delete", { ids: selected });

      // If we deleted every row on this page, go back one page
      if (selected.length === data.items.length && page > 1) {
        setPage(page - 1);
      } else {
        setReloadKey((k) => k + 1);
      }
    } catch (err) {
      setError(getErrorMessage(err, "فشل الحذف"));
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h2 className="page-title">{title}</h2>
        {data && <p className="lead">{data.total} فحص</p>}
      </div>

      <section className="panel">
        <div className="toolbar">
          <select
            aria-label="تصفية حسب النتيجة"
            value={verdict}
            onChange={(e) => {
              setVerdict(e.target.value);
              setPage(1);
            }}
          >
            <option value="">كل النتائج</option>
            <option value="safe">آمن</option>
            <option value="phishing">احتيال</option>
          </select>

          {selected.length > 0 && (
            <button
              className="link-btn"
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
            >
              {deleting ? "جارٍ الحذف..." : `حذف المحدد (${selected.length})`}
            </button>
          )}

          <Link className="back-link" to="/scan">+ فحص جديد</Link>
        </div>

        {error && <p className="error">{error}</p>}
        {!data && !error && <p className="helper">جارٍ التحميل...</p>}

        {data && data.items.length === 0 && (
          <p className="empty">لا توجد نتائج هنا بعد.</p>
        )}

        {data && data.items.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="تحديد الكل"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  {isUrl && <th>النطاق</th>}
                  <th>المحتوى</th>
                  <th>النتيجة</th>
                  <th>نسبة الخطر</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label="تحديد"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleOne(s.id)}
                      />
                    </td>
                    {isUrl && <td>{s.domain}</td>}
                    <td className="preview">
                      <Link to={`/scans/${s.id}`}>{s.preview}</Link>
                    </td>
                    <td><VerdictBadge verdict={s.verdict} /></td>
                    <td>{Math.round(s.score * 100)}%</td>
                    <td>{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && pages > 1 && (
          <div className="pager">
            <button className="link-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              السابق
            </button>
            <span>{page} / {pages}</span>
            <button className="link-btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              التالي
            </button>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="هل أنت متأكد من حذف العناصر المحددة؟"
        message="لا يمكن التراجع عن هذا الإجراء."
        details={[`عدد العناصر: ${selected.length}`]}
        confirmText="حذف"
        cancelText="إلغاء"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}