export const FRONT_MATTER_KEYS = [
  "nome",
  "cargo",
  "email",
  "telefone",
  "linkedin",
  "localizacao",
  "foto",
] as const;

export type FrontMatterKey = (typeof FRONT_MATTER_KEYS)[number];
export type FrontMatterData = Partial<Record<FrontMatterKey, string>>;

export interface ParsedFrontMatter {
  hasFrontMatter: boolean;
  data: FrontMatterData;
  body: string;
  errors: string[];
}

const DELIMITER = "---";
const LINE_PATTERN = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/;

function isFrontMatterKey(key: string): key is FrontMatterKey {
  return (FRONT_MATTER_KEYS as readonly string[]).includes(key);
}

function stripQuotes(value: string): string {
  const quote = value[0];
  if (value.length >= 2 && (quote === '"' || quote === "'") && value.endsWith(quote)) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Lê o bloco `---` inicial com pares `chave: valor`.
 * Sem bloco válido de abertura e fechamento, `hasFrontMatter` é false e `body` é o markdown original.
 * Erros de sintaxe ficam em `errors`; quem decide se são fatais é o chamador.
 */
export function parseFrontMatter(markdown: string): ParsedFrontMatter {
  const withoutFallback: ParsedFrontMatter = {
    hasFrontMatter: false,
    data: {},
    body: markdown,
    errors: [],
  };

  const text = markdown.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");

  if (lines[0] !== DELIMITER) return withoutFallback;

  const closing = lines.indexOf(DELIMITER, 1);
  if (closing === -1) {
    return { ...withoutFallback, errors: ["front matter sem fechamento (---)"] };
  }

  const data: FrontMatterData = {};
  const errors: string[] = [];
  const seen = new Set<string>();

  lines.slice(1, closing).forEach((rawLine, index) => {
    const lineNumber = index + 2;
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) return;

    const match = LINE_PATTERN.exec(line);
    if (!match) {
      errors.push(`linha ${lineNumber} inválida: use "chave: valor"`);
      return;
    }

    const key = match[1];
    if (!isFrontMatterKey(key)) {
      errors.push(`chave desconhecida na linha ${lineNumber}`);
      return;
    }
    if (seen.has(key)) {
      errors.push(`chave repetida na linha ${lineNumber}`);
      return;
    }
    seen.add(key);

    const value = stripQuotes(match[2].trim());
    if (value !== "") data[key] = value;
  });

  return {
    hasFrontMatter: true,
    data,
    body: lines.slice(closing + 1).join("\n"),
    errors,
  };
}
