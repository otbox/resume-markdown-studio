import { GoogleGenerativeAI } from "@google/generative-ai";

/** Stable default; override with GEMINI_MODEL in .env if overloaded */
const DEFAULT_MODEL = "gemini-2.5-flash";

/** Models confirmed on v1beta generateContent (avoid deprecated 1.5 / 2.0) */
const FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-pro"] as const;

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export function getGeminiModel(modelName = getGeminiModelName()) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

export function getGeminiModelWithFallbacks() {
  return [getGeminiModelName(), ...FALLBACK_MODELS.filter((m) => m !== getGeminiModelName())];
}

export async function generateWithFallback(
  buildPrompt: (model: ReturnType<typeof getGeminiModel>) => Promise<{ response: { text: () => string } }>
): Promise<string> {
  const models = getGeminiModelWithFallbacks();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const result = await buildPrompt(getGeminiModel(modelName));
      return result.response.text();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes("503") ||
        message.includes("429") ||
        message.includes("high demand") ||
        message.includes("not found") ||
        message.includes("404");
      if (!retryable) throw error;
    }
  }

  throw new Error(
    `Todos os modelos Gemini falharam (${models.join(" → ")}). ` +
      (lastError instanceof Error ? lastError.message : String(lastError))
  );
}

export function extractJsonFromResponse(text: string): unknown {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(raw);
}
