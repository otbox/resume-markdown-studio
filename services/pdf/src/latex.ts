import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Config } from "./config";

export class QueueFullError extends Error {
  constructor() {
    super("fila de renderização cheia");
    this.name = "QueueFullError";
  }
}

export class LatexCompileError extends Error {
  /** Trecho final do log do pdflatex, sem o caminho do tempdir. */
  readonly detail: string;
  constructor(detail: string) {
    super("falha ao compilar LaTeX");
    this.name = "LatexCompileError";
    this.detail = detail;
  }
}

/**
 * Compila um documento LaTeX em PDF com pdflatex, num diretório temporário
 * descartável. O shell-escape fica DESLIGADO (-no-shell-escape): nenhum
 * \write18 roda. A entrada vai por arquivo, nunca pela linha de comando,
 * então não há injeção de shell. A fila FIFO com teto é compartilhada com a
 * rota de Markdown pela mesma política de concorrência.
 */
export class LatexRenderer {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(private readonly config: Config) {}

  async render(latex: string): Promise<Buffer> {
    await this.acquire();
    try {
      return await this.compile(latex);
    } finally {
      this.release();
    }
  }

  private async compile(latex: string): Promise<Buffer> {
    const dir = await mkdtemp(join(tmpdir(), "resume-tex-"));
    try {
      const texPath = join(dir, "curriculo.tex");
      await writeFile(texPath, latex, "utf8");

      // Duas passadas: a primeira resolve rótulos/bookmarks, a segunda fecha
      // as referências. O currículo é curto, então o custo é baixo.
      await this.runPdflatex(dir, "curriculo.tex");
      await this.runPdflatex(dir, "curriculo.tex");

      return await readFile(join(dir, "curriculo.pdf"));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  private runPdflatex(cwd: string, file: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(
        this.config.latexEngine,
        [
          "-interaction=nonstopmode",
          "-halt-on-error",
          "-no-shell-escape",
          "-output-directory",
          cwd,
          file,
        ],
        { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, HOME: cwd } }
      );

      let output = "";
      const capture = (chunk: Buffer) => {
        output += chunk.toString("utf8");
        if (output.length > 200_000) output = output.slice(-200_000);
      };
      child.stdout.on("data", capture);
      child.stderr.on("data", capture);

      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new LatexCompileError(`tempo limite de ${this.config.latexTimeoutMs} ms excedido`));
      }, this.config.latexTimeoutMs);

      child.on("error", (error) => {
        clearTimeout(timer);
        reject(new LatexCompileError(error.message));
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
          return;
        }
        reject(new LatexCompileError(tailOfLog(output)));
      });
    });
  }

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

/** Devolve as linhas de erro mais úteis do log, sem expor o tempdir. */
function tailOfLog(output: string): string {
  const lines = output.split("\n");
  const firstError = lines.findIndex((line) => line.startsWith("!"));
  const slice = firstError >= 0 ? lines.slice(firstError, firstError + 6) : lines.slice(-6);
  return slice.join("\n").replace(/\/tmp\/resume-tex-[^/\s]+/g, "<tmp>").trim();
}
