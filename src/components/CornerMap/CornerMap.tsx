import { useMemo } from "react";
import type { ShapePoint } from "../../types/corner";
import styles from "./CornerMap.module.css";

interface Props {
  /** top-down racing line through the corner, metres, centred on the apex */
  shape: ShapePoint[];
}

// viewBox geometry — a short landscape panel so it sits low beside the telemetry
const W = 420;
const H = 250;
const PAD = 22;

/**
 * A zoomed-in, anonymised top-down view of the corner's racing line — the rookie
 * difficulty's extra hint. Just the shape (no track name, no direction, no
 * scale), auto-fit with an equal aspect ratio so the corner geometry is faithful.
 * Hand-rolled SVG to match the telemetry chart's house style.
 */
export function CornerMap({ shape }: Props) {
  const geom = useMemo(() => {
    const xs = shape.map((p) => p.x);
    const ys = shape.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);

    // equal-aspect fit, centred in the drawing area (SVG y grows down, so flip)
    const scale = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY);
    const offX = PAD + (W - 2 * PAD - spanX * scale) / 2;
    const offY = PAD + (H - 2 * PAD - spanY * scale) / 2;
    const px = (x: number) => offX + (x - minX) * scale;
    const py = (y: number) => offY + (maxY - y) * scale;

    const line = shape.map((p) => `${px(p.x)},${py(p.y)}`).join(" ");
    const apex = { x: px(0), y: py(0) }; // apex is the centred origin

    return { line, apex };
  }, [shape]);

  return (
    <div className={styles.wrap}>
      <div className={styles.legend}>
        <span className={styles.cap}>CORNER MAP</span>
      </div>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Zoomed-in top-down shape of the mystery corner"
      >
        {/* racing line */}
        <polyline points={geom.line} className={styles.path} />

        {/* apex */}
        <circle cx={geom.apex.x} cy={geom.apex.y} r={6} className={styles.apex} />
        <text x={geom.apex.x + 11} y={geom.apex.y + 4} className={styles.apexLabel}>
          APEX
        </text>
      </svg>
    </div>
  );
}
