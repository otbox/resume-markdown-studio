import { createHash, timingSafeEqual } from "node:crypto";

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Sem chave configurada (desenvolvimento), toda requisição é aceita. */
export function isAuthorized(authorizationHeader: string | undefined, apiKey: string | null): boolean {
  if (!apiKey) return true;

  const match = BEARER_PATTERN.exec((authorizationHeader ?? "").trim());
  if (!match) return false;

  return timingSafeEqual(digest(match[1]), digest(apiKey));
}
