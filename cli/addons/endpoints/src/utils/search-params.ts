/** Build `?a=1&b=2` from a params object (skips empty values). */
export function toSearchParams(
  params:
    | Record<string, string | number | boolean | null | undefined>
    | undefined,
): string {
  if (!params) {
    return "";
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}
