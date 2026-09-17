/** Shared optional `?page=` search-param validation for paginated listing routes. */
export function validatePageSearch(search: Record<string, unknown>): { page?: number } {
  const page = Number(search["page"]);
  return Number.isFinite(page) && page > 1 ? { page } : {};
}
