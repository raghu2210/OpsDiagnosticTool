// One-off content seed: adds a "Problems" worksheet to sample_data/LongArc_Masters.xlsx -
// Node 4 (leaf-level scoring) for the A1 (Inward & Quality Grading) pilot, per the
// approved plan. Masters and Recommendations sheets for A1's sub-points are left exactly
// as they are (still readable/used as the fallback for the .xlsx upload path); this is
// purely additive.
//
// Run once: node scripts/seed-a1-problems.mjs
// Then regenerate the JSON fallback as usual: node scripts/generate-fallback-json.mjs
import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, "../../sample_data/LongArc_Masters.xlsx");

const MODULE_ID = "FNV_WH_V1";

// [subpoint_id, subpoint_name, [ [problem_id, problem_name, problem_weight, [5 score descs]] ]]
const SUBPOINTS = [
  [
    "A1.1",
    "Receiving Dock Discipline",
    [
      [
        "A1.1.1",
        "Dock Scheduling",
        0.35,
        [
          "No dock scheduling exists - inbound trucks arrive whenever the vendor chooses, with no assigned time window and frequent dock congestion.",
          "A rough scheduling attempt exists (a phone call or message) but isn't tracked, and vendors regularly ignore it.",
          "A documented dock schedule with assigned time windows per vendor exists and is generally followed.",
          "Dock scheduling is actively enforced with a booking system or calendar, and vendor adherence is tracked against a KPI.",
          "Dock scheduling is fully digitized (self-service vendor booking), with real-time visibility and automatic reflow when a slot is missed.",
        ],
      ],
      [
        "A1.1.2",
        "Arrival Time-Stamping",
        0.3,
        [
          "No record of when inbound trucks actually arrive or when unloading finishes - there's no way to know how long anything sat at the dock.",
          "Arrival time is noted informally (a scrawled note) but not consistently, and isn't compiled anywhere.",
          "A documented process for logging arrival and unload-complete times exists and is generally followed, recorded manually or in a spreadsheet.",
          "Time-stamping is actively reviewed against a dock-to-shelf time KPI, with delays flagged and investigated.",
          "Time-stamping is automatic (system/scan-based) and dock-to-shelf time is a continuously monitored, benchmarked metric.",
        ],
      ],
      [
        "A1.1.3",
        "Dock-to-Shelf SOP Adherence",
        0.35,
        [
          "No documented SOP for what happens between a truck arriving and produce reaching storage - the sequence depends entirely on whoever is working.",
          "An informal sequence is understood by experienced staff but isn't written down, and breaks down when they're absent.",
          "A documented dock-to-shelf SOP exists and is generally followed under normal conditions.",
          "SOP adherence is actively audited on a defined cadence, with deviations tracked and corrected.",
          "The SOP is system-guided (e.g. task prompts) and adherence is consistently near 100%, verified continuously.",
        ],
      ],
    ],
  ],
  [
    "A1.2",
    "Produce Quality Grading",
    [
      [
        "A1.2.1",
        "Grading Standard Documentation",
        0.35,
        [
          "No written grading standard exists for any produce category - acceptance is a purely subjective call.",
          "A grading standard exists informally in a few people's heads but isn't written down anywhere.",
          "A documented grading rubric (ripeness, blemish tolerance, size) exists for major SKU categories.",
          "The grading rubric is actively maintained, covers most SKUs, and is referenced during training.",
          "Grading standards are documented with photo references for every SKU category and reviewed/updated on a regular cadence.",
        ],
      ],
      [
        "A1.2.2",
        "Grading Consistency & Sampling",
        0.4,
        [
          "Grading is applied inconsistently or not at all - different staff make different calls on the same produce.",
          "Grading happens but isn't sampling-based or systematic - whoever is at the dock eyeballs a few crates.",
          "A defined sampling method (e.g. check N crates per batch) is documented and generally followed.",
          "Sampling-based grading is actively tracked for consistency across shifts/staff, with outliers coached.",
          "Grading consistency is measured (e.g. inter-rater agreement) and continuously improved through training and feedback.",
        ],
      ],
      [
        "A1.2.3",
        "Rejection Data & Vendor Feedback Loop",
        0.25,
        [
          "Rejected produce is discarded or sent back with no record of quantity, reason, or vendor.",
          "Rejections are occasionally noted informally but not compiled or shared with vendors.",
          "A documented process for logging rejections (vendor, SKU, reason, quantity) exists and is generally followed.",
          "Rejection data is actively reviewed and shared with vendors on a defined cadence, feeding into vendor scorecards.",
          "Rejection data automatically feeds vendor performance reviews and sourcing decisions, with trends tracked over time.",
        ],
      ],
    ],
  ],
  [
    "A1.3",
    "Batch & Lot Traceability",
    [
      [
        "A1.3.1",
        "Batch/Lot Identification at Receiving",
        0.35,
        [
          "No batch or lot identification happens at receiving - once inside the facility, produce origin is untraceable.",
          "Batch/lot tagging happens manually and inconsistently (marker on a box), often illegible or lost.",
          "A documented batch-tagging process (vendor, date, lot) exists and is applied consistently.",
          "Batch tagging is actively verified at receiving with a defined accuracy target.",
          "Batch/lot identification is barcode/QR-based and system-captured at the point of receiving.",
        ],
      ],
      [
        "A1.3.2",
        "Traceability Through Storage",
        0.35,
        [
          "Once a batch is put away, there's no way to trace it - stock is treated as a single undifferentiated pool.",
          "Some batches can be traced with effort (asking staff, checking notes) but it's unreliable.",
          "A documented process keeps batch identity associated with stock through storage, generally followed.",
          "Batch traceability through storage is actively spot-checked and discrepancies are investigated.",
          "Full batch-level traceability is system-enforced from receiving through storage to pick, queryable instantly.",
        ],
      ],
      [
        "A1.3.3",
        "Recall/Root-Cause Capability",
        0.3,
        [
          "If a quality issue is found downstream, there's no way to trace it back to a specific inbound batch or vendor.",
          "Root-cause tracing is possible in theory but takes significant manual effort and often fails.",
          "A documented process exists to trace a downstream issue back to its batch/vendor, generally workable within a reasonable time.",
          "Traceability is actively tested/drilled on a defined cadence to confirm it actually works when needed.",
          "Any downstream issue can be traced to its exact inbound batch and vendor within minutes, system-supported.",
        ],
      ],
    ],
  ],
];

