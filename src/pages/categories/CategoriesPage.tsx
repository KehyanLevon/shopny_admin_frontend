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
import axios from "axios";
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
  sectionId: category?.sectionId ?? null,
});

type CategoryFieldName = keyof CategoryPayload;
type CategoryErrors = Partial<Record<CategoryFieldName | "global", string[]>>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedSectionId, setSelectedSectionId] = useState<number | "all">(
    "all"
  );

  // NEW: фильтр активности
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
    ""
  );

  // NEW: Popover
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const filtersOpen = Boolean(filterAnchorEl);
  const handleOpenFilters = (event: MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  const handleCloseFilters = () => {
    setFilterAnchorEl(null);
  };

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(
    null
  );
  const [formValues, setFormValues] = useState<CategoryPayload>(
    buildInitialForm(null)
  );
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialFormRef = useRef<CategoryPayload>(buildInitialForm(null));

  const [formErrors, setFormErrors] = useState<CategoryErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<CategoryFieldName, boolean>>
  >({});
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const params: any = {
        page,
        limit: ROWS_PER_PAGE,
      };

      if (selectedSectionId !== "all") {
        params.sectionId = selectedSectionId;
      }

      const term = search.trim();
      if (term) {
        params.q = term;
        params.search = term;
      }

      // NEW: isActive
      if (statusFilter === "active") {
        params.isActive = true;
      } else if (statusFilter === "inactive") {
        params.isActive = false;
      }

      const res = await categoryApi.getAll(params);
      const data: any = res.data;

      setCategories(data.items ?? []);
      setPagesCount(data.pages ?? 1);
      setTotal(data.total ?? data.items?.length ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    void loadSections();
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [selectedSectionId, statusFilter, search, page]);

  const validateCategory = (
    values: CategoryPayload,
    mode: "create" | "edit"
  ): CategoryErrors => {
    const errors: CategoryErrors = {};

    const title = (values.title ?? "").trim();
    if (!title) {
      errors.title = ["Title is required."];
    } else {
      if (title.length < 2) {
        errors.title = [
          ...(errors.title ?? []),
          "Title must be at least 2 characters long.",
        ];
      }
      if (title.length > 255) {
        errors.title = [
          ...(errors.title ?? []),
          "Title must not be longer than 255 characters.",
        ];
      }
    }

    const description = values.description ?? "";
    if (description && description.length > 5000) {
      errors.description = [
        "Description must not be longer than 5000 characters.",
      ];
    }

    const sectionId = values.sectionId;
    if (mode === "create") {
      if (sectionId === null || sectionId === undefined) {
        errors.sectionId = ["Section is required."];
      } else if (Number(sectionId) <= 0) {
        errors.sectionId = ["sectionId must be a positive integer."];
      }
    } else {
      if (sectionId !== null && sectionId !== undefined) {
        if (Number(sectionId) <= 0) {
          errors.sectionId = ["sectionId must be a positive integer."];
        }
      }
    }

    return errors;
  };

  useEffect(() => {
    if (!formOpen) return;

    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }

    validationTimerRef.current = setTimeout(() => {
      const allErrors = validateCategory(formValues, formMode);

      setFormErrors(() => {
        const next: CategoryErrors = {};

        (Object.keys(touchedFields) as CategoryFieldName[]).forEach((name) => {
          if (allErrors[name]) {
            next[name] = allErrors[name];
          }
        });

        return next;
      });
    }, 300);

    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, [formValues, formMode, formOpen, touchedFields]);

  const handleFieldBlur = (name: CategoryFieldName) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const allErrors = validateCategory(formValues, formMode);

    setFormErrors((prev) => {
      const next: CategoryErrors = { ...prev };
      if (allErrors[name]) {
        next[name] = allErrors[name];
      } else {
        delete next[name];
      }
      return next;
    });
  };

  const resetFormState = (
    mode: "create" | "edit",
    category: CategoryDto | null
  ) => {
    setFormMode(mode);
    setEditingCategory(category);
    const initial = buildInitialForm(category);
    setFormValues(initial);
    initialFormRef.current = initial;
    setFormErrors({});
    setTouchedFields({});
  };

  const handleOpenCreate = () => {
    resetFormState("create", null);
    setFormOpen(true);
  };

  const handleOpenEdit = (category: CategoryDto) => {
    resetFormState("edit", category);
    setFormOpen(true);
  };

  const handleSubmitForm = async () => {
    const allErrors = validateCategory(formValues, formMode);
    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      setTouchedFields({
        title: true,
        description: true,
        sectionId: true,
        isActive: true,
      });
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});
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
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as any;
        if (status === 422 && data?.errors) {
          const backendErrors: CategoryErrors = {};
          Object.entries(
            data.errors as Record<string, string[] | string>
          ).forEach(([key, value]) => {
            const messages = Array.isArray(value) ? value : [value];
            if (
              ["title", "description", "sectionId", "isActive"].includes(key)
            ) {
              (backendErrors as any)[key] = messages;
            } else {
              backendErrors.global = [
                ...(backendErrors.global ?? []),
                ...messages,
              ];
            }
          });

          setFormErrors(backendErrors);
          return;
        }
        if (data?.message || data?.error) {
          setFormErrors({
            global: [data.message ?? data.error],
          });
          return;
        }
      }
      setFormErrors({
        global: ["Unexpected error occurred. Please try again."],
      });
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
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      maxLength: 255,
      showCounter: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      maxLength: 5000,
      showCounter: true,
    },
    {
      name: "sectionId",
      label: "Section",
      type: "select",
      options: sections.map((s) => ({
        value: s.id,
        label: s.title,
      })),
      required: formMode === "create",
    },
    { name: "isActive", label: "Active", type: "switch" },
  ];

  const hasFieldErrors = Object.keys(formErrors).some(
    (key) => key !== "global" && (formErrors as any)[key]?.length
  );

  const isDirty =
    JSON.stringify(formValues) !== JSON.stringify(initialFormRef.current);

  const isFormValid =
    !hasFieldErrors &&
    formValues.title.trim().length > 0 &&
    (formMode !== "create" || !!formValues.sectionId) &&
    isDirty;

  const handleClearFilters = () => {
    setSelectedSectionId("all");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        mb={2}
        gap={2}
        alignItems="center"
      >
        {/* Search вместо заголовка */}
        <TextField
          size="small"
          label="Search"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
          }}
          sx={{ maxWidth: 320, flexGrow: 1 }}
        />

        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
          <IconButton onClick={handleOpenFilters}>
            <FilterListIcon />
          </IconButton>
          <Button variant="contained" onClick={handleOpenCreate}>
            New Category
          </Button>
        </Stack>
      </Stack>

      {/* Popover с фильтрами */}
      <Popover
        open={filtersOpen}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilters}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box p={2} display="flex" flexDirection="column" gap={2} minWidth={260}>
          <Typography variant="subtitle1">Filters</Typography>

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
          >
            <MenuItem value="all">All sections</MenuItem>
            {sections.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Active"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "" | "active" | "inactive");
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Only active</MenuItem>
            <MenuItem value="inactive">Only inactive</MenuItem>
          </TextField>

          <Button size="small" onClick={handleClearFilters}>
            Clear filters
          </Button>
        </Box>
      </Popover>

      <CrudTable
        rows={categories}
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
          count={pagesCount}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
        <Typography variant="body2" color="text.secondary" mt={1}>
          Total: {total}
        </Typography>
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
        errors={formErrors}
        onFieldBlur={handleFieldBlur}
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
