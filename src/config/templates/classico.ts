import { defaultLayout } from "@/config/defaultLayout";
import { defaultTheme } from "@/config/defaultTheme";
import type { ResumeTemplate } from "@/types/template";

export const classicoTemplate: ResumeTemplate = {
  id: "classico",
  name: "Clássico",
  description: "Coluna principal larga com habilidades e contato em coluna lateral estreita. Padrão.",
  layout: defaultLayout,
  theme: defaultTheme,
};
