// One-off content seed: closes the real gaps found comparing our 18-area FnV Warehouse
// Diagnostic against a general "Core WH Flow Ops + Support & Governance" framework the
// user R&D'd. Not a replacement (that framework has zero perishability lens - no cold
// chain, no spoilage, no FEFO - which is why we're keeping our structure) - this is a
// pure additive pass that adopts everything from it we were genuinely missing:
//
//   6 new areas (A19-A24): Outbound Dispatch & Load Management, Picking Productivity,
//   Packing Operations, Warehouse Safety & Compliance, Third-Party Labor & Outsourced
//   Operations Governance, SKU Expansion & Scalability Readiness.
//
//   4 new sub-points added to existing areas: A1.4 Weighment Accuracy & Calibration,
//   A9.3 Handling Steps & Touch Minimization, A16.3 Cross-Utilization & Skill Matrix,
//   A18.3 Labor Cost Ratio & Utility Cost Discipline.
//
// Existing A1-A18 area_weight is rescaled by a flat 0.82 factor (preserves relative
// proportions exactly, frees up 18% of the module's weight for the 6 new areas) - no
// area's *internal* subpoint/problem weights change except the 4 areas gaining a new
// sub-point (A1, A9, A16, A18), which are rebalanced to sum to 1.0 including the addition.
//
// Run once: node scripts/seed-spread-expansion.mjs
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
const EXISTING_AREA_RESCALE = 0.82;

function buildRecommendedTasks(name, targetLevel, descs) {
  return `Move ${name} toward: ${descs[targetLevel - 1]}`;
}

