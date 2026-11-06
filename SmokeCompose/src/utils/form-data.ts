/**
 * JSON body as-is, or multipart FormData when any value is a File/Blob.
 * Used by OpenAPI codegen for upload endpoints.
 */
export function toApiBody(
  body: Record<string, unknown> | undefined,
): FormData | Record<string, unknown> | undefined {
  if (!body) {
    return undefined;
  }

  const hasFile = Object.values(body).some(
    (value) =>
      (typeof File !== "undefined" && value instanceof File) ||
      (typeof Blob !== "undefined" && value instanceof Blob),
  );

  if (!hasFile) {
    return body;
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    if (
      (typeof File !== "undefined" && value instanceof File) ||
      (typeof Blob !== "undefined" && value instanceof Blob)
    ) {
      form.append(key, value);
    } else if (typeof value === "object") {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, String(value));
    }
  }
  return form;
}
