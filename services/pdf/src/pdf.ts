import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { A4_HEIGHT } from "@/constants/a4";
import type { Config } from "./config";
import { buildMeasureHtml, buildResumeHtml, type RenderInput } from "./render-html";

const PAGE_CLOSE_TIMEOUT_MS = 5_000;

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--font-render-hinting=none",
  // Container com HOME somente leitura: sem crashpad e sem zygote o Chromium sobe.
  "--no-zygote",
  "--disable-breakpad",
  "--disable-crash-reporter",
];

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`tempo limite de ${ms} ms excedido`)), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export class QueueFullError extends Error {
  constructor() {
    super("fila de renderização cheia");
    this.name = "QueueFullError";
  }
}

export class PdfRenderer {
  private browser: Browser | null = null;
  private launching: Promise<Browser> | null = null;
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(private readonly config: Config) { }

  async start(): Promise<void> {
    await this.getBrowser();
  }

  async close(): Promise<void> {
    const browser = this.browser;
    this.browser = null;
    await browser?.close().catch(() => undefined);
  }

  async render(input: RenderInput): Promise<Buffer> {
    await this.acquire();
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      try {
        return await withTimeout(this.renderPage(page, input), this.config.renderTimeoutMs);
      } finally {
        await this.closePage(page);
      }
    } finally {
      this.release();
    }
  }

  /** Fecha a página com tempo limite. Se travar, descarta o navegador para liberar a vaga. */
  private async closePage(page: Page): Promise<void> {
    try {
      await withTimeout(page.close(), PAGE_CLOSE_TIMEOUT_MS);
    } catch {
      const browser = this.browser;
      this.browser = null;
      browser?.process()?.kill("SIGKILL");
    }
  }

  private getBrowser(): Promise<Browser> {
    if (this.browser?.connected) return Promise.resolve(this.browser);

    this.launching ??= puppeteer
      .launch({
        executablePath: this.config.chromePath,
        headless: true,
        args: LAUNCH_ARGS,
      })
      .then((browser) => {
        this.browser = browser;
        browser.on("disconnected", () => {
          if (this.browser === browser) this.browser = null;
        });
        return browser;
      })
      .finally(() => {
        this.launching = null;
      });

    return this.launching;
  }

  private async renderPage(page: Page, input: RenderInput): Promise<Buffer> {
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const decision = request.url().startsWith("data:") ? request.continue() : request.abort();
      decision.catch(() => undefined);
    });

    await page.setContent(buildMeasureHtml(input), { waitUntil: "load" });
    const height = await page.evaluate(
      () => document.getElementById("resume-export-root")?.scrollHeight ?? 0
    );
    const pageCount = Math.max(1, Math.ceil(height / A4_HEIGHT));

    await page.setContent(buildResumeHtml(input, pageCount), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  }

  /**
   * Fila FIFO com teto: a vaga liberada vai direto para o próximo da fila.
   * Com a fila cheia, rejeita com QueueFullError sem enfileirar.
   */
  private acquire(): Promise<void> {
    if (this.active < this.config.maxConcurrency) {
      this.active++;
      return Promise.resolve();
    }
    if (this.waiting.length >= this.config.queueMax) {
      return Promise.reject(new QueueFullError());
    }
    return new Promise((resolve) => this.waiting.push(resolve));
  }

  private release(): void {
    const next = this.waiting.shift();
    if (next) {
      next();
    } else {
      this.active--;
    }
  }
}
