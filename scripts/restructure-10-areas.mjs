// One-off structural migration + content round, in one pass:
//
// 1. RESTRUCTURE: fixes two categorization errors found in the just-shipped 7-area
//    collapse (v3.2) - Demand/Replenishment sub-points were left under "Fulfillment
//    Operations" even though they're planning decisions, not execution; Cold Chain
//    sub-points were left under "Inbound & Quality" even though they're an ongoing
//    storage condition, not a receiving-time activity. Also splits the old "Governance &
//    Performance" mega-area (13 sub-points, more than double every other area) into three
//    focused areas so Safety & Compliance stops being diluted inside a grab-bag.
//    Result: 7 areas -> 10 areas, every area in the 4-9 sub-point range. All 57 existing
//    sub-points and 119 problems are re-parented with zero content loss (same technique as
//    scripts/collapse-categories-to-areas.mjs - only IDs/weights change).
//
// 2. NEW CONTENT: adds 10 new sub-points closing gaps found in a fresh critical pass
//    (New SKU/Vendor Onboarding, Cold-Chain Power Backup, Space/Capacity Utilization,
//    Packaging Sustainability, Security & Theft, Food Safety & Hygiene, Regulatory
//    Licensing, Facility Infrastructure & Upkeep, Insurance & Business Continuity,
//    WMS/Tech System Maturity) - 20 new Node-4 problem statements, all with full 5-level
//    maturity descriptions.
//
// Weight math: existing content's GLOBAL weight (old_area_weight * old_subpoint_weight)
// is preserved exactly, then uniformly rescaled by (1 - NEW_CONTENT_BUDGET) to free room
// for the 10 new sub-points, which get an authored global-weight budget summing to
// NEW_CONTENT_BUDGET. new_area_weight = sum of its members' global weights;
// new_subpoint_weight = member's global weight / new_area_weight.
//
// Run once: node scripts/restructure-10-areas.mjs
// Then: node scripts/generate-fallback-json.mjs
import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, "../../sample_data/LongArc_Masters.xlsx");
const MODULE_ID = "FNV_WH_V1";
const MODULE_NAME = "FnV Warehouse Diagnostic - Quick Commerce";
const TARGET_LEVEL_NAME = { 2: "Basic", 3: "Standardized", 4: "Managed", 5: "Best-in-class" };
const TARGET_LEVELS = [2, 3, 4, 5];
const NEW_CONTENT_BUDGET = 0.12;

function tasks(name, level, descs) {
  return `Move ${name} toward: ${descs[level - 1]}`;
}

