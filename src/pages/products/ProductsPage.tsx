import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { productApi, type ProductDto } from "../../api/productApi";
import { categoryApi, type CategoryDto } from "../../api/categoryApi";
import { sectionApi, type SectionDto } from "../../api/sectionApi";
import { CrudTable, type CrudColumn } from "../../components/common/CrudTable";
import { TruncatedTextWithTooltip } from "../../components/common/TruncatedTextWithTooltip";
import { ConfirmDeleteDialog } from "../../components/common/ConfirmDeleteDialog";
import { ProductFormDialog } from "../../components/products/ProductFormDialog";

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentProduct, setCurrentProduct] = useState<ProductDto | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<ProductDto | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, catRes, secRes] = await Promise.all([
        productApi.getAll(),
        categoryApi.getAll(),
        sectionApi.getAll(),
      ]);

      setProducts(
        prodRes.data.map((p) => ({
          ...p,
          price: Number(p.price),
          discountPrice:
            p.discountPrice !== null && p.discountPrice !== undefined
              ? Number(p.discountPrice)
              : null,
        }))
      );
      setCategories(catRes.data);
      setSections(secRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const sectionMap = useMemo(
    () => new Map(sections.map((s) => [s.id, s.title])),
    [sections]
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.title])),
    [categories]
  );

  const columns: CrudColumn<ProductDto>[] = useMemo(
    () => [
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
        id: "price",
        label: "Price",
        render: (row) => {
          const price = Number(row.price);
          const discount =
            row.discountPrice !== null && row.discountPrice !== undefined
              ? Number(row.discountPrice)
              : null;

          if (
            discount !== null &&
            Number.isFinite(discount) &&
            Number.isFinite(price) &&
            discount < price
          ) {
            return (
              <>
                <Typography
                  component="span"
                  sx={{
                    textDecoration: "line-through",
                    mr: 1,
                    color: "text.secondary",
                    fontSize: "0.875rem",
                  }}
                >
                  {price.toFixed(2)} ֏
                </Typography>
                <Typography component="span" sx={{ fontWeight: 600 }}>
                  {discount.toFixed(2)} ֏
                </Typography>
              </>
            );
          }

          return Number.isFinite(price) ? `${price.toFixed(2)} ֏` : "-";
        },
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
        id: "category",
        label: "Category",
        render: (row) =>
          row.categoryId
            ? categoryMap.get(row.categoryId) ?? `#${row.categoryId}`
            : "-",
      },
      {
        id: "images",
        label: "Images",
        render: (row) => {
          const images = (row as any).images as string[] | null | undefined;
          return images?.length ?? 0;
        },
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
    ],
    [categoryMap, sectionMap]
  );

  const handleOpenCreate = () => {
    setFormMode("create");
    setCurrentProduct(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (product: ProductDto) => {
    setFormMode("edit");
    setCurrentProduct(product);
    setFormOpen(true);
  };

  const handleSaved = (saved: ProductDto) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [saved, ...prev];
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id;
    await productApi.delete(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Products</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          New Product
        </Button>
      </Stack>

      <CrudTable
        rows={products}
        columns={columns}
        loading={loading}
        emptyMessage="No products yet."
        onEdit={handleOpenEdit}
        onDelete={(row) => setDeleteConfirm(row)}
      />

      <ProductFormDialog
        open={formOpen}
        mode={formMode}
        product={currentProduct}
        categories={categories}
        sections={sections}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete product"
        description={
          <>
            Are you sure you want to delete product{" "}
            <strong>{deleteConfirm?.title}</strong>?
          </>
        }
      />
    </Box>
  );
};
