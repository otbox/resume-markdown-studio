"use client";

import { useCallback } from "react";
import type { ThemeConfig } from "@/types/theme";

interface ThemePanelProps {
  theme: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
}

const COLOR_KEYS = [
  { key: "primary", label: "Primária" },
  { key: "secondary", label: "Secundária" },
  { key: "accent", label: "Destaque" },
  { key: "background", label: "Fundo" },
  { key: "surface", label: "Superfície" },
  { key: "text", label: "Texto" },
  { key: "textMuted", label: "Texto secundário" },
  { key: "border", label: "Bordas" },
] as const;

export function ThemePanel({ theme, onChange }: ThemePanelProps) {
  const setColor = useCallback(
    (key: keyof ThemeConfig["colors"], value: string) => {
      onChange({ ...theme, colors: { ...theme.colors, [key]: value } });
    },
    [theme, onChange]
  );

  const setTypography = useCallback(
    (key: keyof ThemeConfig["typography"], value: number | string) => {
      onChange({ ...theme, typography: { ...theme.typography, [key]: value } });
    },
    [theme, onChange]
  );

  const setSpacing = useCallback(
    (key: keyof ThemeConfig["spacing"], value: number) => {
      onChange({ ...theme, spacing: { ...theme.spacing, [key]: value } });
    },
    [theme, onChange]
  );

  return (
    <div className="card" style={{ fontSize: "0.875rem" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Tema e cores</h3>

      <div style={{ marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 500 }}>Paleta</p>
        {COLOR_KEYS.map(({ key, label }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <label style={{ width: 100 }}>{label}</label>
            <input type="color" value={theme.colors[key]} onChange={(e) => setColor(key, e.target.value)} />
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{theme.colors[key]}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 500 }}>Tipografia</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <label style={{ width: 100 }}>Tamanho base</label>
          <input type="range" min={10} max={16} value={theme.typography.baseFontSize} onChange={(e) => setTypography("baseFontSize", Number(e.target.value))} style={{ flex: 1 }} />
          <span>{theme.typography.baseFontSize}px</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <label style={{ width: 100 }}>Escala títulos</label>
          <input type="range" min={1} max={1.6} step={0.05} value={theme.typography.headingScale} onChange={(e) => setTypography("headingScale", Number(e.target.value))} style={{ flex: 1 }} />
          <span>{theme.typography.headingScale.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ width: 100 }}>Entrelinhas</label>
          <input type="range" min={1.2} max={1.8} step={0.05} value={theme.typography.lineHeight} onChange={(e) => setTypography("lineHeight", Number(e.target.value))} style={{ flex: 1 }} />
          <span>{theme.typography.lineHeight.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 500 }}>Espaçamento</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <label style={{ width: 100 }}>Margem página</label>
          <input type="range" min={16} max={48} value={theme.spacing.pagePadding} onChange={(e) => setSpacing("pagePadding", Number(e.target.value))} style={{ flex: 1 }} />
          <span>{theme.spacing.pagePadding}px</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ width: 100 }}>Gap seções</label>
          <input type="range" min={8} max={32} value={theme.spacing.sectionGap} onChange={(e) => setSpacing("sectionGap", Number(e.target.value))} style={{ flex: 1 }} />
          <span>{theme.spacing.sectionGap}px</span>
        </div>
      </div>
    </div>
  );
}
