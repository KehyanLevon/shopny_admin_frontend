import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  categoryApi,
  type CategoryDto,
  type CategoryPayload,
} from "../../api/categoryApi";
import { sectionApi, type SectionDto } from "../../api/sectionApi";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";
import {
  EntityFormDialog,
  type FormFieldConfig,
} from "../../components/common/EntityFormDialog";
import { ConfirmDeleteDialog } from "../../components/common/ConfirmDeleteDialog";
import { TruncatedTextWithTooltip } from "../../components/common/TruncatedTextWithTooltip";

const ROWS_PER_PAGE = 10;

const buildInitialForm = (category: CategoryDto | null): CategoryPayload => ({
  title: category?.title ?? "",
  description: category?.description ?? "",
  isActive: category?.isActive ?? true,
  sectionId: category?.sectionId,
});

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSectionId, setSelectedSectionId] = useState<number | "all">(
    "all"
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(
    null
  );
  const [formValues, setFormValues] = useState<CategoryPayload>(
    buildInitialForm(null)
  );
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSections = async () => {
    const res: any = await sectionApi.getAll();
    const items: SectionDto[] = res?.data?.items ?? res?.data ?? res ?? [];
    setSections(items);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (selectedSectionId !== "all") {
        params.sectionId = selectedSectionId;
      }

      const term = search.trim();
      if (term) {
        params.search = term;
        params.q = term;
      }

      const res: any = await categoryApi.getAll(params);
      const items: CategoryDto[] = res?.data?.items ?? res?.data ?? res ?? [];
      setCategories(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [selectedSectionId, search]);

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingCategory(null);
    setFormValues(buildInitialForm(null));
    setFormOpen(true);
  };

  const handleOpenEdit = (category: CategoryDto) => {
    setFormMode("edit");
    setEditingCategory(category);
    setFormValues(buildInitialForm(category));
    setFormOpen(true);
  };

  const handleSubmitForm = async () => {
    setFormSubmitting(true);
    try {
      const payload: CategoryPayload = {
        ...formValues,
        sectionId: formValues.sectionId ? Number(formValues.sectionId) : null,
      };

      if (formMode === "create") {
        await categoryApi.create(payload);
      } else if (editingCategory) {
        await categoryApi.update(editingCategory.id, payload);
      }
      setFormOpen(false);
      await loadCategories();
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await categoryApi.delete(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadCategories();
    } finally {
      setDeleteLoading(false);
    }
  };

  const pageCount = Math.max(1, Math.ceil(categories.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () =>
      categories.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
      ),
    [categories, currentPage]
  );

  const columns: CrudColumn<CategoryDto>[] = [
    {
      id: "title",
      label: "Title",
      render: (row) => row.title,
    },
    {
      id: "description",
      label: "Description",
      render: (row) => (
        <TruncatedTextWithTooltip text={row.description ?? ""} max={40} />
      ),
    },
    {
      id: "slug",
      label: "Slug",
      render: (row) => <Chip label={row.slug} size="small" />,
    },
    {
      id: "section",
      label: "Section",
      render: (row) => {
        const section = sections.find((s) => s.id === row.sectionId);
        return section ? section.title : "-";
      },
    },
    {
      id: "isActive",
      label: "Active",
      render: (row) =>
        row.isActive ? (
          <Chip label="Active" color="success" size="small" />
        ) : (
          <Chip label="Inactive" color="default" size="small" />
        ),
    },
    {
      id: "productsCount",
      label: "Products",
      align: "right",
      render: (row) => row.productsCount ?? 0,
    },
  ];

  const formFields: FormFieldConfig<CategoryPayload>[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    {
      name: "sectionId",
      label: "Section",
      type: "select",
      options: sections.map((s) => ({
        value: s.id,
        label: s.title,
      })),
      required: false,
    },
    { name: "isActive", label: "Active", type: "switch" },
  ];

  const isFormValid = formValues.title.trim().length > 0;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2} gap={2}>
        <Typography variant="h5">Categories</Typography>
        <Stack direction="row" gap={2} alignItems="center">
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <TextField
            select
            size="small"
            label="Section"
            value={selectedSectionId}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedSectionId(value === "all" ? "all" : Number(value));
              setPage(1);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All sections</MenuItem>
            {sections.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.title}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleOpenCreate}>
            New Category
          </Button>
        </Stack>
      </Stack>

      <CrudTable
        rows={pagedRows}
        columns={columns}
        loading={loading}
        emptyMessage="No categories."
        onEdit={handleOpenEdit}
        onDelete={(row) => {
          setDeleteTarget(row);
          setDeleteOpen(true);
        }}
      />

      <Stack mt={2} alignItems="center">
        <Pagination
          count={pageCount}
          page={currentPage}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Stack>

      <EntityFormDialog<CategoryPayload>
        open={formOpen}
        mode={formMode}
        title="Category"
        fields={formFields}
        values={formValues}
        onChange={setFormValues}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
        submitting={formSubmitting}
        isValid={isFormValid}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete category"
        description={
          deleteTarget
            ? `Are you sure you want to delete category "${deleteTarget.title}"?`
            : ""
        }
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
      />
    </Box>
  );
}
