const MAX_HTML_BYTES = 500_000;
const FETCH_TIMEOUT_MS = 15_000;

export async function fetchJobPageHtml(url: string): Promise<string> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("URL inválida — use http ou https");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Não foi possível acessar a URL (${response.status}). Cole a descrição manualmente.`);
  }

  const html = await response.text();
  if (html.length > MAX_HTML_BYTES) {
    return html.slice(0, MAX_HTML_BYTES);
  }
  return html;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function fetchJobTextFromUrl(url: string): Promise<string> {
  const html = await fetchJobPageHtml(url);
  const text = htmlToPlainText(html);
  if (text.length < 50) {
    throw new Error(
      "Pouco conteúdo extraído da página. Alguns sites bloqueiam importação — cole a descrição manualmente."
    );
  }
  return text.slice(0, 20_000);
}
