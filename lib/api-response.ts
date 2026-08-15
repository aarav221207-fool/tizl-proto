import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api';
import { ApiError } from './errors';
import { ZodError } from 'zod';

export function successResponse<T>(data: T, statusCode = 200, meta?: ApiResponse<T>['meta']): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status: statusCode }
  );
}

export function errorResponse(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.flatten().fieldErrors,
        },
      },
      { status: 422 }
    );
  }

  console.error('Unhandled API Error:', error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected internal error occurred.',
      },
    },
    { status: 500 }
  );
}
