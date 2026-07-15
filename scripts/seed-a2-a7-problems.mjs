// One-off content seed: extends Node 4 (problem statements) from the A1 pilot to every
// remaining area (A2-A7) - full rollout per user request, same schema/pattern as
// seed-a1-problems.mjs. Adds rows to the existing "Problems" worksheet (already has A1's
// 9) and matching Recommendations rows keyed by problem_id.
//
// Run once: node scripts/seed-a2-a7-problems.mjs
// Then regenerate the JSON fallback as usual: node scripts/generate-fallback-json.mjs
import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, "../../sample_data/LongArc_Masters.xlsx");

const MODULE_ID = "FNV_WH_V1";

// [subpoint_id, [ [problem_id, problem_name, problem_weight, [5 score descs]] ]]
const SUBPOINTS = [
  [
    "A2.1",
    [
      [
        "A2.1.1",
        "Sensor Coverage & Placement",
        0.35,
        [
          "No temperature sensors installed anywhere in storage - conditions are assumed, never measured.",
          "A single sensor exists somewhere in the facility, not representative of conditions across different storage zones.",
          "Sensors are placed in each defined storage zone per a documented placement plan, generally followed.",
          "Sensor placement is actively reviewed against hot-spot/cold-spot mapping and adjusted when gaps are found.",
          "Sensor coverage is continuously validated (calibration checks, redundancy in critical zones) and placement is data-driven from historical temperature variance.",
        ],
      ],
      [
        "A2.1.2",
        "Reading Frequency & Logging Discipline",
        0.35,
        [
          "Temperature is never logged - if it's checked at all, it's a glance with no record kept.",
          "Readings are taken irregularly and logged inconsistently, often skipped during busy periods.",
          "A documented reading schedule (e.g. every 2 hours) exists and logs are generally kept, manually or in a spreadsheet.",
          "Reading frequency is actively enforced with completion tracked against the schedule, gaps flagged.",
          "Readings are continuous and automatic (sensor-logged), with 100% time-coverage and no manual step required.",
        ],
      ],
      [
        "A2.1.3",
        "Excursion Escalation Process",
        0.3,
        [
          "No defined response when temperature goes out of range - it's noticed only if someone happens to check.",
          "An informal response exists (\"tell the supervisor\") but isn't documented or consistently followed.",
          "A documented escalation process (who's notified, what action is taken) exists and is generally followed.",
          "Escalations are actively tracked with response-time targets, and root causes of excursions are reviewed.",
          "Excursions trigger automatic real-time alerts with a defined SLA for response, and escalation effectiveness is continuously measured.",
        ],
      ],
    ],
  ],
  [
    "A2.2",
    [
      [
        "A2.2.1",
        "Zone Definition & Labeling",
        0.35,
        [
          "No storage zones are defined at all - the facility is one undifferentiated space.",
          "Zones exist informally (\"the cold corner\") but aren't labeled or documented anywhere.",
          "Zones are documented and physically labeled, with a written guide for what belongs where.",
          "Zone definitions are actively reviewed and refined based on operational experience, with staff trained on them.",
          "Zone layout is data-optimized (temperature mapping, produce mix) and digitally referenced in the WMS.",
        ],
      ],
      [
        "A2.2.2",
        "Ethylene-Sensitivity Separation",
        0.35,
        [
          "No awareness of ethylene sensitivity - gas-producing and gas-sensitive produce are stored together routinely, accelerating spoilage.",
          "Ethylene sensitivity is known informally by some staff but not applied systematically.",
          "A documented ethylene-compatibility guide exists and separation is generally practiced.",
          "Ethylene separation is actively audited and violations are tracked back to spoilage outcomes.",
          "Ethylene management is systematized (zone assignment enforces it automatically) and continuously validated against spoilage data.",
        ],
      ],
      [
        "A2.2.3",
        "Put-Away Enforcement of Zoning",
        0.3,
        [
          "Produce is put away wherever there's space, regardless of defined zones.",
          "Staff generally know where things should go but zoning isn't checked or enforced.",
          "A documented put-away process references zone assignment and is generally followed.",
          "Zone compliance at put-away is actively spot-checked, with misplacement tracked and corrected.",
          "Zone assignment is system-enforced at put-away (WMS blocks incorrect placement).",
        ],
      ],
    ],
  ],
  [
    "A2.3",
    [
      [
        "A2.3.1",
        "Humidity Target Setting per Zone",
        0.5,
        [
          "No humidity targets exist for any zone - humidity is whatever it happens to be.",
          "A rough humidity preference exists informally but isn't documented or measured against.",
          "Documented humidity targets exist per zone/produce category and are referenced.",
          "Humidity is actively measured against targets with corrective action when out of range.",
          "Humidity targets are continuously refined based on spoilage outcomes and automatically enforced per zone.",
        ],
      ],
      [
        "A2.3.2",
        "Airflow/Ventilation Equipment Upkeep",
        0.5,
        [
          "No ventilation equipment maintenance - fans/humidifiers run (or don't) with no upkeep plan.",
          "Equipment is fixed reactively only after visible failure, with no preventive maintenance.",
          "A documented maintenance schedule exists and is generally followed.",
          "Maintenance completion is actively tracked against the schedule, with equipment downtime monitored.",
          "Maintenance is predictive/condition-based, with equipment performance continuously monitored and downtime near zero.",
        ],
      ],
    ],
  ],
  [
    "A3.1",
    [
      [
        "A3.1.1",
        "Velocity-Based Slot Assignment",
        0.5,
        [
          "Slotting ignores sales velocity entirely - fast and slow movers are placed identically, with no regard to picker travel time.",
          "Fast movers are placed conveniently based on staff habit, not documented or data-driven.",
          "A documented slotting plan based on velocity tiers exists and is generally followed.",
          "Slot assignment is actively reviewed against current velocity data on a defined cadence and adjusted.",
          "Slotting is dynamically optimized by an algorithm/system recommendation based on real-time velocity.",
        ],
      ],
      [
        "A3.1.2",
        "Shelf-Life-Aware Placement",
        0.5,
        [
          "Placement ignores shelf-life entirely - short-life items can end up in the slowest-to-reach locations.",
          "Shelf-life is considered informally by experienced staff but not systematically.",
          "A documented placement rule links shelf-life to proximity (shortest-life nearest pack-out) and is generally followed.",
          "Shelf-life-aware placement is actively audited and adjusted based on spoilage patterns.",
          "Placement is system-recommended based on live shelf-life data per batch.",
        ],
      ],
    ],
  ],
  [
    "A3.2",
    [
      [
        "A3.2.1",
        "Time-to-Shelf Target & Tracking",
        0.5,
        [
          "No time-to-shelf target exists - produce can sit unshelved for an unpredictable, untracked duration.",
          "A rough expectation exists informally but isn't measured.",
          "A documented time-to-shelf target exists and is occasionally checked.",
          "Time-to-shelf is actively measured against the target with delays investigated.",
          "Time-to-shelf is continuously tracked in real time and benchmarked against a best-in-class threshold.",
        ],
      ],
      [
        "A3.2.2",
        "Peak-Inbound Staffing Response",
        0.5,
        [
          "Staffing doesn't flex with inbound volume at all - peak periods cause the same delays every time with no adjustment.",
          "Staffing is adjusted informally and inconsistently when someone notices a backlog.",
          "A documented staffing plan for peak inbound periods exists and is generally followed.",
          "Staffing response is actively reviewed against actual peak performance and refined.",
          "Staffing is dynamically planned using inbound forecast data, with peak delays minimized proactively.",
        ],
      ],
    ],
  ],
  [
    "A4.1",
    [
      [
        "A4.1.1",
        "Date-Based Bin/Location Labeling",
        0.5,
        [
          "No date labeling on bins or locations - there's no way to tell which stock is older without digging through it.",
          "Some batches are dated informally (marker on a box) but inconsistently.",
          "A documented date-labeling process exists and is generally applied.",
          "Date-labeling accuracy is actively spot-checked and corrected.",
          "Date labeling is barcode/system-based and automatically visible at the point of pick.",
        ],
      ],
      [
        "A4.1.2",
        "Pick-Time FEFO Enforcement",
        0.5,
        [
          "Pickers grab whichever unit is easiest to reach, with no regard to which batch is older.",
          "FEFO is understood informally but frequently skipped under time pressure.",
          "A documented FEFO picking process exists and is generally followed with spot checks.",
          "FEFO adherence is actively audited on a schedule, with violations tracked and coached.",
          "FEFO is system-directed at pick (the WMS routes pickers to the oldest eligible batch) with adherence near 100%.",
        ],
      ],
    ],
  ],
  [
    "A4.2",
    [
      [
        "A4.2.1",
        "Per-Batch Shelf-Life Recording",
        0.5,
        [
          "No shelf-life is recorded per batch - there's no way to know how close any given unit is to expiry.",
          "Shelf-life is estimated by appearance rather than recorded from receipt date.",
          "A documented shelf-life standard per SKU (days from receipt) is defined and used to track batches.",
          "Remaining shelf-life is actively tracked per batch and reviewed on a defined cadence.",
          "Shelf-life is tracked per batch in a system that computes remaining life automatically from receipt date.",
        ],
      ],
      [
        "A4.2.2",
        "Aging-Stock Flagging & Action",
        0.5,
        [
          "Aging stock is only noticed once it's visibly spoiling - no proactive flagging happens at all.",
          "Aging stock is occasionally noticed informally but no consistent action is taken.",
          "A documented process flags aging stock at a defined threshold and prescribes an action (markdown, priority pick).",
          "Aging-stock flags are actively actioned and tracked to completion, with outcomes reviewed.",
          "Aging stock is automatically flagged and routed (markdown, redistribution, priority pick) with no manual step.",
        ],
      ],
    ],
  ],
  [
    "A4.3",
    [
      [
        "A4.3.1",
        "Count Frequency & Coverage",
        0.5,
        [
          "No cycle counting happens - stock records and physical stock are never reconciled until a pick fails.",
          "Counts happen occasionally and informally with no defined schedule or coverage.",
          "A documented cycle-count schedule (e.g. weekly per zone) exists and is generally followed.",
          "Count completion is actively tracked against the schedule with coverage gaps flagged.",
          "Cycle counting is continuous/perpetual, system-driven, with full SKU coverage on a rolling basis.",
        ],
      ],
      [
        "A4.3.2",
        "Variance Investigation Process",
        0.5,
        [
          "Count variances are recorded (if at all) with no investigation into why they happened.",
          "Variances are occasionally looked into informally, without a consistent process.",
          "A documented variance-investigation process exists and is generally followed for significant variances.",
          "Variance root causes are actively tracked and trends reviewed to prevent recurrence.",
          "Variance investigation is systematic and data-driven, with root-cause patterns feeding process improvements automatically.",
        ],
      ],
    ],
  ],
  [
    "A5.1",
    [
      [
        "A5.1.1",
        "Replenishment Trigger Definition",
        0.5,
        [
          "Replenishment is purely reactive - triggered only after a stockout is noticed.",
          "A rough par level exists informally but isn't consistently used to trigger replenishment.",
          "A documented par level/trigger threshold exists per SKU category and is generally followed.",
          "Trigger thresholds are actively reviewed against sell-through data and adjusted.",
          "Replenishment triggers are dynamically calculated from real-time sell-through and shelf-life data.",
        ],
      ],
      [
        "A5.1.2",
        "Peak/Promo Demand Adjustment",
        0.5,
        [
          "Replenishment doesn't adjust for known demand spikes at all - promotions and peak periods cause the same stockouts every time.",
          "Adjustments happen informally and inconsistently when someone remembers an upcoming promotion.",
          "A documented process adjusts replenishment ahead of known demand drivers and is generally followed.",
          "Peak/promo adjustments are actively reviewed post-event for accuracy and refined.",
          "Demand-driver adjustments are modeled and applied automatically based on historical promo/peak performance.",
        ],
      ],
    ],
  ],
  [
    "A5.2",
    [
      [
        "A5.2.1",
        "Forecast Input Data Quality",
        0.5,
        [
          "No real sales data feeds the order quantity - it's guessed or copied from the last order.",
          "Recent sales are referenced informally but not systematically incorporated.",
          "A documented forecasting input (recent sales trend) is used consistently.",
          "Forecast inputs are actively validated for quality and expanded to include more signals (weather, day-of-week).",
          "Forecast inputs are comprehensive and automatically ingested (sales, seasonality, promotions, external signals).",
        ],
      ],
      [
        "A5.2.2",
        "Forecast Accuracy Review Cadence",
        0.5,
        [
          "Forecast accuracy is never checked - there's no feedback loop between predicted and actual demand.",
          "Accuracy is occasionally noticed informally when a big miss happens.",
          "A documented review cadence compares forecast to actuals and is generally followed.",
          "Forecast accuracy is actively tracked as a KPI, with systematic adjustments based on error patterns.",
          "Forecast accuracy is continuously monitored with automated model refinement based on error trends.",
        ],
      ],
    ],
  ],
  [
    "A5.3",
    [
      [
        "A5.3.1",
        "Stockout Rate Tracking",
        0.5,
        [
          "Stockouts aren't tracked at all - it's unclear which SKUs or times are most affected.",
          "Stockouts are noticed anecdotally but not measured.",
          "A documented stockout rate is tracked at a basic level per SKU category.",
          "Stockout rate is actively monitored against a target, with root causes reviewed.",
          "Stockout rate is tracked in real time per SKU/store with automated root-cause tagging.",
        ],
      ],
      [
        "A5.3.2",
        "Overstock/Spoilage Linkage Tracking",
        0.5,
        [
          "Overstock and the spoilage it causes are never connected - they're treated as unrelated problems.",
          "The link is occasionally noticed informally but not tracked.",
          "A documented process tracks spoilage attributable to overstock at a basic level.",
          "Overstock-linked spoilage is actively monitored and used to adjust replenishment parameters.",
          "Overstock and spoilage are jointly optimized in a single system view, continuously tuned to minimize both.",
        ],
      ],
    ],
  ],
  [
    "A6.1",
    [
      [
        "A6.1.1",
        "Weigh-Station Coverage & Calibration",
        0.5,
        [
          "No weighing equipment exists for loose/weighted produce - quantities are estimated by eye.",
          "Some weighing equipment exists but isn't consistently used or calibrated.",
          "A documented weighing process with calibrated scales exists at defined stations and is generally used.",
          "Scale calibration and usage are actively audited on a schedule.",
          "Weighing is integrated into the pick workflow (system-connected scales) with calibration continuously monitored.",
        ],
      ],
      [
        "A6.1.2",
        "Pick-Accuracy Tolerance Enforcement",
        0.5,
        [
          "No tolerance standard exists for weighted picks - over/under-fulfillment is common and unmeasured.",
          "A rough tolerance is understood informally but not enforced or measured.",
          "A documented tolerance band exists per SKU and is generally referenced.",
          "Tolerance adherence is actively measured against a KPI, with deviations tracked to individual pickers.",
          "Tolerance is system-verified at pack (automatic flag on out-of-tolerance) with accuracy consistently best-in-class.",
        ],
      ],
    ],
  ],
  [
    "A6.2",
    [
      [
        "A6.2.1",
        "Packaging Standard by Produce Category",
        0.5,
        [
          "No packaging standard exists - packaging choice is left entirely to whoever is packing.",
          "A rough packaging preference exists for a few fragile items but isn't documented.",
          "A documented packaging standard per produce category exists and is generally followed.",
          "Packaging standards are actively reviewed against damage data and refined.",
          "Packaging is continuously optimized per SKU based on transit-damage analytics.",
        ],
      ],
      [
        "A6.2.2",
        "Transit-Damage Tracking & Feedback",
        0.5,
        [
          "Transit damage isn't tracked - complaints or returns are handled case by case with no pattern analysis.",
          "Damage is occasionally noted informally but not compiled.",
          "A documented process logs transit damage (SKU, cause) and is generally followed.",
          "Damage data is actively reviewed and fed back into packaging decisions on a defined cadence.",
          "Damage tracking is real-time and automatically triggers packaging standard updates.",
        ],
      ],
    ],
  ],
  [
    "A7.1",
    [
      [
        "A7.1.1",
        "Spoilage Logging Discipline",
        0.5,
        [
          "Spoiled produce is discarded with no record of quantity, SKU, or cause at all.",
          "Spoilage is estimated informally rather than logged consistently.",
          "A documented logging process (SKU, quantity, reason) exists and is generally followed.",
          "Spoilage logging completeness is actively audited and gaps are corrected.",
          "Spoilage is logged in real time per SKU/batch with automated reporting.",
        ],
      ],
      [
        "A7.1.2",
        "Shrinkage % Benchmarking",
        0.5,
        [
          "There's no shrinkage percentage calculated at all - spoilage cost is invisible.",
          "Shrinkage is estimated roughly but not calculated as a consistent percentage of throughput.",
          "Shrinkage % is calculated on a defined cadence and compared to a basic target.",
          "Shrinkage % is actively tracked as a KPI and reviewed against a best-in-class benchmark.",
          "Shrinkage % is tracked in real time and directly feeds sourcing/replenishment decisions.",
        ],
      ],
    ],
  ],
  [
    "A7.2",
    [
      [
        "A7.2.1",
        "Cause Categorization Process",
        0.5,
        [
          "Spoilage causes are never categorized - it's treated as an unavoidable cost, not a solvable problem.",
          "Causes are occasionally guessed at informally.",
          "A documented categorization (over-order, cold-chain break, aged stock, damage) exists and is generally applied.",
          "Cause categorization is actively analyzed for patterns and reviewed on a defined cadence.",
          "Cause categorization is systematic and data-driven, with patterns surfaced automatically.",
        ],
      ],
      [
        "A7.2.2",
        "Corrective Action Follow-Through",
        0.5,
        [
          "No corrective actions are taken based on spoilage causes - the same problems recur unaddressed.",
          "Corrective actions are occasionally taken informally but not tracked to completion.",
          "A documented process assigns and tracks corrective actions for identified causes.",
          "Corrective action effectiveness is actively measured and reviewed.",
          "Corrective actions are automatically prioritized by impact and their effectiveness is tracked continuously.",
        ],
      ],
    ],
  ],
  [
    "A7.3",
    [
      [
        "A7.3.1",
        "Write-Off Approval & Verification",
        0.5,
        [
          "Stock disappears from the floor with no formal write-off, approval, or verification at all.",
          "Write-offs are recorded informally and inconsistently, often without approval.",
          "A documented write-off SOP (verification, approval) exists and is generally followed.",
          "Write-off approvals are actively audited for compliance with the SOP.",
          "Write-off approval is system-integrated and fully auditable, with no manual gaps.",
        ],
      ],
      [
        "A7.3.2",
        "Inventory Reconciliation on Disposal",
        0.5,
        [
          "Disposed stock is never reconciled against inventory records - the system and reality drift apart silently.",
          "Reconciliation happens occasionally and informally.",
          "A documented reconciliation process runs on a defined cadence and is generally followed.",
          "Reconciliation is actively monitored for unusual patterns, which are investigated.",
          "Reconciliation is automatic and real-time, with disposal method also optimized (e.g. donation/composting) to reduce cost and waste impact.",
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

  const problemsWs = wb.getWorksheet("Problems");
  if (!problemsWs) throw new Error("No Problems worksheet found - run seed-a1-problems.mjs first.");
  const problemsHeaders = problemsWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());

  const recoWs = wb.getWorksheet("Recommendations");
  const recoHeaders = recoWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());

  let problemsAdded = 0;
  let recoAdded = 0;
  for (const [subId, problems] of SUBPOINTS) {
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
          subpoint_id: problemId,
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
  console.log(`Added ${problemsAdded} Problems rows across ${SUBPOINTS.length} sub-points (A2-A7).`);
  console.log(`Added ${recoAdded} new Recommendations rows keyed by problem_id.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
