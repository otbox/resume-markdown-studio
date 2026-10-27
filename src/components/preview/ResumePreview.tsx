"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ThemeConfig } from "@/types/theme";
import type { LayoutConfig } from "@/types/layout";
import { A4_WIDTH, A4_HEIGHT } from "@/constants/a4";
import { DecorativeShapes } from "./DecorativeShapes";
import { ResumeDocument } from "./ResumeDocument";

interface ResumePreviewProps {
  markdown: string;
  theme: ThemeConfig;
  layout: LayoutConfig;
  scale?: number;
  highlightShapes?: boolean;
}

export function ResumePreview({ markdown, theme, layout, scale = 0.65, highlightShapes = false }: ResumePreviewProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const update = () => {
      const h = el.scrollHeight;
      setContentHeight(h);
      setPageCount(Math.max(1, Math.ceil(h / A4_HEIGHT)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [markdown, theme, layout]);

  const pages = Array.from({ length: pageCount }, (_, i) => i);

  return (
    <div style={{ position: "relative" }}>
      {/* Medição de altura fora da tela, sem interferir em cliques */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: -10000,
          top: 0,
          width: A4_WIDTH,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          id="resume-export-root"
          ref={measureRef}
          style={{
            width: A4_WIDTH,
            position: "relative",
            background: theme.colors.background,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          <ResumeDocument markdown={markdown} theme={theme} layout={layout} />
        </div>
      </div>

      <div
        style={{
          overflow: "auto",
          background: "#e2e8f0",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {pages.map((pageIndex) => (
          <div key={pageIndex} style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                top: -20,
                left: 0,
                fontSize: "0.75rem",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              Página {pageIndex + 1} de {pageCount}
            </span>
            <div
              id={pageIndex === 0 ? "resume-a4" : undefined}
              className="resume-a4-page"
              style={{
                width: A4_WIDTH,
                height: A4_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: "top center",
                background: theme.colors.background,
                position: "relative",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.12)",
                borderRadius: theme.borderRadius,
                overflow: highlightShapes ? "visible" : "hidden",
              }}
            >
              <div
                style={{
                  width: A4_WIDTH,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: `translateY(-${pageIndex * A4_HEIGHT}px)`,
                  zIndex: 1,
                }}
              >
                <div style={{ width: A4_WIDTH, position: "relative" }}>
                  <ResumeDocument markdown={markdown} theme={theme} layout={layout} />
                </div>
              </div>
              <DecorativeShapes
                shapes={theme.shapes}
                pageIndex={pageIndex}
                highlightGuides={highlightShapes}
              />
            </div>
          </div>
        ))}

        {pageCount > 1 && (
          <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0, textAlign: "center" }}>
            Conteúdo excede 1 página ({contentHeight}px). Considere encurtar o texto para currículo ATS de 1 página.
          </p>
        )}
      </div>
    </div>
  );
}
