/** Envelope respons API (docs/API.md §3). */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: FieldError[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
