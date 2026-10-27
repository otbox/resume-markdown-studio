import ReactMarkdown from "react-markdown";
import type { ResumeSection } from "@/utils/parseResume";
import type { ThemeConfig } from "@/types/theme";

interface ResumeSectionViewProps {
  section: ResumeSection;
  theme: ThemeConfig;
}

export function ResumeSectionView({ section, theme }: ResumeSectionViewProps) {
  return (
    <section style={{ marginBottom: theme.spacing.sectionGap }}>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: theme.typography.baseFontSize * theme.typography.headingScale,
          fontFamily: theme.typography.headingFontFamily,
          color: theme.colors.secondary,
          fontWeight: 600,
          borderBottom: `2px solid ${theme.colors.accent}`,
          paddingBottom: 4,
        }}
      >
        {section.label}
      </h2>
      <div
        style={{
          fontSize: theme.typography.baseFontSize,
          lineHeight: theme.typography.lineHeight,
          color: theme.colors.text,
        }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p style={{ margin: "4px 0" }}>{children}</p>,
            ul: ({ children }) => <ul style={{ margin: "4px 0", paddingLeft: 18 }}>{children}</ul>,
            li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
            strong: ({ children }) => <strong style={{ color: theme.colors.primary }}>{children}</strong>,
            em: ({ children }) => <em style={{ color: theme.colors.textMuted, fontSize: "0.9em" }}>{children}</em>,
            a: ({ href, children }) => (
              <a href={href} style={{ color: theme.colors.primary }}>{children}</a>
            ),
          }}
        >
          {section.content}
        </ReactMarkdown>
      </div>
    </section>
  );
}
