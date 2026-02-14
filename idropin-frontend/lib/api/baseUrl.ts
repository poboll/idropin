export function resolveApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window === 'undefined') {
    return env || 'http://localhost:8081/api';
  }

  const { protocol, hostname } = window.location;
  const derived = `${protocol}//${hostname}:8081/api`;
  if (!env) return derived;

  try {
    const envUrl = new URL(env, derived);
    const pageHost = hostname;

    const isLoopbackHost = (h: string) => h === 'localhost' || h === '127.0.0.1';
    const isPrivateIpv4 = (h: string) => {
      const parts = h.split('.').map((p) => Number(p));
      if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
      const [a, b] = parts;
      if (a === 10) return true;
      if (a === 192 && b === 168) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      return false;
    };

    const shouldRewriteToPageHost =
      envUrl.hostname !== pageHost &&
      (isLoopbackHost(envUrl.hostname) || isPrivateIpv4(envUrl.hostname)) &&
      (isLoopbackHost(pageHost) || isPrivateIpv4(pageHost));

    if (shouldRewriteToPageHost) {
      envUrl.hostname = pageHost;
    }

    return envUrl.toString();
  } catch {
    return env;
  }
}

export const API_BASE_URL = resolveApiBaseUrl();

export function normalizeBackendUrl(input: string): string {
  if (!input) return input;
  if (typeof window === 'undefined') return input;

  try {
    const url = new URL(input, API_BASE_URL);
    const pageHost = window.location.hostname;
    const isPageLoopback = pageHost === 'localhost' || pageHost === '127.0.0.1';
    const isUrlLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    if (!isPageLoopback && isUrlLoopback) {
      url.hostname = pageHost;
    }

    return url.toString();
  } catch {
    return input;
  }
}
