export function unwrapSupabase<T>(res: any): { data: T | null; error: any } {
  if (!res) return { data: null, error: new Error('no response') };
  const data = res?.data ?? null;
  const error = res?.error ?? null;
  return { data, error };
}

export function safeParse<T>(v: unknown): T | null {
  try {
    return v as T;
  } catch (e) {
    return null;
  }
}
