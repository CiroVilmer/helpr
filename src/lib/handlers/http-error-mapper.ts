// src/lib/handlers/http-error-mapper.ts
// Maps thrown errors to a consistent HTTP shape: { error: { statusCode, message, userMessage } }.
import { ZodError } from 'zod'
import { BaseException } from '@/exceptions/base/base-exceptions'

export type ErrorBody = {
  error: { statusCode: number; message: string; userMessage: string }
}

export function mapErrorToHttp(err: unknown): { statusCode: number; body: ErrorBody } {
  if (err instanceof BaseException) {
    return {
      statusCode: err.statusCode,
      body: { error: { statusCode: err.statusCode, message: err.message, userMessage: err.userMessage } },
    }
  }

  if (err instanceof ZodError) {
    const message = err.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ')
    return {
      statusCode: 400,
      body: { error: { statusCode: 400, message, userMessage: 'Parámetros inválidos.' } },
    }
  }

  console.error('[route] unhandled error:', err)
  return {
    statusCode: 500,
    body: { error: { statusCode: 500, message: 'Internal Server Error', userMessage: 'Algo salió mal.' } },
  }
}
