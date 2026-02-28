import type { Usuario } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

interface JWTPayload {
  userId: string;
  email: string;
  exp: number;
}

function encodePayload(payload: JWTPayload): string {
  return btoa(JSON.stringify(payload));
}

function decodePayload(token: string): JWTPayload | null {
  try {
    const [, payloadB64] = token.split(".");
    return JSON.parse(atob(payloadB64));
  } catch {
    // Token malformado/corrupto — retorna null como payload inválido
    return null;
  }
}

export function generarToken(usuario: Usuario): string {
  const payload: JWTPayload = {
    userId: usuario.id,
    email: usuario.email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadEncoded = encodePayload(payload);
  const signature = btoa(JWT_SECRET);

  return `${header}.${payloadEncoded}.${signature}`;
}

export function verificarToken(token: string): JWTPayload | null {
  const payload = decodePayload(token);
  if (!payload) return null;
  if (payload.exp < Date.now()) return null;
  return payload;
}

export function obtenerUsuarioDeToken(
  token: string,
): { userId: string; email: string } | null {
  const payload = verificarToken(token);
  if (!payload) return null;
  return { userId: payload.userId, email: payload.email };
}
