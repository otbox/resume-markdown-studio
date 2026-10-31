import { z } from "zod";

const MAX_FIELD = 100 * 1024; // 100 KB por campo de texto

const bodySchema = z
  .object({
    profile: z.string().min(1).max(MAX_FIELD),
    job: z.string().min(1).max(MAX_FIELD),
    jobAnalysis: z.unknown().optional(),
  })
  .strict();

export interface GenerateRequest {
  profile: string;
  job: string;
  jobAnalysis?: unknown;
}

export type ParseGenerateResult = { ok: true; value: GenerateRequest } | { ok: false; error: string };

export function parseGenerateRequest(raw: unknown): ParseGenerateResult {
  const fail = (error: string): ParseGenerateResult => ({ ok: false, error });

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return fail("corpo deve ser um objeto JSON");
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue.path.length > 0 ? issue.path.join(".") : "corpo";
    if (issue.code === z.ZodIssueCode.invalid_type && issue.received === "undefined") {
      return fail(`campo obrigatório ausente: ${where}`);
    }
    if (issue.code === z.ZodIssueCode.too_big) {
      return fail(`campo ${where} maior que 100 KB`);
    }
    if (issue.code === z.ZodIssueCode.too_small) {
      return fail(`campo ${where} vazio`);
    }
    if (issue.code === z.ZodIssueCode.unrecognized_keys) {
      return fail(`chave desconhecida em ${where}`);
    }
    return fail(`valor inválido em ${where}`);
  }

  return { ok: true, value: parsed.data };
}
