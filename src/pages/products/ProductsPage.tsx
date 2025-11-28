import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { productApi, type ProductDto } from "../../api/productApi";
import { sectionApi, type SectionDto } from "../../api/sectionApi";
import { categoryApi, type CategoryDto } from "../../api/categoryApi";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";
import { ConfirmDeleteDialog } from "../../components/common/ConfirmDeleteDialog";
import { TruncatedTextWithTooltip } from "../../components/common/TruncatedTextWithTooltip";
import { ProductFormDialog } from "../../components/products/ProductFormDialog";

const ROWS_PER_PAGE = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSectionId, setSelectedSectionId] = useState<number | "all">(
    "all"
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">(
    "all"
  );
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");

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
      const res: any = await productApi.getAll();
      const items: ProductDto[] = res?.data?.items ?? res?.data ?? res ?? [];
      setProducts(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
    void loadCategories();
    void loadProducts();
  }, []);

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    let data = products;

    if (selectedSectionId !== "all") {
      const sectionCategories = categories
        .filter((c) => c.sectionId === selectedSectionId)
        .map((c) => c.id);
      data = data.filter((p) => sectionCategories.includes(p.categoryId));
    }

    if (selectedCategoryId !== "all") {
      data = data.filter((p) => p.categoryId === selectedCategoryId);
    }

    if (term) {
      data = data.filter((p) => {
        return (
          p.title.toLowerCase().includes(term) ||
          (p.description ?? "").toLowerCase().includes(term) ||
          p.slug.toLowerCase().includes(term)
        );
      });
    }

    if (priceSort !== "none") {
      data = [...data].sort((a, b) => {
        const priceA = a.discountPrice ?? a.price ?? 0;
        const priceB = b.discountPrice ?? b.price ?? 0;
        const numA = typeof priceA === "string" ? Number(priceA) : priceA;
        const numB = typeof priceB === "string" ? Number(priceB) : priceB;

        if (priceSort === "asc") {
          return numA - numB;
        }
        return numB - numA;
      });
    }

    return data;
  }, [
    products,
    categories,
    search,
    selectedSectionId,
    selectedCategoryId,
    priceSort,
  ]);

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
      id: "slug",
      label: "Slug",
      render: (row) => <Chip label={row.slug} size="small" />,
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
        row.isArchived ? (
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
      render: (row) => row.imagesCount ?? 0,
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2} gap={2}>
        <Typography variant="h5">Products</Typography>
        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
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
              const parsed = value === "all" ? "all" : Number(value);
              setSelectedSectionId(parsed);
              setSelectedCategoryId("all");
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
            sx={{ minWidth: 160 }}
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

          <ToggleButtonGroup
            size="small"
            value={priceSort}
            exclusive
            onChange={(_, value) => {
              setPriceSort(value || "none");
              setPage(1);
            }}
          >
            <ToggleButton value="none">No sort</ToggleButton>
            <ToggleButton value="asc">Price ↑</ToggleButton>
            <ToggleButton value="desc">Price ↓</ToggleButton>
          </ToggleButtonGroup>

          <Button variant="contained" onClick={handleOpenCreate}>
            New Product
          </Button>
        </Stack>
      </Stack>

      <CrudTable
        rows={pagedRows}
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
          count={pageCount}
          page={currentPage}
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
