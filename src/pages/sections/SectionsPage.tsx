import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  sectionApi,
  type SectionDto,
  type SectionCreatePayload as SectionPayload,
} from "../../api/sectionApi";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";
import {
  EntityFormDialog,
  type FormFieldConfig,
} from "../../components/common/EntityFormDialog";
import { ConfirmDeleteDialog } from "../../components/common/ConfirmDeleteDialog";
import { TruncatedTextWithTooltip } from "../../components/common/TruncatedTextWithTooltip";

const ROWS_PER_PAGE = 10;

const buildInitialForm = (section: SectionDto | null): SectionPayload => ({
  title: section?.title ?? "",
  description: section?.description ?? "",
  isActive: section?.isActive ?? true,
});

export default function SectionsPage() {
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingSection, setEditingSection] = useState<SectionDto | null>(null);
  const [formValues, setFormValues] = useState<SectionPayload>(
    buildInitialForm(null)
  );
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SectionDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSections = async () => {
    setLoading(true);
    try {
      const res: any = await sectionApi.getAll();
      const items: SectionDto[] = res?.data?.items ?? res?.data ?? res ?? [];
      setSections(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, []);

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingSection(null);
    setFormValues(buildInitialForm(null));
    setFormOpen(true);
  };

  const handleOpenEdit = (section: SectionDto) => {
    setFormMode("edit");
    setEditingSection(section);
    setFormValues(buildInitialForm(section));
    setFormOpen(true);
  };

  const handleSubmitForm = async () => {
    setFormSubmitting(true);
    try {
      if (formMode === "create") {
        await sectionApi.create(formValues);
      } else if (editingSection) {
        await sectionApi.update(editingSection.id, formValues);
      }
      setFormOpen(false);
      await loadSections();
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await sectionApi.delete(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadSections();
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sections;
    return sections.filter((s) => {
      return (
        s.title.toLowerCase().includes(term) ||
        (s.description ?? "").toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term)
      );
    });
  }, [sections, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
      ),
    [filtered, currentPage]
  );

  const columns: CrudColumn<SectionDto>[] = [
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
      id: "categoriesCount",
      label: "Categories",
      align: "right",
      render: (row) => row.categoriesCount ?? 0,
    },
  ];

  const formFields: FormFieldConfig<SectionPayload>[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "isActive", label: "Active", type: "switch" },
  ];

  const isFormValid = formValues.title.trim().length > 0;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2} gap={2}>
        <Typography variant="h5">Sections</Typography>
        <Stack direction="row" gap={2}>
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Button variant="contained" onClick={handleOpenCreate}>
            New Section
          </Button>
        </Stack>
      </Stack>

      <CrudTable
        rows={pagedRows}
        columns={columns}
        loading={loading}
        emptyMessage="No sections."
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

      <EntityFormDialog<SectionPayload>
        open={formOpen}
        mode={formMode}
        title="Section"
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
        title="Delete section"
        description={
          deleteTarget
            ? `Are you sure you want to delete section "${deleteTarget.title}"?`
            : ""
        }
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
      />
    </Box>
  );
}
