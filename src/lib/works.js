// File: src/lib/works.js
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export async function getWorks() {
  const url = process.env.CSV_URL ?? import.meta.env.CSV_URL;
  if (!url) {
    throw new Error("CSV_URL が設定されていません");
  }

  const res = await fetch(url);
  if (!res.ok) {
    // 失敗したまま空のサイトを公開しないよう、ビルドを止める
    throw new Error(`シートの取得に失敗しました: ${res.status}`);
  }

  const rows = parseCSV(await res.text());
  const headers = rows[0].map((h) => h.trim());

  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (r[i] || "").trim();
      });
      return obj;
    });
}