// New area order/membership. Each entry: existing sub-points (by their CURRENT, i.e.
// post-v3.2, subpoint_id) in the order they should appear, then new sub-points (full
// content authored inline) appended after them.
const NEW_AREAS = [
  {
    name: "Planning & Sourcing",
    existing: ["A1.1", "A1.2", "A1.3", "A1.4", "A4.1", "A4.2", "A4.3"],
    newSubpoints: [
      {
        name: "New SKU/Vendor Onboarding Process",
        weight: 0.012,
        descs: [
          "New SKUs or vendors are onboarded with no evaluation process at all - they go straight into sourcing/inventory with no trial or go/no-go check.",
          "A rough informal trial happens sometimes (buyers \"try it and see\") but isn't a defined process.",
          "A documented onboarding process (sampling, trial run, go/no-go criteria) exists and is generally followed for new SKUs/vendors.",
          "Onboarding outcomes are actively tracked (trial success rate, time-to-scale) and the process refined.",
          "New SKU/vendor onboarding is systematically tracked and continuously refined based on which onboarding signals actually predict long-term performance.",
        ],
        problems: [
          {
            name: "Trial/Sampling Process for New SKUs",
            weight: 0.5,
            descs: [
              "No sampling or trial happens before a new SKU is added - it goes straight to full sourcing.",
              "A rough informal sample check happens sometimes, inconsistently.",
              "A documented sampling/trial process exists before a new SKU is added to the catalog and is generally followed.",
              "Trial outcomes are actively tracked and reviewed before scale-up decisions.",
              "Sampling/trial is systematic and data-driven, with clear go/no-go thresholds applied consistently.",
            ],
          },
          {
            name: "Go/No-Go Criteria for New Vendor Onboarding",
            weight: 0.5,
            descs: [
              "No defined criteria exist for accepting a new vendor - the decision is made on gut feel.",
              "Rough informal criteria exist in a buyer's head, not documented.",
              "Documented go/no-go criteria (quality, reliability, pricing) exist for new vendor onboarding and are generally applied.",
              "Go/no-go decisions are actively tracked against actual vendor performance post-onboarding to validate the criteria.",
              "Go/no-go criteria are data-derived and continuously refined based on which onboarding signals predict actual vendor performance.",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Inbound & Quality",
    existing: ["A2.1", "A2.2", "A2.3", "A2.4", "A2.8", "A2.9"],
    newSubpoints: [],
  },
  {
    name: "Cold Chain & Perishability",
    existing: ["A2.5", "A2.6", "A2.7"],
    newSubpoints: [
      {
        name: "Cold-Chain Power Backup & Continuity",
        weight: 0.015,
        descs: [
          "No power backup exists for cold storage - a power outage means immediate, unmanaged risk to all perishable stock.",
          "A rough informal backup (a generator \"somewhere\") exists but isn't tested or sized for actual cold-chain load.",
          "A documented power backup plan (sized for cold-chain load, tested periodically) exists and is generally functional.",
          "Backup readiness is actively tested on a defined cadence, with failures corrected before they matter.",
          "Power backup is continuously monitored (auto-failover, remote alerting) and tested on a fixed schedule with full documentation.",
        ],
        problems: [
          {
            name: "Backup Power Sizing & Failover",
            weight: 0.5,
            descs: [
              "No backup power exists for refrigeration - any outage directly threatens all cold-stored produce.",
              "A generator exists informally but was never sized against actual cold-chain load, so it may not be adequate.",
              "A documented backup power system sized for cold-chain load exists and generally functions on failover.",
              "Failover performance is actively tested and tracked against target switchover time.",
              "Failover is automatic, continuously monitored, and tested on a fixed audit schedule.",
            ],
          },
          {
            name: "Outage Response Protocol",
            weight: 0.5,
            descs: [
              "No protocol exists for what to do during a power outage - staff respond however they think best, in the moment.",
              "A rough informal response exists (someone knows to \"check the generator\") but isn't documented.",
              "A documented outage response protocol (escalation, monitoring, spoilage-risk triage) exists and is generally followed.",
              "Outage response is actively drilled and reviewed after any real incident.",
              "Outage response is drilled on a fixed schedule, fully documented, with real incidents feeding continuous improvement.",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Storage & Inventory",
    existing: ["A3.1", "A3.2", "A3.3", "A3.4", "A3.5", "A3.6", "A3.7", "A3.8"],
    newSubpoints: [
      {
        name: "Space/Capacity Utilization Tracking",
        weight: 0.010,
        descs: [
          "Warehouse space utilization is never measured - there's no visibility into how much capacity is actually being used versus idle.",
          "A rough informal sense exists (\"we're pretty full\") without any actual measurement.",
          "A documented space utilization tracking process exists and is checked on a basic (e.g. monthly) cadence.",
          "Utilization is actively tracked as a KPI and reviewed for underused or over-strained zones.",
          "Space utilization is tracked continuously (near real-time) and directly informs layout and capacity decisions.",
        ],
        problems: [
          {
            name: "Utilization Measurement Cadence",
            weight: 0.5,
            descs: [
              "No measurement of space utilization happens at any cadence - the figure simply doesn't exist.",
              "Utilization is estimated informally and irregularly, without a consistent method.",
              "A documented utilization measurement (e.g. % of racking/floor space occupied) exists on a basic cadence.",
              "Utilization measurement is actively tracked as a KPI against a target range.",
              "Utilization is measured continuously and tracked as a live KPI feeding capacity planning.",
            ],
          },
          {
            name: "Underused/Overstrained Zone Identification",
            weight: 0.5,
            descs: [
              "No attempt is made to identify which zones are underused or overstrained - capacity problems are discovered only when something breaks down.",
              "A rough informal sense exists of \"busy\" vs \"quiet\" zones, not measured.",
              "A documented process identifies underused/overstrained zones on a basic cadence and is reviewed.",
              "Zone-level findings actively inform layout or process adjustments.",
              "Zone-level utilization is continuously monitored and automatically flags imbalance for action.",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Fulfillment Operations",
    existing: ["A4.4", "A4.5", "A4.6", "A4.7", "A4.8", "A4.9", "A4.10", "A4.11"],
    newSubpoints: [
      {
        name: "Packaging Sustainability",
        weight: 0.008,
        descs: [
          "Packaging choices have no sustainability consideration at all - whatever is cheapest/available is used, regardless of recyclability or waste.",
          "Some informal awareness exists (\"we should probably use less plastic\") without any actual practice change.",
          "A documented sustainable packaging guideline (recyclable materials, reduced plastic use) exists and is generally followed.",
          "Sustainable packaging adoption is actively tracked (% recyclable, waste volume) and reviewed for improvement.",
          "Packaging sustainability is continuously tracked and improved, with material choices driven by measured waste/environmental data.",
        ],
        problems: [
          {
            name: "Recyclable/Sustainable Material Adoption",
            weight: 0.5,
            descs: [
              "No recyclable or sustainable packaging materials are used - packaging choice ignores environmental impact entirely.",
              "Some recyclable materials are used informally and inconsistently, not by any defined guideline.",
              "A documented guideline specifies recyclable/sustainable materials for defined use cases and is generally followed.",
              "Adoption is actively tracked (% of packaging that is recyclable/sustainable) against a target.",
              "Sustainable material adoption is tracked continuously and the target is actively raised over time.",
            ],
          },
          {
            name: "Packaging Waste Volume Tracking",
            weight: 0.5,
            descs: [
              "Packaging waste volume is never tracked - there's no visibility into how much packaging material is consumed or discarded.",
              "A rough informal estimate exists without actual measurement.",
              "A documented process tracks packaging waste volume on a basic (e.g. monthly) cadence.",
              "Waste volume is actively tracked against a reduction target and reviewed.",
              "Packaging waste volume is tracked continuously and directly informs material right-sizing and sourcing decisions.",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Loss, Returns & Complaints",
    existing: ["A5.1", "A5.2", "A5.3", "A5.4", "A5.5", "A5.6", "A5.7"],
    newSubpoints: [],
  },
  {
    name: "Control Tower & Metrics",
    existing: ["A6.1", "A6.2", "A6.3", "A6.4"],
    newSubpoints: [],
  },
  {
    name: "Safety, Compliance & Risk",
    existing: ["A6.8", "A6.9"],
    newSubpoints: [
      {
        name: "Security & Theft Prevention",
        weight: 0.014,
        descs: [
          "No security measures exist - no CCTV, no access control, no theft-prevention practice of any kind.",
          "Some informal security exists (a guard \"keeps an eye out\") but isn't systematic.",
          "A documented security setup (CCTV coverage, access control) exists and is generally functional.",
          "Security effectiveness is actively reviewed (incident data, coverage gaps) and improved.",
          "Security is continuously monitored and audited, with incident/shrinkage data directly driving coverage improvements.",
        ],
        problems: [
          {
            name: "CCTV & Access Control Coverage",
            weight: 0.5,
            descs: [
              "No CCTV or access control exists anywhere in the facility - anyone can enter and move freely with no record.",
              "Some informal coverage exists (a camera or two) but isn't comprehensive or reviewed.",
              "A documented CCTV/access control setup covers key areas (entry points, high-value storage) and is generally functional.",
              "Coverage is actively reviewed for gaps and incidents are investigated using available footage/logs.",
              "CCTV/access control coverage is comprehensive, continuously monitored, and audited on a fixed schedule.",
            ],
          },
          {
            name: "Inventory Shrinkage from Theft Tracking",
            weight: 0.5,
            descs: [
              "Shrinkage from theft is never distinguished from shrinkage due to spoilage - the two causes are conflated, if tracked at all.",
              "A rough informal suspicion of theft exists sometimes, without any actual tracking.",
              "A documented process tracks theft-related shrinkage separately from spoilage and is reviewed on a basic cadence.",
              "Theft-shrinkage data is actively tracked against a target and investigated when it spikes.",
              "Theft-shrinkage tracking is continuous and directly informs security investment decisions.",
            ],
          },
        ],
      },
      {
        name: "Food Safety & Hygiene Compliance",
        weight: 0.016,
        descs: [
          "No food safety or hygiene practice exists - no handwashing protocol, no pest control, no sanitation logging of any kind.",
          "A rough informal hygiene practice exists (staff \"know to wash hands\") but isn't documented or checked.",
          "A documented food safety/hygiene protocol (handwashing, sanitation logs, pest control) exists and is generally followed.",
          "Hygiene compliance is actively audited on a defined cadence, with violations corrected.",
          "Food safety/hygiene is continuously audited and documented, fully aligned with applicable regulatory standards (e.g. FSSAI-equivalent).",
        ],
        problems: [
          {
            name: "Personal Hygiene & Sanitation Practice",
            weight: 0.5,
            descs: [
              "No personal hygiene practice is enforced - no handwashing stations, no protective gear requirement, nothing documented.",
              "A rough informal expectation exists but isn't enforced or checked.",
              "A documented personal hygiene/sanitation protocol exists and is generally followed.",
              "Hygiene practice is actively audited and violations corrected.",
              "Hygiene practice is continuously audited and enforced, with staff compliance tracked individually.",
            ],
          },
          {
            name: "Pest Control Program",
            weight: 0.5,
            descs: [
              "No pest control program exists - infestation would only be noticed once it's already a serious problem.",
              "A rough informal pest control practice exists (occasional spraying) but isn't scheduled or documented.",
              "A documented pest control program (scheduled treatment, monitoring stations) exists and is generally followed.",
              "Pest control effectiveness is actively tracked (sightings, trap counts) and the program adjusted.",
              "Pest control is continuously monitored and audited on a fixed schedule, fully documented for regulatory inspection.",
            ],
          },
        ],
      },
      {
        name: "Regulatory Licensing & Documentation",
        weight: 0.012,
        descs: [
          "Regulatory licenses/certifications (food safety license, weights & measures, fire NOC, pollution control) are not tracked - their validity status is unknown.",
          "A rough informal awareness exists that licenses exist somewhere, without active tracking of validity/renewal.",
          "A documented tracking process for license validity/renewal exists and is generally maintained.",
          "License status is actively tracked against renewal deadlines, with lapses caught before they happen.",
          "License/certification tracking is continuous and systematic, with full audit-ready documentation always available.",
        ],
        problems: [
          {
            name: "License & Certification Validity Tracking",
            weight: 0.5,
            descs: [
              "No one tracks whether required licenses (food safety, weights & measures, fire NOC, pollution control) are current or expired.",
              "A rough informal awareness exists but isn't actively tracked against expiry dates.",
              "A documented tracking process for license validity exists and is generally maintained.",
              "License validity is actively tracked with renewal reminders ahead of expiry.",
              "License tracking is systematic and automated, with zero-lapse renewal discipline.",
            ],
          },
          {
            name: "Audit-Readiness of Compliance Documentation",
            weight: 0.5,
            descs: [
              "Compliance documentation is scattered or missing - a regulatory inspection would find no organized paper trail.",
              "Some documentation exists informally but isn't organized for quick retrieval.",
              "A documented, organized compliance file exists and is generally kept current.",
              "Audit-readiness is actively verified (mock audits or reviews) on a defined cadence.",
              "Compliance documentation is continuously maintained and instantly retrievable for any regulatory inspection.",
            ],
          },
        ],
      },
      {
        name: "Facility Infrastructure & Upkeep",
        weight: 0.010,
        descs: [
          "No facility maintenance practice exists - structural issues (leaks, drainage, flooring damage) are addressed only when they become severe.",
          "A rough informal maintenance practice exists (fixed \"when someone complains\") but isn't scheduled.",
          "A documented facility maintenance schedule (roof, drainage, flooring, water supply) exists and is generally followed.",
          "Maintenance issues are actively tracked and resolved against a target timeline.",
          "Facility infrastructure is continuously monitored and maintained on a fixed audit schedule, issues resolved proactively before they affect operations.",
        ],
        problems: [
          {
            name: "Structural Maintenance (Roof, Drainage, Flooring)",
            weight: 0.5,
            descs: [
              "Structural issues (roof leaks, poor drainage, damaged flooring) are addressed only reactively, after they've already caused a problem.",
              "A rough informal check happens occasionally, not scheduled.",
              "A documented structural maintenance schedule exists and is generally followed.",
              "Maintenance issues are actively tracked to resolution against a target timeline.",
              "Structural maintenance is proactively scheduled and continuously tracked, issues resolved before they affect operations.",
            ],
          },
          {
            name: "Water Supply & Quality",
            weight: 0.5,
            descs: [
              "Water supply/quality (for washing produce, hygiene) is never checked - its suitability is simply assumed.",
              "A rough informal assumption of adequate water quality exists without any testing.",
              "A documented water quality check process exists and is generally followed on a basic cadence.",
              "Water quality is actively tested against a standard and tracked over time.",
              "Water supply/quality is continuously monitored and tested on a fixed schedule, fully documented.",
            ],
          },
        ],
      },
      {
        name: "Insurance & Business Continuity",
        weight: 0.010,
        descs: [
          "No insurance coverage or business continuity plan exists - a major loss event (fire, flood, prolonged outage) would be an unplanned catastrophe.",
          "Some informal insurance coverage exists but hasn't been reviewed for adequacy; no continuity plan exists.",
          "Documented insurance coverage (goods-in-transit, fire, liability) and a basic business continuity plan exist.",
          "Coverage adequacy and the continuity plan are actively reviewed on a defined cadence and updated.",
          "Insurance coverage and business continuity planning are continuously reviewed and tested, covering the full range of realistic risk scenarios.",
        ],
        problems: [
          {
            name: "Insurance Coverage Adequacy",
            weight: 0.5,
            descs: [
              "No insurance coverage exists for the facility or inventory - any major loss event is a complete financial exposure.",
              "Some coverage exists informally but was never reviewed against actual risk/asset value.",
              "Documented insurance coverage (goods-in-transit, fire, liability) exists and is generally adequate.",
              "Coverage adequacy is actively reviewed on a defined cadence against current asset value and risk.",
              "Coverage is continuously reviewed and adjusted as risk/asset value changes, with no known gaps.",
            ],
          },
          {
            name: "Business Continuity Plan (Beyond Fire)",
            weight: 0.5,
            descs: [
              "No business continuity plan exists beyond (at best) a fire evacuation plan - flood, prolonged power outage, or supply shock have no defined response.",
              "A rough informal plan exists in people's heads for some scenarios, not documented.",
              "A documented business continuity plan covering major risk scenarios (flood, extended outage, supply shock) exists.",
              "The continuity plan is actively tested/reviewed on a defined cadence and updated based on findings.",
              "Business continuity planning is continuously tested (drills, tabletop exercises) and refined across all realistic risk scenarios.",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "People & Training",
    existing: ["A7.1", "A7.2", "A7.3", "A7.4", "A7.5", "A6.10", "A6.11"],
    newSubpoints: [],
  },
  {
    name: "Cost & Scalability",
    existing: ["A6.5", "A6.6", "A6.7", "A6.12", "A6.13"],
    newSubpoints: [
      {
        name: "WMS/Tech System Maturity",
        weight: 0.013,
        descs: [
          "No warehouse management system exists - all inventory/order tracking is manual (paper or basic spreadsheets).",
          "A basic system exists (spreadsheet-based or a simple app) but isn't integrated with other systems and requires heavy manual work.",
          "A documented WMS exists, covers core functions (inventory, picking, dispatch), and is generally used.",
          "WMS usage and data quality are actively tracked, with integration to upstream/downstream systems reviewed and improved.",
          "The WMS is fully integrated, barcode/RFID-enabled, and continuously upgraded based on operational needs.",
        ],
        problems: [
          {
            name: "WMS Functional Coverage",
            weight: 0.5,
            descs: [
              "No WMS exists - inventory and order tracking happen entirely on paper or in disconnected spreadsheets.",
              "A basic system exists but covers only part of the workflow (e.g. inventory but not picking), with manual gaps elsewhere.",
              "A documented WMS covers the core functions (inventory, picking, dispatch) and is generally used.",
              "WMS functional coverage is actively reviewed against operational needs and gaps are closed.",
              "WMS coverage is comprehensive and continuously extended as new operational needs arise.",
            ],
          },
          {
            name: "Barcode/RFID & System Integration",
            weight: 0.5,
            descs: [
              "No barcode/RFID scanning exists anywhere - all identification and tracking is manual and error-prone.",
              "Barcode scanning exists in some areas informally, not consistently deployed or integrated with the WMS.",
              "A documented barcode/RFID deployment exists across key workflow steps and is integrated with the WMS.",
              "Scanning adoption and data accuracy are actively tracked and gaps closed.",
              "Barcode/RFID and system integration are comprehensive and continuously monitored for data accuracy.",
            ],
          },
        ],
      },
    ],
  },
];

const numericCompare = (a, b) => a.localeCompare(b, undefined, { numeric: true });

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);

  const mastersWs = wb.getWorksheet("Masters");
  const problemsWs = wb.getWorksheet("Problems");
  const recoWs = wb.getWorksheet("Recommendations");

  const mastersHeaders = mastersWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());
  const problemsHeaders = problemsWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());
  const recoHeaders = recoWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());
  const col = (headers, name) => headers.indexOf(name) + 1;

  const mCols = {
    moduleId: col(mastersHeaders, "module_id"),
    areaId: col(mastersHeaders, "area_id"),
    areaName: col(mastersHeaders, "area_name"),
    areaWeight: col(mastersHeaders, "area_weight"),
    subpointId: col(mastersHeaders, "subpoint_id"),
    subpointWeight: col(mastersHeaders, "subpoint_weight"),
  };

  // 1. Read all active FNV_WH_V1 Masters rows.
  const masterRows = [];
  mastersWs.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (row.getCell(mCols.moduleId).value !== MODULE_ID) return;
    masterRows.push({
      row,
      area_id: row.getCell(mCols.areaId).value,
      area_weight: Number(row.getCell(mCols.areaWeight).value),
      subpoint_id: row.getCell(mCols.subpointId).value,
      subpoint_weight: Number(row.getCell(mCols.subpointWeight).value),
    });
  });
  const byOldSubpointId = new Map(masterRows.map((r) => [r.subpoint_id, r]));

  // 2. Compute each existing sub-point's GLOBAL weight, rescaled to free room for new
  //    content, then assign new area/subpoint IDs and weights.
  const subpointRename = new Map(); // old subpoint_id -> new subpoint_id
  const newAreaOf = new Map(); // new area_id -> { name, weight }
  const newSubpointWeight = new Map(); // new subpoint_id -> weight (local, within its area)
  const newSubpointsToAdd = []; // { area_id, area_name, area_weight, subpoint_id, subpoint_name, subpoint_weight, descs, problems }

  NEW_AREAS.forEach((cat, catIdx) => {
    const newAreaId = `A${catIdx + 1}`;
    const memberGlobalWeights = []; // { key, isNew, globalWeight, ...extra }

    for (const oldId of cat.existing) {
      const r = byOldSubpointId.get(oldId);
      if (!r) throw new Error(`Missing expected existing sub-point ${oldId}`);
      const globalWeight = r.area_weight * r.subpoint_weight * (1 - NEW_CONTENT_BUDGET);
      memberGlobalWeights.push({ key: oldId, isNew: false, globalWeight });
    }
    for (const sp of cat.newSubpoints) {
      memberGlobalWeights.push({ key: sp.name, isNew: true, globalWeight: sp.weight, sp });
    }

    const newAreaWeight = memberGlobalWeights.reduce((s, m) => s + m.globalWeight, 0);
    newAreaOf.set(newAreaId, { name: cat.name, weight: newAreaWeight });

    memberGlobalWeights.forEach((m, i) => {
      const newSubpointId = `${newAreaId}.${i + 1}`;
      const localWeight = newAreaWeight > 0 ? m.globalWeight / newAreaWeight : 0;
      newSubpointWeight.set(newSubpointId, localWeight);
      if (!m.isNew) {
        subpointRename.set(m.key, newSubpointId);
      } else {
        newSubpointsToAdd.push({
          area_id: newAreaId,
          area_name: cat.name,
          area_weight: newAreaWeight, // patched to final value after all areas computed - see below
          subpoint_id: newSubpointId,
          subpoint_name: m.sp.name,
          subpoint_weight: localWeight,
          descs: m.sp.descs,
          problems: m.sp.problems,
        });
      }
    });
  });

  // 3. Write new area_id/area_name/area_weight/subpoint_id/subpoint_weight onto each
  //    existing Masters row in place.
  for (const r of masterRows) {
    const newSubpointId = subpointRename.get(r.subpoint_id);
    if (!newSubpointId) throw new Error(`Sub-point ${r.subpoint_id} not covered by NEW_AREAS mapping`);
    const newAreaId = newSubpointId.split(".")[0];
    const areaInfo = newAreaOf.get(newAreaId);
    r.row.getCell(mCols.areaId).value = newAreaId;
    r.row.getCell(mCols.areaName).value = areaInfo.name;
    r.row.getCell(mCols.areaWeight).value = areaInfo.weight;
    r.row.getCell(mCols.subpointId).value = newSubpointId;
    r.row.getCell(mCols.subpointWeight).value = newSubpointWeight.get(newSubpointId);
  }

  // 4. Add the 10 new Masters rows (with the now-final area_weight from newAreaOf).
  for (const sp of newSubpointsToAdd) {
    const areaInfo = newAreaOf.get(sp.area_id);
    const record = {
      module_id: MODULE_ID,
      module_name: MODULE_NAME,
      area_id: sp.area_id,
      area_name: sp.area_name,
      area_weight: areaInfo.weight,
      subpoint_id: sp.subpoint_id,
      subpoint_name: sp.subpoint_name,
      subpoint_weight: sp.subpoint_weight,
      score_1_desc: sp.descs[0],
      score_2_desc: sp.descs[1],
      score_3_desc: sp.descs[2],
      score_4_desc: sp.descs[3],
      score_5_desc: sp.descs[4],
      version: 1,
      status: "active",
    };
    mastersWs.addRow(mastersHeaders.map((h) => record[h] ?? ""));
  }

  // 5. Problems sheet: rename subpoint_id + problem_id for existing rows.
  const pCols = {
    moduleId: col(problemsHeaders, "module_id"),
    subpointId: col(problemsHeaders, "subpoint_id"),
    problemId: col(problemsHeaders, "problem_id"),
  };
  const problemRename = new Map();
  problemsWs.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (row.getCell(pCols.moduleId).value !== MODULE_ID) return;
    const oldSubpointId = row.getCell(pCols.subpointId).value;
    const oldProblemId = row.getCell(pCols.problemId).value;
    const newSubpointId = subpointRename.get(oldSubpointId);
    if (!newSubpointId) return;
    const suffix = oldProblemId.slice(oldSubpointId.length);
    const newProblemId = `${newSubpointId}${suffix}`;
    problemRename.set(oldProblemId, newProblemId);
    row.getCell(pCols.subpointId).value = newSubpointId;
    row.getCell(pCols.problemId).value = newProblemId;
  });

  // 6. Recommendations sheet: rename EXISTING rows' subpoint_id column (either an old
  //    subpoint_id or an old problem_id) BEFORE any new rows are added below - critical
  //    ordering, since a freshly-generated new problem_id can coincidentally collide with
  //    an old problem_id string also being renamed in this same pass (e.g. new "A3.4.1"
  //    vs. old "A3.4.1" belonging to an unrelated problem pre-migration). Renaming only
  //    the rows that existed before any addRow() call means a rename can never clobber a
  //    row added afterward.
  const rCols = { moduleId: col(recoHeaders, "module_id"), subpointId: col(recoHeaders, "subpoint_id") };
  let recoRenamed = 0;
  recoWs.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (row.getCell(rCols.moduleId).value !== MODULE_ID) return;
    const key = row.getCell(rCols.subpointId).value;
    const renamed = problemRename.get(key) ?? subpointRename.get(key);
    if (renamed) {
      row.getCell(rCols.subpointId).value = renamed;
      recoRenamed++;
    }
  });

  // 7. Add the 20 new Problems rows + 80 new Recommendations rows.
  let newProblemsAdded = 0;
  let newRecoAdded = 0;
  for (const sp of newSubpointsToAdd) {
    sp.problems.forEach((p, i) => {
      const problemId = `${sp.subpoint_id}.${i + 1}`;
      const record = {
        module_id: MODULE_ID,
        subpoint_id: sp.subpoint_id,
        problem_id: problemId,
        problem_name: p.name,
        problem_weight: p.weight,
        score_1_desc: p.descs[0],
        score_2_desc: p.descs[1],
        score_3_desc: p.descs[2],
        score_4_desc: p.descs[3],
        score_5_desc: p.descs[4],
        version: 1,
        status: "active",
      };
      problemsWs.addRow(problemsHeaders.map((h) => record[h] ?? ""));
      newProblemsAdded++;

      for (const level of TARGET_LEVELS) {
        const recoRecord = {
          module_id: MODULE_ID,
          subpoint_id: problemId,
          subpoint_name: p.name,
          target_level: level,
          target_level_name: TARGET_LEVEL_NAME[level],
          recommended_tasks: tasks(p.name, level, p.descs),
        };
        recoWs.addRow(recoHeaders.map((h) => recoRecord[h] ?? ""));
        newRecoAdded++;
      }
    });
  }

  await wb.xlsx.writeFile(XLSX_PATH);
  console.log(`New areas: ${newAreaOf.size}`);
  console.log(`Existing sub-points renamed: ${subpointRename.size}`);
  console.log(`New sub-points added: ${newSubpointsToAdd.length}`);
  console.log(`Existing problems renamed: ${problemRename.size}`);
  console.log(`New problems added: ${newProblemsAdded}`);
  console.log(`Existing recommendation rows updated: ${recoRenamed}`);
  console.log(`New recommendation rows added: ${newRecoAdded}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
