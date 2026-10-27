import type { ResumeTemplate } from "@/types/template";
import { classicoTemplate } from "./classico";
import { sidebarTemplate } from "./sidebar";

export const TEMPLATE_IDS = ["classico", "sidebar"] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const DEFAULT_TEMPLATE_ID: TemplateId = "classico";

export const RESUME_TEMPLATES: Record<TemplateId, ResumeTemplate> = {
  classico: classicoTemplate,
  sidebar: sidebarTemplate,
};

export function getTemplate(id: TemplateId = DEFAULT_TEMPLATE_ID): ResumeTemplate {
  return RESUME_TEMPLATES[id];
}

export function listTemplates(): { id: string; name: string; description: string }[] {
  return TEMPLATE_IDS.map((id) => {
    const { name, description } = RESUME_TEMPLATES[id];
    return { id, name, description };
  });
}
