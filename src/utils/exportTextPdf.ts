import type { LayoutConfig } from "@/types/layout";
import type { ThemeConfig, ThemeShape } from "@/types/theme";
import { parseResume, type ResumeSection } from "@/utils/parseResume";
import { getRegionSections } from "@/utils/resumeLayout";
import { pxToPt } from "@/utils/pdfScale";
import { blendHexColor, getShapesForPage } from "@/utils/shapeRendering";
import type {
  CanvasElement,
  Column,
  Content,
  DynamicBackground,
  Style,
  TDocumentDefinitions,
} from "pdfmake/interfaces";

type TextSegment = string | { text: string; bold?: boolean; italics?: boolean; color?: string; fontSize?: number };

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\([^)]+\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function parseInlineMarkdown(line: string, theme: ThemeConfig): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const baseSize = pxToPt(theme.typography.baseFontSize);

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: stripMarkdown(line.slice(lastIndex, match.index)), color: theme.colors.text });
    }
    segments.push({ text: match[1], bold: true, color: theme.colors.primary });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    const rest = line.slice(lastIndex);
    if (rest.startsWith("*") && rest.endsWith("*") && !rest.startsWith("**")) {
      segments.push({
        text: stripMarkdown(rest),
        italics: true,
        color: theme.colors.textMuted,
        fontSize: baseSize * 0.9,
      });
    } else {
      segments.push({ text: stripMarkdown(rest), color: theme.colors.text });
    }
  }

  return segments.length > 0 ? segments : [{ text: stripMarkdown(line), color: theme.colors.text }];
}

function sectionContentToBlocks(content: string, theme: ThemeConfig): Content[] {
  const lines = content.split("\n");
  const blocks: Content[] = [];
  let bulletItems: TextSegment[][] = [];
  const itemGap = pxToPt(theme.spacing.itemGap);
  const baseSize = pxToPt(theme.typography.baseFontSize);

  const flushBullets = () => {
    if (bulletItems.length > 0) {
      blocks.push({
        ul: bulletItems.map((item) => ({ text: item })),
        margin: [0, 0, 0, itemGap] as [number, number, number, number],
        markerColor: theme.colors.primary,
      });
      bulletItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushBullets();
      continue;
    }

    if (line.startsWith("- ")) {
      bulletItems.push(parseInlineMarkdown(line.slice(2), theme));
      continue;
    }

    flushBullets();

    if (/^\*Tech:\*/i.test(line)) {
      const techs = line.replace(/^\*Tech:\*\s*/i, "");
      blocks.push({
        text: [
          { text: "Tech: ", italics: true, color: theme.colors.textMuted, fontSize: baseSize * 0.9 },
          { text: techs, color: theme.colors.textMuted, fontSize: baseSize * 0.9 },
        ],
        margin: [0, 0, 0, itemGap] as [number, number, number, number],
      });
      continue;
    }

    blocks.push({
      text: parseInlineMarkdown(line, theme),
      margin: [0, pxToPt(4), 0, itemGap] as [number, number, number, number],
      lineHeight: theme.typography.lineHeight,
    });
  }

  flushBullets();
  return blocks;
}

function sectionTitleBlock(section: ResumeSection, theme: ThemeConfig): Content {
  const titleSize = pxToPt(theme.typography.baseFontSize * theme.typography.headingScale);
  const sectionGap = pxToPt(theme.spacing.sectionGap);
  const itemGap = pxToPt(theme.spacing.itemGap);

  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: section.label,
            bold: true,
            fontSize: titleSize,
            color: theme.colors.secondary,
            border: [false, false, false, true],
            borderColor: ["", "", "", theme.colors.accent],
            margin: [0, 0, 0, pxToPt(4)] as [number, number, number, number],
          },
        ],
      ],
    },
    layout: {
      defaultBorder: false,
      hLineWidth: (rowIndex) => (rowIndex === 1 ? pxToPt(2) : 0),
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, sectionGap, 0, itemGap] as [number, number, number, number],
  };
}

function sectionToStack(section: ResumeSection, theme: ThemeConfig): Content[] {
  return [sectionTitleBlock(section, theme), ...sectionContentToBlocks(section.content, theme)];
}

function buildRegionStack(sections: ResumeSection[], theme: ThemeConfig): Content[] {
  return sections.flatMap((section) => sectionToStack(section, theme));
}

function colorWithOpacity(hex: string, opacity: number, background: string): string {
  if (opacity >= 1) return hex;
  return blendHexColor(hex, opacity, background);
}

