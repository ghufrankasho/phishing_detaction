import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatScanRows(items, isUrl) {
  return items.map((s, idx) => {
    const row = {
      "#": idx + 1,
      ID: s.id ?? "-",
      "User Name": s.user_name || "-",
      "User Email": s.user_email || "-",
    };

    if (isUrl) {
      row["Domain"] = s.domain || "-";
    }

    row["Content"] = s.content || s.preview || "-";
    row["Result"] = (s.label || "-").toUpperCase();
    row["Risk Score"] = s.score != null ? `${Math.round(s.score)}%` : "-";
    row["Date"] = s.created_at ? new Date(s.created_at).toLocaleString() : "-";

    return row;
  });
}

export function exportScansToExcel(items, { kind = "message", title = "Scans" } = {}) {
  if (!items || items.length === 0) return;

  const isUrl = kind === "url";
  const rows = formatScanRows(items, isUrl);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 5 },  // #
    { wch: 8 },  // ID
    { wch: 20 }, // User Name
    { wch: 26 }, // User Email
    ...(isUrl ? [{ wch: 24 }] : []), // Domain
    { wch: 50 }, // Content
    { wch: 12 }, // Result
    { wch: 12 }, // Risk Score
    { wch: 22 }, // Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31));
  const dateTag = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${kind}-scans-${dateTag}.xlsx`);
}

export function exportScansToPDF(items, { kind = "message", title = "Scans" } = {}) {
  if (!items || items.length === 0) return;

  const isUrl = kind === "url";
  const doc = new jsPDF({ orientation: "landscape" });

  // Title & Metadata
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`${title} Report`, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Records: ${items.length}`, 14, 25);

  const rows = formatScanRows(items, isUrl);
  const headers = [
    "#",
    "ID",
    "User Name",
    "User Email",
    ...(isUrl ? ["Domain"] : []),
    "Content",
    "Result",
    "Risk",
    "Date",
  ];

  const body = rows.map((r) => {
    const contentText = String(r["Content"]);
    const truncated = contentText.length > 65 ? contentText.slice(0, 62) + "..." : contentText;
    return [
      r["#"],
      r.ID,
      r["User Name"],
      r["User Email"],
      ...(isUrl ? [r["Domain"]] : []),
      truncated,
      r["Result"],
      r["Risk Score"],
      r["Date"],
    ];
  });

  const resultColIndex = isUrl ? 6 : 5;

  autoTable(doc, {
    startY: 31,
    head: [headers],
    body,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === resultColIndex) {
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
  doc.save(`${kind}-scans-${dateTag}.pdf`);
}