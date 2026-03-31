import { NextResponse } from "next/server";

/**
 * Standard success response helper
 * Usage: return ok({ data: products, total: 42, page: 1, pageSize: 20 })
 */
export function ok<T = any>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Standard error response helper
 * Usage: return error("Product not found", 404)
 */
export function error(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Parse pagination/sorting/filtering params from request
 * Returns: { page, pageSize, search, sortBy, sortOrder }
 */
export function parseSearchParams(req: Request): {
  page: number;
  pageSize: number;
  search: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "10"))
  );
  const search = (url.searchParams.get("search") ?? "").trim();
  const sortBy = url.searchParams.get("sortBy") ?? undefined;
  const sortOrder = (url.searchParams.get("sortOrder") ?? "asc") as
    | "asc"
    | "desc";

  return { page, pageSize, search, sortBy, sortOrder };
}
