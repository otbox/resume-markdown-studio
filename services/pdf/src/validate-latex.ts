import { z } from "zod";

const bodySchema = z
  .object({
    latex: z.string(),
  })
  .strict();

export interface LatexRenderRequest {
  latex: string;
}

export type ParseLatexResult = { ok: true; value: LatexRenderRequest } | { ok: false; error: string };

/**
 * Comandos que leem/escrevem arquivos ou pedem shell. Mesmo com
 * -no-shell-escape desligando o \write18, barramos na entrada para dar erro
 * claro e defesa em profundidade. \input e \include trariam arquivos de fora
 * do documento enviado.
 */
const FORBIDDEN = [
  /\\write18\b/,
  /\\immediate\s*\\write18\b/,
  /\\input\b/,
  /\\include\b/,
  /\\openin\b/,
  /\\openout\b/,
  /\\read\b/,
  /\\catcode\b/,
  /\\usepackage\s*(\[[^\]]*\])?\s*\{\s*(shellesc|write18)\s*\}/,
];

const MAX_LATEX_BYTES = 256 * 1024;

function checkLatex(latex: string): string | null {
  if (latex.trim() === "") return "latex obrigatório";
  if (Buffer.byteLength(latex, "utf8") > MAX_LATEX_BYTES) {
    return "documento LaTeX maior que 256 KB";
  }
  if (!/\\documentclass\b/.test(latex)) {
    return "documento sem \\documentclass";
  }
  if (!/\\begin\s*\{\s*document\s*\}/.test(latex)) {
    return "documento sem \\begin{document}";
  }
  for (const pattern of FORBIDDEN) {
    if (pattern.test(latex)) {
      return "comando LaTeX não permitido no documento";
    }
  }
  return null;
}

export function parseLatexRequest(raw: unknown): ParseLatexResult {
  const fail = (error: string): ParseLatexResult => ({ ok: false, error });

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return fail("corpo deve ser um objeto JSON");
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue.path.length > 0 ? issue.path.join(".") : "corpo";
    return fail(
      issue.code === z.ZodIssueCode.invalid_type && issue.received === "undefined"
        ? `campo obrigatório ausente: ${where}`
        : `valor inválido em ${where}`
    );
  }

  const latexError = checkLatex(parsed.data.latex);
  if (latexError) return fail(latexError);

  return { ok: true, value: { latex: parsed.data.latex } };
}
