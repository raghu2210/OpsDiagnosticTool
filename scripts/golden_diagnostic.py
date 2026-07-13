"""One-off: compute a golden compute_diagnostic() result using the exact Python logic
from appv1.py against the real sample data, for a fixed synthetic score set. The output
JSON is what tests/scoring.test.ts asserts the TypeScript port produces bit-for-bit
(within float tolerance) - this is the actual parity check for the core business logic."""
import json
import pandas as pd

LEVEL_NAME = {1: "Ad-hoc", 2: "Basic", 3: "Standardized", 4: "Managed", 5: "Best-in-class"}


def compute_diagnostic(module_df, scores, observations, recos):
    df = module_df.copy()
    df["score"] = df["subpoint_id"].map(scores)
    df["observation"] = df["subpoint_id"].map(observations).fillna("")
    df["score"] = pd.to_numeric(df["score"], errors="coerce")
    scored = df[df["score"].between(1, 5)].copy()

    scored["level_name"] = scored["score"].astype(int).map(LEVEL_NAME)
    scored["target"] = scored["score"].apply(lambda s: min(int(s) + 1, 5) if s < 5 else 5)
    scored["target_name"] = scored["target"].map(LEVEL_NAME)
    scored["weighted_gap"] = (5 - scored["score"]) * scored["subpoint_weight"] * scored["area_weight"]

    reco_map = {}
    has_mid = not recos.empty and "module_id" in recos.columns
    if not recos.empty:
        for _, r in recos.iterrows():
            mid = r["module_id"] if has_mid else None
            reco_map[(mid, r["subpoint_id"], int(r["target_level"]))] = str(r["recommended_tasks"])

    def tasks_for(row):
        if row["score"] >= 5:
            return ""
        mid = row["module_id"] if has_mid else None
        return reco_map.get((mid, row["subpoint_id"], int(row["target"])), "")

    scored["tasks"] = scored.apply(tasks_for, axis=1)

    area_rows = []
    for aid, g in scored.groupby("area_id"):
        w = g["subpoint_weight"].sum()
        a_score = (g["score"] * g["subpoint_weight"]).sum() / w if w else g["score"].mean()
        area_rows.append({
            "area_id": aid, "area_name": g["area_name"].iloc[0],
            "area_weight": g["area_weight"].iloc[0], "area_score": a_score,
            "n_scored": len(g),
        })
    area_scores = pd.DataFrame(area_rows).sort_values("area_id")

    if not area_scores.empty:
        aw = area_scores["area_weight"].sum()
        module_score = (area_scores["area_score"] * area_scores["area_weight"]).sum() / aw if aw else area_scores["area_score"].mean()
    else:
        module_score = 0.0

    return {
        "module_score": float(module_score), "pct": float(module_score) / 5 * 100,
        "n_scored": len(scored), "n_total": len(module_df),
        "area_scores": area_scores.to_dict("records"),
    }


masters = pd.read_excel("../../sample_data/LongArc_Masters.xlsx", sheet_name="Masters")
recos = pd.read_excel("../../sample_data/LongArc_Masters.xlsx", sheet_name="Recommendations")
module_df = masters[masters["module_id"] == "WH_V1"]

# Synthetic score set: deterministic pattern (cycle 1-5) over the first 20 subpoints,
# by sorted subpoint_id, so the TS test can reproduce the exact same input map.
subpoint_ids = sorted(module_df["subpoint_id"].tolist())[:20]
scores = {sid: (i % 5) + 1 for i, sid in enumerate(subpoint_ids)}
observations = {subpoint_ids[0]: "Sample observation for golden test"}

result = compute_diagnostic(module_df, scores, observations, recos)
print(json.dumps({"input_scores": scores, "result": result}, indent=2, default=str))
