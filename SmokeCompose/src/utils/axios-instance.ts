import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { unwrapApiResult } from "@/utils/api-result";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/utils/token-storage";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Shared Axios client for `src/endpoints/*`. Do not call from UI directly. */
export const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.setAuthorization(`Bearer ${accessToken}`);
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh || !baseURL) {
    return null;
  }

  try {
    const { data } = await axios.post(`${baseURL}/auth/refresh/`, { refresh });
    const payload = unwrapApiResult<{ access?: string; refresh?: string }>(data);
    const access = payload.access;
    if (!access) {
      clearTokens();
      return null;
    }
    setTokens({ access, refresh: payload.refresh ?? refresh });
    return access;
  } catch {
    clearTokens();
    return null;
  }
}

function shouldSkipRefresh(url: string | undefined) {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    if (
      !original ||
      error.response?.status !== 401 ||
      original._retry ||
      shouldSkipRefresh(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const access = await refreshPromise;
    if (!access) {
      return Promise.reject(error);
    }

    original.headers.setAuthorization(`Bearer ${access}`);
    return api(original);
  },
);
