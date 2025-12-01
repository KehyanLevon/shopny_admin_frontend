import { useEffect, useState } from "react";
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
import {
  productApi,
  type ProductDto,
  type ProductListParams,
} from "../../api/productApi";
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

  // 🔹 фильтры / поиск / сортировка
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1); // сколько всего страниц приходит с бека
  const [total, setTotal] = useState(0); // общее кол-во товаров (если пригодится)

  const [selectedSectionId, setSelectedSectionId] = useState<number | "all">(
    "all"
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">(
    "all"
  );
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");

  // 🔹 модалки
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
        // бек ожидает параметр q
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

      const res: any = await productApi.getAll(params);
      const data = res?.data ?? res;

      const items: ProductDto[] = data?.items ?? data ?? [];
      setProducts(items);

      // 🔹 берём мета-информацию с бека
      if (typeof data?.total === "number") {
        setTotal(data.total);
      }
      if (typeof data?.pages === "number") {
        setPages(data.pages);
      } else if (typeof data?.total === "number") {
        // fallback, если pages не пришёл
        setPages(Math.max(1, Math.ceil(data.total / ROWS_PER_PAGE)));
      } else {
        // совсем fallback
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
  }, [page, search, selectedSectionId, selectedCategoryId, priceSort]);

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

  // ❌ УБРАНО: локальная фильтрация / сортировка / пагинация (filtered, pagedRows)
  // Теперь products — это уже отфильтрованный/отсортированный список с нужной страницы.

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
        row.isArchived ? ( // если такого поля нет — убери
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
        // если на беке нет imagesCount — можно считать по длине массива
        (row as any).imagesCount ?? (row.images ? row.images.length : 0),
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2} gap={2}>
        <Typography variant="h5">
          Products{total ? ` (${total})` : ""}
        </Typography>
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
              const next = (value || "none") as "none" | "asc" | "desc";
              setPriceSort(next);
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
        rows={products} // ✅ теперь просто items с текущей страницы
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
          count={pages} // ✅ кол-во страниц с бека
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