const TARGET_LEVEL_NAME = { 2: "Basic", 3: "Standardized", 4: "Managed", 5: "Best-in-class" };

function buildRecommendedTasks(problemName, targetLevel, descs) {
  return `Move ${problemName} toward: ${descs[targetLevel - 1]}`;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);

  let problemsWs = wb.getWorksheet("Problems");
  if (!problemsWs) {
    problemsWs = wb.addWorksheet("Problems");
    problemsWs.addRow([
      "module_id",
      "subpoint_id",
      "problem_id",
      "problem_name",
      "problem_weight",
      "score_1_desc",
      "score_2_desc",
      "score_3_desc",
      "score_4_desc",
      "score_5_desc",
      "version",
      "status",
    ]);
  }
  const problemsHeaders = problemsWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());

  const recoWs = wb.getWorksheet("Recommendations");
  const recoHeaders = recoWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());

  let problemsAdded = 0;
  let recoAdded = 0;
  for (const [subId, , problems] of SUBPOINTS) {
    for (const [problemId, problemName, weight, descs] of problems) {
      const record = {
        module_id: MODULE_ID,
        subpoint_id: subId,
        problem_id: problemId,
        problem_name: problemName,
        problem_weight: weight,
        score_1_desc: descs[0],
        score_2_desc: descs[1],
        score_3_desc: descs[2],
        score_4_desc: descs[3],
        score_5_desc: descs[4],
        version: 1,
        status: "active",
      };
      problemsWs.addRow(problemsHeaders.map((h) => record[h] ?? ""));
      problemsAdded++;

      for (const targetLevel of [2, 3, 4, 5]) {
        const recoRecord = {
          module_id: MODULE_ID,
          subpoint_id: problemId, // recoKey is keyed by problem_id for Node-4 items
          subpoint_name: problemName,
          target_level: targetLevel,
          target_level_name: TARGET_LEVEL_NAME[targetLevel],
          recommended_tasks: buildRecommendedTasks(problemName, targetLevel, descs),
        };
        recoWs.addRow(recoHeaders.map((h) => recoRecord[h] ?? ""));
        recoAdded++;
      }
    }
  }

  await wb.xlsx.writeFile(XLSX_PATH);
  console.log(`Added ${problemsAdded} Problems rows across ${SUBPOINTS.length} sub-points.`);
  console.log(`Added ${recoAdded} new Recommendations rows keyed by problem_id.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
