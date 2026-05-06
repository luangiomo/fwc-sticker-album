import type { Collection } from "#shared/types/album";

export const COLLECTION_EXPORT_FORMAT = "fwc-collection-export-v1";

/** Shared body: header row + data rows (code,count). Import accepts this from either file type. */
export function buildCollectionExportBody(collection: Collection): string {
  const rows = Object.entries(collection)
    .filter(([, count]) => typeof count === "number" && count > 0)
    .sort(([a], [b]) => a.localeCompare(b, "pt", { sensitivity: "base" }));
  const lines = [
    "code,count",
    ...rows.map(([code, count]) => `${code},${count}`),
  ];
  return lines.join("\n");
}

export function serializeCollectionCsv(collection: Collection): string {
  return `${buildCollectionExportBody(collection)}\n`;
}

export function serializeCollectionTxt(collection: Collection): string {
  const iso = new Date().toISOString();
  const header = [
    `# ${COLLECTION_EXPORT_FORMAT}`,
    `# exportedAt=${iso}`,
    "# Linhas que começam com # são ignoradas na importação.",
    "",
  ].join("\n");
  return `${header}${buildCollectionExportBody(collection)}\n`;
}

export type ParseCollectionResult =
  | { ok: true; collection: Collection; warnings: string[] }
  | { ok: false; error: string };

/**
 * Parses CSV/TXT backup. Unknown codes are skipped (warning). Invalid lines skipped.
 */
export function parseCollectionBackup(
  text: string,
  validCodes: Set<string>
): ParseCollectionResult {
  const warnings: string[] = [];
  const collection: Collection = {};
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!.trim();
    if (!raw || raw.startsWith("#")) continue;

    const comma = raw.indexOf(",");
    if (comma <= 0) {
      warnings.push(
        `Linha ${i + 1}: formato inválido (esperado código,quantidade).`
      );
      continue;
    }

    const code = raw.slice(0, comma).trim();
    const countPart = raw.slice(comma + 1).trim();
    if (!code) {
      warnings.push(`Linha ${i + 1}: código vazio.`);
      continue;
    }

    if (/^code$/i.test(code) && /^count$/i.test(countPart)) {
      continue;
    }

    if (!/^\d+$/.test(countPart)) {
      warnings.push(`Linha ${i + 1}: quantidade inválida (${countPart}).`);
      continue;
    }
    const count = Number.parseInt(countPart, 10);
    if (!Number.isFinite(count) || count < 0) {
      warnings.push(`Linha ${i + 1}: quantidade inválida (${countPart}).`);
      continue;
    }
    if (count === 0) continue;

    if (!validCodes.has(code)) {
      warnings.push(`Código desconhecido ignorado: ${code}`);
      continue;
    }

    collection[code] = count;
  }

  const nonCommentLines = lines
    .map((l) => l.trim())
    .filter((t) => t.length > 0 && !t.startsWith("#"));

  if (Object.keys(collection).length === 0) {
    if (nonCommentLines.length === 0) {
      return { ok: false, error: "Arquivo vazio." };
    }
    if (
      nonCommentLines.length === 1 &&
      /^code\s*,\s*count$/i.test(nonCommentLines[0]!)
    ) {
      return { ok: true, collection: {}, warnings };
    }
    return {
      ok: false,
      error: "Nenhuma figurinha válida encontrada no arquivo.",
    };
  }

  return { ok: true, collection, warnings };
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime: string
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type PrintRow = {
  code: string;
  name: string;
  groupName: string;
  count: number;
};

export function openCollectionPrintWindow(rows: PrintRow[], title: string) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return false;

  const head = `<meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 1.2rem; color: #111; }
  h1 { font-size: 1.25rem; margin: 0 0 0.25rem; }
  .meta { color: #555; font-size: 0.85rem; margin-bottom: 1rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
  th, td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; }
  th { background: #f2f2f2; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  @media print {
    body { margin: 0.5cm; }
    a { display: none; }
  }
</style>`;

  const bodyRows = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.code)}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.groupName)}</td><td class="num">${r.count}</td></tr>`
    )
    .join("");

  const when = new Date().toLocaleString("pt-BR");
  w.document.write(`<!DOCTYPE html><html><head>${head}</head><body>
<h1>${escapeHtml(title)}</h1>
<p class="meta">Gerado em ${escapeHtml(when)} · ${rows.length} figurinha(s) com quantidade &gt; 0</p>
<table>
<thead><tr><th>Código</th><th>Figurinha</th><th>Equipe</th><th>Qtd</th></tr></thead>
<tbody>${bodyRows}</tbody>
</table>
</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  return true;
}
