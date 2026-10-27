import type { ThemeConfig } from "@/types/theme";

export const defaultTheme: ThemeConfig = {
  colors: {
    primary: "#0d9488",
    secondary: "#134e4a",
    accent: "#5eead4",
    background: "#ffffff",
    surface: "#f0fdfa",
    text: "#134e4a",
    textMuted: "#64748b",
    border: "#99f6e4",
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    headingFontFamily: "'Inter', system-ui, sans-serif",
    baseFontSize: 14,
    headingScale: 1.25,
    lineHeight: 1.5,
  },
  borderRadius: 8,
  spacing: {
    pagePadding: 32,
    sectionGap: 20,
    itemGap: 8,
  },
  shapes: [
    {
      id: "shape-accent",
      type: "circle",
      x: 680,
      y: 40,
      width: 80,
      height: 80,
      color: "#5eead4",
      opacity: 0.3,
    },
    {
      id: "sidebar-bar",
      type: "rect",
      x: 0,
      y: 0,
      width: 6,
      height: 1123,
      color: "#0d9488",
      opacity: 1,
    },
  ],
};
