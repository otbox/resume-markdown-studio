export type SectionRegion = "left" | "main" | "right";

export interface LayoutSection {
  id: string;
  label: string;
  visible: boolean;
  region: SectionRegion;
  order: number;
}

export interface LayoutConfig {
  sections: LayoutSection[];
  columnWidths: {
    left: number;
    main: number;
    right: number;
  };
}

export const SECTION_IDS = [
  "resumo",
  "experiencia",
  "formacao",
  "projetos",
  "hard-skills",
  "soft-skills",
  "contato",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_LABELS: Record<SectionId, string> = {
  resumo: "Resumo",
  experiencia: "Experiência",
  formacao: "Formação",
  projetos: "Projetos",
  "hard-skills": "Hard Skills",
  "soft-skills": "Soft Skills",
  contato: "Contato",
};
