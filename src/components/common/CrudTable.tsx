import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export interface CrudColumn<T> {
  id: string;
  label: string;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
}

interface CrudTableProps<T> {
  rows: T[];
  columns: CrudColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}

export function CrudTable<T extends { id: number | string }>({
  rows,
  columns,
  loading = false,
  emptyMessage = "No data.",
  onEdit,
  onDelete,
}: CrudTableProps<T>) {
  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!loading && rows.length === 0) {
    return <Typography>{emptyMessage}</Typography>;
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableCell key={col.id} align={col.align ?? "left"}>
              {col.label}
            </TableCell>
          ))}
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} hover>
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align ?? "left"}>
                {col.render(row)}
              </TableCell>
            ))}
            <TableCell align="right">
              <Tooltip title="Edit">
                <IconButton onClick={() => onEdit(row)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton color="error" onClick={() => onDelete(row)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
