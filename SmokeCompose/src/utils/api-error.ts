import { isAxiosError } from "axios";

import type { ApiErrorEnvelope, ApiMessageItem } from "@/endpoints/Types";

export type { ApiErrorEnvelope, ApiMessageItem };

function codeFromValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const code = codeFromValue(item);
      if (code) return code;
    }
    return null;
  }

  if (value && typeof value === "object" && "code" in value) {
    const code = (value as ApiMessageItem).code;
    if (typeof code === "string" && code.trim()) return code.trim();
  }

  return null;
}

function envelopeMessages(error: unknown): Record<string, unknown> | null {
  if (!isAxiosError(error)) return null;

  const messages = (error.response?.data as { messages?: unknown } | undefined)
    ?.messages;
  if (!messages || typeof messages !== "object") return null;

  if (!Array.isArray(messages)) {
    return messages as Record<string, unknown>;
  }

  const mapped: Record<string, unknown> = {};
  for (let i = 0; i < messages.length; i += 1) {
    const item = messages[i];
    if (item && typeof item === "object") {
      const field = (item as { field?: unknown }).field;
      if (typeof field === "string" && field.trim()) {
        mapped[field.trim()] = item;
      } else {
        mapped[`_${i}`] = item;
      }
    }
  }
  return mapped;
}

function messageFromValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) return item;
      if (item && typeof item === "object" && "message" in item) {
        const text = (item as ApiMessageItem).message;
        if (typeof text === "string" && text.trim()) return text;
      }
    }
  }

  if (value && typeof value === "object" && "message" in value) {
    const text = (value as ApiMessageItem).message;
    if (typeof text === "string" && text.trim()) return text;
  }

  return null;
}

export const NETWORK_ERROR_MESSAGE =
  "Could not reach the API. Check the network or that the server is running.";

export const SERVER_ERROR_MESSAGE =
  "The API returned a server error. Try again later.";

export function isNetworkError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  return (
    !error.response ||
    error.code === "ERR_NETWORK" ||
    error.code === "ECONNREFUSED" ||
    error.code === "ETIMEDOUT" ||
    error.message === "Network Error"
  );
}

export function isServerError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return typeof status === "number" && status >= 500;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;
  if (isServerError(error)) return SERVER_ERROR_MESSAGE;

  if (!isAxiosError(error)) {
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallback;
  }

  const data = error.response?.data as
    | { messages?: Record<string, unknown>; detail?: unknown }
    | undefined;

  const messages = envelopeMessages(error);
  if (messages) {
    for (const value of Object.values(messages)) {
      const message = messageFromValue(value);
      if (message) return message;
    }
  }

  const detail = messageFromValue(data?.detail);
  if (detail) return detail;

  return fallback;
}

export function getApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null;

  const data = error.response?.data as
    | { messages?: Record<string, unknown>; detail?: unknown; code?: unknown }
    | undefined;

  if (typeof data?.code === "string" && data.code.trim()) {
    return data.code.trim();
  }

  const messages = envelopeMessages(error);
  if (messages) {
    for (const value of Object.values(messages)) {
      const code = codeFromValue(value);
      if (code) return code;
    }
  }

  return codeFromValue(data?.detail);
}

export function getApiHttpStatus(error: unknown): number | undefined {
  if (!isAxiosError(error)) return undefined;
  return error.response?.status;
}

export function getApiErrorFieldCode(
  error: unknown,
  field: string,
): string | null {
  const messages = envelopeMessages(error);
  if (!messages || !(field in messages)) return null;
  return codeFromValue(messages[field]);
}

export function getApiErrorFieldMessage(
  error: unknown,
  field: string,
): string | null {
  const messages = envelopeMessages(error);
  if (!messages || !(field in messages)) return null;
  return messageFromValue(messages[field]);
}

export function extractApiFieldErrors(
  error: unknown,
): Record<string, string> {
  const messages = envelopeMessages(error);
  if (!messages) return {};

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(messages)) {
    const msg = messageFromValue(value);
    if (msg) result[key] = msg;
  }
  return result;
}
