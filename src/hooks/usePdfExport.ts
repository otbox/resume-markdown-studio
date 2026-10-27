"use client";

import { useCallback } from "react";
import type { LayoutConfig } from "@/types/layout";
import type { ThemeConfig } from "@/types/theme";
import { exportResumeTextPdf } from "@/utils/exportTextPdf";

export function usePdfExport() {
  const exportPdf = useCallback(
    async (
      markdown: string,
      layout: LayoutConfig,
      theme: ThemeConfig,
      filename = "curriculo.pdf"
    ) => {
      await exportResumeTextPdf(markdown, layout, theme, filename);
    },
    []
  );

  return { exportPdf };
}
