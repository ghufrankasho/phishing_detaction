// src/pages/ScanDetail.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getOne, create } from "../api";

const KIND_LABEL = { url: "Link / Domain", email: "Email", message: "Message" };
const VERDICT_LABEL = { safe: "Safe", suspicious: "Suspicious", phishing: "Phishing" };
const SUMMARY = {
  safe: "No signs of fraud were found. The content appears safe.",
  suspicious: "Some suspicious signs were found. Verify the sender before acting.",
  phishing: "Strong signs of fraud. Do not open the link or share any information.",
};

 

export default function ScanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [error, setError] = useState("");

  // "add to domain list" form (null = use the value derived from the scan)
  const [domainEdit, setDomainEdit] = useState(null);
  const [listTypeEdit, setListTypeEdit] = useState(null);
  const [notesEdit, setNotesEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { type: "ok" | "err", text }

  useEffect(() => {
    let cancelled = false;
    getOne("scans", id)
      .then((data) => { if (!cancelled) setScan(data); })
      .catch((err) => { if (!cancelled) setError(err.message || "Unable to load the scan"); });
    return () => { cancelled = true; };
  }, [id]);

  const verdict = scan?.label || "safe";
  const domain = scan?.kind === "url" ?scan.content : "";

  const domainValue = domainEdit ?? domain;
  const listTypeValue = listTypeEdit ?? (verdict === "safe" ? "whitelist" : "blacklist");
  const notesValue = notesEdit ??  "";

  const addDomain = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await create("domain_lists", {
        domain: domainValue.trim().toLowerCase(),
        list_type: listTypeValue,
        notes: notesValue,
      });
      setSaveMsg({ type: "ok", text: `${domainValue} was added to the ${listTypeValue}.` });
    } catch (err) {
      setSaveMsg({ type: "err", text: err.message || "Failed to add the domain" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sd-page">
      <button className="sd-back" onClick={() => navigate(-1)}>← Back to list</button>

      {error && <p className="sd-error">{error}</p>}
      {!scan && !error && <p className="sd-helper">Loading...</p>}

      {scan && (
        <section className="sd-panel">
          <div className="sd-head">
            <div>
              <h2>{KIND_LABEL[scan.kind] || scan.kind}</h2>
              <p className="sd-helper">
                {domain && `${domain} • `}
                {new Date(scan.created_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p className="sd-helper">
                Submitted by <b>{scan.user_name || `User #${scan.user_id}`}</b>
                {scan.user_email && ` (${scan.user_email})`}
              </p>
            </div>

            <div className={`sd-score ${verdict}`}>
              <span>{scan.score ?? "—"}%</span>
              <small>Risk rate</small>
            </div>
          </div>

          <p className={`sd-verdict ${verdict}`}>
            <strong>{VERDICT_LABEL[verdict] || verdict}</strong> {SUMMARY[verdict]}
          </p>

          <h3>Scanned content</h3>
          <div className="sd-content">{scan.content}</div>

          {scan.kind === "url" && (
            <>
              <h3>Add to domain list</h3>
              <form className="sd-add" onSubmit={addDomain}>
                <input
                  required
                  placeholder="example.com"
                  value={domainValue}
                  onChange={(e) => setDomainEdit(e.target.value)}
                />
                <select value={listTypeValue} onChange={(e) => setListTypeEdit(e.target.value)}>
                  <option value="blacklist">Blacklist</option>
                  <option value="whitelist">Whitelist</option>
                </select>
                <input
                  placeholder="Notes (optional)"
                  value={notesValue}
                  onChange={(e) => setNotesEdit(e.target.value)}
                />
                <button type="submit" disabled={saving}>
                  {saving ? "Adding..." : "Add to list"}
                </button>
              </form>

              {saveMsg && (
                <p className={saveMsg.type === "ok" ? "sd-ok" : "sd-error"}>
                  {saveMsg.text}{" "}
                  {saveMsg.type === "ok" && <Link to="/domains">View domain lists</Link>}
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}