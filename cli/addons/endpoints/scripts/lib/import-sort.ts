/** Same path normalization + collator as `eslint-plugin-simple-import-sort`. */
const importExportCollator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});

export function compareStrings(a: string, b: string): number {
  return importExportCollator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

export function compareImportExportSources(a: string, b: string): number {
  const normalizedA = normalizeImportExportSource(a);
  const normalizedB = normalizeImportExportSource(b);
  return compareStrings(normalizedA, normalizedB) || compareStrings(a, b);
}

function normalizeImportExportSource(source: string): string {
  return source
    .replace(/^[./]*\.$/, "$&/")
    .replace(/^[./]*\/$/, "$&,")
    .replace(/[./_-]/g, (char) => {
      switch (char) {
        case ".":
          return "_";
        case "/":
          return "-";
        case "_":
          return ".";
        case "-":
          return "/";
        default:
          return char;
      }
    });
}

export function emitTypeImport(names: string[], from: string): string {
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  if (sorted.length === 1) {
    return `import type { ${sorted[0]} } from "${from}";`;
  }
  return [`import type {`, ...sorted.map((name) => `  ${name},`), `} from "${from}";`].join("\n");
}
