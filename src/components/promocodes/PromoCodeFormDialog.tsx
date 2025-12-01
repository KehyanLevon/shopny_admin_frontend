import React, { useEffect, useMemo, useState } from "react";
import {
  EntityFormDialog,
  type FormFieldConfig,
} from "../../components/common/EntityFormDialog";
import {
  promoCodesApi,
  type PromoCodeDto,
  type PromoCodeCreatePayload,
  type PromoCodeUpdatePayload,
  type PromoScopeType,
} from "../../api/promoCodesApi";
import { type SectionDto } from "../../api/sectionApi";
import { type CategoryDto } from "../../api/categoryApi";
import { type ProductDto } from "../../api/productApi";
import { Autocomplete, Stack, TextField, Typography } from "@mui/material";

interface PromoCodeFormState {
  code: string;
  description: string;
  scopeType: PromoScopeType;
  discountPercent: string;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;

  sectionId: number | "";
  categoryId: number | "";
  productId: number | "";
}

interface PromoCodeFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  promo: PromoCodeDto | null;
  sections: SectionDto[];
  categories: CategoryDto[];
  products: ProductDto[];
  onClose: () => void;
  onSaved: (promo: PromoCodeDto) => void;
}

const toInputDatetime = (value: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const buildInitialForm = (promo: PromoCodeDto | null): PromoCodeFormState => {
  if (!promo) {
    return {
      code: "",
      description: "",
      scopeType: "all",
      discountPercent: "",
      isActive: true,
      startsAt: "",
      expiresAt: "",
      sectionId: "",
      categoryId: "",
      productId: "",
    };
  }

  return {
    code: promo.code,
    description: promo.description ?? "",
    scopeType: promo.scopeType,
    discountPercent: promo.discountPercent ?? "",
    isActive: promo.isActive,
    startsAt: toInputDatetime(promo.startsAt),
    expiresAt: toInputDatetime(promo.expiresAt),
    sectionId: promo.section?.id ?? "",
    categoryId: promo.category?.id ?? "",
    productId: promo.product?.id ?? "",
  };
};

export const PromoCodeFormDialog: React.FC<PromoCodeFormDialogProps> = ({
  open,
  mode,
  promo,
  sections,
  categories,
  products,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState<PromoCodeFormState>(buildInitialForm(promo));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(promo));
    }
  }, [open, promo, mode]);

  const sectionMap = useMemo(
    () => new Map(sections.map((s) => [s.id, s.title])),
    [sections]
  );

  const categoryWithSectionLabel = (c: CategoryDto) => {
    const sectionTitle = c.sectionId ? sectionMap.get(c.sectionId) : null;
    return sectionTitle ? `${c.title} (${sectionTitle})` : c.title;
  };

  const productLabel = (p: ProductDto) => {
    const category = categories.find((c) => c.id === p.categoryId);
    const sectionTitle =
      category && category.sectionId
        ? sectionMap.get(category.sectionId)
        : null;
    if (category && sectionTitle) {
      return `${p.title} (${category.title} / ${sectionTitle})`;
    }
    if (category) return `${p.title} (${category.title})`;
    return p.title;
  };

  const fields: FormFieldConfig<PromoCodeFormState>[] = useMemo(
    () => [
      {
        name: "code",
        label: "Code",
        type: "text",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
      },
      {
        name: "scopeType",
        label: "Scope type",
        type: "select",
        required: true,
        options: [
          { value: "all", label: "All products" },
          { value: "section", label: "Section" },
          { value: "category", label: "Category" },
          { value: "product", label: "Product" },
        ],
      },
      {
        name: "discountPercent",
        label: "Discount (%)",
        type: "text",
        required: true,
      },
      {
        name: "isActive",
        label: "Active",
        type: "switch",
      },
    ],
    []
  );

  const discountNum = Number(form.discountPercent.replace(",", "."));
  const isDiscountValid =
    !form.discountPercent.trim() ||
    (!Number.isNaN(discountNum) && discountNum >= 0 && discountNum <= 100);

  const isScopeValid =
    form.scopeType === "all" ||
    (form.scopeType === "section" && !!form.sectionId) ||
    (form.scopeType === "category" && !!form.categoryId) ||
    (form.scopeType === "product" && !!form.productId);

  const isValid =
    form.code.trim().length > 0 &&
    form.scopeType !== undefined &&
    isDiscountValid &&
    isScopeValid;

  const handleSave = async () => {
    const trimmedCode = form.code.trim();
    const discountNum = Number(form.discountPercent.replace(",", "."));

    if (!trimmedCode || !isDiscountValid || Number.isNaN(discountNum)) {
      return;
    }

    if (!isScopeValid) {
      return;
    }

    const basePayload = {
      code: trimmedCode,
      description: form.description || null,
      scopeType: form.scopeType,
      discountPercent: discountNum,
      isActive: form.isActive,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
    } as PromoCodeCreatePayload & PromoCodeUpdatePayload;

    if (form.scopeType === "section") {
      basePayload.sectionId = form.sectionId ? Number(form.sectionId) : null;
      basePayload.categoryId = null;
      basePayload.productId = null;
    } else if (form.scopeType === "category") {
      basePayload.categoryId = form.categoryId ? Number(form.categoryId) : null;
      basePayload.sectionId = null;
      basePayload.productId = null;
    } else if (form.scopeType === "product") {
      basePayload.productId = form.productId ? Number(form.productId) : null;
      basePayload.sectionId = null;
      basePayload.categoryId = null;
    } else {
      basePayload.sectionId = null;
      basePayload.categoryId = null;
      basePayload.productId = null;
    }

    setSaving(true);
    try {
      let res;
      if (mode === "edit" && promo) {
        const payload: PromoCodeUpdatePayload = basePayload;
        res = await promoCodesApi.update(promo.id, payload);
      } else {
        const payload: PromoCodeCreatePayload =
          basePayload as PromoCodeCreatePayload;
        res = await promoCodesApi.create(payload);
      }

      onSaved(res.data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedSection =
    form.sectionId === ""
      ? null
      : sections.find((s) => s.id === form.sectionId) ?? null;

  const selectedCategory =
    form.categoryId === ""
      ? null
      : categories.find((c) => c.id === form.categoryId) ?? null;

  const selectedProduct =
    form.productId === ""
      ? null
      : products.find((p) => p.id === form.productId) ?? null;

  return (
    <EntityFormDialog<PromoCodeFormState>
      open={open}
      mode={mode}
      title="Promo code"
      fields={fields}
      values={form}
      onChange={setForm}
      onClose={onClose}
      onSubmit={handleSave}
      submitting={saving}
      isValid={isValid}
    >
      <Stack spacing={2} mt={2}>
        {form.scopeType === "section" && (
          <Autocomplete<SectionDto>
            options={sections}
            value={selectedSection}
            getOptionLabel={(option) => option.title}
            onChange={(_, value) =>
              setForm((prev) => ({
                ...prev,
                sectionId: value ? value.id : "",
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Section"
                size="small"
                fullWidth
                placeholder="Search sections..."
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        )}

        {form.scopeType === "category" && (
          <Autocomplete<CategoryDto>
            options={categories}
            value={selectedCategory}
            getOptionLabel={(option) => categoryWithSectionLabel(option)}
            onChange={(_, value) =>
              setForm((prev) => ({
                ...prev,
                categoryId: value ? value.id : "",
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category"
                size="small"
                fullWidth
                placeholder="Search categories..."
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        )}

        {form.scopeType === "product" && (
          <Autocomplete<ProductDto>
            options={products}
            value={selectedProduct}
            getOptionLabel={(option) => productLabel(option)}
            onChange={(_, value) =>
              setForm((prev) => ({
                ...prev,
                productId: value ? value.id : "",
              }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product"
                size="small"
                fullWidth
                placeholder="Search products..."
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Starts at"
            type="datetime-local"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.startsAt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, startsAt: e.target.value }))
            }
          />
          <TextField
            label="Expires at"
            type="datetime-local"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={form.expiresAt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, expiresAt: e.target.value }))
            }
          />
        </Stack>

        {!isDiscountValid && (
          <Typography color="error" variant="body2">
            Discount percent must be between 0 and 100.
          </Typography>
        )}
        {!isScopeValid && (
          <Typography color="error" variant="body2">
            Please select a target (section/category/product) for this scope.
          </Typography>
        )}
      </Stack>
    </EntityFormDialog>
  );
};
