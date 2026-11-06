export function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const group = key(item);
    (result[group] ??= []).push(item);
  }
  return result;
}

export function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function stripBraces(value: string) {
  return value.replace(/^\{|\}$/g, "");
}

export function pascalCase(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join("");
}

export function camelCase(value: string) {
  const pascal = pascalCase(value);
  return pascal ? pascal[0]!.toLowerCase() + pascal.slice(1) : pascal;
}

export function safeKey(key: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : JSON.stringify(key);
}

export function escapeComment(value: string) {
  return value.replace(/\*\//g, "*\\/").replace(/\n/g, " ");
}
