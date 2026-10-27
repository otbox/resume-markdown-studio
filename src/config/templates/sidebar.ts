import { A4_HEIGHT } from "@/constants/a4";
import { defaultLayout } from "@/config/defaultLayout";
import { defaultTheme } from "@/config/defaultTheme";
import type { LayoutConfig, SectionId } from "@/types/layout";
import type { ResumeTemplate } from "@/types/template";
import type { ThemeConfig } from "@/types/theme";

const LEFT_SECTIONS: readonly SectionId[] = ["hard-skills", "soft-skills", "contato"];

const layout: LayoutConfig = {
  sections: defaultLayout.sections.map((section) => ({
    ...section,
    region: LEFT_SECTIONS.includes(section.id as SectionId) ? "left" : "main",
  })),
  columnWidths: {
    left: 30,
    main: 70,
    right: 0,
  },
};

const theme: ThemeConfig = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: "#1e3a5f",
    secondary: "#1e293b",
    accent: "#93c5fd",
    surface: "#e0ecff",
    text: "#1e293b",
    textMuted: "#475569",
    border: "#cbd5e1",
  },
  shapes: [
    {
      id: "sidebar-bar",
      type: "rect",
      x: 0,
      y: 0,
      width: 6,
      height: A4_HEIGHT,
      color: "#1e3a5f",
      opacity: 1,
    },
  ],
};

export const sidebarTemplate: ResumeTemplate = {
  id: "sidebar",
  name: "Sidebar",
  description: "Coluna lateral azul-marinho à esquerda, mais estreita, com barra de acento na borda.",
  layout,
  theme,
};
