"use client";

import { useCallback } from "react";
import type { ThemeShape } from "@/types/theme";
import type { ThemeConfig } from "@/types/theme";

interface ShapesPanelProps {
  theme: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
}

export function ShapesPanel({ theme, onChange }: ShapesPanelProps) {
  const sidebarShape = theme.shapes.find((s) => s.id === "sidebar-bar");
  const decorativeShapes = theme.shapes.filter((s) => s.id !== "sidebar-bar");

  const setSidebarColor = useCallback(
    (color: string) => {
      const shapes = theme.shapes.map((s) =>
        s.id === "sidebar-bar" ? { ...s, color } : s
      );
      if (!shapes.some((s) => s.id === "sidebar-bar")) {
        shapes.unshift({
          id: "sidebar-bar",
          type: "rect",
          x: 0,
          y: 0,
          width: 6,
          height: 1123,
          color,
          opacity: 1,
        });
      }
      onChange({ ...theme, shapes });
    },
    [theme, onChange]
  );

  const setSidebarWidth = useCallback(
    (width: number) => {
      onChange({
        ...theme,
        shapes: theme.shapes.map((s) =>
          s.id === "sidebar-bar" ? { ...s, width } : s
        ),
      });
    },
    [theme, onChange]
  );

  const updateShape = useCallback(
    (id: string, patch: Partial<ThemeShape>) => {
      onChange({
        ...theme,
        shapes: theme.shapes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      });
    },
    [theme, onChange]
  );

  const addShape = useCallback(() => {
    const id = `shape-${Date.now()}`;
    onChange({
      ...theme,
      shapes: [
        ...theme.shapes,
        {
          id,
          type: "circle",
          x: 650,
          y: 60,
          width: 60,
          height: 60,
          color: theme.colors.accent,
          opacity: 0.35,
        },
      ],
    });
  }, [theme, onChange]);

  const removeShape = useCallback(
    (id: string) => {
      onChange({ ...theme, shapes: theme.shapes.filter((s) => s.id !== id) });
    },
    [theme, onChange]
  );

  return (
    <div className="card" style={{ fontSize: "0.875rem" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Formas decorativas</h3>

      <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
        <p style={{ margin: "0 0 0.75rem", fontWeight: 500 }}>Barra lateral</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <label style={{ width: 60 }}>Cor</label>
          <input
            type="color"
            value={sidebarShape?.color ?? theme.colors.primary}
            onChange={(e) => setSidebarColor(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ width: 60 }}>Largura</label>
          <input
            type="range"
            min={0}
            max={20}
            value={sidebarShape?.width ?? 6}
            onChange={(e) => setSidebarWidth(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span>{sidebarShape?.width ?? 6}px</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <p style={{ margin: 0, fontWeight: 500 }}>Formas extras</p>
        <button type="button" className="btn btn-secondary" style={{ padding: "0.25rem 0.625rem", fontSize: "0.8125rem" }} onClick={addShape}>
          + Forma
        </button>
      </div>

      {decorativeShapes.length === 0 && (
        <p style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>Nenhuma forma extra.</p>
      )}

      {decorativeShapes.map((shape) => (
        <div key={shape.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <select
              value={shape.type}
              onChange={(e) => updateShape(shape.id, { type: e.target.value as ThemeShape["type"] })}
              style={{ fontSize: "0.8125rem" }}
            >
              <option value="circle">Círculo</option>
              <option value="rect">Retângulo</option>
              <option value="line">Linha</option>
            </select>
            <button type="button" className="btn btn-secondary" style={{ padding: "0.125rem 0.5rem", fontSize: "0.75rem" }} onClick={() => removeShape(shape.id)}>
              Remover
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem" }}>
              Cor
              <input type="color" value={shape.color} onChange={(e) => updateShape(shape.id, { color: e.target.value })} style={{ display: "block", width: "100%" }} />
            </label>
            <label style={{ fontSize: "0.75rem" }}>
              Opacidade
              <input type="range" min={0.1} max={1} step={0.05} value={shape.opacity} onChange={(e) => updateShape(shape.id, { opacity: Number(e.target.value) })} style={{ width: "100%" }} />
            </label>
            <label style={{ fontSize: "0.75rem" }}>
              X
              <input type="number" value={shape.x} onChange={(e) => updateShape(shape.id, { x: Number(e.target.value) })} style={{ width: "100%" }} />
            </label>
            <label style={{ fontSize: "0.75rem" }}>
              Y
              <input type="number" value={shape.y} onChange={(e) => updateShape(shape.id, { y: Number(e.target.value) })} style={{ width: "100%" }} />
            </label>
            <label style={{ fontSize: "0.75rem" }}>
              Largura
              <input type="number" value={shape.width} onChange={(e) => updateShape(shape.id, { width: Number(e.target.value) })} style={{ width: "100%" }} />
            </label>
            <label style={{ fontSize: "0.75rem" }}>
              Altura
              <input type="number" value={shape.height} onChange={(e) => updateShape(shape.id, { height: Number(e.target.value) })} style={{ width: "100%" }} />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
