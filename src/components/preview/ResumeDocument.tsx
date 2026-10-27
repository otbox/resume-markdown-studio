"use client";

import type { ThemeConfig } from "@/types/theme";
import type { LayoutConfig } from "@/types/layout";
import { parseResume } from "@/utils/parseResume";
import { getRegionSections } from "@/utils/resumeLayout";
import { ResumeHeaderView } from "./ResumeHeader";
import { ResumeSectionView } from "./ResumeSection";

interface ResumeDocumentProps {
  markdown: string;
  theme: ThemeConfig;
  layout: LayoutConfig;
}

export function ResumeDocument({ markdown, theme, layout }: ResumeDocumentProps) {
  const parsed = parseResume(markdown);
  const regions = getRegionSections(parsed, layout);
  const { left: leftWidth, main: mainWidth, right: rightWidth } = layout.columnWidths;

  return (
    <div
      style={{
        position: "relative",
        padding: theme.spacing.pagePadding,
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
      }}
    >
        <ResumeHeaderView header={parsed.header} theme={theme} />
        <div style={{ display: "flex", flex: 1, gap: 16, alignItems: "flex-start" }}>
          {leftWidth > 0 && regions.left.length > 0 && (
            <div style={{ width: `${leftWidth}%`, flexShrink: 0 }}>
              {regions.left.map((section) => (
                <ResumeSectionView key={section.id} section={section} theme={theme} />
              ))}
            </div>
          )}
          {mainWidth > 0 && regions.main.length > 0 && (
            <div style={{ width: `${mainWidth}%`, flex: 1 }}>
              {regions.main.map((section) => (
                <ResumeSectionView key={section.id} section={section} theme={theme} />
              ))}
            </div>
          )}
          {rightWidth > 0 && regions.right.length > 0 && (
            <div style={{ width: `${rightWidth}%`, flexShrink: 0 }}>
              {regions.right.map((section) => (
                <ResumeSectionView key={section.id} section={section} theme={theme} />
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
