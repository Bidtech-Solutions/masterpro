import type { ApiErrorBody, FieldError } from "@/types/api";

/** Error dari API dengan kode stabil (docs/API.md §3.3). Tampilkan pesan berdasarkan `code`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldError[];
  readonly retryAfter?: number;

  constructor(status: number, body: ApiErrorBody, retryAfter?: number) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details ?? [];
    this.retryAfter = retryAfter;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