function scaleShape(shape: ThemeShape, background: string, pageHeightPt?: number): CanvasElement {
  const fill = colorWithOpacity(shape.color, shape.opacity, background);

  if (shape.id === "sidebar-bar") {
    return {
      type: "rect",
      x: pxToPt(shape.x),
      y: 0,
      w: pxToPt(shape.width),
      h: pageHeightPt ?? pxToPt(shape.height),
      color: fill,
    };
  }

  if (shape.type === "circle") {
    return {
      type: "ellipse",
      x: pxToPt(shape.x + shape.width / 2),
      y: pxToPt(shape.y + shape.height / 2),
      r1: pxToPt(shape.width / 2),
      r2: pxToPt(shape.height / 2),
      color: fill,
    };
  }

  if (shape.type === "line") {
    return {
      type: "line",
      x1: pxToPt(shape.x),
      y1: pxToPt(shape.y),
      x2: pxToPt(shape.x + shape.width),
      y2: pxToPt(shape.y + shape.height),
      lineWidth: pxToPt(2),
      lineColor: fill,
    };
  }

  return {
    type: "rect",
    x: pxToPt(shape.x),
    y: pxToPt(shape.y),
    w: pxToPt(shape.width),
    h: pxToPt(shape.height),
    color: fill,
    r: pxToPt(4),
  };
}

function buildBackground(theme: ThemeConfig): DynamicBackground | undefined {
  if (theme.shapes.length === 0) return undefined;

  return (currentPage, pageSize) => {
    const pageShapes = getShapesForPage(theme.shapes, currentPage - 1);
    if (pageShapes.length === 0) return null;

    const canvas = pageShapes.map((shape) =>
      scaleShape(shape, theme.colors.background, pageSize.height)
    );

    return { canvas };
  };
}

async function getPdfMake() {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default as typeof pdfMakeModule.default & {
    vfs: Record<string, string>;
  };
  const fonts = pdfFontsModule as { pdfMake?: { vfs: Record<string, string> }; vfs?: Record<string, string> };

  pdfMake.vfs = fonts.pdfMake?.vfs ?? fonts.vfs ?? {};

  return pdfMake;
}

export async function exportResumeTextPdf(
  markdown: string,
  layout: LayoutConfig,
  theme: ThemeConfig,
  filename = "curriculo.pdf"
): Promise<void> {
  const parsed = parseResume(markdown);
  const regions = getRegionSections(parsed, layout);
  const pagePadding = pxToPt(theme.spacing.pagePadding);
  const sectionGap = pxToPt(theme.spacing.sectionGap);
  const baseSize = pxToPt(theme.typography.baseFontSize);

  const headerBlock: Content[] = [
    {
      text: parsed.header.name,
      style: "header",
      color: theme.colors.primary,
      margin: [0, 0, 0, pxToPt(4)] as [number, number, number, number],
    },
  ];

  if (parsed.header.role) {
    headerBlock.push({
      text: parsed.header.role,
      style: "subheader",
      color: theme.colors.secondary,
      margin: [0, pxToPt(4), 0, pxToPt(8)] as [number, number, number, number],
    });
  }

  if (parsed.header.contacts.length > 0) {
    headerBlock.push({
      text: parsed.header.contacts.join("    "),
      style: "contact",
      color: theme.colors.textMuted,
      margin: [0, 0, 0, sectionGap] as [number, number, number, number],
    });
  }

  const columnDefs: Column[] = [];
  const { left: leftW, main: mainW, right: rightW } = layout.columnWidths;

  if (regions.left.length > 0 && leftW > 0) {
    columnDefs.push({
      width: `${leftW}%`,
      stack: buildRegionStack(regions.left, theme),
    });
  }
  if (regions.main.length > 0 && mainW > 0) {
    columnDefs.push({
      width: `${mainW}%`,
      stack: buildRegionStack(regions.main, theme),
    });
  }
  if (regions.right.length > 0 && rightW > 0) {
    columnDefs.push({
      width: `${rightW}%`,
      stack: buildRegionStack(regions.right, theme),
    });
  }

  const bodyContent: Content[] = [
    ...headerBlock,
    columnDefs.length > 0
      ? { columns: columnDefs, columnGap: pxToPt(16) }
      : { text: "Sem conteúdo nas seções visíveis.", color: theme.colors.textMuted },
  ];

  const styles: Record<string, Style> = {
    header: {
      fontSize: pxToPt(theme.typography.baseFontSize * theme.typography.headingScale * 1.5),
      bold: true,
    },
    subheader: {
      fontSize: baseSize * 1.1,
      bold: true,
    },
    contact: {
      fontSize: baseSize * 0.85,
    },
  };

  const docDefinition: TDocumentDefinitions = {
    info: {
      title: `${parsed.header.name || "Currículo"} - Currículo`,
      author: parsed.header.name || "Candidato",
      subject: "Currículo profissional",
      keywords: "curriculo, resume, CV, ATS",
    },
    pageSize: "A4",
    pageMargins: [pagePadding, pagePadding, pagePadding, pagePadding],
    background: buildBackground(theme),
    defaultStyle: {
      font: "Roboto",
      fontSize: baseSize,
      lineHeight: theme.typography.lineHeight,
      color: theme.colors.text,
    },
    styles,
    content: bodyContent,
  };

  const pdfMake = await getPdfMake();
  pdfMake.createPdf(docDefinition).download(filename);
}
