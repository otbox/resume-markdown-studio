import http from "node:http";
import { listTemplates } from "@/config/templates";
import { isAuthorized } from "./auth";
import { ConfigError, loadConfig, type Config } from "./config";
import { PdfRenderer, QueueFullError } from "./pdf";
import { parseRenderRequest } from "./validate";

const MAX_BODY_BYTES = 1_048_576;
const TOO_LARGE_MESSAGE = "Corpo maior que 1 MB";

class BodyTooLargeError extends Error { }

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  payload: unknown,
  headers: Record<string, string> = {}
): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(payload));
}

function sendTooLarge(res: http.ServerResponse): void {
  sendJson(res, 413, { error: TOO_LARGE_MESSAGE }, { Connection: "close" });
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    const onData = (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.off("data", onData);
        req.pause();
        reject(new BodyTooLargeError(TOO_LARGE_MESSAGE));
        return;
      }
      chunks.push(chunk);
    };

    req.on("data", onData);
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handlePdf(req: http.IncomingMessage, res: http.ServerResponse, renderer: PdfRenderer): Promise<void> {
  const declaredLength = Number(req.headers["content-length"] ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    sendTooLarge(res);
    return;
  }

  let raw: string;
  try {
    raw = await readBody(req);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      sendTooLarge(res);
      return;
    }
    throw error;
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    sendJson(res, 400, { error: "Corpo deve ser JSON válido" });
    return;
  }

  const parsed = parseRenderRequest(body);
  if (!parsed.ok) {
    sendJson(res, 400, { error: parsed.error });
    return;
  }

  try {
    const pdf = await renderer.render(parsed.value);
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="curriculo.pdf"',
      "Content-Length": pdf.length,
    });
    res.end(pdf);
  } catch (error) {
    if (error instanceof QueueFullError) {
      sendJson(res, 503, { error: "Serviço ocupado. Tente novamente em instantes." }, { "Retry-After": "5" });
      return;
    }
    console.error(`falha ao renderizar PDF: ${errorMessage(error)}`);
    sendJson(res, 500, { error: "Falha ao renderizar PDF" });
  }
}

function createServer(config: Config, renderer: PdfRenderer): http.Server {
  const route = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");

    if (pathname === "/health") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Método não permitido" }, { Allow: "GET" });
        return;
      }
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (pathname.startsWith("/api/") && !isAuthorized(req.headers.authorization, config.apiKey)) {
      sendJson(res, 401, { error: "Não autorizado" }, { "WWW-Authenticate": "Bearer" });
      return;
    }

    if (pathname === "/api/templates") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Método não permitido" }, { Allow: "GET" });
        return;
      }
      sendJson(res, 200, listTemplates());
      return;
    }

    if (pathname === "/api/resumes") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Método não permitido" }, { Allow: "POST" });
        return;
      }
      await handlePdf(req, res, renderer);
      return;
    }

    sendJson(res, 404, { error: "Rota não encontrada" });
  };

  return http.createServer((req, res) => {
    const started = performance.now();
    res.on("finish", () => {
      const path = new URL(req.url ?? "/", "http://localhost").pathname;
      const duration = Math.round(performance.now() - started);
      console.log(`${req.method} ${path} ${res.statusCode} ${duration}ms`);
    });

    route(req, res).catch((error: unknown) => {
      console.error(`erro não tratado: ${errorMessage(error)}`);
      if (!res.headersSent) {
        sendJson(res, 500, { error: "Erro interno" });
      } else {
        res.end();
      }
    });
  });
}

async function main(): Promise<void> {
  let config: Config;
  try {
    config = loadConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`configuração inválida: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }

  if (!config.apiKey) {
    console.warn("PDF_API_KEY não definida: autenticação desligada (use somente em desenvolvimento).");
  }

  const renderer = new PdfRenderer(config);
  try {
    await renderer.start();
  } catch (error) {
    console.error(`falha ao iniciar o Chromium: ${errorMessage(error)}`);
    process.exit(1);
  }

  const server = createServer(config, renderer);
  server.listen(config.port, "0.0.0.0", () => {
    console.log(`serviço de PDF ouvindo na porta ${config.port}`);
  });

  const shutdown = () => {
    server.close();
    renderer.close().finally(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

void main();
