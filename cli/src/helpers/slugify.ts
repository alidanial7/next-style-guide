/** Lowercase slug: spaces / hyphens / dots → `_` */
export function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[\s.-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (!slug) {
    throw new Error(`Could not derive a package slug from "${name}".`);
  }
  if (/^[0-9]/.test(slug)) {
    return `app_${slug}`;
  }
  return slug;
}
