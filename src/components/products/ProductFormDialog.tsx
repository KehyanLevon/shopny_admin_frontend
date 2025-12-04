import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
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

type FieldName = keyof ProductFormState;
type ProductFormErrors = Partial<Record<FieldName | "global", string[]>>;

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
  const [initialForm, setInitialForm] = useState<ProductFormState>(
    buildInitialForm(product)
  );
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>(
    {}
  );
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      const init = buildInitialForm(product);
      setForm(init);
      setInitialForm(init);
      setSaving(false);
      setErrors({});
      setTouched({});
    }
  }, [open, product, mode]);

  const sectionMap = useMemo(
    () => new Map(sections.map((s) => [s.id, s.title])),
    [sections]
  );

  const fields: FormFieldConfig<ProductFormState>[] = useMemo(
    () => [
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
        name: "price",
        label: "Price",
        type: "text",
        required: true,
      },
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

  const validate = (state: ProductFormState): ProductFormErrors => {
    const e: ProductFormErrors = {};
    const title = state.title.trim();
    if (!title) {
      e.title = ["Title is required."];
    } else {
      if (title.length < 2) {
        e.title = [
          ...(e.title ?? []),
          "Title must be at least 2 characters long.",
        ];
      }
      if (title.length > 255) {
        e.title = [
          ...(e.title ?? []),
          "Title must not be longer than 255 characters.",
        ];
      }
    }
    const desc = state.description ?? "";
    if (desc.length > 5000) {
      e.description = ["Description must not be longer than 5000 characters."];
    }
    const priceStr = state.price.replace(",", ".").trim();
    if (!priceStr) {
      e.price = ["Price is required."];
    } else {
      const priceNum = Number(priceStr);
      if (Number.isNaN(priceNum)) {
        e.price = ["Price must be numeric."];
      } else if (priceNum <= 0) {
        e.price = ["Price must be greater than zero."];
      }
    }
    const discountStr = state.discountPrice.replace(",", ".").trim();
    if (discountStr) {
      const discountNum = Number(discountStr);
      if (Number.isNaN(discountNum)) {
        e.discountPrice = ["Discount price must be numeric."];
      } else if (discountNum < 0) {
        e.discountPrice = ["Discount price cannot be negative."];
      }

      const priceNum = Number(priceStr || "0");
      if (
        !Number.isNaN(priceNum) &&
        priceNum > 0 &&
        !Number.isNaN(discountNum) &&
        discountNum >= priceNum
      ) {
        e.discountPrice = [
          ...(e.discountPrice ?? []),
          "Discount price must be lower than price.",
        ];
      }
    }
    if (!state.categoryId) {
      e.categoryId = ["categoryId is required."];
    } else if (Number(state.categoryId) <= 0) {
      e.categoryId = ["categoryId must be a positive integer."];
    }

    return e;
  };
  useEffect(() => {
    if (!open) return;

    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }

    validationTimerRef.current = setTimeout(() => {
      const allErrors = validate(form);

      setErrors((prev) => {
        const next: ProductFormErrors = { ...prev };
        (Object.keys(touched) as FieldName[]).forEach((name) => {
          if (allErrors[name]) {
            next[name] = allErrors[name];
          } else {
            delete next[name];
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
  }, [form, touched, open]);

  const handleFieldBlur = (name: FieldName) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const allErrors = validate(form);
    setErrors((prev) => {
      const next: ProductFormErrors = { ...prev };
      if (allErrors[name]) {
        next[name] = allErrors[name];
      } else {
        delete next[name];
      }
      return next;
    });
  };
  const hasFieldErrors = Object.keys(errors).some(
    (key) => key !== "global" && (errors as any)[key]?.length
  );

  const finalErrors = validate(form);
  const hasFinalErrors = Object.keys(finalErrors).length > 0;
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const isValid = !hasFieldErrors && !hasFinalErrors && isDirty;

  const handleSave = async () => {
    const fullErrors = validate(form);
    if (Object.keys(fullErrors).length > 0) {
      setErrors(fullErrors);
      setTouched({
        title: true,
        description: true,
        price: true,
        discountPrice: true,
        categoryId: true,
        isActive: true,
        images: true,
      });
      return;
    }

    const trimmedTitle = form.title.trim();
    const priceNum = Number(form.price.replace(",", ".").trim());
    const hasDiscount = form.discountPrice.trim() !== "";
    const discountNum = hasDiscount
      ? Number(form.discountPrice.replace(",", ".").trim())
      : null;

    setSaving(true);
    setErrors({});
    try {
      const basePayload = {
        title: trimmedTitle,
        description: form.description || null,
        price: priceNum,
        discountPrice: hasDiscount && discountNum !== null ? discountNum : null,
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
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as any;

        if (status === 422 && data?.errors) {
          const backendErrors: ProductFormErrors = {};

          Object.entries(
            data.errors as Record<string, string[] | string>
          ).forEach(([key, value]) => {
            const messages = Array.isArray(value) ? value : [value];

            if (
              [
                "title",
                "description",
                "price",
                "discountPrice",
                "categoryId",
                "isActive",
              ].includes(key)
            ) {
              (backendErrors as any)[key] = messages;
              return;
            }

            if (key === "images" || key.startsWith("images[")) {
              backendErrors.images = [
                ...(backendErrors.images ?? []),
                ...messages,
              ];
              return;
            }

            backendErrors.global = [
              ...(backendErrors.global ?? []),
              ...messages,
            ];
          });

          setErrors(backendErrors);
          return;
        }

        if (data?.message || data?.error) {
          setErrors({
            global: [data.message ?? data.error],
          });
          return;
        }
      }

      setErrors({
        global: ["Unexpected error occurred. Please try again."],
      });
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
      errors={errors}
      onFieldBlur={handleFieldBlur}
    >
      <ProductImagesManager
        productId={product?.id ?? null}
        images={form.images}
        onChange={(updated) =>
          setForm((prev) => ({ ...prev, images: updated }))
        }
      />

      {errors.images && (
        <div style={{ marginTop: 8 }}>
          <span style={{ color: "#d32f2f", fontSize: 12 }}>
            {errors.images.join(" ")}
          </span>
        </div>
      )}
    </EntityFormDialog>
  );
};
