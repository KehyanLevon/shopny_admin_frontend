import { useEffect, useState, useRef, type MouseEvent } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Pagination,
  Popover,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import axios from "axios";
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
import { useSearchParams } from "react-router-dom";

const ROWS_PER_PAGE = 10;

const buildInitialForm = (section: SectionDto | null): SectionPayload => ({
  title: section?.title ?? "",
  description: section?.description ?? "",
  isActive: section?.isActive ?? true,
});

type SectionFormErrors = Partial<
  Record<keyof SectionPayload | "global", string[]>
>;

type SectionTouched = Partial<Record<keyof SectionPayload, boolean>>;

export default function SectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") ?? "";
  const initialPage = (() => {
    const p = Number(searchParams.get("page") || "1");
    return Number.isNaN(p) || p < 1 ? 1 : p;
  })();
  const initialStatus =
    (searchParams.get("status") as "" | "active" | "inactive" | null) ?? "";

  const [sections, setSections] = useState<SectionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [pagesCount, setPagesCount] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
    initialStatus
  );

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
  const [editingSection, setEditingSection] = useState<SectionDto | null>(null);
  const [formValues, setFormValues] = useState<SectionPayload>(
    buildInitialForm(null)
  );
  const [initialFormValues, setInitialFormValues] = useState<SectionPayload>(
    buildInitialForm(null)
  );
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<SectionFormErrors>({});
  const [touched, setTouched] = useState<SectionTouched>({});

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SectionDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSections = async () => {
    setLoading(true);
    try {
      const term = search.trim();
      const params: any = {
        page,
        limit: ROWS_PER_PAGE,
        q: term || undefined,
      };

      if (statusFilter === "active") {
        params.isActive = true;
      } else if (statusFilter === "inactive") {
        params.isActive = false;
      }

      const res = await sectionApi.getAll(params);
      const data = res.data;

      setSections(data.items ?? []);
      setPagesCount(data.pages ?? 1);
      setTotal(data.total ?? data.items?.length ?? 0);
    } finally {
      setLoading(false);
    }
  };

  // дебаунс поиска
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    void loadSections();
  }, [page, search, statusFilter]);

  // 🔗 Синхронизация с URL
  useEffect(() => {
    const params: Record<string, string> = {};

    if (page !== 1) params.page = String(page);
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;

    setSearchParams(params, { replace: true });
  }, [page, search, statusFilter, setSearchParams]);

  const validateSection = (values: SectionPayload): SectionFormErrors => {
    const errors: SectionFormErrors = {};

    const title = values.title?.trim() ?? "";
    if (!title) {
      errors.title = ["Title is required."];
    } else if (title.length < 2) {
      errors.title = ["Title must be at least 2 characters long."];
    } else if (title.length > 255) {
      errors.title = ["Title must not be longer than 255 characters."];
    }

    const description = values.description ?? "";
    if (description.length > 5000) {
      errors.description = [
        "Description must not be longer than 5000 characters.",
      ];
    }

    return errors;
  };

  const handleOpenCreate = () => {
    const init = buildInitialForm(null);
    setFormMode("create");
    setEditingSection(null);
    setFormValues(init);
    setInitialFormValues(init);
    setFormErrors({});
    setTouched({});
    setFormOpen(true);
  };

  const handleOpenEdit = (section: SectionDto) => {
    const init = buildInitialForm(section);
    setFormMode("edit");
    setEditingSection(section);
    setFormValues(init);
    setInitialFormValues(init);
    setFormErrors({});
    setTouched({});
    setFormOpen(true);
  };

  const handleFormChange = (values: SectionPayload) => {
    setFormValues(values);

    const allErrors = validateSection(values);
    setFormErrors((prev) => {
      const next: SectionFormErrors = { ...prev };
      (Object.keys(touched) as (keyof SectionPayload)[]).forEach((key) => {
        if (touched[key]) {
          if (allErrors[key]?.length) {
            next[key] = allErrors[key];
          } else {
            delete next[key];
          }
        }
      });
      return next;
    });
  };

  const handleFieldBlur = (name: keyof SectionPayload) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const allErrors = validateSection(formValues);

    setFormErrors((prev) => {
      const next: SectionFormErrors = { ...prev };

      if (allErrors[name]?.length) {
        next[name] = allErrors[name];
      } else {
        delete next[name];
      }

      return next;
    });
  };

  const handleSubmitForm = async () => {
    const localErrors = validateSection(formValues);

    if (Object.keys(localErrors).length > 0) {
      setFormErrors(localErrors);
      setTouched({
        title: true,
        description: true,
        isActive: true,
      });
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});
    try {
      if (formMode === "create") {
        await sectionApi.create(formValues);
      } else if (editingSection) {
        await sectionApi.update(editingSection.id, formValues);
      }
      setFormOpen(false);
      await loadSections();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response as {
          status: number;
          data: any;
        };

        if (status === 422 || status === 400) {
          const backendErrors: SectionFormErrors = data?.errors ?? {};
          if (!backendErrors.global && data?.message) {
            backendErrors.global = [data.message];
          }
          setFormErrors(backendErrors);
        } else {
          setFormErrors({
            global: ["Unexpected error. Please try again later."],
          });
        }
      } else {
        setFormErrors({
          global: ["Unexpected error. Please try again later."],
        });
      }
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
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 4,
      maxLength: 5000,
      showCounter: true,
    },
    { name: "isActive", label: "Active", type: "switch" },
  ];

  const isFormValid = Object.keys(validateSection(formValues)).length === 0;
  const hasChanges =
    JSON.stringify(formValues) !== JSON.stringify(initialFormValues);

  const handleClearFilters = () => {
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
        <TextField
          fullWidth
          sx={{ maxWidth: 320, flexGrow: 1 }}
          size="small"
          label="Search"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
          }}
        />

        <Stack direction="row" gap={2} alignItems="center">
          <IconButton onClick={handleOpenFilters}>
            <FilterListIcon />
          </IconButton>
          <Button variant="contained" onClick={handleOpenCreate}>
            New Section
          </Button>
        </Stack>
      </Stack>

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
        rows={sections}
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
          count={pagesCount}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
        <Typography variant="body2" color="text.secondary" mt={1}>
          Total: {total}
        </Typography>
      </Stack>

      <EntityFormDialog<SectionPayload>
        open={formOpen}
        mode={formMode}
        title="Section"
        fields={formFields}
        values={formValues}
        onChange={handleFormChange}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
        submitting={formSubmitting}
        isValid={isFormValid && hasChanges}
        errors={formErrors}
        onFieldBlur={handleFieldBlur}
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
