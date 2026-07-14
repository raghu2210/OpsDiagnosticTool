// One-off content seed: replaces the generic 5-module Masters content with a single,
// coherent FnV (fruits & vegetables) warehouse diagnostic for quick commerce, per the
// full-repositioning decision. Old modules are marked inactive (not deleted) so the data
// is preserved and the change is reversible - same mechanism the app already uses to
// filter status === "active" everywhere.
//
// Run once: node scripts/seed-fnv-warehouse.mjs
// Then regenerate the JSON fallback as usual: node scripts/generate-fallback-json.mjs
import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, "../../sample_data/LongArc_Masters.xlsx");

const MODULE_ID = "FNV_WH_V1";
const MODULE_NAME = "FnV Warehouse Diagnostic - Quick Commerce";

// [area_id, area_name, area_weight, [ [subpoint_id, subpoint_name, subpoint_weight, [5 score descs]] ]]
const AREAS = [
  [
    "A1",
    "Inward & Quality Grading",
    0.16,
    [
      [
        "A1.1",
        "Receiving Dock Discipline",
        0.35,
        [
          "No defined receiving process for inbound produce. Crates are unloaded and moved into the facility with no time stamping, no dock scheduling, and no ownership of the inward step.",
          "A basic receiving process exists but is manual and inconsistent - some inbound batches are logged on paper or a spreadsheet, others aren't tracked at all, and dock timing varies by whoever is on shift.",
          "A standardized dock SOP is documented and generally followed: inbound trucks are scheduled, crates are logged against a purchase order, and receiving time is recorded manually or in a basic tool.",
          "Receiving is actively managed against a dock-to-shelf time KPI, with system-logged timestamps, deviations flagged, and vendor punctuality tracked and reviewed.",
          "Dock scheduling and inbound logging are fully digitized and integrated with the WMS; dock-to-shelf time is continuously monitored and used to renegotiate vendor delivery windows.",
        ],
      ],
      [
        "A1.2",
        "Produce Quality Grading",
        0.4,
        [
          "No formal grading of incoming produce. Acceptance/rejection is a subjective, ad-hoc call with no documented standard for ripeness, bruising, or size.",
          "A basic grading checklist exists for a few high-volume SKUs, but it's applied inconsistently and mostly from memory rather than a written spec.",
          "A standardized grading rubric (ripeness stage, blemish tolerance, size band) is documented per SKU category and used at the dock, with rejected batches logged.",
          "Grading is actively managed with photo-referenced standards, sampling-based inspection at defined intervals, and rejection-rate KPIs reviewed with vendors.",
          "Grading is best-in-class: digitized (e.g. handheld/photo-based grading capture), tied directly to vendor scorecards, and rejection data feeds back into sourcing decisions automatically.",
        ],
      ],
      [
        "A1.3",
        "Batch & Lot Traceability",
        0.25,
        [
          "No batch or lot identification on inbound produce - once inside the facility, a crate's origin and receipt date can't be reliably traced.",
          "Batch/lot numbers are assigned manually with a marker or paper tag, but records aren't centrally kept and are frequently lost or illegible.",
          "A standardized batch-tagging process (vendor, receipt date, lot) is documented and applied consistently, with a manual or spreadsheet-based log kept.",
          "Batch/lot data is captured in a system at receiving and can be traced through storage and picking; discrepancies are investigated.",
          "Full lot-level traceability from dock to dispatch is system-enforced and barcode/QR-driven, enabling instant recall or root-cause tracing for any batch.",
        ],
      ],
    ],
  ],
  [
    "A2",
    "Cold Chain & Storage Conditions",
    0.16,
    [
      [
        "A2.1",
        "Temperature Monitoring & Logging",
        0.4,
        [
          "No temperature monitoring in storage areas. Cooling is assumed to be working; there's no record of actual conditions produce is held at.",
          "Temperature is checked manually and irregularly (e.g. a wall thermometer glanced at occasionally), with no logging or escalation if out of range.",
          "A standardized temperature-check SOP exists with scheduled manual readings logged on paper or a spreadsheet, and a defined acceptable range per zone.",
          "Temperature is monitored with sensors and logged on a defined cadence; excursions trigger a documented escalation and corrective action process.",
          "Continuous automated temperature/humidity monitoring with real-time alerts, historical trend data, and integration into a cold-chain compliance dashboard.",
        ],
      ],
      [
        "A2.2",
        "Zone Segregation by Produce Type",
        0.3,
        [
          "All produce is stored together regardless of temperature sensitivity or ethylene sensitivity, with no zoning at all.",
          "Some informal separation exists (e.g. \"cold stuff over there\") but it's not documented or consistently enforced across shifts.",
          "Storage zones are defined and labeled by temperature band and ethylene sensitivity, with a documented placement guide for common SKUs.",
          "Zone assignment is actively enforced through put-away rules and periodically audited; misplacement is tracked and corrected.",
          "Zoning is system-enforced at put-away (WMS blocks incorrect placement), with zone-level condition monitoring tied to individual SKU shelf-life outcomes.",
        ],
      ],
      [
        "A2.3",
        "Humidity & Ventilation Control",
        0.3,
        [
          "No humidity or airflow management - produce is stored in whatever ambient conditions the facility happens to have.",
          "Basic ventilation (fans, open doors) is used opportunistically but there's no target humidity range or consistent practice.",
          "A documented humidity/ventilation standard exists per storage zone, with equipment (humidifiers, exhaust) assigned and checked periodically.",
          "Humidity is actively monitored against targets with corrective actions logged when out of range, and equipment maintenance is scheduled.",
          "Humidity and airflow are automatically controlled and logged per zone, tuned per produce category, and reviewed against spoilage outcomes to refine targets.",
        ],
      ],
    ],
  ],
  [
    "A3",
    "Put-Away & Slotting",
    0.12,
    [
      [
        "A3.1",
        "Slotting Logic for Perishables",
        0.5,
        [
          "No defined slotting logic - produce is placed wherever there's open space, with no regard to velocity, shelf-life, or picker travel distance.",
          "Slotting follows informal habits of experienced staff, but it's not documented and breaks down when they're not on shift.",
          "A documented slotting plan exists based on velocity and shelf-life (fast-moving, short-life SKUs near pack-out), generally followed.",
          "Slotting is actively reviewed against sales velocity data and adjusted on a defined cadence; deviations from plan are tracked.",
          "Slotting is dynamically optimized (system-recommended or algorithm-driven) based on real-time velocity, shelf-life, and pick-path efficiency.",
        ],
      ],
      [
        "A3.2",
        "Put-Away Speed & SOP Adherence",
        0.5,
        [
          "No put-away time expectation or process - produce can sit at the dock for an unpredictable amount of time before being shelved.",
          "A rough put-away expectation exists informally but isn't tracked, and delays are common during peak inbound periods.",
          "A documented put-away SOP with a target time-to-shelf exists and is generally followed under normal conditions.",
          "Put-away time is actively measured against the KPI, with staffing adjusted for peak inbound volume and delays investigated.",
          "Put-away is system-directed (task assignment, guided locations) and time-to-shelf is a continuously tracked, best-in-class-benchmarked metric.",
        ],
      ],
    ],
  ],
  [
    "A4",
    "Inventory & Shelf-Life Management",
    0.16,
    [
      [
        "A4.1",
        "FEFO Rotation Discipline",
        0.4,
        [
          "No first-expiry-first-out discipline - older stock and newer stock are picked interchangeably, with no visibility into which is which.",
          "FEFO is understood informally by experienced pickers but isn't enforced by any process or system, and is frequently skipped under time pressure.",
          "A documented FEFO process exists (e.g. date-labeled bins, front-to-back stocking) and is generally followed with periodic spot checks.",
          "FEFO adherence is actively audited on a defined schedule, with violations tracked and corrective coaching given.",
          "FEFO is system-enforced at pick (the WMS directs pickers to the oldest eligible batch), with adherence continuously measured near 100%.",
        ],
      ],
      [
        "A4.2",
        "Expiry / Shelf-Life Tracking",
        0.35,
        [
          "No shelf-life tracking at all - there's no way to know how close any given batch is to becoming unsellable until it visibly spoils.",
          "Shelf-life is estimated informally by appearance/smell rather than tracked from receipt date, and is inconsistent across staff.",
          "A documented shelf-life standard per SKU (days from receipt) is defined and used to flag aging stock manually.",
          "Remaining shelf-life is actively tracked per batch, with aging stock flagged for markdown or priority picking on a defined cadence.",
          "Shelf-life is tracked per batch in a system that automatically flags at-risk inventory and triggers markdown, redistribution, or priority-pick workflows.",
        ],
      ],
      [
        "A4.3",
        "Cycle Counting & Stock Accuracy",
        0.25,
        [
          "No cycle counting - system/paper stock levels and physical stock are not reconciled, and discrepancies are only discovered when a pick fails.",
          "Counts happen occasionally and informally, with no defined frequency or accuracy target.",
          "A documented cycle-count schedule exists (e.g. weekly per zone) with a defined accuracy target, and discrepancies are logged.",
          "Cycle counts are actively tracked against an accuracy KPI, with root causes of variance investigated and corrected.",
          "Cycle counting is continuous/perpetual (not just periodic), system-driven, with accuracy consistently above a best-in-class threshold and variance trends analyzed.",
        ],
      ],
    ],
  ],
  [
    "A5",
    "Replenishment & Demand Planning",
    0.14,
    [
      [
        "A5.1",
        "Dark Store Replenishment Cadence",
        0.4,
        [
          "Replenishment to dark stores/fulfillment points is reactive and ad-hoc - triggered only after a stockout is noticed.",
          "A rough replenishment schedule exists but is manually decided each time with no consistent trigger logic.",
          "A documented replenishment cadence and trigger threshold (e.g. par level) exists per SKU category and is generally followed.",
          "Replenishment triggers are actively tuned against sell-through data and adjusted for known demand spikes (e.g. weekends, promotions).",
          "Replenishment is dynamically automated based on real-time sell-through, shelf-life, and demand signals, minimizing both stockouts and over-replenishment of perishables.",
        ],
      ],
      [
        "A5.2",
        "Demand Forecasting for Perishables",
        0.35,
        [
          "No forecasting - order quantities are guessed or based on whatever was ordered last time, with no reference to actual demand.",
          "A basic forecast exists (e.g. last week's sales) but doesn't account for perishability, seasonality, or promotions.",
          "A documented forecasting method incorporating recent sales trends and shelf-life constraints is used and generally followed.",
          "Forecasts are actively reviewed against actuals on a defined cadence, with accuracy tracked and adjustments made for known demand drivers.",
          "Forecasting is system/model-driven, incorporating seasonality, promotions, and shelf-life risk, with continuous accuracy monitoring and feedback loops.",
        ],
      ],
      [
        "A5.3",
        "Stockout & Overstock Balance",
        0.25,
        [
          "Stockouts and overstock (leading to spoilage) both happen frequently with no tracking of either, and no attempt to balance the two.",
          "Stockouts and overstock are noticed anecdotally but not measured, so it's unclear which SKUs or stores are worst affected.",
          "Stockout rate and overstock/spoilage-linked-to-overstock are documented and tracked at a basic level per SKU category.",
          "Both metrics are actively monitored against targets, with root causes reviewed and replenishment parameters adjusted accordingly.",
          "Stockout and overstock are jointly optimized in a single system view, with SKU-level parameters continuously tuned to minimize both simultaneously.",
        ],
      ],
    ],
  ],
  [
    "A6",
    "Pick-Pack & Fulfillment Accuracy",
    0.12,
    [
      [
        "A6.1",
        "Pick Accuracy for Loose/Weighted SKUs",
        0.5,
        [
          "No defined process for picking loose or weight-based produce (e.g. picked by eye, no weighing step, no accuracy check).",
          "A basic weighing step exists for some SKUs but isn't consistently applied or checked, leading to frequent under/over-fulfillment.",
          "A documented pick-and-weigh SOP with a tolerance band exists per SKU and is generally followed.",
          "Pick accuracy for weighted SKUs is actively measured against a tolerance KPI, with deviations tracked back to individual pickers for coaching.",
          "Pick-and-weigh is system-verified at the point of pack (integrated scale, automatic flag on out-of-tolerance), with accuracy consistently best-in-class.",
        ],
      ],
      [
        "A6.2",
        "Packaging Integrity for Transit",
        0.5,
        [
          "No standard for how produce is packed for delivery - packaging choice is left entirely to whoever is packing, with frequent transit damage.",
          "A basic packaging guideline exists for a few fragile SKUs but isn't documented or consistently applied.",
          "A documented packaging standard per produce category (crush-resistance, ventilation, ice packs where needed) exists and is generally followed.",
          "Transit-damage rates are actively tracked back to packaging choices, with the standard updated based on damage data.",
          "Packaging is continuously optimized per SKU based on transit-damage analytics, with near-zero damage-related returns/complaints.",
        ],
      ],
    ],
  ],
  [
    "A7",
    "Spoilage & Wastage Management",
    0.14,
    [
      [
        "A7.1",
        "Spoilage / Shrinkage Tracking",
        0.4,
        [
          "Spoilage is not tracked at all - unsellable produce is simply discarded with no record of quantity, SKU, or cause.",
          "Spoilage is estimated informally (e.g. \"a lot this week\") but not logged with any consistency or granularity.",
          "A documented process for logging spoiled/discarded produce (SKU, quantity, reason) exists and is generally followed.",
          "Spoilage is actively tracked as a % of throughput per SKU, reviewed on a defined cadence, and compared against a target.",
          "Spoilage is tracked in real time per SKU/batch with automated reporting, benchmarked against a best-in-class shrinkage target, and directly feeds sourcing/replenishment decisions.",
        ],
      ],
      [
        "A7.2",
        "Root-Cause Analysis & Corrective Action",
        0.3,
        [
          "No investigation into why produce spoils - it's treated as an unavoidable cost of doing business rather than a solvable problem.",
          "Causes are occasionally guessed at informally, but no structured analysis or corrective action is taken.",
          "A documented process exists to categorize spoilage causes (over-order, cold-chain break, aged stock, damage) and review them periodically.",
          "Root causes are actively analyzed against the tracked spoilage data, with corrective actions assigned and their impact monitored.",
          "Root-cause analysis is continuous and data-driven, with corrective actions automatically prioritized by impact and their effectiveness tracked over time.",
        ],
      ],
      [
        "A7.3",
        "Write-Off & Disposal Process",
        0.3,
        [
          "No formal write-off process - spoiled stock disappears from the floor with no reconciliation against inventory records.",
          "Write-offs are recorded manually and inconsistently, often after the fact and without approval or verification.",
          "A documented write-off SOP (verification, approval, disposal method, inventory reconciliation) exists and is generally followed.",
          "Write-offs are actively reconciled against inventory on a defined cadence, with unusual patterns flagged for review.",
          "Write-off and disposal are system-integrated with inventory (automatic reconciliation), fully auditable, and disposal method is optimized (e.g. donation/composting where viable) to reduce cost and waste impact.",
        ],
      ],
    ],
  ],
];

