import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getErrorMessage } from "../api/getErrorMessage";
import VerdictBadge from "../components/VerdictBadge";
import { KIND_LABEL, formatDate } from "../lib/labels";

const CARDS = [
  { kind: "email", to: "/emails", icon: "bxs-envelope", label: "رسائل البريد" },
  { kind: "message", to: "/messages", icon: "bxs-message-dots", label: "الرسائل" },
  { kind: "url", to: "/domains", icon: "bx-globe", label: "النطاقات والروابط" },
];

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/stats")
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err, "تعذّر تحميل الإحصائيات")));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="helper">جارٍ التحميل...</p>;

  return (
    <div className="container">
       

      <div className="stat-grid">
        {CARDS.map((card) => {
          const s = data.by_kind[card.kind];
          return (
            <Link to={card.to} className="stat-card" key={card.kind}>
              <div className="stat-top">
                <i className={`bx ${card.icon}`}></i>
                <span>{card.label}</span>
              </div>
              <div className="stat-num">{s.total}</div>

              <div className="bar" aria-hidden="true">
                <span className="safe" style={{ flex: s.safe }} />
                <span className="suspicious" style={{ flex: s.suspicious }} />
                <span className="phishing" style={{ flex: s.phishing }} />
              </div>
              <div className="stat-split">
                <span className="safe">آمن {s.safe}</span>
                <span className="suspicious">مشبوه {s.suspicious}</span>
                <span className="phishing">احتيال {s.phishing}</span>
              </div>

              {card.kind === "url" && (
                <p className="helper">{data.unique_domains} نطاق مختلف</p>
              )}
            </Link>
          );
        })}
      </div>

      <section className="panel">
        <h3>آخر الفحوصات</h3>
        {data.recent.length === 0 ? (
          <p className="empty">
            لم تُجرِ أي فحص بعد. <Link className="back-link" to="/scan">ابدأ فحصاً جديداً</Link>
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>المحتوى</th>
                  <th>النتيجة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((s) => (
                  <tr key={s.id}>
                    <td>{KIND_LABEL[s.kind]}</td>
                    <td className="preview">
                      <Link to={`/scans/${s.id}`}>{s.preview}</Link>
                    </td>
                    <td><VerdictBadge verdict={s.verdict} /></td>
                    <td>{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
