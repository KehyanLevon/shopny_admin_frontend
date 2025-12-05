import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Pagination,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { usersApi, type UserDto } from "../../api/usersApi";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";
import { SearchInput } from "../../components/common/SearchInput";
import { useSearchParams } from "react-router-dom";

const ROWS_PER_PAGE = 10;

type VerifiedFilter = "" | "verified" | "not-verified";
type SortBy = "createdAt" | "verifiedAt";
type SortDir = "asc" | "desc";

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") ?? "";
  const initialPage = (() => {
    const p = Number(searchParams.get("page") || "1");
    return Number.isNaN(p) || p < 1 ? 1 : p;
  })();

  const initialVerified =
    (searchParams.get("verified") as VerifiedFilter | null) ?? "";
  const initialRole = searchParams.get("role") ?? "";
  const initialSortBy =
    (searchParams.get("sortBy") as SortBy | null) ?? "createdAt";
  const initialSortDir =
    (searchParams.get("sortDir") as SortDir | null) ?? "desc";

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState(initialSearch);

  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [verifiedFilter, setVerifiedFilter] =
    useState<VerifiedFilter>(initialVerified);
  const [roleFilter, setRoleFilter] = useState<string>(initialRole);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const filterOpen = Boolean(filterAnchorEl);

  const handleOpenFilters = (event: MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleCloseFilters = () => {
    setFilterAnchorEl(null);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: ROWS_PER_PAGE,
      };

      const term = search.trim();
      if (term) {
        params.search = term;
      }

      if (verifiedFilter === "verified") {
        params.isVerified = 1;
      } else if (verifiedFilter === "not-verified") {
        params.isVerified = 0;
      }

      if (roleFilter) {
        params.role = roleFilter;
      }

      params.sortBy = sortBy;
      params.sortDir = sortDir;

      const res: any = await usersApi.getAll(params);
      const data = res?.data ?? res;

      const items: UserDto[] = data?.items ?? data ?? [];
      setUsers(items);

      if (typeof data?.total === "number") {
        setTotal(data.total);
      }
      if (typeof data?.pages === "number") {
        setPages(data.pages);
      } else if (typeof data?.total === "number") {
        setPages(Math.max(1, Math.ceil(data.total / ROWS_PER_PAGE)));
      } else {
        setPages(1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [page, search, verifiedFilter, roleFilter, sortBy, sortDir]);

  useEffect(() => {
    const params: Record<string, string> = {};

    if (page !== 1) params.page = String(page);
    if (search.trim()) params.search = search.trim();
    if (verifiedFilter) params.verified = verifiedFilter;
    if (roleFilter) params.role = roleFilter;
    if (sortBy !== "createdAt") params.sortBy = sortBy;
    if (sortDir !== "desc") params.sortDir = sortDir;

    setSearchParams(params, { replace: true });
  }, [
    page,
    search,
    verifiedFilter,
    roleFilter,
    sortBy,
    sortDir,
    setSearchParams,
  ]);

  const columns: CrudColumn<UserDto>[] = [
    {
      id: "name",
      label: "Name",
      render: (row) => `${row.name} ${row.surname}`.trim(),
    },
    {
      id: "email",
      label: "Email",
      render: (row) => row.email,
    },
    {
      id: "roles",
      label: "Roles",
      render: (row) =>
        row.roles && row.roles.length ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {row.roles.map((r) => (
              <Chip
                key={r}
                label={r.replace(/^ROLE_/, "")}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        ) : (
          "—"
        ),
    },
    {
      id: "isVerified",
      label: "Verified",
      render: (row) =>
        (row as any).isVerified ? (
          <Chip label="Verified" color="success" size="small" />
        ) : (
          <Chip label="Not verified" color="warning" size="small" />
        ),
    },
    {
      id: "verifiedAt",
      label: "Verified at",
      render: (row) => formatDateTime((row as any).verifiedAt),
    },
    {
      id: "createdAt",
      label: "Registered at",
      render: (row) => formatDateTime((row as any).createdAt),
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2} gap={2}>
        <SearchInput
          initialValue={initialSearch}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <Stack direction="row" gap={2} alignItems="center">
          <IconButton
            size="small"
            onClick={handleOpenFilters}
            aria-label="Filters"
          >
            <FilterListIcon />
          </IconButton>
        </Stack>
      </Stack>

      <CrudTable<UserDto>
        rows={users}
        columns={columns}
        loading={loading}
        emptyMessage="No users."
      />

      <Stack mt={2} alignItems="center">
        <Pagination
          count={pages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
        <Typography variant="body2" color="text.secondary" mt={1}>
          Total: {total}
        </Typography>
      </Stack>

      <Popover
        open={filterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilters}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box p={2} minWidth={260}>
          <Typography variant="subtitle1" mb={1}>
            Filters
          </Typography>

          <Stack spacing={2}>
            <TextField
              select
              size="small"
              label="Verified"
              value={verifiedFilter}
              onChange={(e) => {
                const val = e.target.value as VerifiedFilter;
                setVerifiedFilter(val);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="verified">Only verified</MenuItem>
              <MenuItem value="not-verified">Only not verified</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Role"
              value={roleFilter}
              onChange={(e) => {
                const val = e.target.value as string;
                setRoleFilter(val);
                setPage(1);
              }}
            >
              <MenuItem value="">All roles</MenuItem>
              <MenuItem value="ROLE_USER">User</MenuItem>
              <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Sort by"
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value as SortBy;
                setSortBy(val);
                setPage(1);
              }}
            >
              <MenuItem value="createdAt">Created at</MenuItem>
              <MenuItem value="verifiedAt">Verified at</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Direction"
              value={sortDir}
              onChange={(e) => {
                const val = e.target.value as SortDir;
                setSortDir(val);
                setPage(1);
              }}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setVerifiedFilter("");
                setRoleFilter("");
                setSortBy("createdAt");
                setSortDir("desc");
                setPage(1);
              }}
            >
              Reset filters
            </Button>
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
}
