import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Stack,
  Chip,
  Pagination,
} from "@mui/material";
import { usersApi, type UserDto } from "../../api/usersApi";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";

const ROWS_PER_PAGE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(ROWS_PER_PAGE);

  const loadUsers = async (pageArg: number, searchArg: string) => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({
        page: pageArg,
        limit: ROWS_PER_PAGE,
        q: searchArg.trim() || undefined,
      });

      const data = res.data;
      setUsers(data.items);
      setTotal(data.total);
      setLimit(data.limit ?? ROWS_PER_PAGE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers(page, search);
  }, [page, search]);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  const columns: CrudColumn<UserDto>[] = [
    {
      id: "id",
      label: "ID",
      render: (row) => row.id,
    },
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
        row.roles.length === 0 ? (
          "-"
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {row.roles.map((r) => (
              <Chip key={r} label={r} size="small" />
            ))}
          </Stack>
        ),
    },
    {
      id: "verified",
      label: "Verified",
      render: (row) =>
        row.isVerified ? (
          <Chip label="Verified" color="success" size="small" />
        ) : (
          <Chip label="Not verified" color="warning" size="small" />
        ),
    },
    {
      id: "verifiedAt",
      label: "Verified at",
      render: (row) =>
        row.verifiedAt ? new Date(row.verifiedAt).toLocaleString() : "—",
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2} gap={2}>
        <Typography variant="h5">Users</Typography>
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </Stack>

      <CrudTable<UserDto>
        rows={users}
        columns={columns}
        loading={loading}
        emptyMessage="No users."
      />

      <Stack mt={2} alignItems="center">
        <Pagination
          count={pageCount}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Stack>
    </Box>
  );
}
