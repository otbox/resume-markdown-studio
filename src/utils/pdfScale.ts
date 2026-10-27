import { A4_WIDTH } from "@/constants/a4";

/** pdfmake A4 width in points (72 dpi) */
export const PDF_PAGE_WIDTH_PT = 595.28;

/** Preview canvas uses CSS pixels at ~96 dpi (794px wide A4) */
export function pxToPt(px: number): number {
  return px * (PDF_PAGE_WIDTH_PT / A4_WIDTH);
}
