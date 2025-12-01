import React, { useEffect, useMemo, useState } from "react";
import { productApi, type ProductDto } from "../../api/productApi";
import { type CategoryDto } from "../../api/categoryApi";
import { type SectionDto } from "../../api/sectionApi";
import {
  EntityFormDialog,
  type FormFieldConfig,
} from "../../components/common/EntityFormDialog";
import { ProductImagesManager } from "./ProductImagesManager";

interface ProductFormState {
  title: string;
  description: string;
  price: string;
  discountPrice: string;
  categoryId: number | "";
  isActive: boolean;
  images: string[];
}

interface ProductFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  product: ProductDto | null;
  categories: CategoryDto[];
  sections: SectionDto[];
  onClose: () => void;
  onSaved: (product: ProductDto) => void;
}

const buildInitialForm = (product: ProductDto | null): ProductFormState => {
  if (!product) {
    return {
      title: "",
      description: "",
      price: "",
      discountPrice: "",
      categoryId: "",
      isActive: true,
      images: [],
    };
  }

  return {
    title: product.title,
    description: product.description ?? "",
    price:
      product.price !== null && product.price !== undefined
        ? String(product.price)
        : "",
    discountPrice:
      product.discountPrice !== null && product.discountPrice !== undefined
        ? String(product.discountPrice)
        : "",
    categoryId: product.categoryId ?? "",
    isActive: product.isActive,
    images: (product as any).images ?? [],
  };
};

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  mode,
  product,
  categories,
  sections,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<ProductFormState>(buildInitialForm(product));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(product));
    }
  }, [open, product, mode]);

  const sectionMap = useMemo(
    () => new Map(sections.map((s) => [s.id, s.title])),
    [sections]
  );

  const fields: FormFieldConfig<ProductFormState>[] = useMemo(
    () => [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "price", label: "Price", type: "text", required: true },
      {
        name: "discountPrice",
        label: "Discount price",
        type: "text",
      },
      {
        name: "categoryId",
        label: "Category",
        type: "select",
        required: true,
        options: categories.map((c) => ({
          value: c.id,
          label:
            c.sectionId && sectionMap.get(c.sectionId)
              ? `${c.title} (${sectionMap.get(c.sectionId)})`
              : c.title,
        })),
      },
      { name: "isActive", label: "Active", type: "switch" },
    ],
    [categories, sectionMap]
  );

  const priceNum = Number(form.price.replace(",", "."));
  const hasDiscount = form.discountPrice.trim() !== "";
  const discountNum = hasDiscount
    ? Number(form.discountPrice.replace(",", "."))
    : null;

  const isDiscountValid =
    !hasDiscount ||
    (discountNum !== null &&
      Number.isFinite(discountNum) &&
      discountNum >= 0 &&
      discountNum <= priceNum);

  const isValid =
    form.title.trim().length > 0 &&
    !!form.categoryId &&
    Number.isFinite(priceNum) &&
    priceNum >= 0 &&
    isDiscountValid;

  const handleSave = async () => {
    const trimmedTitle = form.title.trim();
    const priceNum = Number(form.price.replace(",", "."));
    const hasDiscount = form.discountPrice.trim() !== "";
    const discountNum = hasDiscount
      ? Number(form.discountPrice.replace(",", "."))
      : null;

    if (
      !trimmedTitle ||
      !form.categoryId ||
      !Number.isFinite(priceNum) ||
      priceNum < 0 ||
      !isDiscountValid
    ) {
      return;
    }

    setSaving(true);
    try {
      const basePayload = {
        title: trimmedTitle,
        description: form.description || null,
        price: priceNum.toString(),
        discountPrice:
          hasDiscount && discountNum !== null ? discountNum.toString() : null,
        categoryId: form.categoryId as number,
        isActive: form.isActive,
        images: form.images.length ? form.images : null,
      };

      let res;
      if (mode === "edit" && product) {
        const payload: import("../../api/productApi").ProductUpdatePayload = {
          ...basePayload,
        };
        res = await productApi.update(product.id, payload);
      } else {
        const payload: import("../../api/productApi").ProductCreatePayload = {
          ...basePayload,
        };
        res = await productApi.create(payload);
      }

      onSaved(res.data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityFormDialog<ProductFormState>
      open={open}
      mode={mode}
      title="Product"
      fields={fields}
      values={form}
      onChange={setForm}
      onClose={onClose}
      onSubmit={handleSave}
      submitting={saving}
      isValid={isValid}
    >
      <ProductImagesManager
        productId={product?.id ?? null}
        images={form.images}
        onChange={(updated) =>
          setForm((prev) => ({ ...prev, images: updated }))
        }
      />
    </EntityFormDialog>
  );
};
