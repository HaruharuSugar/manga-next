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
    throw new Error(`シートの取得に失敗しました: ${res.status}`);
  }

  const rows = parseCSV(await res.text());
  const headers = rows[0].map((h) => h.trim());

  const records = rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (r[i] || "").trim();
      });
      return obj;
    });

  // 同じ slug の行を、1作品にまとめる
  const map = new Map();
  for (const r of records) {
    if (!r.slug) {
      console.warn(`slug が空の行をスキップしました: ${r.title}`);
      continue;
    }
    if (!map.has(r.slug)) {
      map.set(r.slug, { slug: r.slug, title: r.title, description: "", seasons: [] });
    }
    const w = map.get(r.slug);
    if (!w.title && r.title) w.title = r.title;
    if (!w.description && r.description) w.description = r.description;
    w.seasons.push({
      season: r.season,
      media: r.media,
      anime: r.anime,
      next: r.next,
      note: r.note,
      amazon: r.amazon
    });
  }

    // 最後の行の期を最新期とし、その期の全媒体の行を latests にまとめる
  return [...map.values()].map((w) => {
    const latest = w.seasons[w.seasons.length - 1];
    const latests = w.seasons.filter((s) => s.season === latest.season);
    return { ...w, latest, latests };
  });
}
}
