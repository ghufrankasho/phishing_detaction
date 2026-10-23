import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOne } from "../api"; // Using your api.js helper
import { getErrorMessage } from "../components/getErrorMessage";
import VerdictBadge from "../components/VerdictBadge";
import { KIND_LABEL, KIND_PATH, formatDate } from "../lib/labels";

export default function ScanDetail() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScan(null);
    setError("");

    // Using your getOne helper function (e.g. gets /scans/{id})
    getOne("scans", id)
      .then((data) => {
        if (!cancelled) setScan(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "تعذّر تحميل التفاصيل"));
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
        <Link className="back-link" to="/dashboard">العودة للرئيسية</Link>
      </div>
    );
  }
  if (!scan) return <p className="helper">جارٍ التحميل...</p>;

  return (
    <div className="container">
      <Link className="back-link" to={KIND_PATH[scan.kind]}>
        ← العودة إلى القائمة
      </Link>

      <section className="panel">
        <div className="result-head">
          <div>
            <h3>{KIND_LABEL[scan.kind]}</h3>
            <p className="helper">
              {scan.domain ? `${scan.domain} - ` : ""}
              {formatDate(scan.created_at)}
            </p>
          </div>
          <div className={`score ${scan.verdict || scan.label}`} title="نسبة الخطر">
            {Math.round((scan.score || 0) * 100)}%
          </div>
        </div>

        <p className={`verdict ${scan.verdict || scan.label}`}>
          <VerdictBadge verdict={scan.verdict || scan.label} /> {scan.summary || "نتائج تحليل الفحص"}
        </p>

        {scan.indicators && scan.indicators.length > 0 && (
          <>
            <h3>المؤشرات</h3>
            <div className="indicators">
              {scan.indicators.map((item) => (
                <div className="indicator" key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="section-gap">المحتوى الذي فُحص</h3>
        <div className="detail-content">{scan.content}</div>
      </section>
    </div>
  );
}