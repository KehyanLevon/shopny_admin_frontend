import { useEffect, useState, type MouseEvent } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  productApi,
  type ProductDto,
  type ProductListParams,
} from "../../api/productApi";
import { sectionApi, type SectionDto } from "../../api/sectionApi";
import { categoryApi, type CategoryDto } from "../../api/categoryApi";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";
import { SearchInput } from "../../components/common/SearchInput";
import { ConfirmDeleteDialog } from "../../components/common/ConfirmDeleteDialog";
import { TruncatedTextWithTooltip } from "../../components/common/TruncatedTextWithTooltip";
import { ProductFormDialog } from "../../components/products/ProductFormDialog";
import { useSearchParams } from "react-router-dom";
const ROWS_PER_PAGE = 10;

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") ?? "";
  const initialPage = (() => {
    const p = Number(searchParams.get("page") || "1");
    return Number.isNaN(p) || p < 1 ? 1 : p;
  })();

  const initialSectionIdParam = searchParams.get("sectionId");
  const initialSectionId: number | "all" =
    initialSectionIdParam != null
      ? Number.isNaN(Number(initialSectionIdParam))
        ? "all"
        : Number(initialSectionIdParam)
      : "all";

  const initialCategoryIdParam = searchParams.get("categoryId");
  const initialCategoryId: number | "all" =
    initialCategoryIdParam != null
      ? Number.isNaN(Number(initialCategoryIdParam))
        ? "all"
        : Number(initialCategoryIdParam)
      : "all";

  const initialPriceSort =
    (searchParams.get("priceSort") as "none" | "asc" | "desc" | null) ?? "none";

  const initialStatusFilter =
    (searchParams.get("status") as "" | "active" | "inactive" | null) ?? "";

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(1);
  const [_, setTotal] = useState(0);

  const [selectedSectionId, setSelectedSectionId] = useState<number | "all">(
    initialSectionId
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">(
    initialCategoryId
  );
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">(
    initialPriceSort
  );
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
    initialStatusFilter
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
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSections = async () => {
    const res: any = await sectionApi.getAll();
    const items: SectionDto[] = res?.data?.items ?? res?.data ?? res ?? [];
    setSections(items);
  };

  const loadCategories = async () => {
    const res: any = await categoryApi.getAll();
    const items: CategoryDto[] = res?.data?.items ?? res?.data ?? res ?? [];
    setCategories(items);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: ProductListParams = {
        page,
        limit: ROWS_PER_PAGE,
      };

      const term = search.trim();
      if (term) {
        params.q = term;
      }

      if (selectedSectionId !== "all") {
        params.sectionId = selectedSectionId as number;
      }

      if (selectedCategoryId !== "all") {
        params.categoryId = selectedCategoryId as number;
      }

      if (priceSort !== "none") {
        params.sortBy = "price";
        params.sortDir = priceSort;
      }

      if (statusFilter === "active") {
        (params as any).isActive = true;
      } else if (statusFilter === "inactive") {
        (params as any).isActive = false;
      }

      const res: any = await productApi.getAll(params);
      const data = res?.data ?? res;

      const items: ProductDto[] = data?.items ?? data ?? [];
      setProducts(items);

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
    void loadSections();
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [
    page,
    search,
    selectedSectionId,
    selectedCategoryId,
    priceSort,
    statusFilter,
  ]);

  useEffect(() => {
    const params: Record<string, string> = {};

    if (page !== 1) params.page = String(page);
    if (search.trim()) params.search = search.trim();
    if (selectedSectionId !== "all") {
      params.sectionId = String(selectedSectionId);
    }
    if (selectedCategoryId !== "all") {
      params.categoryId = String(selectedCategoryId);
    }
    if (priceSort !== "none") {
      params.priceSort = priceSort;
    }
    if (statusFilter) {
      params.status = statusFilter;
    }

    setSearchParams(params, { replace: true });
  }, [
    page,
    search,
    selectedSectionId,
    selectedCategoryId,
    priceSort,
    statusFilter,
    setSearchParams,
  ]);

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (product: ProductDto) => {
    setFormMode("edit");
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleProductSaved = async () => {
    setFormOpen(false);
    await loadProducts();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await productApi.delete(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadProducts();
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: CrudColumn<ProductDto>[] = [
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
      id: "price",
      label: "Price",
      align: "right",
      render: (row) => {
        const price =
          typeof row.price === "string" ? Number(row.price) : row.price;
        const discount =
          row.discountPrice != null
            ? typeof row.discountPrice === "string"
              ? Number(row.discountPrice)
              : row.discountPrice
            : null;

        if (discount != null && discount < price) {
          return (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Typography
                variant="body2"
                sx={{ textDecoration: "line-through", opacity: 0.6 }}
              >
                {price.toFixed(2)}
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="error">
                {discount.toFixed(2)}
              </Typography>
            </Stack>
          );
        }

        return price.toFixed(2);
      },
    },
    {
      id: "status",
      label: "Status",
      render: (row) =>
        (row as any).isArchived ? (
          <Chip label="Archived" color="default" size="small" />
        ) : row.isActive ? (
          <Chip label="Active" color="success" size="small" />
        ) : (
          <Chip label="Inactive" color="warning" size="small" />
        ),
    },
    {
      id: "category",
      label: "Category",
      render: (row) => {
        const category = categories.find((c) => c.id === row.categoryId);
        return category ? category.title : "-";
      },
    },
    {
      id: "imagesCount",
      label: "Images",
      align: "right",
      render: (row) =>
        (row as any).imagesCount ?? (row.images ? row.images.length : 0),
    },
  ];

  const handleClearFilters = () => {
    setSelectedSectionId("all");
    setSelectedCategoryId("all");
    setPriceSort("none");
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
        <SearchInput
          initialValue={initialSearch}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          sx={{ maxWidth: 320, flexGrow: 1 }}
        />

        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
          <IconButton onClick={handleOpenFilters}>
            <FilterListIcon />
          </IconButton>

          <Button variant="contained" onClick={handleOpenCreate}>
            New Product
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
        <Box p={2} display="flex" flexDirection="column" gap={2} minWidth={280}>
          <Typography variant="subtitle1">Filters</Typography>

          <TextField
            select
            size="small"
            label="Section"
            value={selectedSectionId}
            onChange={(e) => {
              const value = e.target.value;
              const parsed = value === "all" ? "all" : Number(value);
              setSelectedSectionId(parsed);
              setSelectedCategoryId("all");
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
            label="Category"
            value={selectedCategoryId}
            onChange={(e) => {
              const value = e.target.value;
              const parsed = value === "all" ? "all" : Number(value);
              setSelectedCategoryId(parsed);
              setPage(1);
            }}
          >
            <MenuItem value="all">All categories</MenuItem>
            {categories
              .filter((c) =>
                selectedSectionId === "all"
                  ? true
                  : c.sectionId === selectedSectionId
              )
              .map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.title}
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

          <ToggleButtonGroup
            size="small"
            value={priceSort}
            exclusive
            onChange={(_, value) => {
              const next = (value || "none") as "none" | "asc" | "desc";
              setPriceSort(next);
              setPage(1);
            }}
          >
            <ToggleButton value="none">No sort</ToggleButton>
            <ToggleButton value="asc">Price ↑</ToggleButton>
            <ToggleButton value="desc">Price ↓</ToggleButton>
          </ToggleButtonGroup>

          <Button size="small" onClick={handleClearFilters}>
            Clear filters
          </Button>
        </Box>
      </Popover>

      <CrudTable
        rows={products}
        columns={columns}
        loading={loading}
        emptyMessage="No products."
        onEdit={handleOpenEdit}
        onDelete={(row) => {
          setDeleteTarget(row);
          setDeleteOpen(true);
        }}
      />

      <Stack mt={2} alignItems="center">
        <Pagination
          count={pages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Stack>

      <ProductFormDialog
        open={formOpen}
        mode={formMode}
        product={editingProduct}
        sections={sections}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={handleProductSaved}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete product"
        description={
          deleteTarget
            ? `Are you sure you want to delete product "${deleteTarget.title}"?`
            : ""
        }
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
      />
    </Box>
  );
}
