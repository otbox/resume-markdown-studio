import { z } from "zod";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, getTemplate, type TemplateId } from "@/config/templates";
import { SECTION_IDS, type LayoutConfig } from "@/types/layout";
import type { ThemeConfig } from "@/types/theme";
import { parseFrontMatter } from "@/utils/frontMatter";
import { parseResume } from "@/utils/parseResume";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const fontFamily = z
  .string()
  .max(120)
  .regex(/^[\w\s'",.-]+$/);
const range = (min: number, max: number) => z.number().min(min).max(max);

const themeOverrideSchema = z
  .object({
    colors: z
      .object({
        primary: hexColor,
        secondary: hexColor,
        accent: hexColor,
        background: hexColor,
        surface: hexColor,
        text: hexColor,
        textMuted: hexColor,
        border: hexColor,
      })
      .partial()
      .strict()
      .optional(),
    typography: z
      .object({
        fontFamily,
        headingFontFamily: fontFamily,
        baseFontSize: range(8, 24),
        headingScale: range(1, 2.5),
        lineHeight: range(1, 2.5),
      })
      .partial()
      .strict()
      .optional(),
    borderRadius: range(0, 50).optional(),
    spacing: z
      .object({
        pagePadding: range(0, 120),
        sectionGap: range(0, 80),
        itemGap: range(0, 40),
      })
      .partial()
      .strict()
      .optional(),
    shapes: z
      .array(
        z
          .object({
            id: z.string().min(1).max(40),
            type: z.enum(["circle", "rect", "line"]),
            x: range(-2000, 2000),
            y: range(-2000, 2000),
            width: range(0, 2000),
            height: range(0, 2000),
            color: hexColor,
            opacity: range(0, 1),
          })
          .strict()
      )
      .max(10)
      .optional(),
  })
  .strict();

const sectionOverrideSchema = z
  .object({
    id: z.enum(SECTION_IDS),
    visible: z.boolean().optional(),
    region: z.enum(["left", "main", "right"]).optional(),
    order: z.number().int().min(0).max(99).optional(),
  })
  .strict();

const columnWidthSchema = z.number().int().min(0).max(100);

const layoutOverrideSchema = z
  .object({
    sections: z
      .array(sectionOverrideSchema)
      .max(SECTION_IDS.length)
      .superRefine((items, ctx) => {
        const ids = items.map((item) => item.id);
        if (new Set(ids).size !== ids.length) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "seção repetida em layout.sections" });
        }
      })
      .optional(),
    columnWidths: z
      .object({
        left: columnWidthSchema,
        main: columnWidthSchema,
        right: columnWidthSchema,
      })
      .partial()
      .strict()
      .optional(),
  })
  .strict();

const bodySchema = z
  .object({
    markdown: z.string(),
    template: z.string().optional(),
    theme: themeOverrideSchema.optional(),
    layout: layoutOverrideSchema.optional(),
  })
  .strict();

type ThemeOverride = z.infer<typeof themeOverrideSchema>;
type LayoutOverride = z.infer<typeof layoutOverrideSchema>;

export interface RenderRequest {
  markdown: string;
  templateId: TemplateId;
  theme: ThemeConfig;
  layout: LayoutConfig;
}

export type ParseRenderResult = { ok: true; value: RenderRequest } | { ok: false; error: string };

function describeIssue(issue: z.ZodIssue): string {
  const where = issue.path.length > 0 ? issue.path.join(".") : "corpo";

  switch (issue.code) {
    case z.ZodIssueCode.unrecognized_keys:
      return `chave desconhecida em ${where}: ${issue.keys.join(", ")}`;
    case z.ZodIssueCode.invalid_type:
      return issue.received === "undefined"
        ? `campo obrigatório ausente: ${where}`
        : `tipo inválido em ${where}`;
    case z.ZodIssueCode.custom:
      return `${issue.message} (${where})`;
    case z.ZodIssueCode.invalid_string:
      return `formato inválido em ${where}`;
    case z.ZodIssueCode.too_small:
    case z.ZodIssueCode.too_big:
      return `valor fora do intervalo permitido em ${where}`;
    case z.ZodIssueCode.invalid_enum_value:
      return `valor não permitido em ${where}`;
    default:
      return `valor inválido em ${where}`;
  }
}

function mergeTheme(base: ThemeConfig, override: ThemeOverride | undefined): ThemeConfig {
  if (!override) return base;
  return {
    ...base,
    colors: { ...base.colors, ...override.colors },
    typography: { ...base.typography, ...override.typography },
    borderRadius: override.borderRadius ?? base.borderRadius,
    spacing: { ...base.spacing, ...override.spacing },
    shapes: override.shapes ?? base.shapes,
  };
}

function mergeLayout(base: LayoutConfig, override: LayoutOverride | undefined): LayoutConfig {
  if (!override) return base;
  const patches = override.sections ?? [];
  return {
    sections: base.sections.map((section) => {
      const patch = patches.find((item) => item.id === section.id);
      return patch ? { ...section, ...patch } : section;
    }),
    columnWidths: { ...base.columnWidths, ...override.columnWidths },
  };
}

/** Retorna a mensagem de erro, ou null quando o markdown é aceito. Não inclui o conteúdo do markdown. */
function checkMarkdown(markdown: string): string | null {
  if (markdown.trim() === "") return "markdown obrigatório";

  const frontMatter = parseFrontMatter(markdown);
  if (frontMatter.errors.length > 0) {
    return `front matter inválido: ${frontMatter.errors.join("; ")}`;
  }
  if (frontMatter.hasFrontMatter) {
    return frontMatter.data.nome ? null : "nome obrigatório no front matter";
  }
  return parseResume(markdown).header.name
    ? null
    : "nome ausente: use front matter com nome ou um título '# Nome'";
}

function isTemplateId(value: string): value is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(value);
}

export function parseRenderRequest(raw: unknown): ParseRenderResult {
  const fail = (error: string): ParseRenderResult => ({ ok: false, error });

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return fail("corpo deve ser um objeto JSON");
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return fail(describeIssue(parsed.error.issues[0]));
  }
  const body = parsed.data;

  const templateId = body.template ?? DEFAULT_TEMPLATE_ID;
  if (!isTemplateId(templateId)) {
    return fail(`template desconhecido: use ${TEMPLATE_IDS.join(" ou ")}`);
  }

  const template = getTemplate(templateId);
  const theme = mergeTheme(template.theme, body.theme);
  const layout = mergeLayout(template.layout, body.layout);

  const widthSum = layout.columnWidths.left + layout.columnWidths.main + layout.columnWidths.right;
  if (widthSum !== 100) {
    return fail(`layout.columnWidths deve somar 100 (soma atual: ${widthSum})`);
  }

  const markdownError = checkMarkdown(body.markdown);
  if (markdownError) return fail(markdownError);

  return { ok: true, value: { markdown: body.markdown, templateId, theme, layout } };
}
