// src/lib/handlers/route-handler.ts
// Thunk wrapper for route handlers: runs the work, returns { data } on success or a mapped
// { error } with the right status. Kept as a thunk (not a handler wrapper) so each route can
// export a native Next 16 GET signature (req, { params }) without fighting route type-checks.
import 'server-only'
import { NextResponse } from 'next/server'
import { mapErrorToHttp } from './http-error-mapper'

export async function routeHandler<T>(fn: () => Promise<T> | T): Promise<Response> {
  try {
    const data = await fn()
    return NextResponse.json({ data })
  } catch (err) {
    const { statusCode, body } = mapErrorToHttp(err)
    return NextResponse.json(body, { status: statusCode })
  }
}
