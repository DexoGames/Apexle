import { useMemo } from "react";
import type { TracePoint, TraceChannel } from "../../types/corner";
import styles from "./TelemetryChart.module.css";

interface Props {
  trace: TracePoint[];
  channels: TraceChannel[];
  direction: "L" | "R";
  /** metres from trace start to the apex — stored in JSON so no re-derivation needed */
  apexD: number;
}

// viewBox geometry (kept short so it sits beside the corner map without scrolling)
const W = 720;
const H = 240;
const PAD_L = 16;
const PAD_R = 16;
const SPEED_TOP = 34;
const SPEED_BOT = 157;
const INP_TOP = 171;
const INP_BOT = 224;

/**
 * The puzzle: an anonymised speed/throttle/brake trace for one corner. No axis
 * numbers, no track shape — just the telemetry signature. Hand-rolled SVG to
 * match the brutalist, dependency-light house style.
 */
export function TelemetryChart({ trace, channels, direction, apexD }: Props) {
  const geom = useMemo(() => {
    const maxD = trace[trace.length - 1]?.d || 1;
    const speeds = trace.map((p) => p.speed);
    const sMin = Math.min(...speeds);
    const sMax = Math.max(...speeds);
    const lo = sMin - (sMax - sMin) * 0.12 - 2;
    const hi = sMax + (sMax - sMin) * 0.08 + 2;

    const x = (d: number) => PAD_L + (d / maxD) * (W - PAD_L - PAD_R);
    const ySpeed = (s: number) =>
      SPEED_BOT - ((s - lo) / (hi - lo)) * (SPEED_BOT - SPEED_TOP);
    const yInput = (v: number) => INP_BOT - (v / 100) * (INP_BOT - INP_TOP);

    const speedLine = trace.map((p) => `${x(p.d)},${ySpeed(p.speed)}`).join(" ");

    const throttleArea =
      `${x(0)},${INP_BOT} ` +
      trace.map((p) => `${x(p.d)},${yInput(p.throttle)}`).join(" ") +
      ` ${x(maxD)},${INP_BOT}`;

    // contiguous braking spans → red blocks
    const brakeSpans: Array<[number, number]> = [];
    let start: number | null = null;
    trace.forEach((p, i) => {
      if (p.brake === 1 && start === null) start = p.d;
      if (p.brake === 0 && start !== null) {
        brakeSpans.push([start, trace[i - 1].d]);
        start = null;
      }
    });
    if (start !== null) brakeSpans.push([start, maxD]);

    // Use the stored apexD (metres from trace start) — exact, not re-derived from
    // the downsampled trace. Clamp to the visible range just in case.
    const apexX = x(Math.min(apexD, maxD));

    return { x, ySpeed, speedLine, throttleArea, brakeSpans, maxD, apexX };
  }, [trace, apexD]);

  const showThrottle = channels.includes("throttle");
  const showBrake = channels.includes("brake");

  return (
    <div className={styles.wrap}>
      <div className={styles.legend}>
        <span className={styles.chip}>
          <i className={styles.swSpeed} /> Speed
        </span>
        {showThrottle && (
          <span className={styles.chip}>
            <i className={styles.swThrottle} /> Throttle
          </span>
        )}
        {showBrake && (
          <span className={styles.chip}>
            <i className={styles.swBrake} /> Brake
          </span>
        )}
        <span className={styles.dir} title="Corner direction">
          {direction === "L" ? "◀ Left" : "Right ▶"}
        </span>
      </div>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Anonymised speed, throttle and brake trace for the mystery corner"
      >
        {/* speed gridlines (unlabelled — the track stays anonymous) */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = SPEED_TOP + t * (SPEED_BOT - SPEED_TOP);
          return (
            <line key={t} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} className={styles.grid} />
          );
        })}

        {/* brake blocks (behind throttle) */}
        {showBrake &&
          geom.brakeSpans.map(([s, e], i) => (
            <rect
              key={i}
              x={geom.x(s)}
              y={INP_TOP}
              width={Math.max(geom.x(e) - geom.x(s), 1.5)}
              height={INP_BOT - INP_TOP}
              className={styles.brake}
            />
          ))}

        {/* throttle area */}
        {showThrottle && <polygon points={geom.throttleArea} className={styles.throttle} />}

        {/* inputs baseline */}
        {(showThrottle || showBrake) && (
          <line x1={PAD_L} y1={INP_BOT} x2={W - PAD_R} y2={INP_BOT} className={styles.baseline} />
        )}

        {/* apex marker — thin vertical line at minimum speed */}
        <line
          x1={geom.apexX} y1={SPEED_TOP}
          x2={geom.apexX} y2={INP_BOT}
          className={styles.apexLine}
        />

        {/* speed trace */}
        <polyline points={geom.speedLine} className={styles.speed} />

        {/* captions (no scale values) */}
        <text x={PAD_L} y={SPEED_TOP - 14} className={styles.cap}>
          SPEED
        </text>
        <text x={W - PAD_R} y={H - 4} className={styles.capRight}>
          DISTANCE →
        </text>
      </svg>
    </div>
  );
}
