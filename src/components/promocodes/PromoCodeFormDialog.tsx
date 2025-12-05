import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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

type PromoCodeFormErrors = Partial<
  Record<keyof PromoCodeFormState | "global", string[]>
>;

type PromoCodeTouched = Partial<Record<keyof PromoCodeFormState, boolean>>;

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

const validatePromo = (values: PromoCodeFormState): PromoCodeFormErrors => {
  const errors: PromoCodeFormErrors = {};

  const code = values.code.trim();
  if (!code) {
    errors.code = ["Code is required."];
  } else if (code.length < 2) {
    errors.code = ["Code must be at least 2 characters long."];
  } else if (code.length > 64) {
    errors.code = ["Code must not be longer than 64 characters."];
  }

  const description = values.description ?? "";
  if (description.length > 5000) {
    errors.description = [
      "Description must not be longer than 5000 characters.",
    ];
  }

  const discountStr = values.discountPercent.trim();
  if (!discountStr) {
    errors.discountPercent = ["Discount percent is required."];
  } else {
    const discountNum = Number(discountStr.replace(",", "."));
    if (Number.isNaN(discountNum)) {
      errors.discountPercent = ["Discount percent must be a number."];
    } else if (discountNum < 0 || discountNum > 100) {
      errors.discountPercent = ["Discount percent must be between 0 and 100."];
    }
  }

  if (!values.scopeType) {
    errors.scopeType = ["Scope type is required."];
  } else if (values.scopeType === "section" && !values.sectionId) {
    errors.scopeType = ["Section is required for this scope."];
  } else if (values.scopeType === "category" && !values.categoryId) {
    errors.scopeType = ["Category is required for this scope."];
  } else if (values.scopeType === "product" && !values.productId) {
    errors.scopeType = ["Product is required for this scope."];
  }

  if (values.startsAt && values.expiresAt) {
    const start = new Date(values.startsAt);
    const end = new Date(values.expiresAt);
    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end < start
    ) {
      errors.expiresAt = ["Expires at must be after or equal to Starts at."];
    }
  }

  return errors;
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
  const [initialForm, setInitialForm] = useState<PromoCodeFormState>(
    buildInitialForm(promo)
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<PromoCodeFormErrors>({});
  const [touched, setTouched] = useState<PromoCodeTouched>({});

  useEffect(() => {
    if (open) {
      const init = buildInitialForm(promo);
      setForm(init);
      setInitialForm(init);
      setErrors({});
      setTouched({});
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
        rows: 4,
        maxLength: 5000,
        showCounter: true,
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

  const handleFormChange = (next: PromoCodeFormState) => {
    setForm(next);

    const allErrors = validatePromo(next);
    setErrors((prev) => {
      const res: PromoCodeFormErrors = { ...prev };
      (Object.keys(touched) as (keyof PromoCodeFormState)[]).forEach((key) => {
        if (touched[key]) {
          if (allErrors[key]?.length) {
            res[key] = allErrors[key];
          } else {
            delete res[key];
          }
        }
      });
      return res;
    });
  };

  const handleFieldBlur = (name: keyof PromoCodeFormState) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const allErrors = validatePromo(form);

    setErrors((prev) => {
      const next: PromoCodeFormErrors = { ...prev };

      if (allErrors[name]?.length) {
        next[name] = allErrors[name];
      } else {
        delete next[name];
      }

      return next;
    });
  };

  const clientErrors = validatePromo(form);
  const hasClientErrors = Object.keys(clientErrors).length > 0;

  const hasFieldErrorsFromState = Object.entries(errors).some(
    ([key, val]) =>
      key !== "global" && Array.isArray(val) && (val as string[]).length > 0
  );

  const isFormValid = !hasClientErrors && !hasFieldErrorsFromState;
  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  const handleSave = async () => {
    const localErrors = validatePromo(form);
    if (Object.keys(localErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...localErrors }));
      setTouched({
        code: true,
        description: true,
        scopeType: true,
        discountPercent: true,
        startsAt: true,
        expiresAt: true,
        sectionId: true,
        categoryId: true,
        productId: true,
      });
      return;
    }

    const trimmedCode = form.code.trim();
    const discountNum = Number(form.discountPercent.replace(",", "."));

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
    setErrors({});
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
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response as {
          status: number;
          data: any;
        };

        if (status === 422 || status === 400) {
          const backendErrors: PromoCodeFormErrors = data?.errors ?? {};
          if (!backendErrors.global && data?.message) {
            backendErrors.global = [data.message];
          }
          if (!backendErrors.global && data?.error) {
            backendErrors.global = [data.error];
          }
          setErrors(backendErrors);
        } else {
          setErrors({
            global: ["Unexpected error. Please try again later."],
          });
        }
      } else {
        setErrors({
          global: ["Unexpected error. Please try again later."],
        });
      }
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

  const discountNum = Number(form.discountPercent.replace(",", "."));
  const isDiscountValid =
    !form.discountPercent.trim() ||
    (!Number.isNaN(discountNum) && discountNum >= 0 && discountNum <= 100);

  const isScopeValid =
    form.scopeType === "all" ||
    (form.scopeType === "section" && !!form.sectionId) ||
    (form.scopeType === "category" && !!form.categoryId) ||
    (form.scopeType === "product" && !!form.productId);

  const startsAtErrors = errors.startsAt;
  const startsAtErrorText = startsAtErrors?.join(" ") ?? "";

  const expiresAtErrors = errors.expiresAt;
  const expiresAtErrorText = expiresAtErrors?.join(" ") ?? "";

  return (
    <EntityFormDialog<PromoCodeFormState>
      open={open}
      mode={mode}
      title="Promo code"
      fields={fields}
      values={form}
      onChange={handleFormChange}
      onClose={onClose}
      onSubmit={handleSave}
      submitting={saving}
      isValid={isFormValid && hasChanges}
      errors={errors}
      onFieldBlur={handleFieldBlur}
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
            onBlur={() => handleFieldBlur("startsAt")}
            error={!!startsAtErrors}
            helperText={startsAtErrorText || " "}
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
            onBlur={() => handleFieldBlur("expiresAt")}
            error={!!expiresAtErrors}
            helperText={expiresAtErrorText || " "}
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
