import { http } from "./http";

export interface CategoryDto {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sectionId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  productsCount: number;
}

export interface CategoryPayload {
  title: string;
  sectionId: number;
  description?: string | null;
  isActive?: boolean;
}

export const categoryApi = {
  getAll(sectionId?: number) {
    return http.get<CategoryDto[]>("/categories", {
      params: sectionId ? { sectionId } : undefined,
    });
  },

  getById(id: number) {
    return http.get<CategoryDto>(`/categories/${id}`);
  },

  create(payload: CategoryPayload) {
    return http.post<CategoryDto>("/categories", payload);
  },

  update(
    id: number,
    payload: Partial<CategoryPayload>
  ) {
    return http.patch<CategoryDto>(`/categories/${id}`, payload);
  },

  delete(id: number) {
    return http.delete<void>(`/categories/${id}`);
  },
};
