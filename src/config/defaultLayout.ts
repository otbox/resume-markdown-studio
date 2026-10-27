import type { LayoutConfig } from "@/types/layout";
import { SECTION_LABELS } from "@/types/layout";

export const defaultLayout: LayoutConfig = {
  sections: [
    { id: "resumo", label: SECTION_LABELS.resumo, visible: true, region: "main", order: 0 },
    { id: "experiencia", label: SECTION_LABELS.experiencia, visible: true, region: "main", order: 1 },
    { id: "formacao", label: SECTION_LABELS.formacao, visible: true, region: "main", order: 2 },
    { id: "projetos", label: SECTION_LABELS.projetos, visible: true, region: "main", order: 3 },
    { id: "hard-skills", label: SECTION_LABELS["hard-skills"], visible: true, region: "left", order: 0 },
    { id: "soft-skills", label: SECTION_LABELS["soft-skills"], visible: true, region: "left", order: 1 },
    { id: "contato", label: SECTION_LABELS.contato, visible: true, region: "left", order: 2 },
  ],
  columnWidths: {
    left: 28,
    main: 72,
    right: 0,
  },
};
