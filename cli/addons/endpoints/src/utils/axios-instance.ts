import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Shared Axios client for `src/endpoints/*`.
 * Do not call from UI components directly — go through generated endpoint modules.
 */
export const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Let the browser set multipart boundary; default JSON Content-Type breaks FormData.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});
