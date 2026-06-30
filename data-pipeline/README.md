# Apexle data pipeline

Offline extractor that turns real F1 telemetry into the game's bundled JSON. It runs
**at build time only** — the web app ships the generated files, so the live site is
fully static and never touches Python or the F1 API.

## What it produces

- `../src/data/corners.json` — one entry per corner: an anonymised speed/throttle/brake
  display trace plus the comparison attributes (min speed, braking distance, corner angle,
  gradient, min gear, lateral G, direction, DRS, …). **All** attributes are always computed
  and stored, so enabling/disabling any of them in the app is just a flag flip — no re-run.
- `../src/data/circuits.json` — circuit id, name, country, corner count.

## Run it

```bash
cd data-pipeline
python -m venv .venv && .venv\Scripts\activate   # optional (Windows)
pip install -r requirements.txt

python extract.py            # SEED circuits only (Monaco, Silverstone, Monza, Spa, Suzuka)
python extract.py --all      # every configured circuit (slow on first run — downloads + caches)
python extract.py monza spa  # just these circuit ids
```

Runs accumulate: the script merges new circuits into the existing JSON, so you can fill
in the roster a few circuits at a time. Downloaded sessions are cached in `cache/`
(git-ignored), so re-runs are fast.

## Adding / changing circuits

Edit the `CIRCUITS` dict in [`extract.py`](extract.py). Each entry picks a recent **dry
qualifying** session for a clean representative fastest lap:

```python
"monza": CircuitCfg("Autodromo Nazionale Monza", "Italy", 2023, "Italy", seed=True),
#                    display name                 country  year  grand-prix  ship-now?
```

Pick dry sessions — a wet qualifying lap distorts every speed/braking figure. Famous
corners can be given names in `CORNER_NAMES`.

## Tuning / validation

After a run the script prints a sanity table. Eyeball it against reality:
- **Direction (L/R)** depends on the telemetry's coordinate orientation. If corners come
  out mirrored (e.g. Monaco T1 / Sainte Devote should be a **right**), flip the
  `FLIP_DIRECTION` constant.
- **Lateral G** should peak around ~3–5 g in fast corners. If it's ~10× off, the
  `POS_TO_M` position-unit scale needs adjusting.
- **Gradient** is the least reliable attribute (telemetry elevation `Z` is noisy); it's
  shipped as an approximate figure and can be disabled in the app if it looks off.

Window size, trace resolution, and DRS codes are constants near the top of `extract.py`.

## Data & licensing

Telemetry is accessed via [FastF1](https://github.com/theOehrly/Fast-F1) for a personal,
non-commercial fan project. Only **derived, anonymised** values are shipped — never raw
timing or driver data. Not affiliated with Formula 1, the FIA, or any team.
