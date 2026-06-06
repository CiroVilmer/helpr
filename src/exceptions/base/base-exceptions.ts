// src/exceptions/base/base-exceptions.ts
// Typed exceptions thrown by services/repositories; mapped to HTTP by http-error-mapper.ts (§19).
export class BaseException extends Error {
  readonly statusCode: number
  readonly userMessage: string

  constructor(message: string, statusCode = 500, userMessage = 'Error interno.') {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
    this.userMessage = userMessage
  }
}

export class ValidationException extends BaseException {
  constructor(message = 'Validation failed', userMessage = 'Datos inválidos.') {
    super(message, 400, userMessage)
  }
}

export class NotFoundException extends BaseException {
  constructor(message = 'Not found', userMessage = 'No encontrado.') {
    super(message, 404, userMessage)
  }
}
