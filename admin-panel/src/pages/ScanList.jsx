import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOne, list } from "../api"; // Using your api.js helpers
import VerdictBadge from "../components/VerdictBadge";
 

const LIMIT = 10;

export default function ScanList({ kind, title }) {
  const [verdict, setVerdict] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    setError("");

    // Using your list helper which formats range, sort, and filters correctly
    list("scans", {
      page,
      perPage: LIMIT,
      filter: {
        kind: kind,
        ...(verdict ? { verdict } : {}),
      },
    })
      .then((res) => {
        if (!cancelled) {
          // Since your api.js request helper returns { data, total } 
          // and formats Content-Range automatically:
          setData({
            items: res.data,
            total: res.total,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "تعذّر تحميل القائمة");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kind, verdict, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const isUrl = kind === "url";

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
            <option value="suspicious">مشبوه</option>
            <option value="phishing">احتيال</option>
          </select>
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
                    {isUrl && <td>{s.domain || "—"}</td>}
                    <td className="preview">
                      <Link to={`/scans/${s.id}`}>{s.content ? s.content.substring(0, 50) + "..." : "عرض التفاصيل"}</Link>
                    </td>
                    <td><VerdictBadge verdict={s.verdict || s.label} /></td>
                    <td>{Math.round((s.score || 0) * 100)}%</td>
                    <td>{s.created_at ? formatDate(s.created_at) : "—"}</td>
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
    </div>
  );
}