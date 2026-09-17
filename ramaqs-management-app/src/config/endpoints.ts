const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

// Development keeps the local convenience; production must use VITE_API_URL or
// the reverse-proxy same-origin /api endpoint. No production localhost fallback.
export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api');

const browserOrigin = typeof window === 'undefined' ? '' : window.location.origin;
export const API_ORIGIN = /^https?:\/\//.test(API_BASE_URL)
  ? API_BASE_URL.replace(/\/api(?:\/.*)?$/, '')
  : browserOrigin;

export const WS_BASE_URL = import.meta.env.VITE_WS_URL?.replace(/\/+$/, '')
  || API_ORIGIN.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
