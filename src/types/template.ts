import type { LayoutConfig } from "@/types/layout";
import type { ThemeConfig } from "@/types/theme";

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  layout: LayoutConfig;
  theme: ThemeConfig;
}
