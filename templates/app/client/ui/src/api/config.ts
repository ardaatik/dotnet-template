function resolveApiOrigin(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured !== undefined && configured !== '') {
    return configured.replace(/\/$/, '');
  }

  return import.meta.env.DEV ? 'http://localhost:5000' : '';
}

export const API_ORIGIN = resolveApiOrigin();
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const HATEOAS_ACCEPT = 'application/vnd.dotnet-template.hateoas+json';

/** Rewrites server HATEOAS URLs to match the configured API base (path, host, scheme). */
export function resolveApiUrl(url: string): string {
  if (!url) return url;

  if (url.startsWith('/api')) {
    return API_ORIGIN ? `${API_ORIGIN}${url}` : url;
  }

  try {
    const { pathname, search } = new URL(url);
    if (pathname.startsWith('/api')) {
      const path = `${pathname}${search}`;
      return API_ORIGIN ? `${API_ORIGIN}${path}` : path;
    }
  } catch {
    // Not an absolute URL; leave unchanged.
  }

  return url;
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data as T;
}
