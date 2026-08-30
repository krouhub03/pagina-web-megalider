import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function applyCORSHeaders(headers: HeadersInit = {}): HeadersInit {
  const isProd = process.env.NODE_ENV === "production";
  const allowedOrigin = isProd
    ? process.env.ALLOWED_ORIGIN || "https://megalider.com"
    : "*";

  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    ...headers,
  };
}

export function handleCORSPreflight(headers: HeadersInit = {}): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: applyCORSHeaders(headers),
  });
}

export function apiSuccess<T>(
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
  headers?: HeadersInit
): NextResponse<ApiSuccessResponse<T>> {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: meta || { timestamp: new Date().toISOString() },
  };

  return NextResponse.json(body, {
    status,
    headers: applyCORSHeaders(headers),
  });
}

export function apiError(
  message: string,
  status = 500,
  code = "INTERNAL_SERVER_ERROR",
  details?: unknown,
  headers?: HeadersInit
): NextResponse<ApiErrorResponse> {
  const isProd = process.env.NODE_ENV === "production";
  
  let safeDetails = details;
  if (isProd && details instanceof Error) {
    safeDetails = undefined;
  }

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(safeDetails !== undefined && { details: safeDetails }),
    },
  };

  return NextResponse.json(body, {
    status,
    headers: applyCORSHeaders(headers),
  });
}