// [subpoint_id, subpoint_name, subpoint_weight, [5 subpoint descs],
//   [ [problem_id, problem_name, problem_weight, [5 problem descs]], ... ] ]
const NEW_AREAS = [
  [
    "A19",
    "Outbound Dispatch & Load Management",
    0.045,
    [
      [
        "A19.1",
        "Load Plan Accuracy & Dispatch Sequencing",
        0.5,
        [
          "No load planning exists - vehicles are loaded with whatever's staged and in whatever order, with no check against the order/vehicle fill plan.",
          "A rough informal load practice exists (experienced loaders 'know how to pack a truck') but isn't documented or checked against a plan.",
          "A documented load-plan process (vehicle fill vs order, dispatch sequencing by priority/FEFO/route) exists and is generally followed.",
          "Load plan accuracy and sequencing adherence are actively tracked, with deviations investigated.",
          "Load planning is system-generated and continuously optimized against vehicle fill, FEFO, and route data in real time.",
        ],
        [
          [
            "A19.1.1",
            "Load Plan vs Order Accuracy",
            0.5,
            [
              "Loaded quantity/mix is never checked against the actual order - discrepancies are only discovered on delivery.",
              "A rough visual check happens informally before dispatch but isn't systematic or recorded.",
              "A documented load-vs-order verification step exists before dispatch and is generally followed.",
              "Load accuracy is actively tracked as a KPI, with discrepancy root causes investigated.",
              "Load-vs-order verification is system-assisted (scan-based) and near-100% accurate, continuously monitored.",
            ],
          ],
          [
            "A19.1.2",
            "Dispatch Sequencing Logic",
            0.5,
            [
              "No sequencing logic exists for dispatch - vehicles/orders go out in whatever order they happen to be staged.",
              "A rough informal priority exists (urgent orders 'get pushed forward') but isn't documented.",
              "A documented dispatch sequencing logic (priority, FEFO, or route-based) exists and is generally followed.",
              "Sequencing adherence is actively tracked and reviewed for on-time performance impact.",
              "Dispatch sequencing is system-optimized in real time across priority, FEFO, and route constraints together.",
            ],
          ],
        ],
      ],
      [
        "A19.2",
        "Outbound Documentation & Dock Turnaround",
        0.5,
        [
          "Outbound documentation and weighment are inconsistent or missing, and dock turnaround time for departing vehicles is never measured.",
          "A rough informal documentation practice exists but isn't standardized; dock turnaround is noticed only when it's unusually bad.",
          "A documented outbound documentation/weighment process exists and dock turnaround is tracked on a basic level.",
          "Outbound documentation accuracy and dock turnaround are actively tracked against targets, with delays investigated.",
          "Outbound documentation is fully digitized and dock turnaround is continuously monitored and optimized as a KPI.",
        ],
        [
          [
            "A19.2.1",
            "Outbound Weighment & Documentation Accuracy",
            0.5,
            [
              "No outbound weighment or documentation discipline exists - vehicles leave without a verified weight or paperwork check.",
              "A rough informal check happens for some dispatches but isn't consistent or recorded.",
              "A documented outbound weighment and documentation process exists and is generally followed.",
              "Weighment/documentation accuracy is actively audited, with gaps corrected.",
              "Outbound weighment and documentation are system-captured and verified automatically before a vehicle is released.",
            ],
          ],
          [
            "A19.2.2",
            "Outbound Dock Turnaround Time",
            0.5,
            [
              "Dock turnaround time for outbound vehicles is never measured - there's no visibility into how long loading/departure actually takes.",
              "Turnaround is estimated informally ('trucks usually leave by evening') without real measurement.",
              "A documented process tracks outbound dock turnaround time on a basic level.",
              "Turnaround time is actively tracked against a target and chronic delays are investigated.",
              "Outbound dock turnaround is tracked in real time and continuously optimized as a throughput KPI.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A20",
    "Picking Productivity",
    0.03,
    [
      [
        "A20.1",
        "Pick Path Efficiency & Tooling",
        0.5,
        [
          "No thought given to pick paths or tooling - pickers walk however the layout happens to allow, with no purpose-fit cart or tooling.",
          "A rough informal path/tooling practice exists (pickers develop their own habits) but isn't designed or standardized.",
          "A documented pick path design and tooling standard exists and is generally followed.",
          "Pick path efficiency and tooling fitness are actively measured (time/unit, distance walked) and refined.",
          "Pick paths and tooling are continuously optimized using real picking data, re-evaluated as layout or SKU mix changes.",
        ],
        [
          [
            "A20.1.1",
            "Pick Path Design",
            0.5,
            [
              "No designed pick path exists - pickers navigate the floor ad hoc, often backtracking and covering unnecessary distance.",
              "A rough informal path exists based on picker habit, not deliberately designed.",
              "A documented pick path design exists (by zone or SKU velocity) and is generally followed.",
              "Pick path efficiency is actively measured (distance/time per pick) and refined based on findings.",
              "Pick paths are system-generated and continuously optimized against real-time order mix and SKU velocity.",
            ],
          ],
          [
            "A20.1.2",
            "Pick Cart/Tooling Fitness",
            0.5,
            [
              "Pickers use whatever container/cart is on hand - no purpose-fit picking tool exists for the produce being handled.",
              "Some informal tooling choices exist (certain carts 'work better') but aren't standardized or deliberately designed.",
              "A documented picking tool/cart standard exists, fit for the produce type and order profile, and is generally used.",
              "Tooling fitness is actively reviewed against picker feedback and productivity data.",
              "Picking tools/carts are purpose-designed and continuously refined based on productivity and ergonomic data.",
            ],
          ],
        ],
      ],
      [
        "A20.2",
        "Zone Picking & Crate Tagging",
        0.5,
        [
          "No zone picking discipline exists - any picker can be assigned to any zone with no crate/tote tagging to track what's been picked.",
          "A rough informal zone assignment exists but isn't consistently enforced; tagging is inconsistent.",
          "A documented zone picking and crate/tote tagging process exists and is generally followed.",
          "Zone picking adherence and tagging accuracy are actively tracked and deviations corrected.",
          "Zone picking and crate/tote tagging are system-enforced (scan-based) and continuously monitored for accuracy.",
        ],
        [
          [
            "A20.2.1",
            "Zone Picking Discipline",
            0.5,
            [
              "No zone-based picking discipline exists - pickers roam the entire floor for every order, with no assigned coverage area.",
              "A rough informal zone split exists but isn't consistently enforced.",
              "A documented zone picking process exists (pickers assigned defined zones) and is generally followed.",
              "Zone adherence is actively tracked and rebalanced based on order volume by zone.",
              "Zone picking is system-assigned and dynamically rebalanced in real time against order volume.",
            ],
          ],
          [
            "A20.2.2",
            "Crate/Tote Tagging Accuracy",
            0.5,
            [
              "Crates/totes aren't tagged or tracked at all - there's no way to know which order a given container belongs to mid-pick.",
              "Tagging happens informally (handwritten labels) and is error-prone.",
              "A documented crate/tote tagging process exists and is generally followed.",
              "Tagging accuracy is actively audited and errors traced to root cause.",
              "Crate/tote tagging is barcode/RFID-based and verified automatically at each handoff point.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A21",
    "Packing Operations",
    0.025,
    [
      [
        "A21.1",
        "Pack Station Layout & Ergonomics",
        0.5,
        [
          "Pack stations have no deliberate layout - packers work at whatever surface is available, with no ergonomic or workflow consideration.",
          "A rough informal pack station setup exists but wasn't deliberately designed for workflow or ergonomics.",
          "A documented pack station layout standard exists (workflow, reach, ergonomics) and is generally followed.",
          "Pack station effectiveness is actively reviewed (throughput, packer fatigue/injury reports) and refined.",
          "Pack station layout is continuously optimized using throughput and ergonomic data, re-evaluated as volume changes.",
        ],
        [
          [
            "A21.1.1",
            "Pack Station Layout & Workflow",
            0.5,
            [
              "No deliberate pack station layout exists - packing happens wherever space allows, with materials and orders arriving in no particular flow.",
              "A rough informal layout exists but wasn't deliberately designed for workflow.",
              "A documented pack station layout (material flow, packer positioning) exists and is generally followed.",
              "Layout effectiveness is actively measured (throughput per station) and refined.",
              "Pack station layout is continuously optimized against throughput data as volume and SKU mix evolve.",
            ],
          ],
          [
            "A21.1.2",
            "Packer Ergonomics & Fatigue Management",
            0.5,
            [
              "No attention is paid to packer ergonomics or fatigue - stations aren't designed for repetitive-motion safety, and no fatigue monitoring exists.",
              "Some informal awareness exists (packers rotate 'when it feels needed') without a defined practice.",
              "A documented ergonomics/fatigue management practice (rotation, station height, rest breaks) exists and is generally followed.",
              "Ergonomics/fatigue practices are actively reviewed against injury/strain reports and refined.",
              "Ergonomics and fatigue management are continuously monitored and proactively adjusted using real injury/strain data.",
            ],
          ],
        ],
      ],
      [
        "A21.2",
        "Packaging Material Right-Sizing & Pre-Dispatch QC",
        0.5,
        [
          "Packaging material is one-size-fits-all with no right-sizing logic, and no quality check happens on a pack before it leaves the station.",
          "Some informal material choices exist per order type, and a quick visual check happens sometimes, but neither is standardized.",
          "A documented packaging right-sizing guide and pre-dispatch pack QC step exist and are generally followed.",
          "Right-sizing and pre-dispatch QC are actively tracked (material cost, pack failure rate) and refined.",
          "Packaging right-sizing is system-guided per order, and pre-dispatch QC is systematic with failure data continuously tracked.",
        ],
        [
          [
            "A21.2.1",
            "Packaging Material Right-Sizing",
            0.5,
            [
              "The same packaging is used regardless of order size or produce type, driving unnecessary material cost and/or inadequate protection.",
              "Some informal material choices exist per order type but aren't a defined guide.",
              "A documented packaging right-sizing guide (by order size/produce type) exists and is generally followed.",
              "Right-sizing is actively tracked for material cost and pack integrity, refined based on findings.",
              "Packaging right-sizing is system-guided per order at pack time, continuously optimized for cost and protection.",
            ],
          ],
          [
            "A21.2.2",
            "Pre-Dispatch Pack QC",
            0.5,
            [
              "No quality check happens on a completed pack before dispatch - the first inspection is the customer's, on delivery.",
              "A quick informal visual check happens sometimes, inconsistently, before a pack ships.",
              "A documented pre-dispatch pack QC step exists and is generally applied.",
              "Pre-dispatch QC pass/fail rates are actively tracked and failure causes investigated.",
              "Pre-dispatch pack QC is systematic (checklist or scan-verified) with failure data continuously tracked and fed back to packing.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A22",
    "Warehouse Safety & Compliance",
    0.035,
    [
      [
        "A22.1",
        "MHE Safety & Racking Audits",
        0.5,
        [
          "No safety protocol exists for material handling equipment (forklifts, pallet trucks) or racking - operation and load limits are whatever operators assume.",
          "A rough informal safety practice exists (experienced operators 'know the rules') but isn't documented or audited.",
          "A documented MHE safety protocol and racking load/inspection audit process exist and are generally followed.",
          "MHE safety and racking audit compliance are actively tracked, with violations/deficiencies corrected on a defined timeline.",
          "MHE safety and racking integrity are continuously monitored and audited on a fixed schedule, fully documented and closed-loop.",
        ],
        [
          [
            "A22.1.1",
            "MHE (Forklift/Pallet Truck) Safety Protocol",
            0.5,
            [
              "No safety protocol governs forklift/pallet truck operation - anyone can operate equipment with no training or certification check.",
              "A rough informal practice exists (senior staff show newer staff) but isn't documented or certified.",
              "A documented MHE safety protocol (certified operators, speed limits, pedestrian separation) exists and is generally followed.",
              "MHE safety compliance is actively audited, with violations tracked and corrected.",
              "MHE safety is continuously enforced and audited, with operator certification tracked and renewed on schedule.",
            ],
          ],
          [
            "A22.1.2",
            "Racking Load & Inspection Audits",
            0.5,
            [
              "Racking is never inspected or load-checked - overloading and structural damage would go unnoticed until failure.",
              "A rough informal visual check happens occasionally but isn't scheduled or documented.",
              "A documented racking load limit and inspection audit process exists and is generally followed on a defined cadence.",
              "Racking audit findings are actively tracked to closure, with damaged racking taken out of service.",
              "Racking is inspected on a fixed audit schedule with full documentation, load limits enforced and continuously verified.",
            ],
          ],
        ],
      ],
      [
        "A22.2",
        "Fire/Emergency Preparedness & Incident Reporting",
        0.5,
        [
          "No fire/emergency preparedness exists - no evacuation plan, no fire equipment checks, and incidents/near-misses go unreported.",
          "A rough informal awareness exists (fire extinguishers are 'somewhere') but no defined plan or reporting process.",
          "A documented fire/emergency preparedness plan and incident/near-miss reporting process exist and are generally followed.",
          "Preparedness drills and incident reports are actively tracked, with corrective actions followed through.",
          "Fire/emergency preparedness is drilled and audited on a fixed schedule, with incident/near-miss reporting systematic and analyzed for trends.",
        ],
        [
          [
            "A22.2.1",
            "Fire & Emergency Preparedness",
            0.5,
            [
              "No fire or emergency preparedness plan exists - no evacuation routes, no fire equipment checks, nothing documented.",
              "A rough informal plan exists (staff 'know where the exits are') but isn't documented or drilled.",
              "A documented fire/emergency preparedness plan (evacuation routes, equipment checks) exists and is generally followed.",
              "Preparedness is actively drilled and reviewed on a defined cadence, with gaps corrected.",
              "Fire/emergency preparedness is drilled and audited on a fixed schedule, fully documented and continuously improved.",
            ],
          ],
          [
            "A22.2.2",
            "Incident/Near-Miss Reporting",
            0.5,
            [
              "Incidents and near-misses are never reported or recorded - problems are only visible once someone is actually hurt.",
              "Reporting happens informally and inconsistently, often only for serious incidents.",
              "A documented incident/near-miss reporting process exists and is generally used.",
              "Reported incidents/near-misses are actively analyzed for root cause and trend, with corrective actions tracked.",
              "Incident/near-miss reporting is systematic and analyzed continuously, directly driving safety process changes.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A23",
    "Third-Party Labor & Outsourced Operations Governance",
    0.025,
    [
      [
        "A23.1",
        "3PL SLA & Quality Parity",
        0.5,
        [
          "No SLA exists for outsourced/3PL-manned floor work, and its quality/output is never compared against in-house performance.",
          "A rough informal expectation exists but isn't documented as an SLA or checked against in-house parity.",
          "A documented SLA for outsourced floor work exists and quality parity vs in-house is checked on a basic level.",
          "SLA performance and quality parity are actively tracked and reviewed with the 3PL provider.",
          "SLA performance and quality parity are tracked continuously and directly inform 3PL contract/renewal decisions.",
        ],
        [
          [
            "A23.1.1",
            "SLA Definition for Outsourced Floor Work",
            0.5,
            [
              "No SLA is defined for outsourced/3PL floor work - expectations (speed, accuracy, safety) are never written down or agreed.",
              "A rough informal expectation exists verbally but isn't a documented SLA.",
              "A documented SLA (speed, accuracy, safety expectations) exists for outsourced floor work and is generally referenced.",
              "SLA performance is actively tracked against the defined terms and reviewed with the provider.",
              "SLA performance is tracked continuously and directly informs 3PL scorecards and contract decisions.",
            ],
          ],
          [
            "A23.1.2",
            "Quality Parity vs In-House",
            0.5,
            [
              "Outsourced/3PL work quality is never compared against in-house performance - there's no way to know if outsourcing is a net quality loss.",
              "A rough informal impression exists ('the 3PL team seems fine') without any actual comparison.",
              "A documented process compares 3PL vs in-house quality metrics on a basic level.",
              "Quality parity is actively tracked and reviewed, with gaps addressed through retraining or SLA renegotiation.",
              "Quality parity between 3PL and in-house is tracked continuously and directly drives sourcing/staffing mix decisions.",
            ],
          ],
        ],
      ],
      [
        "A23.2",
        "Contractor Compliance",
        0.5,
        [
          "Contractor labor-law and safety compliance is never checked - whether the 3PL is actually compliant is simply unknown.",
          "A rough informal assumption of compliance exists without any verification.",
          "A documented contractor compliance check (labor law, safety pass-through) exists and is generally applied.",
          "Contractor compliance is actively audited on a defined cadence, with gaps escalated.",
          "Contractor compliance is continuously verified and documented, integrated into onboarding and ongoing performance tracking.",
        ],
        [
          [
            "A23.2.1",
            "Labor-Law & Safety Compliance Pass-Through",
            0.5,
            [
              "No verification exists that the labor contractor/3PL is compliant with labor law or safety requirements - it's simply assumed.",
              "A rough informal assumption of compliance exists without documentation or verification.",
              "A documented compliance check (labor law, safety pass-through) exists and is generally applied to contractors.",
              "Compliance is actively audited on a defined cadence, with non-compliance escalated.",
              "Contractor compliance is continuously verified and documented, with audit trails available on demand.",
            ],
          ],
          [
            "A23.2.2",
            "Contractor Onboarding & Performance Tracking",
            0.5,
            [
              "Contract labor is onboarded with no process and no performance tracking - individuals are simply put to work.",
              "A rough informal onboarding happens but isn't documented, and performance isn't tracked per contractor.",
              "A documented contractor onboarding and basic performance tracking process exists and is generally followed.",
              "Contractor performance is actively tracked and reviewed, feeding into retention/replacement decisions.",
              "Contractor onboarding and performance are systematically tracked and integrated with the 3PL SLA scorecard.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A24",
    "SKU Expansion & Scalability Readiness",
    0.02,
    [
      [
        "A24.1",
        "Layout & Racking Scalability",
        0.5,
        [
          "The facility layout/racking has no headroom for SKU growth - adding SKUs means improvising space with no plan.",
          "Some informal awareness exists that space is tight, without any assessment of actual scalability.",
          "A documented assessment of layout/racking headroom for SKU growth exists and is referenced when planning expansion.",
          "Layout/racking scalability is actively reviewed against growth forecasts and gaps are planned for.",
          "Layout/racking scalability is continuously assessed against SKU growth forecasts, with expansion plans in place ahead of need.",
        ],
        [
          [
            "A24.1.1",
            "Racking/Layout Headroom for SKU Growth",
            0.5,
            [
              "No assessment exists of how much SKU growth the current layout/racking can absorb before it breaks down.",
              "A rough informal sense exists ('we're getting full') without any actual headroom assessment.",
              "A documented headroom assessment exists and is referenced when planning new SKU intake.",
              "Headroom is actively tracked against actual SKU growth and reviewed for when expansion is needed.",
              "Headroom is continuously modeled against growth forecasts, with expansion triggered proactively before capacity is hit.",
            ],
          ],
          [
            "A24.1.2",
            "Slotting Re-Optimization Cadence",
            0.5,
            [
              "Slotting is never re-optimized as SKU count grows - the original layout just gets more crowded and less efficient over time.",
              "Re-slotting happens informally and rarely, usually only when things become unworkable.",
              "A documented slotting re-optimization cadence exists and is generally followed as SKU count changes.",
              "Re-optimization outcomes are actively tracked (pick efficiency before/after) and the cadence refined.",
              "Slotting is continuously re-optimized using real velocity/SKU-growth data rather than a fixed calendar cadence.",
            ],
          ],
        ],
      ],
      [
        "A24.2",
        "Process Scalability for SKU Growth",
        0.5,
        [
          "Operating processes (receiving, put-away, picking) have never been assessed for whether they hold up as SKU count grows.",
          "Some informal awareness exists that processes 'feel strained' at times, without a real scalability assessment.",
          "A documented process scalability assessment exists and is referenced when SKU count changes materially.",
          "Process scalability is actively reviewed against growth milestones, with bottlenecks addressed proactively.",
          "Process and systems scalability are continuously assessed against SKU growth, with capacity investments planned ahead of need.",
        ],
        [
          [
            "A24.2.1",
            "Process Scalability Assessment",
            0.5,
            [
              "No assessment exists of whether core processes (receiving, put-away, picking) can handle SKU growth - it's discovered by them breaking.",
              "A rough informal sense exists that processes are strained, without a structured assessment.",
              "A documented process scalability assessment exists and is referenced when planning for SKU growth.",
              "Process scalability is actively reviewed against growth milestones, with bottlenecks flagged proactively.",
              "Process scalability is continuously assessed against growth forecasts, with capacity investments planned ahead of need.",
            ],
          ],
          [
            "A24.2.2",
            "Systems/Tech Scalability for SKU Growth",
            0.5,
            [
              "The systems/tech stack (WMS or equivalent) has no assessed ceiling for SKU count - growth just happens until something breaks.",
              "A rough informal awareness exists that the system might struggle at scale, without any real assessment.",
              "A documented systems/tech scalability assessment exists and is referenced when planning for SKU growth.",
              "Systems scalability is actively reviewed against growth milestones, with upgrade needs flagged proactively.",
              "Systems/tech scalability is continuously assessed against growth forecasts, with upgrades planned ahead of need.",
            ],
          ],
        ],
      ],
    ],
  ],
];

// New sub-points added to existing areas. [area_id, subpoint_id, subpoint_name, [5 descs],
//   [ [problem_id, problem_name, problem_weight, [5 descs]], ... ] ]
// area_id here is used only to locate existing rows to rebalance subpoint_weight within;
// area_name/area_weight for the new row are read from an existing row of that area.
const NEW_SUBPOINTS = [
  [
    "A1",
    "A1.4",
    "Weighment Accuracy & Calibration",
    0.2,
    [
      "Weighing equipment is never calibrated and weighment accuracy is never verified - inbound weights are trusted without question.",
      "A rough informal calibration happens occasionally (someone remembers to check) but isn't scheduled or documented.",
      "A documented weighing equipment calibration schedule and weighment accuracy verification process exist and are generally followed.",
      "Calibration compliance and weighment accuracy are actively tracked, with deviations investigated.",
      "Weighing equipment is calibrated on a fixed audit schedule with full documentation, and weighment accuracy is continuously verified.",
    ],
    [
      [
        "A1.4.1",
        "Weighing Equipment Calibration",
        0.5,
        [
          "Weighing equipment is never calibrated - it's used as-is indefinitely with no check against a reference standard.",
          "Calibration happens informally and irregularly, whenever someone happens to think of it.",
          "A documented calibration schedule exists and is generally followed.",
          "Calibration compliance is actively tracked against the schedule, with overdue equipment flagged.",
          "Calibration is tracked on a fixed audit schedule with full documentation and traceability to a reference standard.",
        ],
      ],
      [
        "A1.4.2",
        "Weighment Accuracy Verification",
        0.5,
        [
          "Weighment accuracy is never verified - there's no spot-check or cross-check process for inbound weights.",
          "A rough informal spot-check happens occasionally but isn't systematic or recorded.",
          "A documented weighment accuracy verification process (spot-checks, reference weights) exists and is generally followed.",
          "Verification results are actively tracked and discrepancies investigated for equipment or process cause.",
          "Weighment accuracy is continuously verified (system-flagged variance checks) with discrepancies auto-routed for investigation.",
        ],
      ],
    ],
  ],
  [
    "A9",
    "A9.3",
    "Handling Steps & Touch Minimization",
    0.2,
    [
      "The number of times a unit is touched between receipt and pick is never measured - handling steps accumulate with no attempt to minimize them.",
      "Some informal awareness exists that 'there's a lot of handling' without any actual touch-count measurement.",
      "A documented touch-count measurement exists for the receipt-to-pick flow and is referenced periodically.",
      "Touch count is actively tracked and reduction initiatives are run based on findings.",
      "Touch count is continuously measured and minimized as a standing efficiency KPI, re-evaluated whenever flow or layout changes.",
    ],
    [
      [
        "A9.3.1",
        "Touch-Count Measurement",
        0.5,
        [
          "No measurement exists of how many times a unit is handled between receipt and pick - the number could be anything.",
          "A rough informal estimate exists ('it gets touched a few times') without real measurement.",
          "A documented touch-count measurement for the receipt-to-pick flow exists and is checked periodically.",
          "Touch count is actively tracked as a KPI and reviewed for reduction opportunities.",
          "Touch count is measured continuously and tracked as a standing efficiency KPI across the flow.",
        ],
      ],
      [
        "A9.3.2",
        "Touch Reduction Initiatives",
        0.5,
        [
          "No initiative has ever targeted reducing handling touches - the flow simply accumulates whatever steps it happens to have.",
          "A touch-reduction idea comes up occasionally and informally, but nothing structured is done about it.",
          "A documented touch-reduction initiative process exists and is generally used when flow changes are considered.",
          "Touch-reduction initiatives are actively tracked for impact (before/after touch count) and iterated on.",
          "Touch reduction is a continuous improvement discipline, with initiatives tracked, measured, and iterated systematically.",
        ],
      ],
    ],
  ],
  [
    "A16",
    "A16.3",
    "Cross-Utilization & Skill Matrix",
    0.2,
    [
      "Staff are single-skilled with no cross-utilization - if one process is short-staffed, no one else on the floor can step in.",
      "Some informal cross-utilization happens (a supervisor pulls someone over) but isn't planned or tracked.",
      "A documented skill/training matrix and cross-utilization plan exist and are generally used to allocate staff across processes.",
      "Cross-utilization and the skill matrix are actively reviewed and updated as staff gain new skills.",
      "Cross-utilization is systematically planned using a live skill matrix, with staff deployed dynamically across processes by need.",
    ],
    [
      [
        "A16.3.1",
        "Cross-Utilization Practice",
        0.5,
        [
          "No cross-utilization exists - each staff member works only one process and can't be redeployed when another process is short-staffed.",
          "Cross-utilization happens informally and ad hoc, whenever a supervisor decides to pull someone over.",
          "A documented cross-utilization plan exists (which staff can cover which processes) and is generally used.",
          "Cross-utilization effectiveness is actively tracked (coverage gaps closed, throughput impact) and refined.",
          "Cross-utilization is dynamically planned using a live skill matrix, with staff redeployed by real-time process-speed need.",
        ],
      ],
      [
        "A16.3.2",
        "Skill/Training Matrix Maintenance",
        0.5,
        [
          "No skill/training matrix exists - there's no record of which staff are trained/competent on which processes.",
          "A rough informal sense exists in supervisors' heads of who can do what, not documented anywhere.",
          "A documented skill/training matrix exists and is generally kept up to date.",
          "The skill matrix is actively reviewed and updated as staff complete new training, used to plan cross-utilization.",
          "The skill matrix is maintained continuously and directly drives cross-utilization and shift-planning decisions.",
        ],
      ],
    ],
  ],
  [
    "A18",
    "A18.3",
    "Labor Cost Ratio & Utility Cost Discipline",
    0.2,
    [
      "Labor cost as a percentage of throughput value and energy/utility costs are never tracked - overall cost is known only at a lump-sum level, if at all.",
      "Some informal cost awareness exists ('labor is our biggest expense') without either figure actually being tracked.",
      "A documented process tracks labor cost as % of throughput value and energy/utility cost on a basic level.",
      "Both ratios are actively tracked against targets/benchmarks and reviewed for cost-reduction opportunities.",
      "Labor cost ratio and utility cost are tracked continuously and directly inform staffing and facility investment decisions.",
        ],
    [
      [
        "A18.3.1",
        "Labor Cost as % of Throughput Value",
        0.5,
        [
          "Labor cost is never expressed as a ratio to throughput value - it's known only as a lump sum, disconnected from output.",
          "A rough informal estimate exists without an actual calculated ratio.",
          "A documented process calculates labor cost as % of throughput value on a basic (e.g. monthly) cadence.",
          "The ratio is actively tracked against a target/benchmark and reviewed for efficiency opportunities.",
          "Labor cost ratio is tracked continuously and directly informs staffing and productivity investment decisions.",
        ],
      ],
      [
        "A18.3.2",
        "Energy/Utility Cost Discipline",
        0.5,
        [
          "Energy/utility costs (refrigeration, lighting, equipment) are never tracked separately or reviewed for efficiency.",
          "A rough informal awareness exists ('the electricity bill is high') without any structured tracking.",
          "A documented process tracks energy/utility cost on a basic cadence and is reviewed periodically.",
          "Energy/utility cost is actively tracked against a target/benchmark and efficiency initiatives are run based on findings.",
          "Energy/utility cost is tracked continuously and directly informs facility investment and efficiency decisions.",
        ],
      ],
    ],
  ],
];

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);

  const mastersWs = wb.getWorksheet("Masters");
  const problemsWs = wb.getWorksheet("Problems");
  const recoWs = wb.getWorksheet("Recommendations");

  const mastersHeaders = mastersWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());
  const problemsHeaders = problemsWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());
  const recoHeaders = recoWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());

  const areaWeightCol = mastersHeaders.indexOf("area_weight") + 1;
  const areaIdCol = mastersHeaders.indexOf("area_id") + 1;
  const moduleIdCol = mastersHeaders.indexOf("module_id") + 1;
  const subpointIdCol = mastersHeaders.indexOf("subpoint_id") + 1;
  const subpointWeightCol = mastersHeaders.indexOf("subpoint_weight") + 1;

  // 1. Rescale all existing A1-A18 area_weight by a flat 0.82 factor.
  let rescaledAreas = 0;
  mastersWs.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (row.getCell(moduleIdCol).value !== MODULE_ID) return;
    const current = Number(row.getCell(areaWeightCol).value);
    row.getCell(areaWeightCol).value = current * EXISTING_AREA_RESCALE;
    rescaledAreas++;
  });

  // 2. Rebalance subpoint_weight for the 4 areas gaining a new sub-point:
  //    existing subpoint weights * (1 - newWeight), new sub-point gets newWeight.
  for (const [areaId, , , newWeight] of NEW_SUBPOINTS) {
    const factor = 1 - newWeight;
    mastersWs.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (row.getCell(moduleIdCol).value !== MODULE_ID) return;
      if (row.getCell(areaIdCol).value !== areaId) return;
      const current = Number(row.getCell(subpointWeightCol).value);
      row.getCell(subpointWeightCol).value = current * factor;
    });
  }

  // 3. Add the 4 new sub-points (Masters rows) + their problems + recommendations.
  let mastersAdded = 0;
  let problemsAdded = 0;
  let recoAdded = 0;
  for (const [areaId, subId, subName, subWeight, subDescs, problems] of NEW_SUBPOINTS) {
    let areaName = "";
    mastersWs.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || areaName) return;
      if (row.getCell(moduleIdCol).value === MODULE_ID && row.getCell(areaIdCol).value === areaId) {
        areaName = row.getCell(mastersHeaders.indexOf("area_name") + 1).value;
      }
    });
    const areaWeight = (() => {
      let w;
      mastersWs.eachRow((row, rowNumber) => {
        if (rowNumber === 1 || w !== undefined) return;
        if (row.getCell(moduleIdCol).value === MODULE_ID && row.getCell(areaIdCol).value === areaId) {
          w = row.getCell(areaWeightCol).value;
        }
      });
      return w;
    })();

    const masterRecord = {
      module_id: MODULE_ID,
      module_name: MODULE_NAME,
      area_id: areaId,
      area_name: areaName,
      area_weight: areaWeight,
      subpoint_id: subId,
      subpoint_name: subName,
      subpoint_weight: subWeight,
      score_1_desc: subDescs[0],
      score_2_desc: subDescs[1],
      score_3_desc: subDescs[2],
      score_4_desc: subDescs[3],
      score_5_desc: subDescs[4],
      version: 1,
      status: "active",
    };
    mastersWs.addRow(mastersHeaders.map((h) => masterRecord[h] ?? ""));
    mastersAdded++;

    for (const [problemId, problemName, problemWeight, descs] of problems) {
      const problemRecord = {
        module_id: MODULE_ID,
        subpoint_id: subId,
        problem_id: problemId,
        problem_name: problemName,
        problem_weight: problemWeight,
        score_1_desc: descs[0],
        score_2_desc: descs[1],
        score_3_desc: descs[2],
        score_4_desc: descs[3],
        score_5_desc: descs[4],
        version: 1,
        status: "active",
      };
      problemsWs.addRow(problemsHeaders.map((h) => problemRecord[h] ?? ""));
      problemsAdded++;

      for (const targetLevel of TARGET_LEVELS) {
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

  // 4. Add the 6 new areas (A19-A24), each with 2 sub-points and their problems/recos.
  for (const [areaId, areaName, areaWeight, subpoints] of NEW_AREAS) {
    for (const [subId, subName, subWeight, subDescs, problems] of subpoints) {
      const masterRecord = {
        module_id: MODULE_ID,
        module_name: MODULE_NAME,
        area_id: areaId,
        area_name: areaName,
        area_weight: areaWeight,
        subpoint_id: subId,
        subpoint_name: subName,
        subpoint_weight: subWeight,
        score_1_desc: subDescs[0],
        score_2_desc: subDescs[1],
        score_3_desc: subDescs[2],
        score_4_desc: subDescs[3],
        score_5_desc: subDescs[4],
        version: 1,
        status: "active",
      };
      mastersWs.addRow(mastersHeaders.map((h) => masterRecord[h] ?? ""));
      mastersAdded++;

      for (const [problemId, problemName, problemWeight, descs] of problems) {
        const problemRecord = {
          module_id: MODULE_ID,
          subpoint_id: subId,
          problem_id: problemId,
          problem_name: problemName,
          problem_weight: problemWeight,
          score_1_desc: descs[0],
          score_2_desc: descs[1],
          score_3_desc: descs[2],
          score_4_desc: descs[3],
          score_5_desc: descs[4],
          version: 1,
          status: "active",
        };
        problemsWs.addRow(problemsHeaders.map((h) => problemRecord[h] ?? ""));
        problemsAdded++;

        for (const targetLevel of TARGET_LEVELS) {
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
  }

  await wb.xlsx.writeFile(XLSX_PATH);
  console.log(`Rescaled area_weight (x${EXISTING_AREA_RESCALE}) on ${rescaledAreas} existing A1-A18 Masters rows.`);
  console.log(`Rebalanced subpoint_weight in 4 areas gaining a new sub-point (A1, A9, A16, A18).`);
  console.log(`Added ${mastersAdded} new Masters rows (4 new sub-points + 6 new areas x 2 sub-points).`);
  console.log(`Added ${problemsAdded} new Problems rows.`);
  console.log(`Added ${recoAdded} new Recommendations rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
