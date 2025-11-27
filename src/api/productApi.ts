import { http } from "./http";

export interface ProductDto {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number | string;
  discountPrice: number | string | null;
  isActive: boolean;
  categoryId: number | null;
  sectionId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  imagesCount: number;
}

export interface ProductPayload {
  title: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  categoryId: number;
  isActive?: boolean;
}

export const productApi = {
  getAll() {
    return http.get<ProductDto[]>("/products");
  },

  getById(id: number) {
    return http.get<ProductDto>(`/products/${id}`);
  },

  create(payload: ProductPayload) {
    return http.post<ProductDto>("/products", payload);
  },

  update(id: number, payload: Partial<ProductPayload>) {
    return http.patch<ProductDto>(`/products/${id}`, payload);
  },

  delete(id: number) {
    return http.delete<void>(`/products/${id}`);
  },
  uploadImages(productId: number, formData: FormData) {
    return http.post(`/products/${productId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteImage(productId: number, path: string) {
    return http.delete(`/products/${productId}/images`, {
      data: { path },
    });
  },
};
