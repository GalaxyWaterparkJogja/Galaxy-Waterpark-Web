export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
