import { http } from "./http";
import type { PaginatedResponse } from "./types";

export interface UserDto {
  id: number;
  name: string;
  surname: string;
  email: string;
  roles: string[];
  isVerified: boolean;
  verifiedAt: string | null;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const usersApi = {
  getAll(params?: UserListParams) {
    return http.get<PaginatedResponse<UserDto>>("/users", {
      params,
    });
  },
};
