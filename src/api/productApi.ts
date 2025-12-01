import { http } from "./http";
import type { PaginatedResponse } from "./types";

export interface ProductDto {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: string;
  discountPrice: string | null;
  status: string;
  isActive: boolean;
  isArchived: string;
  images: string[] | null;
  imagesCount: number;

  categoryId: number;
  categoryTitle: string | null;
  sectionId: number;
  sectionTitle: string | null;

  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductCreatePayload {
  title: string;
  price: string;
  categoryId: number;
  description?: string | null;
  discountPrice?: string | null;
  status?: string | null;
  images?: string[] | null;
  isActive?: boolean;
}

export interface ProductUpdatePayload {
  title?: string;
  price?: string;
  categoryId?: number;
  description?: string | null;
  discountPrice?: string | null;
  status?: string | null;
  images?: string[] | null;
  isActive?: boolean;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "price" | "createdAt";
  sortDir?: "asc" | "desc";
  categoryId?: number;
  sectionId?: number;
}

export const productApi = {
  getAll(params?: ProductListParams) {
    return http.get<PaginatedResponse<ProductDto>>("/products", {
      params,
    });
  },

  getOne(id: number) {
    return http.get<ProductDto>(`/products/${id}`);
  },

  create(payload: ProductCreatePayload) {
    return http.post<ProductDto>("/products", payload);
  },

  update(id: number, payload: ProductUpdatePayload) {
    return http.patch<ProductDto>(`/products/${id}`, payload);
  },

  delete(id: number) {
    return http.delete<void>(`/products/${id}`);
  },
};
