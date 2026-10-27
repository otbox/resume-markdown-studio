import type { LayoutConfig } from "@/types/layout";
import type { ParsedResume, ResumeSection } from "@/utils/parseResume";

export interface RegionSections {
  left: ResumeSection[];
  main: ResumeSection[];
  right: ResumeSection[];
}

export function getRegionSections(
  parsed: ParsedResume,
  layout: LayoutConfig
): RegionSections {
  const visible = layout.sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  const findSection = (id: string) =>
    parsed.sections.find((s) => s.id === id && s.content.trim());

  return {
    left: visible
      .filter((s) => s.region === "left")
      .map((s) => findSection(s.id))
      .filter((s): s is ResumeSection => !!s),
    main: visible
      .filter((s) => s.region === "main")
      .map((s) => findSection(s.id))
      .filter((s): s is ResumeSection => !!s),
    right: visible
      .filter((s) => s.region === "right")
      .map((s) => findSection(s.id))
      .filter((s): s is ResumeSection => !!s),
  };
}
