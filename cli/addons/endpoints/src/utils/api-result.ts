/**
 * django-style-guide endpoints usually return `{ result, status, success, messages }`.
 * Some auth responses may be the bare payload.
 */
export function unwrapApiResult<T>(data: unknown): T {
  if (data && typeof data === "object" && "result" in data) {
    const result = (data as { result: unknown }).result;
    if (result !== undefined && result !== null) {
      return result as T;
    }
  }
  return data as T;
}
