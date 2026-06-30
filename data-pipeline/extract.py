#!/usr/bin/env python3
"""
Apexle telemetry extractor.

Pulls a representative fast lap per circuit via FastF1, slices each corner, and
emits anonymised display traces + comparison attributes to:

    ../src/data/corners.json
    ../src/data/circuits.json

This runs OFFLINE at build time only. The web app ships the resulting JSON, so the
site stays fully static and never depends on Python or the F1 API at runtime.

Usage:
    pip install -r requirements.txt
    python extract.py              # seed circuits only (fast)
    python extract.py --all        # every configured circuit (slow first run)
    python extract.py monaco monza # specific circuit ids

F1 telemetry is used here for a personal, non-commercial fan project. Only derived,
anonymised values are shipped — never raw timing/driver data.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np
import pandas as pd

import fastf1

# ----------------------------------------------------------------------------
# Paths & logging
# ----------------------------------------------------------------------------
HERE = Path(__file__).resolve().parent
CACHE_DIR = HERE / "cache"
OUT_DIR = HERE.parent / "src" / "data"
CACHE_DIR.mkdir(exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

fastf1.Cache.enable_cache(str(CACHE_DIR))
fastf1.set_log_level("WARNING")
logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("apexle")

# ----------------------------------------------------------------------------
# Circuit config
#   id -> (display name, country, (year, grand-prix, session))
#   Pick recent DRY qualifying sessions for clean, representative fast laps.
#   `seed=True` circuits are extracted by default; the rest fill in with --all.
# ----------------------------------------------------------------------------
@dataclass
class CircuitCfg:
    name: str
    country: str
    year: int
    gp: str
    short: str  # abbreviated name for compact UI (no "Circuit"/"International"/etc.)
    seed: bool = False
    session: str = "Q"


CIRCUITS: dict[str, CircuitCfg] = {
    # --- seed (real data shipped now) ---
    "monaco":      CircuitCfg("Circuit de Monaco", "Monaco", 2024, "Monaco", "Monaco", seed=True),
    "silverstone": CircuitCfg("Silverstone Circuit", "Great Britain", 2023, "Great Britain", "Silverstone", seed=True),
    "monza":       CircuitCfg("Autodromo Nazionale Monza", "Italy", 2023, "Italy", "Monza", seed=True),
    "spa":         CircuitCfg("Circuit de Spa-Francorchamps", "Belgium", 2024, "Belgium", "Spa-Francorchamps", seed=True),
    "suzuka":      CircuitCfg("Suzuka International Racing Course", "Japan", 2024, "Japan", "Suzuka", seed=True),
    # --- modern recurring roster (run with --all when ready) ---
    "bahrain":     CircuitCfg("Bahrain International Circuit", "Bahrain", 2024, "Bahrain", "Bahrain"),
    "jeddah":      CircuitCfg("Jeddah Corniche Circuit", "Saudi Arabia", 2024, "Saudi Arabia", "Jeddah"),
    "albert_park": CircuitCfg("Albert Park Circuit", "Australia", 2024, "Australia", "Albert Park"),
    "imola":       CircuitCfg("Autodromo Enzo e Dino Ferrari", "Emilia-Romagna", 2024, "Emilia Romagna", "Imola"),
    "miami":       CircuitCfg("Miami International Autodrome", "Miami", 2024, "Miami", "Miami"),
    "catalunya":   CircuitCfg("Circuit de Barcelona-Catalunya", "Spain", 2024, "Spain", "Barcelona"),
    "montreal":    CircuitCfg("Circuit Gilles Villeneuve", "Canada", 2024, "Canada", "Montreal"),
    "red_bull_ring": CircuitCfg("Red Bull Ring", "Austria", 2024, "Austria", "Red Bull Ring"),
    "hungaroring": CircuitCfg("Hungaroring", "Hungary", 2024, "Hungary", "Hungaroring"),
    "zandvoort":   CircuitCfg("Circuit Zandvoort", "Netherlands", 2024, "Netherlands", "Zandvoort"),
    "baku":        CircuitCfg("Baku City Circuit", "Azerbaijan", 2024, "Azerbaijan", "Baku"),
    "marina_bay":  CircuitCfg("Marina Bay Street Circuit", "Singapore", 2024, "Singapore", "Marina Bay"),
    "cota":        CircuitCfg("Circuit of the Americas", "United States", 2024, "United States", "COTA"),
    "rodriguez":   CircuitCfg("Autodromo Hermanos Rodriguez", "Mexico", 2024, "Mexico City", "Mexico City"),
    "interlagos":  CircuitCfg("Autodromo Jose Carlos Pace", "Brazil", 2024, "Sao Paulo", "Interlagos"),
    "vegas":       CircuitCfg("Las Vegas Strip Circuit", "Las Vegas", 2024, "Las Vegas", "Las Vegas"),
    "lusail":      CircuitCfg("Lusail International Circuit", "Qatar", 2024, "Qatar", "Lusail"),
    "yas_marina":  CircuitCfg("Yas Marina Circuit", "Abu Dhabi", 2024, "Abu Dhabi", "Yas Marina"),
    "shanghai":    CircuitCfg("Shanghai International Circuit", "China", 2024, "China", "Shanghai"),
}

# Flavour: (circuit id, FastF1 corner number) -> real corner name.
# Mapped from each session's telemetry signature (slowest = hairpin, flat-out
# high-speed = the famous fast corners, etc.) cross-checked against track maps.
# Only confident, well-known corners are named; the rest stay as "T<n>". Verify
# the numbering against the printed sample if you add a new circuit.
CORNER_NAMES: dict[tuple[str, int], str] = {
    # Monaco
    ("monaco", 1): "Sainte Devote",
    ("monaco", 3): "Massenet",
    ("monaco", 4): "Casino",
    ("monaco", 5): "Mirabeau",
    ("monaco", 6): "Grand Hotel Hairpin",
    ("monaco", 8): "Portier",
    ("monaco", 9): "Tunnel",
    ("monaco", 10): "Nouvelle Chicane",
    ("monaco", 12): "Tabac",
    ("monaco", 13): "Swimming Pool",
    ("monaco", 18): "La Rascasse",
    ("monaco", 19): "Anthony Noghes",
    # Silverstone
    ("silverstone", 1): "Abbey",
    ("silverstone", 3): "Village",
    ("silverstone", 4): "The Loop",
    ("silverstone", 6): "Brooklands",
    ("silverstone", 7): "Luffield",
    ("silverstone", 9): "Copse",
    ("silverstone", 10): "Maggotts",
    ("silverstone", 11): "Becketts",
    ("silverstone", 15): "Stowe",
    ("silverstone", 16): "Vale",
    ("silverstone", 18): "Club",
    # Monza
    ("monza", 1): "Variante del Rettifilo",
    ("monza", 3): "Curva Grande",
    ("monza", 4): "Variante della Roggia",
    ("monza", 6): "Lesmo 1",
    ("monza", 7): "Lesmo 2",
    ("monza", 8): "Variante Ascari",
    ("monza", 11): "Parabolica",
    # Spa
    ("spa", 1): "La Source",
    ("spa", 3): "Eau Rouge",
    ("spa", 4): "Raidillon",
    ("spa", 5): "Les Combes",
    ("spa", 11): "Pouhon",
    ("spa", 16): "Blanchimont",
    ("spa", 18): "Bus Stop Chicane",
    ("spa", 19): "Bus Stop Chicane",
    # Suzuka
    ("suzuka", 8): "Dunlop Curve",
    ("suzuka", 9): "Degner 1",
    ("suzuka", 10): "Degner 2",
    ("suzuka", 11): "Hairpin",
    ("suzuka", 13): "Spoon Curve",
    ("suzuka", 15): "130R",
    ("suzuka", 16): "Casio Triangle",
    ("suzuka", 17): "Casio Triangle",
}

# ----------------------------------------------------------------------------
# Tunables
# ----------------------------------------------------------------------------
WIN_BEFORE = 300.0   # metres before the apex to include in the window
WIN_AFTER = 140.0    # metres after the apex
RADIUS_DD = 18.0     # metres each side of apex for the 3-point radius (lateral G)
APEX_SEARCH = 90.0   # search radius (m) around the nominal apex for true min speed
TRACE_POINTS = 80    # downsampled points in the display trace
DRS_ON = {10, 12, 14}  # FastF1 DRS channel codes that mean "open"
# FastF1 position X/Y/Z are in 1/10 m. Convert to metres for geometry.
POS_TO_M = 0.1
# Flip if computed corner directions come out mirrored vs reality (validate!).
FLIP_DIRECTION = False


@dataclass
class Corner:
    id: str
    circuitId: str
    number: int
    name: str | None
    trace: list[dict]
    minSpeed: int
    entrySpeed: int
    brakingDistance: int
    cornerAngle: int
    minGear: int
    gradient: float
    direction: str       # 'L' | 'R'
    lateralG: float
    drsApproach: bool
    duration: float


def _moving_avg(a: np.ndarray, k: int) -> np.ndarray:
    if k <= 1 or a.size < k:
        return a
    kernel = np.ones(k) / k
    return np.convolve(a, kernel, mode="same")


def _nearest(d: np.ndarray, target: float) -> int:
    return int(np.argmin(np.abs(d - target)))


def _corner_angle_dir(x: np.ndarray, y: np.ndarray, d: np.ndarray,
                      apex_d: float) -> tuple[float, str]:
    """Net turn angle (deg) + direction over the corner's own extent.

    The path is first resampled to a uniform 2 m spacing so the heading derivative
    is smooth (raw telemetry samples are unevenly spaced and spike the curvature).
    A contiguous run is then grown out from the apex while the turn rate stays
    above a fraction of its peak AND keeps the same sign — isolating one corner
    from its neighbours (vital at packed circuits like Monaco). The swept angle is
    the unwrapped heading change across that run: ~180 for a hairpin, ~20 for a
    kink, with a stable sign through a 180° reversal.
    """
    d0 = d - d[0]
    if d0[-1] < 8:
        return 0.0, "R"
    grid = np.arange(0.0, d0[-1], 2.0)
    if grid.size < 6:
        return 0.0, "R"
    rx = np.interp(grid, d0, x)
    ry = np.interp(grid, d0, y)
    theta = np.unwrap(np.arctan2(np.gradient(ry), np.gradient(rx)))
    tr = np.gradient(theta)  # rad per 2 m step

    a = int(np.clip(np.argmin(np.abs(grid - (apex_d - d[0]))), 1, tr.size - 2))
    lo_w, hi_w = max(0, a - 6), min(tr.size, a + 7)
    a = lo_w + int(np.argmax(np.abs(tr[lo_w:hi_w])))
    peak = abs(tr[a])
    if peak < 1e-6:
        return 0.0, "R"

    thr = peak * 0.2
    sgn = np.sign(tr[a])
    lo = hi = a
    while lo - 1 >= 0 and abs(tr[lo - 1]) >= thr and np.sign(tr[lo - 1]) == sgn:
        lo -= 1
    while hi + 1 < tr.size and abs(tr[hi + 1]) >= thr and np.sign(tr[hi + 1]) == sgn:
        hi += 1

    signed = float(theta[hi] - theta[lo])
    direction = "L" if signed > 0 else "R"
    if FLIP_DIRECTION:
        direction = "R" if direction == "L" else "L"
    return abs(np.degrees(signed)), direction


def _circumradius(p1, p2, p3) -> float:
    """Radius (m) of the circle through three points; inf if near-collinear."""
    a = float(np.hypot(p2[0] - p3[0], p2[1] - p3[1]))
    b = float(np.hypot(p1[0] - p3[0], p1[1] - p3[1]))
    c = float(np.hypot(p1[0] - p2[0], p1[1] - p2[1]))
    area2 = abs((p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]))
    if area2 < 1e-6:
        return float("inf")
    return a * b * c / (2.0 * area2)


def _lateral_g(x: np.ndarray, y: np.ndarray, d: np.ndarray, apex_d: float,
               v_apex_kmh: float) -> float:
    """Peak lateral g ≈ v² / R at the apex, R from a 3-point circle fit."""
    i1, i2, i3 = (_nearest(d, apex_d - RADIUS_DD), _nearest(d, apex_d),
                  _nearest(d, apex_d + RADIUS_DD))
    r = _circumradius((x[i1], y[i1]), (x[i2], y[i2]), (x[i3], y[i3]))
    if not np.isfinite(r) or r <= 0:
        return 0.0
    v = v_apex_kmh / 3.6  # m/s
    return float(np.clip(v * v / r / 9.81, 0, 5.5))


def extract_corner(circuit_id: str, cid_num: int, apex_d: float, tel: pd.DataFrame,
                   lap_len: float) -> Corner | None:
    dist = tel["Distance"].to_numpy()
    lo, hi = apex_d - WIN_BEFORE, apex_d + WIN_AFTER
    mask = (dist >= lo) & (dist <= hi)
    if mask.sum() < 10:
        return None

    seg = tel.loc[mask].copy()
    d = seg["Distance"].to_numpy()
    speed = seg["Speed"].to_numpy().astype(float)
    throttle = seg["Throttle"].to_numpy().astype(float)
    brake_raw = seg["Brake"].to_numpy()
    brake = (brake_raw.astype(float) > 0).astype(int) if brake_raw.dtype != bool else brake_raw.astype(int)
    gear = seg["nGear"].to_numpy().astype(float)
    drs = seg["DRS"].to_numpy().astype(float)
    x = seg["X"].to_numpy().astype(float) * POS_TO_M
    y = seg["Y"].to_numpy().astype(float) * POS_TO_M
    z = seg["Z"].to_numpy().astype(float) * POS_TO_M
    t = (seg["Time"] - seg["Time"].iloc[0]).dt.total_seconds().to_numpy()

    # --- true apex = minimum speed near the nominal apex distance ---
    near = np.abs(d - apex_d) <= APEX_SEARCH
    if near.sum() < 3:
        near = np.ones_like(d, dtype=bool)
    apex_idx_local = np.where(near)[0][np.argmin(speed[near])]
    apex_dist = d[apex_idx_local]

    min_speed = float(speed[apex_idx_local])
    approach = d <= apex_dist
    entry_speed = float(speed[approach].max()) if approach.any() else float(speed.max())

    # --- braking distance: first sustained brake before apex -> apex ---
    braking_distance = 0.0
    pre = np.where(approach & (brake == 1))[0]
    if pre.size:
        brake_on_dist = d[pre[0]]
        braking_distance = max(0.0, apex_dist - brake_on_dist)

    # --- min gear (ignore 0 = neutral/no-signal) ---
    valid_gear = gear[gear >= 1]
    min_gear = int(valid_gear.min()) if valid_gear.size else 0

    # --- gradient over the slice (signed %), from smoothed elevation ---
    zs = _moving_avg(z, 7)
    span = d[-1] - d[0]
    gradient = float((zs[-1] - zs[0]) / span * 100.0) if span > 0 else 0.0

    angle, direction = _corner_angle_dir(x, y, d, apex_dist)
    lateral_g = _lateral_g(x, y, d, apex_dist, min_speed)

    drs_approach = bool(np.isin(drs[approach], list(DRS_ON)).any())

    # --- duration: braking point (or window start) through to window exit ---
    start_i = pre[0] if pre.size else 0
    duration = float(t[-1] - t[start_i])

    # --- anonymised display trace (distance normalised to 0) ---
    d0 = d - d[0]
    grid = np.linspace(0, d0[-1], TRACE_POINTS)
    trace = [
        {
            "d": int(round(gd)),
            "speed": int(round(np.interp(gd, d0, speed))),
            "throttle": int(round(np.interp(gd, d0, throttle))),
            "brake": 1 if np.interp(gd, d0, brake) >= 0.5 else 0,
        }
        for gd in grid
    ]

    return Corner(
        id=f"{circuit_id}-T{cid_num}",
        circuitId=circuit_id,
        number=int(cid_num),
        name=CORNER_NAMES.get((circuit_id, int(cid_num))),
        trace=trace,
        minSpeed=int(round(min_speed)),
        entrySpeed=int(round(entry_speed)),
        brakingDistance=int(round(braking_distance)),
        cornerAngle=int(round(min(angle, 180))),
        minGear=min_gear,
        gradient=round(gradient, 1),
        direction=direction,
        lateralG=round(lateral_g, 1),
        drsApproach=drs_approach,
        duration=round(duration, 1),
    )


def process_circuit(circuit_id: str, cfg: CircuitCfg) -> list[Corner]:
    log.info("→ %s (%s %s %s)", circuit_id, cfg.year, cfg.gp, cfg.session)
    session = fastf1.get_session(cfg.year, cfg.gp, cfg.session)
    session.load(telemetry=True, laps=True, weather=False)

    lap = session.laps.pick_fastest()
    tel = lap.get_telemetry()
    needed = {"Distance", "Speed", "Throttle", "Brake", "nGear", "DRS", "X", "Y", "Z", "Time"}
    missing = needed - set(tel.columns)
    if missing:
        raise RuntimeError(f"telemetry missing columns: {missing}")

    circuit_info = session.get_circuit_info()
    corners_df = circuit_info.corners
    lap_len = float(tel["Distance"].max())

    out: list[Corner] = []
    for _, row in corners_df.iterrows():
        c = extract_corner(circuit_id, int(row["Number"]), float(row["Distance"]), tel, lap_len)
        if c is not None:
            out.append(c)
    log.info("   %d corners", len(out))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*", help="specific circuit ids to extract")
    ap.add_argument("--all", action="store_true", help="extract every configured circuit")
    args = ap.parse_args()

    if args.ids:
        targets = {cid: CIRCUITS[cid] for cid in args.ids if cid in CIRCUITS}
        unknown = [cid for cid in args.ids if cid not in CIRCUITS]
        if unknown:
            log.warning("unknown circuit ids ignored: %s", unknown)
    elif args.all:
        targets = dict(CIRCUITS)
    else:
        targets = {cid: c for cid, c in CIRCUITS.items() if c.seed}

    # merge with whatever is already on disk so partial runs accumulate
    corners_path = OUT_DIR / "corners.json"
    circuits_path = OUT_DIR / "circuits.json"
    corners_by_circuit: dict[str, list[dict]] = {}
    if corners_path.exists():
        for c in json.loads(corners_path.read_text()):
            corners_by_circuit.setdefault(c["circuitId"], []).append(c)

    for cid, cfg in targets.items():
        try:
            corners = process_circuit(cid, cfg)
            if corners:
                corners_by_circuit[cid] = [asdict(c) for c in corners]
        except Exception as e:  # noqa: BLE001 - one bad session shouldn't kill the run
            log.error("   FAILED %s: %s", cid, e)

    # flatten + sort
    all_corners = [c for cid in sorted(corners_by_circuit) for c in corners_by_circuit[cid]]
    circuits = [
        {
            "id": cid,
            "name": CIRCUITS[cid].name,
            "short": CIRCUITS[cid].short,
            "country": CIRCUITS[cid].country,
            "corners": len(corners_by_circuit[cid]),
        }
        for cid in sorted(corners_by_circuit)
        if cid in CIRCUITS
    ]

    corners_path.write_text(json.dumps(all_corners, separators=(",", ":")))
    circuits_path.write_text(json.dumps(circuits, indent=2))

    log.info("✓ wrote %d corners across %d circuits", len(all_corners), len(circuits))
    log.info("  %s", corners_path)
    log.info("  %s", circuits_path)

    # quick sanity table for validation
    if all_corners:
        log.info("\n  sample (validate these against reality):")
        for c in all_corners[:8]:
            log.info(
                "  %-14s min=%3dkm/h brake=%3dm angle=%3d° gear=%d grad=%+.1f%% %s latG=%.1f drs=%s",
                c["id"], c["minSpeed"], c["brakingDistance"], c["cornerAngle"],
                c["minGear"], c["gradient"], c["direction"], c["lateralG"], c["drsApproach"],
            )
    return 0


if __name__ == "__main__":
    sys.exit(main())
