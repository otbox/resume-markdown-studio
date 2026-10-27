export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export interface Config {
  port: number;
  apiKey: string | null;
  production: boolean;
  maxConcurrency: number;
  chromePath: string | undefined;
  renderTimeoutMs: number;
}

function parseIntInRange(raw: string | undefined, fallback: number, min: number, max: number, name: string): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ConfigError(`${name} deve ser um inteiro entre ${min} e ${max}.`);
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const production = env.NODE_ENV === "production";
  const apiKey = (env.PDF_API_KEY ?? "").trim() || null;

  if (production && !apiKey) {
    throw new ConfigError("PDF_API_KEY é obrigatória com NODE_ENV=production. O serviço não inicia sem ela.");
  }

  return {
    port: parseIntInRange(env.PORT, 3333, 1, 65535, "PORT"),
    apiKey,
    production,
    maxConcurrency: parseIntInRange(env.PDF_MAX_CONCURRENCY, 2, 1, 8, "PDF_MAX_CONCURRENCY"),
    chromePath: env.PUPPETEER_EXECUTABLE_PATH?.trim() || undefined,
    renderTimeoutMs: 30_000,
  };
}
