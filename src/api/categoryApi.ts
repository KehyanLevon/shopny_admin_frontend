import { http } from "./http";
import type { PaginatedResponse } from "./types";

export interface CategoryDto {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sectionId?: number;
  createdAt: string;
  updatedAt: string | null;
  productsCount: number;
}

export interface CategoryPayload {
  title: string;
  sectionId?: number | null;
  description?: string | null;
  isActive?: boolean;
}

export interface CategoryListParams {
  page?: number;
  limit?: number;
  q?: string;
  sectionId?: number;
  isActive?: number;
  all?: boolean;
  fields?: string;
}

export const categoryApi = {
  getAll(params?: CategoryListParams) {
    return http.get<PaginatedResponse<CategoryDto>>("/categories", {
      params,
    });
  },

  getOne(id: number) {
    return http.get<CategoryDto>(`/categories/${id}`);
  },

  create(payload: CategoryPayload) {
    return http.post<CategoryDto>("/categories", payload);
  },

  update(id: number, payload: CategoryPayload) {
    return http.patch<CategoryDto>(`/categories/${id}`, payload);
  },

  delete(id: number) {
    return http.delete<void>(`/categories/${id}`);
  },
};
