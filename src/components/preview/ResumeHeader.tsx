import type { ResumeHeader } from "@/utils/parseResume";
import type { ThemeConfig } from "@/types/theme";

interface ResumeHeaderProps {
  header: ResumeHeader;
  theme: ThemeConfig;
}

export function ResumeHeaderView({ header, theme }: ResumeHeaderProps) {
  return (
    <header style={{ marginBottom: theme.spacing.sectionGap }}>
      <h1
        style={{
          margin: 0,
          fontSize: theme.typography.baseFontSize * theme.typography.headingScale * 1.5,
          fontFamily: theme.typography.headingFontFamily,
          color: theme.colors.primary,
          fontWeight: 700,
        }}
      >
        {header.name}
      </h1>
      {header.role && (
        <p
          style={{
            margin: "4px 0 8px",
            fontSize: theme.typography.baseFontSize * 1.1,
            color: theme.colors.secondary,
            fontWeight: 500,
          }}
        >
          {header.role}
        </p>
      )}
      {header.contacts.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            fontSize: theme.typography.baseFontSize * 0.85,
            color: theme.colors.textMuted,
          }}
        >
          {header.contacts.map((contact, i) => (
            <span key={i}>{contact}</span>
          ))}
        </div>
      )}
    </header>
  );
}
