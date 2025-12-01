export function extractItems<T>(res: any): T[] {
  return res?.data?.items ?? res?.data ?? res ?? [];
}