const TARGET_LEVEL_NAME = { 2: "Basic", 3: "Standardized", 4: "Managed", 5: "Best-in-class" };

function buildRecommendedTasks(subpointName, targetLevel, descs) {
  // descs is the 0-indexed array of 5 score descriptions; targetLevel 2..5 maps to descs[targetLevel-1]
  const targetDesc = descs[targetLevel - 1];
  return `Move ${subpointName} toward: ${targetDesc}`;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);

  const mastersWs = wb.getWorksheet("Masters");
  const recoWs = wb.getWorksheet("Recommendations");

  // Read headers from row 1 of each sheet so we append in the correct column order.
  const mastersHeaders = mastersWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());
  const recoHeaders = recoWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());

  // 1. Mark every existing Masters row inactive (preserve data, hide from active filters).
  let deactivated = 0;
  mastersWs.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const statusColIdx = mastersHeaders.indexOf("status") + 1; // 1-indexed for row.getCell
    if (statusColIdx > 0) {
      row.getCell(statusColIdx).value = "inactive";
      deactivated++;
    }
  });

  // 2. Append new FNV_WH_V1 Masters rows.
  let mastersAdded = 0;
  for (const [areaId, areaName, areaWeight, subpoints] of AREAS) {
    for (const [subId, subName, subWeight, descs] of subpoints) {
      const record = {
        module_id: MODULE_ID,
        module_name: MODULE_NAME,
        area_id: areaId,
        area_name: areaName,
        area_weight: areaWeight,
        subpoint_id: subId,
        subpoint_name: subName,
        subpoint_weight: subWeight,
        score_1_desc: descs[0],
        score_2_desc: descs[1],
        score_3_desc: descs[2],
        score_4_desc: descs[3],
        score_5_desc: descs[4],
        version: 1,
        status: "active",
      };
      mastersWs.addRow(mastersHeaders.map((h) => record[h] ?? ""));
      mastersAdded++;
    }
  }

  // 3. Append matching Recommendations rows (target_level 2-5 per subpoint, same pattern as existing data).
  let recoAdded = 0;
  for (const [, , , subpoints] of AREAS) {
    for (const [subId, subName, , descs] of subpoints) {
      for (const targetLevel of [2, 3, 4, 5]) {
        const record = {
          module_id: MODULE_ID,
          subpoint_id: subId,
          subpoint_name: subName,
          target_level: targetLevel,
          target_level_name: TARGET_LEVEL_NAME[targetLevel],
          recommended_tasks: buildRecommendedTasks(subName, targetLevel, descs),
        };
        recoWs.addRow(recoHeaders.map((h) => record[h] ?? ""));
        recoAdded++;
      }
    }
  }

  await wb.xlsx.writeFile(XLSX_PATH);
  console.log(`Deactivated ${deactivated} existing Masters rows.`);
  console.log(`Added ${mastersAdded} new Masters rows for ${MODULE_ID} (${AREAS.length} areas).`);
  console.log(`Added ${recoAdded} new Recommendations rows for ${MODULE_ID}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
