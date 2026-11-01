import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { getErrorMessage } from "../api/getErrorMessage";
import VerdictBadge from "../components/VerdictBadge";
import { KIND_LABEL, KIND_PATH, formatDate } from "../lib/labels";

export default function ScanDetail() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setScan(null);
    setError("");
    api
      .get(`/scans/${id}`)
      .then((res) => setScan(res.data))
      .catch((err) => setError(getErrorMessage(err, "تعذّر تحميل التفاصيل")));
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
            <p className="helper">{formatDate(scan.created_at)}</p>
          </div>
          <div className={`score ${scan.label}`} title="نسبة الخطر">
            {Math.round(scan.score)}%
          </div>
        </div>

        <p className={`verdict ${scan.label}`}>
          <VerdictBadge verdict={scan.label} />
        </p>

        <h3 className="section-gap">المحتوى الذي فُحص</h3>
        <div className="detail-content">{scan.content}</div>
      </section>
    </div>
  );
}