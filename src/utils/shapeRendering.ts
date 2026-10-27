import { A4_HEIGHT, A4_WIDTH } from "@/constants/a4";
import type { ThemeShape } from "@/types/theme";

/** Shapes positioned for a single A4 page (0-based index). */
export function getShapesForPage(shapes: ThemeShape[], pageIndex: number): ThemeShape[] {
  const result: ThemeShape[] = [];
  const pageTop = pageIndex * A4_HEIGHT;
  const pageBottom = pageTop + A4_HEIGHT;

  for (const shape of shapes) {
    if (shape.id === "sidebar-bar") {
      if (shape.width <= 0) continue;
      result.push({
        ...shape,
        y: 0,
        height: A4_HEIGHT,
      });
      continue;
    }

    const centerY = shape.y + shape.height / 2;
    if (centerY < pageTop || centerY >= pageBottom) continue;

    result.push({
      ...shape,
      y: shape.y - pageTop,
    });
  }

  return result;
}

export function blendHexColor(foreground: string, opacity: number, background: string): string {
  const parse = (hex: string) => {
    const normalized = hex.replace("#", "");
    return [
      parseInt(normalized.slice(0, 2), 16),
      parseInt(normalized.slice(2, 4), 16),
      parseInt(normalized.slice(4, 6), 16),
    ] as const;
  };

  const [fr, fg, fb] = parse(foreground);
  const [br, bg, bb] = parse(background);
  const mix = (channel: number, back: number) =>
    Math.round(channel * opacity + back * (1 - opacity));

  const r = mix(fr, br);
  const g = mix(fg, bg);
  const b = mix(fb, bb);

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export { A4_WIDTH, A4_HEIGHT };
