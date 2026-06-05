export interface JwtPayload {
  id: string;
  email: string;
  roles: string[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
