import type { ThemeShape } from "@/types/theme";
import { A4_HEIGHT, A4_WIDTH, getShapesForPage } from "@/utils/shapeRendering";

interface DecorativeShapesProps {
  shapes: ThemeShape[];
  pageIndex: number;
  highlightGuides?: boolean;
}

function shapeLabel(shape: ThemeShape): string {
  if (shape.id === "sidebar-bar") return "Barra lateral";
  if (shape.type === "circle") return "Círculo";
  if (shape.type === "line") return "Linha";
  return "Retângulo";
}

export function DecorativeShapes({ shapes, pageIndex, highlightGuides = false }: DecorativeShapesProps) {
  const pageShapes = getShapesForPage(shapes, pageIndex);

  if (pageShapes.length === 0 && !highlightGuides) return null;

  return (
    <svg
      viewBox={`0 0 ${A4_WIDTH} ${A4_HEIGHT}`}
      width={A4_WIDTH}
      height={A4_HEIGHT}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 2,
      }}
      aria-hidden={!highlightGuides}
    >
      {pageShapes.map((shape) => {
        const label = shapeLabel(shape);
        const guideOpacity = highlightGuides ? Math.max(shape.opacity, 0.45) : shape.opacity;

        return (
          <g key={`${shape.id}-${pageIndex}`}>
            {shape.type === "circle" ? (
              <ellipse
                cx={shape.x + shape.width / 2}
                cy={shape.y + shape.height / 2}
                rx={shape.width / 2}
                ry={shape.height / 2}
                fill={shape.color}
                opacity={guideOpacity}
              />
            ) : shape.type === "line" ? (
              <line
                x1={shape.x}
                y1={shape.y}
                x2={shape.x + shape.width}
                y2={shape.y + shape.height}
                stroke={shape.color}
                strokeWidth={2}
                opacity={guideOpacity}
              />
            ) : (
              <rect
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill={shape.color}
                opacity={guideOpacity}
                rx={shape.id === "sidebar-bar" ? 0 : 4}
              />
            )}

            {highlightGuides && (
              <>
                <rect
                  x={shape.x}
                  y={shape.y}
                  width={Math.max(shape.width, 8)}
                  height={Math.max(shape.height, 8)}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  opacity={0.9}
                />
                <rect
                  x={shape.x}
                  y={Math.max(shape.y - 18, 2)}
                  width={Math.min(label.length * 7 + 12, 140)}
                  height={16}
                  fill="#2563eb"
                  rx={3}
                />
                <text
                  x={shape.x + 6}
                  y={Math.max(shape.y - 6, 14)}
                  fill="#ffffff"
                  fontSize={11}
                  fontFamily="system-ui, sans-serif"
                  fontWeight={600}
                >
                  {label}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
