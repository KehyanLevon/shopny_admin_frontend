import React, { useEffect, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { categoryApi, type CategoryDto } from "../../api/categoryApi";
import { sectionApi, type SectionDto } from "../../api/sectionApi";
import { TruncatedTextWithTooltip } from "../../components/common/TruncatedTextWithTooltip";
import { ConfirmDeleteDialog } from "../../components/common/ConfirmDeleteDialog";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";
import {
  EntityFormDialog,
  type FormFieldConfig,
} from "../../components/common/EntityFormDialog";

interface CategoryFormState {
  title: string;
  description: string;
  sectionId: number | "";
  isActive: boolean;
}

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [form, setForm] = useState<CategoryFormState>({
    title: "",
    description: "",
    sectionId: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CategoryDto | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [catRes, secRes] = await Promise.all([
        categoryApi.getAll(),
        sectionApi.getAll(),
      ]);
      setCategories(catRes.data);
      setSections(secRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setForm({
      title: "",
      description: "",
      sectionId: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (category: CategoryDto) => {
    setMode("edit");
    setEditing(category);
    setForm({
      title: category.title,
      description: category.description ?? "",
      sectionId: category.sectionId ?? "",
      isActive: category.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.sectionId) return;

    setSaving(true);
    try {
      if (mode === "edit" && editing) {
        const res = await categoryApi.update(editing.id, {
          title: form.title,
          description: form.description || null,
          sectionId: form.sectionId as number,
          isActive: form.isActive,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editing.id ? res.data : c))
        );
      } else {
        const res = await categoryApi.create({
          title: form.title,
          description: form.description || null,
          sectionId: form.sectionId as number,
          isActive: form.isActive,
        });
        setCategories((prev) => [res.data, ...prev]);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id;
    await categoryApi.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
  };

  const sectionMap = new Map(sections.map((s) => [s.id, s.title]));

  const columns: CrudColumn<CategoryDto>[] = [
    { id: "id", label: "ID", render: (row) => row.id },
    { id: "title", label: "Title", render: (row) => row.title },
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
      id: "section",
      label: "Section",
      render: (row) =>
        row.sectionId
          ? sectionMap.get(row.sectionId) ?? `#${row.sectionId}`
          : "-",
    },
    {
      id: "productsCount",
      label: "Products",
      render: (row) => row.productsCount,
    },
    {
      id: "description",
      label: "Description",
      render: (row) => <TruncatedTextWithTooltip text={row.description} />,
    },
    {
      id: "createdAt",
      label: "Created",
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
    },
  ];

  const fields: FormFieldConfig<CategoryFormState>[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    {
      name: "sectionId",
      label: "Section",
      type: "select",
      required: true,
      options: sections.map((s) => ({
        value: s.id,
        label: s.title,
      })),
    },
    { name: "isActive", label: "Active", type: "switch" },
  ];

  const isValid = form.title.trim().length > 0 && !!form.sectionId;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Categories</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          New Category
        </Button>
      </Stack>

      <CrudTable
        rows={categories}
        columns={columns}
        loading={loading}
        emptyMessage="No categories yet."
        onEdit={openEdit}
        onDelete={(row) => setDeleteConfirm(row)}
      />

      <EntityFormDialog
        open={dialogOpen}
        mode={mode}
        title="Category"
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
        title="Delete category"
        description={
          <>
            Are you sure you want to delete category{" "}
            <strong>{deleteConfirm?.title}</strong>?
          </>
        }
      />
    </Box>
  );
};
