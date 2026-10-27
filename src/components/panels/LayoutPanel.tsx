"use client";

import { useCallback } from "react";
import type { LayoutConfig } from "@/types/layout";

interface LayoutPanelProps {
  layout: LayoutConfig;
  onChange: (layout: LayoutConfig) => void;
}

export function LayoutPanel({ layout, onChange }: LayoutPanelProps) {
  const toggleVisibility = useCallback(
    (id: string) => {
      onChange({
        ...layout,
        sections: layout.sections.map((s) =>
          s.id === id ? { ...s, visible: !s.visible } : s
        ),
      });
    },
    [layout, onChange]
  );

  const setRegion = useCallback(
    (id: string, region: "left" | "main" | "right") => {
      onChange({
        ...layout,
        sections: layout.sections.map((s) =>
          s.id === id ? { ...s, region } : s
        ),
      });
    },
    [layout, onChange]
  );

  const setColumnWidth = useCallback(
    (column: "left" | "main" | "right", value: number) => {
      onChange({
        ...layout,
        columnWidths: { ...layout.columnWidths, [column]: value },
      });
    },
    [layout, onChange]
  );

  return (
    <div className="card" style={{ fontSize: "0.875rem" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Layout</h3>

      <div style={{ marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 500 }}>Larguras das colunas (%)</p>
        {(["left", "main", "right"] as const).map((col) => (
          <div key={col} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <label style={{ width: 60, textTransform: "capitalize" }}>{col}</label>
            <input
              type="range"
              min={0}
              max={100}
              value={layout.columnWidths[col]}
              onChange={(e) => setColumnWidth(col, Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ width: 30, textAlign: "right" }}>{layout.columnWidths[col]}</span>
          </div>
        ))}
      </div>

      <div>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 500 }}>Seções</p>
        {layout.sections.map((section) => (
          <div
            key={section.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <input
              type="checkbox"
              checked={section.visible}
              onChange={() => toggleVisibility(section.id)}
            />
            <span style={{ flex: 1 }}>{section.label}</span>
            <select
              value={section.region}
              onChange={(e) => setRegion(section.id, e.target.value as "left" | "main" | "right")}
              style={{ fontSize: "0.8125rem", padding: "0.25rem" }}
            >
              <option value="left">Esquerda</option>
              <option value="main">Principal</option>
              <option value="right">Direita</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
