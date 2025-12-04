import { useEffect, useState } from "react";
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
  promoCodesApi,
  type PromoCodeDto,
  type PromoScopeType,
} from "../../api/promoCodesApi";
import { sectionApi, type SectionDto } from "../../api/sectionApi";
import { categoryApi, type CategoryDto } from "../../api/categoryApi";
import { productApi, type ProductDto } from "../../api/productApi";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";
import { ConfirmDeleteDialog } from "../../components/common/ConfirmDeleteDialog";
import { TruncatedTextWithTooltip } from "../../components/common/TruncatedTextWithTooltip";
import { PromoCodeFormDialog } from "../../components/promocodes/PromoCodeFormDialog";

const ROWS_PER_PAGE = 10;

const scopeTypeLabel = (scope: PromoScopeType, promo: PromoCodeDto): string => {
  switch (scope) {
    case "all":
      return "All products";
    case "section":
      return promo.section ? `Section: ${promo.section.title}` : "Section";
    case "category":
      return promo.category ? `Category: ${promo.category.title}` : "Category";
    case "product":
      return promo.product ? `Product: ${promo.product.title}` : "Product";
    default:
      return scope;
  }
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCodeDto[]>([]);
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [scopeFilter, setScopeFilter] = useState<PromoScopeType | "all-scopes">(
    "all-scopes"
  );
  const [isActiveFilter, setIsActiveFilter] = useState<
    "" | "active" | "inactive"
  >("");
  const [expiredFilter, setExpiredFilter] = useState<
    "" | "expired" | "not-expired"
  >("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(ROWS_PER_PAGE);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingPromo, setEditingPromo] = useState<PromoCodeDto | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromoCodeDto | null>(null);
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
    const res: any = await productApi.getAll();
    const items: ProductDto[] = res?.data?.items ?? res?.data ?? res ?? [];
    setProducts(items);
  };

  const loadPromoCodes = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: ROWS_PER_PAGE,
        search: search.trim() || undefined,
      };

      if (scopeFilter !== "all-scopes") {
        params.scopeType = scopeFilter;
      }

      if (isActiveFilter === "active") {
        params.isActive = 1;
      } else if (isActiveFilter === "inactive") {
        params.isActive = 0;
      }

      if (expiredFilter === "expired") {
        params.isExpired = 1;
      } else if (expiredFilter === "not-expired") {
        params.isExpired = 0;
      }

      const res = await promoCodesApi.getAll(params);
      const data = res.data;
      setPromoCodes(data.items);
      setTotal(data.total);
      setLimit(data.limit ?? ROWS_PER_PAGE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSections();
    void loadCategories();
    void loadProducts();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    void loadPromoCodes();
  }, [page, search, scopeFilter, isActiveFilter, expiredFilter]);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingPromo(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (promo: PromoCodeDto) => {
    setFormMode("edit");
    setEditingPromo(promo);
    setFormOpen(true);
  };

  const handlePromoSaved = async () => {
    setFormOpen(false);
    await loadPromoCodes();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await promoCodesApi.delete(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadPromoCodes();
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: CrudColumn<PromoCodeDto>[] = [
    {
      id: "code",
      label: "Code",
      render: (row) => row.code,
    },
    {
      id: "description",
      label: "Description",
      render: (row) => (
        <TruncatedTextWithTooltip text={row.description ?? ""} max={40} />
      ),
    },
    {
      id: "scope",
      label: "Scope",
      render: (row) => scopeTypeLabel(row.scopeType, row),
    },
    {
      id: "discount",
      label: "Discount",
      align: "right",
      render: (row) => `${Number(row.discountPercent).toFixed(2)}%`,
    },
    {
      id: "status",
      label: "Status",
      render: (row) =>
        row.isActive ? (
          <Chip label="Active" color="success" size="small" />
        ) : (
          <Chip label="Inactive" color="warning" size="small" />
        ),
    },
    {
      id: "expiresAt",
      label: "Expires at",
      render: (row) => {
        const expired =
          row.expiresAt && new Date(row.expiresAt).getTime() < Date.now();
        return (
          <Typography
            variant="body2"
            color={expired ? "error" : "text.primary"}
          >
            {formatDateTime(row.expiresAt)}
          </Typography>
        );
      },
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={2} gap={2}>
        <Typography variant="h5">Promo codes</Typography>
        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            label="Search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
            }}
          />

          <TextField
            select
            size="small"
            label="Scope"
            value={scopeFilter}
            onChange={(e) => {
              const val = e.target.value as PromoScopeType | "all-scopes";
              setScopeFilter(val);
              setPage(1);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all-scopes">All scopes</MenuItem>
            <MenuItem value="all">All products</MenuItem>
            <MenuItem value="section">Section</MenuItem>
            <MenuItem value="category">Category</MenuItem>
            <MenuItem value="product">Product</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Active"
            value={isActiveFilter}
            onChange={(e) => {
              const val = e.target.value as "" | "active" | "inactive";
              setIsActiveFilter(val);
              setPage(1);
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Only active</MenuItem>
            <MenuItem value="inactive">Only inactive</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Expired"
            value={expiredFilter}
            onChange={(e) => {
              const val = e.target.value as "" | "expired" | "not-expired";
              setExpiredFilter(val);
              setPage(1);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="not-expired">Only valid / no date</MenuItem>
            <MenuItem value="expired">Only expired</MenuItem>
          </TextField>

          <Button variant="contained" onClick={handleOpenCreate}>
            New promo code
          </Button>
        </Stack>
      </Stack>

      <CrudTable<PromoCodeDto>
        rows={promoCodes}
        columns={columns}
        loading={loading}
        emptyMessage="No promo codes."
        onEdit={handleOpenEdit}
        onDelete={(row) => {
          setDeleteTarget(row);
          setDeleteOpen(true);
        }}
      />

      <Stack mt={2} alignItems="center">
        <Pagination
          count={pageCount}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Stack>

      <PromoCodeFormDialog
        open={formOpen}
        mode={formMode}
        promo={editingPromo}
        sections={sections}
        categories={categories}
        products={products}
        onClose={() => setFormOpen(false)}
        onSaved={async () => {
          await handlePromoSaved();
        }}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete promo code"
        description={
          deleteTarget
            ? `Are you sure you want to delete promo code "${deleteTarget.code}"?`
            : ""
        }
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteLoading}
      />
    </Box>
  );
}
