export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface ThemeTypography {
  fontFamily: string;
  headingFontFamily: string;
  baseFontSize: number;
  headingScale: number;
  lineHeight: number;
}

export interface ThemeSpacing {
  pagePadding: number;
  sectionGap: number;
  itemGap: number;
}

export interface ThemeShape {
  id: string;
  type: "circle" | "rect" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface ThemeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
  borderRadius: number;
  spacing: ThemeSpacing;
  shapes: ThemeShape[];
}
