import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: number): NextResponse {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 400 });
}

export function unauthorized(message = "No autorizado"): NextResponse {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = "No tienes permisos para realizar esta acción"): NextResponse {
  return NextResponse.json({ message }, { status: 403 });
}

export function notFound(message = "No encontrado"): NextResponse {
  return NextResponse.json({ message }, { status: 404 });
}

export function conflict(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 409 });
}

export function serverError(error: unknown): NextResponse {
  console.error(error);
  return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
}
