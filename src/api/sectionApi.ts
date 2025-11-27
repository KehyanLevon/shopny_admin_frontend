import { http } from "./http";

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

export interface SectionPayload {
  title: string;
  description?: string | null;
  isActive?: boolean;
}

export const sectionApi = {
  getAll() {
    return http.get<SectionDto[]>("/sections");
  },

  getById(id: number) {
    return http.get<SectionDto>(`/sections/${id}`);
  },

  create(payload: SectionPayload) {
    return http.post<SectionDto>("/sections", payload);
  },

  update(id: number, payload: Partial<SectionPayload>) {
    return http.patch<SectionDto>(`/sections/${id}`, payload);
  },

  delete(id: number) {
    return http.delete<void>(`/sections/${id}`);
  },
};
