import { renderToStaticMarkup } from "react-dom/server";
import { DecorativeShapes } from "@/components/preview/DecorativeShapes";
import { ResumeDocument } from "@/components/preview/ResumeDocument";
import { A4_HEIGHT, A4_WIDTH } from "@/constants/a4";
import { SECTION_IDS, SECTION_LABELS, type LayoutConfig, type SectionId } from "@/types/layout";
import type { ThemeConfig } from "@/types/theme";

export interface RenderInput {
  markdown: string;
  theme: ThemeConfig;
  layout: LayoutConfig;
}

const SECTION_ID_SET: ReadonlySet<string> = new Set(SECTION_IDS);

/** Troca `## id | rótulo` (ou `## id`) pelo rótulo fixo em pt-BR de SECTION_LABELS. */
export function normalizeSectionHeadings(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      if (!line.startsWith("## ")) return line;
      const id = line.slice(3).split("|")[0].trim();
      if (!SECTION_ID_SET.has(id)) return line;
      return `## ${id} | ${SECTION_LABELS[id as SectionId]}`;
    })
    .join("\n");
}

const DOCUMENT_CSS = `
@page { size: 210mm 297mm; margin: 0; }
html, body { margin: 0; padding: 0; }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; break-after: page; }
.page:last-child { break-after: auto; }
`;

function prepare(input: RenderInput): RenderInput {
  return { ...input, markdown: normalizeSectionHeadings(input.markdown) };
}

function htmlDocument(body: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><style>${DOCUMENT_CSS}</style></head><body>${body}</body></html>`;
}

function MeasureRoot({ input }: { input: RenderInput }) {
  const { markdown, theme, layout } = input;
  return (
    <div
      id="resume-export-root"
      style={{
        width: A4_WIDTH,
        position: "relative",
        background: theme.colors.background,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <ResumeDocument markdown={markdown} theme={theme} layout={layout} />
    </div>
  );
}

function ResumePages({ input, pageCount }: { input: RenderInput; pageCount: number }) {
  const { markdown, theme, layout } = input;
  return (
    <>
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <div
          key={pageIndex}
          className="page"
          style={{ background: theme.colors.background, fontFamily: theme.typography.fontFamily }}
        >
          <div style={{ position: "absolute", top: -(pageIndex * A4_HEIGHT), left: 0, width: A4_WIDTH, zIndex: 1 }}>
            <div style={{ width: A4_WIDTH, position: "relative" }}>
              <ResumeDocument markdown={markdown} theme={theme} layout={layout} />
            </div>
          </div>
          <DecorativeShapes shapes={theme.shapes} pageIndex={pageIndex} />
        </div>
      ))}
    </>
  );
}

/** HTML usado só para medir a altura do conteúdo. */
export function buildMeasureHtml(input: RenderInput): string {
  return htmlDocument(renderToStaticMarkup(<MeasureRoot input={prepare(input)} />));
}

/** HTML final com uma página A4 por bloco de 1123 px de conteúdo. */
export function buildResumeHtml(input: RenderInput, pageCount: number): string {
  return htmlDocument(renderToStaticMarkup(<ResumePages input={prepare(input)} pageCount={pageCount} />));
}
