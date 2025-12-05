import { http } from "./http";
import type { PaginatedResponse } from "./types";

export interface SectionDto {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  categoriesCount: number;
}

export interface SectionCreatePayload {
  title: string;
  description?: string | null;
  isActive?: boolean;
}

export interface SectionUpdatePayload {
  title?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface SectionListParams {
  page?: number;
  limit?: number;
  q?: string;
  all?: boolean;
  fields?: string;
}

export const sectionApi = {
  getAll(params?: SectionListParams) {
    return http.get<PaginatedResponse<SectionDto>>("/sections", {
      params,
    });
  },

  getOne(id: number) {
    return http.get<SectionDto>(`/sections/${id}`);
  },

  create(payload: SectionCreatePayload) {
    return http.post<SectionDto>("/sections", payload);
  },

  update(id: number, payload: SectionUpdatePayload) {
    return http.patch<SectionDto>(`/sections/${id}`, payload);
  },

  delete(id: number) {
    return http.delete<void>(`/sections/${id}`);
  },
};
