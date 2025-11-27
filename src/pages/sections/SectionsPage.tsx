import React, { useEffect, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { sectionApi, type SectionDto } from "../../api/sectionApi";
import { TruncatedTextWithTooltip } from "../../components/common/TruncatedTextWithTooltip";
import { ConfirmDeleteDialog } from "../../components/common/ConfirmDeleteDialog";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";
import {
  EntityFormDialog,
  type FormFieldConfig,
} from "../../components/common/EntityFormDialog";

interface SectionFormState {
  title: string;
  description: string;
  isActive: boolean;
}

export const SectionsPage: React.FC = () => {
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<SectionDto | null>(null);
  const [form, setForm] = useState<SectionFormState>({
    title: "",
    description: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<SectionDto | null>(null);

  async function loadSections() {
    setLoading(true);
    try {
      const res = await sectionApi.getAll();
      setSections(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSections();
  }, []);

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setForm({
      title: "",
      description: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (section: SectionDto) => {
    setMode("edit");
    setEditing(section);
    setForm({
      title: section.title,
      description: section.description ?? "",
      isActive: section.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      if (mode === "edit" && editing) {
        const res = await sectionApi.update(editing.id, {
          title: form.title,
          description: form.description || null,
          isActive: form.isActive,
        });
        setSections((prev) =>
          prev.map((s) => (s.id === editing.id ? res.data : s))
        );
      } else {
        const res = await sectionApi.create({
          title: form.title,
          description: form.description || null,
          isActive: form.isActive,
        });
        setSections((prev) => [res.data, ...prev]);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id;
    await sectionApi.delete(id);
    setSections((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirm(null);
  };

  const columns: CrudColumn<SectionDto>[] = [
    {
      id: "id",
      label: "ID",
      render: (row) => row.id,
    },
    {
      id: "title",
      label: "Title",
      render: (row) => row.title,
    },
    {
      id: "description",
      label: "Description",
      render: (row) => (
        <TruncatedTextWithTooltip text={row.description} />
      ),
    },
    {
      id: "slug",
      label: "Slug",
      render: (row) => <Chip size="small" label={row.slug} />,
    },
    {
      id: "isActive",
      label: "Active",
      render: (row) => (
        <Chip
          size="small"
          label={row.isActive ? "Active" : "Inactive"}
          color={row.isActive ? "success" : "default"}
        />
      ),
    },
    {
      id: "categoriesCount",
      label: "Categories",
      render: (row) => row.categoriesCount,
    },
    {
      id: "createdAt",
      label: "Created",
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
    },
  ];

  const fields: FormFieldConfig<SectionFormState>[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "isActive", label: "Active", type: "switch" },
  ];

  const isValid = form.title.trim().length > 0;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Sections</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          New Section
        </Button>
      </Stack>

      <CrudTable
        rows={sections}
        columns={columns}
        loading={loading}
        emptyMessage="No sections yet."
        onEdit={openEdit}
        onDelete={(row) => setDeleteConfirm(row)}
      />

      <EntityFormDialog
        open={dialogOpen}
        mode={mode}
        title="Section"
        fields={fields}
        values={form}
        onChange={setForm}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
        submitting={saving}
        isValid={isValid}
      />

      <ConfirmDeleteDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete section"
        description={
          <>
            Are you sure you want to delete section{" "}
            <strong>{deleteConfirm?.title}</strong>?
          </>
        }
      />
    </Box>
  );
};
