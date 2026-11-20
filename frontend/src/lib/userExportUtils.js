import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatUserScanRows(items, isUrl, formatDateFn) {
  return items.map((s, idx) => {
    const row = {
      "#": idx + 1,
      ID: s.id ?? "-",
      ...(isUrl ? { Domain: s.domain || "-" } : {}),
      Content: s.preview || s.content || "-",
      Verdict: (s.verdict || "-").toUpperCase(),
      Risk: s.score != null ? `${Math.round(s.score * 100)}%` : "-",
      Date: s.created_at ? (formatDateFn ? formatDateFn(s.created_at) : new Date(s.created_at).toLocaleString()) : "-",
    };
    return row;
  });
}

export function exportUserScansToExcel(items, { kind = "scan", isUrl = false, formatDateFn } = {}) {
  if (!items || items.length === 0) return;

  const rows = formatUserScanRows(items, isUrl, formatDateFn);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 8 },
    ...(isUrl ? [{ wch: 24 }] : []),
    { wch: 50 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Scans");
  const dateTag = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `my-${kind}-scans-${dateTag}.xlsx`);
}

export function exportUserScansToPDF(items, { kind = "scan", title = "Scans", isUrl = false, formatDateFn } = {}) {
  if (!items || items.length === 0) return;

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(`${title} - Exported Scans`, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()} | Rows: ${items.length}`, 14, 25);

  const rows = formatUserScanRows(items, isUrl, formatDateFn);
  const headers = [
    "#",
    "ID",
    ...(isUrl ? ["Domain"] : []),
    "Content",
    "Verdict",
    "Risk",
    "Date",
  ];

  const body = rows.map((r) => {
    const contentText = String(r.Content);
    const truncated = contentText.length > 70 ? contentText.slice(0, 67) + "..." : contentText;
    return [
      r["#"],
      r.ID,
      ...(isUrl ? [r.Domain] : []),
      truncated,
      r.Verdict,
      r.Risk,
      r.Date,
    ];
  });

  const verdictColIndex = isUrl ? 4 : 3;

  autoTable(doc, {
    startY: 31,
    head: [headers],
    body,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === verdictColIndex) {
        if (hookData.cell.raw === "PHISHING") {
          hookData.cell.styles.textColor = [220, 38, 38];
          hookData.cell.styles.fontStyle = "bold";
        } else if (hookData.cell.raw === "SAFE") {
          hookData.cell.styles.textColor = [22, 163, 74];
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`my-${kind}-scans-${dateTag}.pdf`);
}