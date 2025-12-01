import { http } from "./http";
import type { PaginatedResponse } from "./types";

export type PromoScopeType = "all" | "section" | "category" | "product";

export interface PromoRelatedEntity {
  id: number;
  title: string;
}

export interface PromoCodeDto {
  id: number;
  code: string;
  description: string | null;
  scopeType: PromoScopeType;
  discountPercent: string;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  section: PromoRelatedEntity | null;
  category: PromoRelatedEntity | null;
  product: PromoRelatedEntity | null;
}

export interface PromoCodeListParams {
  page?: number;
  limit?: number;
  search?: string;
  scopeType?: PromoScopeType;
  isActive?: 0 | 1;
  isExpired?: 0 | 1;
}

export interface PromoCodeCreatePayload {
  code: string;
  description?: string | null;
  scopeType: PromoScopeType;
  discountPercent: number;
  sectionId?: number | null;
  categoryId?: number | null;
  productId?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export interface PromoCodeUpdatePayload {
  code?: string;
  description?: string | null;
  scopeType?: PromoScopeType;
  discountPercent?: number;
  sectionId?: number | null;
  categoryId?: number | null;
  productId?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export interface PromoCodeVerifyResponse {
  valid: boolean;
  reason?: string | null; // not_found | inactive | not_started | expired | code_required
  promo?: PromoCodeDto | null;
}

export const promoCodesApi = {
  getAll(params?: PromoCodeListParams) {
    return http.get<PaginatedResponse<PromoCodeDto>>("/promocodes", {
      params,
    });
  },

  getOne(id: number) {
    return http.get<PromoCodeDto>(`/promocodes/${id}`);
  },

  create(payload: PromoCodeCreatePayload) {
    return http.post<PromoCodeDto>("/promocodes", payload);
  },

  update(id: number, payload: PromoCodeUpdatePayload) {
    return http.patch<PromoCodeDto>(`/promocodes/${id}`, payload);
  },

  delete(id: number) {
    return http.delete<void>(`/promocodes/${id}`);
  },

  verify(code: string) {
    return http.post<PromoCodeVerifyResponse>("/promocodes/verify", { code });
  },
};
