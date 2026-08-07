// Xuất dữ liệu ra file CSV (Module 13: Xuất dữ liệu CSV/Excel)
export function exportToCsv(rows, headers, filename = "r2s-leadops-export.csv") {
  if (!rows || rows.length === 0) return;

  const headerLine = headers.map((h) => `"${h}"`).join(",");
  const bodyLines = rows.map((row) =>
    headers.map((h) => `"${row[h] ?? ""}"`).join(",")
  );
  const csv = [headerLine, ...bodyLines].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
