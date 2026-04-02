/** Safe fetcher for SWR — throws on error responses so SWR treats them as errors */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** Safe array fetcher — always returns an array even if API returns an error */
export async function arrayFetcher<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) return [] as T[];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
