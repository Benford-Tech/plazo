/**
 * 10/10/2026 (« Les réservations doivent être affichées de manière chronologique »): the booking lists go by arrival,
 * the earliest first, and open on today. Pages count from today's first arrival: page 1 holds it and the ones after,
 * pages 0, -1… go back in time, the earliest one holding what is left (fewer than `limit` when `before` is not a
 * multiple). `before` is the number of bookings arriving before today, 0 when the list does not open on today (a
 * search, a date filter): pages then simply count from the earliest.
 */
export interface ChronologicalPage {
  /** The page to ask for, kept within the list. */
  page: number;
  /** The page's place among all of them, from 1, for « Page 3 / 4 ». */
  pageNumber: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  skip: number;
  take: number;
}

export function chronologicalPage(total: number, before: number, limit: number, asked?: number): ChronologicalPage {
  const firstPage = 1 - Math.ceil(before / limit);
  const lastPage = Math.max(1, Math.ceil((total - before) / limit));
  const page = Math.min(lastPage, Math.max(firstPage, asked !== undefined && Number.isInteger(asked) ? asked : 1));
  const start = before + (page - 1) * limit;
  return {
    page,
    pageNumber: page - firstPage + 1,
    totalPages: lastPage - firstPage + 1,
    hasPrevPage: page > firstPage,
    hasNextPage: page < lastPage,
    skip: Math.max(0, start),
    take: start < 0 ? limit + start : limit,
  };
}
