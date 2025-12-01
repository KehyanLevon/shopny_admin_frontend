import { useMemo, useState } from "react";

interface UseSearchAndPagingOptions<T> {
  rows: T[];
  rowsPerPage?: number;
  searchFn?: (row: T, term: string) => boolean;
}

export function useSearchAndPaging<T>({
  rows,
  rowsPerPage = 10,
  searchFn,
}: UseSearchAndPagingOptions<T>) {
  const [search, setSearchState] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!searchFn) return rows;

    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => searchFn(row, term));
  }, [rows, search, searchFn]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);

  const pagedRows = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      ),
    [filtered, currentPage, rowsPerPage]
  );

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  return {
    search,
    setSearch,
    page,
    setPage,
    pagedRows,
    pageCount,
    currentPage,
  };
}
