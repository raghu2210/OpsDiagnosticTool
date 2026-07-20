// One-off content seed: adds 11 new areas (A8-A18) to the FnV diagnostic, per the
// "incorporate the Fresh Operating System framework" discussion - Vendor & Collection
// Center Ops, Warehouse Flow & Layout, Rejection Handling, Returns Management, Complaints
// Management, Control Tower, Market Intelligence & Benchmarking, Training Plan, People/
// Workforce, Metrics & Visibility, Cost Diagnostics. Each area gets 2 sub-points (Node 3,
// with their own 5-level descriptions), each sub-point gets 2 problem statements (Node 4).
//
// Also REBALANCES the existing A1-A7 area_weight values (previously summing to 1.0 alone)
// down to sum to 0.55, so the new 11 areas (summing to 0.45) fit into one coherent 1.0
// module-level weighting - existing sub-point/problem weights within each area are
// untouched, only the area_weight column changes for A1-A7's rows.
//
// Run once: node scripts/seed-a8-a18-areas.mjs
// Then regenerate the JSON fallback as usual: node scripts/generate-fallback-json.mjs
import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, "../../sample_data/LongArc_Masters.xlsx");

const MODULE_ID = "FNV_WH_V1";
const MODULE_NAME = "FnV Warehouse Diagnostic - Quick Commerce";

// Rebalanced weights for the existing 7 areas (same relative proportions, scaled to 0.55).
const REBALANCED_AREA_WEIGHTS = {
  A1: 0.09,
  A2: 0.09,
  A3: 0.06,
  A4: 0.09,
  A5: 0.08,
  A6: 0.06,
  A7: 0.08,
};

const TARGET_LEVEL_NAME = { 2: "Basic", 3: "Standardized", 4: "Managed", 5: "Best-in-class" };

// [area_id, area_name, area_weight, [ [subpoint_id, subpoint_name, subpoint_weight, [5 subpoint descs],
//     [ [problem_id, problem_name, problem_weight, [5 problem descs]], ... ] ] ] ]
const AREAS = [
  [
    "A8",
    "Vendor & Collection Center Operations",
    0.06,
    [
      [
        "A8.1",
        "Collection Center Handling",
        0.5,
        [
          "No defined process at collection centers - produce is aggregated from farmers/vendors with no receiving discipline or condition checks before onward transit.",
          "A basic CC receiving practice exists informally but varies by center and staff, with minimal documentation.",
          "A documented CC receiving and staging SOP exists and is generally followed across centers.",
          "CC handling is actively monitored against the SOP, with condition-at-CC data tracked and deviations corrected.",
          "CC operations are standardized and digitally monitored across all centers, with condition data feeding directly into downstream quality decisions.",
        ],
        [
          [
            "A8.1.1",
            "CC Receiving Discipline",
            0.5,
            [
              "No receiving discipline at the collection center - produce is dropped off with no check-in, weighing, or condition assessment.",
              "A rough check-in happens informally at some centers but isn't consistent or recorded.",
              "A documented CC receiving process (check-in, weigh, basic condition check) exists and is generally followed.",
              "CC receiving is actively audited against the SOP, with compliance tracked per center.",
              "CC receiving is standardized and digitally logged across all centers, with real-time visibility into intake quality.",
            ],
          ],
          [
            "A8.1.2",
            "CC-to-Warehouse Transit Handling",
            0.5,
            [
              "No handling standard for the CC-to-warehouse leg - produce travels however it happens to be loaded, with frequent transit damage/quality loss.",
              "A rough transit practice exists informally (e.g. \"use the covered truck when available\") but isn't documented.",
              "A documented transit handling standard (vehicle type, loading practice, timing) exists and is generally followed.",
              "Transit handling is actively monitored (condition-on-arrival vs condition-at-CC) with deviations investigated.",
              "Transit is continuously monitored (temperature-logged vehicles where relevant) with condition loss tracked and minimized as a KPI.",
            ],
          ],
        ],
      ],
      [
        "A8.2",
        "Vendor Performance Management",
        0.5,
        [
          "No vendor performance management - vendors are engaged transactionally with no tracked history or scorecard.",
          "Vendor performance is known informally by procurement staff but isn't documented or shared with vendors.",
          "A documented vendor scorecard exists and is generally used to inform sourcing decisions.",
          "Vendor scorecards are actively reviewed on a defined cadence, with underperforming vendors coached or phased out.",
          "Vendor performance is continuously tracked and automatically informs sourcing allocation, with scorecards shared transparently with vendors.",
        ],
        [
          [
            "A8.2.1",
            "Vendor Scorecard Usage",
            0.5,
            [
              "No vendor scorecard exists - sourcing decisions don't reference any tracked performance history.",
              "A scorecard concept exists informally but isn't consistently populated or referenced.",
              "A documented vendor scorecard (quality, rejection rate, on-time %) exists and is generally used.",
              "The scorecard is actively reviewed on a defined cadence and directly informs sourcing allocation decisions.",
              "The scorecard is continuously updated and automatically weights sourcing decisions, with vendors given visibility into their own standing.",
            ],
          ],
          [
            "A8.2.2",
            "Vendor Onboarding & Capability Assessment",
            0.5,
            [
              "New vendors are onboarded with no capability assessment at all - quality and reliability are discovered after the fact.",
              "A rough informal check happens before onboarding some vendors, but isn't consistent or documented.",
              "A documented onboarding/capability assessment process exists and is generally applied to new vendors.",
              "Onboarding assessments are actively tracked against subsequent actual performance to validate the process.",
              "Onboarding is standardized, data-driven, and continuously refined based on which onboarding signals actually predict performance.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A9",
    "Warehouse Flow & Layout",
    0.05,
    [
      [
        "A9.1",
        "Facility Flow Design",
        0.5,
        [
          "No deliberate flow design - inbound, storage, and outbound zones overlap with no defined traffic pattern, causing constant congestion.",
          "A rough flow pattern exists informally based on how the facility happened to be set up, not deliberately designed.",
          "A documented flow pattern (U-shaped, criss-cross, or straight-through) is defined and the layout generally follows it.",
          "Flow effectiveness is actively measured (travel distance, congestion points) and the layout is adjusted based on findings.",
          "Flow design is continuously optimized using real movement data, with layout changes data-justified rather than assumed.",
        ],
        [
          [
            "A9.1.1",
            "Flow Pattern Definition",
            0.5,
            [
              "No flow pattern is defined - inbound, storage, and outbound activity happen wherever there's space, with paths crossing constantly.",
              "A flow pattern is understood informally by long-tenured staff but was never deliberately designed or documented.",
              "A documented flow pattern (e.g. U-shaped or criss-cross) is defined for the facility and generally followed.",
              "The flow pattern is actively validated against actual movement (walk-throughs, timing studies) and refined.",
              "Flow pattern is data-optimized and periodically re-validated as volume/SKU mix changes.",
            ],
          ],
          [
            "A9.1.2",
            "Cross-Traffic & Congestion Management",
            0.5,
            [
              "Cross-traffic between inbound, picking, and dispatch activity is unmanaged - collisions and bottlenecks are a routine part of the day.",
              "Congestion is addressed reactively and informally in the moment, with no underlying process change.",
              "A documented approach to managing cross-traffic (staggered timing, designated paths) exists and is generally followed.",
              "Congestion points are actively tracked and addressed through layout or scheduling changes.",
              "Cross-traffic is continuously monitored and proactively managed through dynamic scheduling/routing.",
            ],
          ],
        ],
      ],
      [
        "A9.2",
        "Slot Scheduling & Dock Allocation",
        0.5,
        [
          "No slot scheduling exists for docks - trucks and activities compete for space with no allocation logic.",
          "A rough informal allocation exists based on whoever arrives first, not planned in advance.",
          "A documented dock/slot allocation plan exists and is generally followed.",
          "Slot allocation is actively reviewed against utilization data and adjusted to reduce idle/conflict time.",
          "Slot scheduling is dynamically optimized (system-assisted) based on real-time inbound/outbound demand.",
        ],
        [
          [
            "A9.2.1",
            "Dock Slot Allocation Logic",
            0.5,
            [
              "Docks are used on a first-come basis with no allocation logic at all, causing frequent conflicts.",
              "A rough informal priority exists (e.g. \"regular vendors get first dock\") but isn't documented.",
              "A documented dock allocation logic (by vendor, time window, or activity type) exists and is generally followed.",
              "Dock allocation effectiveness is actively measured (wait time, conflicts) and the logic is refined.",
              "Dock allocation is system-scheduled and dynamically adjusted based on real-time conditions.",
            ],
          ],
          [
            "A9.2.2",
            "Slot Utilization Tracking",
            0.5,
            [
              "Slot/dock utilization is never measured - there's no visibility into how much idle or conflict time exists.",
              "Utilization is estimated informally (\"docks always seem busy\") without real measurement.",
              "A documented process tracks slot utilization on a basic level (e.g. logged manually).",
              "Utilization is actively tracked as a KPI and reviewed to identify chronic bottleneck slots/times.",
              "Utilization is tracked continuously and automatically surfaces bottlenecks for proactive resolution.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A10",
    "Rejection Handling",
    0.04,
    [
      [
        "A10.1",
        "Rejected-Goods Disposition",
        0.5,
        [
          "Rejected produce has no defined handling - it sits mixed with accepted stock or is disposed of inconsistently with no record.",
          "Rejected goods are set aside informally but the next step (return, dispose, downgrade) isn't standardized.",
          "A documented disposition process for rejected goods exists and is generally followed.",
          "Disposition decisions are actively tracked and reviewed for consistency and cost impact.",
          "Disposition is systematized with clear rules per rejection reason, fully auditable and cost-tracked.",
        ],
        [
          [
            "A10.1.1",
            "Rejection Segregation & Holding",
            0.5,
            [
              "Rejected goods aren't physically segregated at all - they can end up mixed back into accepted stock by mistake.",
              "Segregation happens informally (a corner is used) but isn't a defined, labeled holding area.",
              "A documented segregation process (labeled holding area, clear marking) exists and is generally followed.",
              "Segregation compliance is actively audited, with any mixing incidents investigated.",
              "Segregation is system-enforced (rejected stock can't be picked or shipped) and continuously verified.",
            ],
          ],
          [
            "A10.1.2",
            "Disposition Decision Process",
            0.5,
            [
              "No decision process exists for what happens to rejected goods - the outcome varies by whoever is handling it that day.",
              "A rough informal rule exists (\"just send it back\") but isn't documented or applied consistently.",
              "A documented disposition decision process (return to vendor / downgrade / dispose) exists and is generally followed.",
              "Disposition decisions are actively tracked and reviewed for cost-effectiveness.",
              "Disposition decisions are rule-based and system-guided, optimized for cost and waste reduction.",
            ],
          ],
        ],
      ],
      [
        "A10.2",
        "Vendor Feedback on Rejection",
        0.5,
        [
          "Rejection reasons are never communicated back to vendors - the same quality issues recur shipment after shipment.",
          "Feedback happens informally and inconsistently, often only when a vendor asks.",
          "A documented process communicates rejection reasons to vendors and is generally followed.",
          "Rejection trends are actively analyzed and shared with vendors on a defined cadence to drive improvement.",
          "Rejection feedback is automatic and data-rich, directly linked to the vendor scorecard and sourcing decisions.",
        ],
        [
          [
            "A10.2.1",
            "Rejection Reason Communication to Vendor",
            0.5,
            [
              "Vendors are never told why a shipment was rejected - they have no way to correct the underlying issue.",
              "Communication happens informally and inconsistently, often verbal and undocumented.",
              "A documented process communicates specific rejection reasons to the vendor and is generally followed.",
              "Communication is actively tracked for completeness and timeliness.",
              "Rejection reasons are automatically communicated to vendors in real time, with a documented trail.",
            ],
          ],
          [
            "A10.2.2",
            "Rejection Trend Analysis",
            0.5,
            [
              "Rejection data isn't analyzed for trends at all - repeated issues from the same vendor/SKU go unnoticed.",
              "Trends are occasionally noticed informally but not systematically analyzed.",
              "A documented process reviews rejection trends by vendor/SKU on a defined cadence.",
              "Rejection trends actively inform vendor scorecard updates and sourcing decisions.",
              "Rejection trend analysis is continuous and automatically flags vendors/SKUs crossing a risk threshold.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A11",
    "Returns Management",
    0.04,
    [
      [
        "A11.1",
        "Return Intake & Processing",
        0.5,
        [
          "No defined process for handling returns - returned goods are handled ad hoc with no consistent intake or disposition.",
          "A rough informal return-handling practice exists but isn't documented or consistent.",
          "A documented return intake and processing SOP exists and is generally followed.",
          "Return processing is actively measured (time-to-disposition) and reviewed for efficiency.",
          "Return processing is system-tracked end to end, with disposition decisions automated where possible.",
        ],
        [
          [
            "A11.1.1",
            "Return Receiving SOP",
            0.5,
            [
              "No SOP exists for receiving returns - they're accepted back with no condition check or documentation.",
              "A rough informal check happens but isn't documented or consistently applied.",
              "A documented return-receiving SOP (condition check, reason capture) exists and is generally followed.",
              "Return receiving compliance is actively audited against the SOP.",
              "Return receiving is standardized and digitally logged, with condition data captured systematically.",
            ],
          ],
          [
            "A11.1.2",
            "Return Disposition",
            0.5,
            [
              "Returned goods have no defined next step - restock, dispose, and write-off decisions are made inconsistently.",
              "Disposition happens informally based on whoever is handling the return.",
              "A documented disposition process (restock if sellable / dispose / write-off) exists and is generally followed.",
              "Disposition decisions are actively tracked and reviewed for accuracy and cost impact.",
              "Disposition is rule-based and system-guided, with outcomes tracked against sellability criteria.",
            ],
          ],
        ],
      ],
      [
        "A11.2",
        "Return Root-Cause & Prevention",
        0.5,
        [
          "Return reasons are never analyzed - returns are treated as an unavoidable cost with no attempt to reduce them.",
          "Reasons are occasionally noted informally but not compiled or acted on.",
          "A documented process tracks return reasons and reviews them on a basic level.",
          "Return root causes are actively analyzed and fed back into upstream process changes (packaging, picking accuracy).",
          "Return prevention is data-driven and continuous, with root-cause patterns automatically routed to the responsible process owner.",
        ],
        [
          [
            "A11.2.1",
            "Return Reason Tracking",
            0.5,
            [
              "No record is kept of why anything is returned - the data simply doesn't exist.",
              "Reasons are occasionally noted informally but not compiled anywhere.",
              "A documented process logs return reasons in a structured way and is generally followed.",
              "Return reasons are actively categorized and reviewed on a defined cadence.",
              "Return reason tracking is systematic and real-time, feeding directly into upstream process dashboards.",
            ],
          ],
          [
            "A11.2.2",
            "Return-Driven Process Correction",
            0.5,
            [
              "Nothing upstream ever changes in response to returns - the same causes keep producing the same returns.",
              "Corrections happen occasionally and informally when a pattern becomes impossible to ignore.",
              "A documented process links return root causes to corrective action in the relevant upstream area.",
              "Corrective actions from returns are actively tracked to completion and their impact measured.",
              "Return-driven correction is systematic, with root causes automatically routed and impact continuously tracked.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A12",
    "Complaints Management",
    0.03,
    [
      [
        "A12.1",
        "Complaint Capture & Traceability",
        0.5,
        [
          "Customer complaints aren't captured in any structured way - they're handled verbally and forgotten.",
          "Complaints are logged informally and inconsistently, often without enough detail to trace back to a cause.",
          "A documented complaint-logging process exists and is generally followed, with basic detail captured.",
          "Complaint logging is actively audited for completeness, and complaints are traceable back to a batch/vendor where relevant.",
          "Complaint capture is systematic and fully traceable to source batch/vendor, feeding automatically into quality dashboards.",
        ],
        [
          [
            "A12.1.1",
            "Complaint Logging Discipline",
            0.5,
            [
              "Complaints are not logged at all - if a customer complains, it's handled and then lost with no record.",
              "Complaints are logged informally and inconsistently, often missing key details.",
              "A documented complaint-logging process exists and is generally followed.",
              "Complaint logging completeness is actively audited and gaps are corrected.",
              "Complaint logging is systematic and structured, capturing full detail automatically at the point of complaint.",
            ],
          ],
          [
            "A12.1.2",
            "Complaint-to-Batch Traceability",
            0.5,
            [
              "There's no way to trace a complaint back to a specific batch, vendor, or process step.",
              "Tracing back is possible in theory with significant manual effort, and often fails.",
              "A documented process links complaints to batch/vendor data where available, generally workable.",
              "Traceability is actively tested to confirm it works, with gaps addressed.",
              "Any complaint can be traced to its source batch/vendor within minutes, system-supported.",
            ],
          ],
        ],
      ],
      [
        "A12.2",
        "Complaint Resolution & Closure",
        0.5,
        [
          "Complaints have no defined resolution process - some get addressed, most don't, with no tracking either way.",
          "Resolution happens informally and inconsistently, with no ownership or time expectation.",
          "A documented resolution process (ownership, time target) exists and is generally followed.",
          "Resolution time and outcomes are actively tracked against targets, with overdue complaints escalated.",
          "Resolution is systematically tracked end to end, with resolution-time and root-cause data feeding continuous improvement.",
        ],
        [
          [
            "A12.2.1",
            "Resolution Time & Ownership",
            0.5,
            [
              "No one owns complaint resolution - complaints can sit indefinitely with no accountable person.",
              "Ownership is informal and inconsistent, varying by who happens to pick it up.",
              "A documented process assigns ownership and a time target for resolution, generally followed.",
              "Resolution time is actively tracked against the target, with overdue items flagged and escalated.",
              "Resolution ownership and time are system-tracked with automatic escalation on breach.",
            ],
          ],
          [
            "A12.2.2",
            "Complaint-to-Wastage Correlation",
            0.5,
            [
              "Complaints and wastage/spoilage data are tracked completely separately, if at all - no one looks at whether they're related.",
              "A connection is occasionally noticed informally but never analyzed.",
              "A documented process reviews complaints alongside wastage data on a basic level.",
              "Complaint-wastage correlation is actively analyzed to find shared root causes.",
              "Complaints and wastage are tracked in one unified dashboard (hub-wise), with correlation continuously monitored.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A13",
    "Control Tower",
    0.05,
    [
      [
        "A13.1",
        "Policy & Monitoring Cadence",
        0.5,
        [
          "No documented policy exists for how operations should run, and nothing is monitored on any regular cadence.",
          "Policies exist informally in people's heads; monitoring happens sporadically when someone thinks to check.",
          "Documented policies exist and a monitoring cadence (daily/weekly) is defined and generally followed.",
          "Monitoring cadence is actively adhered to and reviewed, with policy updated based on findings.",
          "Policy and monitoring are continuously maintained, with real-time dashboards replacing manual checks.",
        ],
        [
          [
            "A13.1.1",
            "Policy Documentation & Distribution",
            0.5,
            [
              "No operational policies are documented anywhere - practices exist only as tribal knowledge.",
              "Some policies are written down but aren't distributed or referenced consistently.",
              "Documented policies exist and are distributed to relevant staff, generally referenced.",
              "Policy adherence is actively audited, with gaps between policy and practice corrected.",
              "Policies are centrally maintained, versioned, and automatically distributed/updated across all sites.",
            ],
          ],
          [
            "A13.1.2",
            "Daily/Weekly Monitoring Rhythm",
            0.5,
            [
              "No regular monitoring rhythm exists - operations are reviewed only when something goes visibly wrong.",
              "Monitoring happens informally and inconsistently, without a defined schedule.",
              "A documented daily/weekly monitoring rhythm exists and is generally followed.",
              "Monitoring rhythm adherence is actively tracked, with findings reviewed and actioned.",
              "Monitoring is continuous and dashboard-driven, with the rhythm automated rather than manually run.",
            ],
          ],
        ],
      ],
      [
        "A13.2",
        "Escalation & Threshold Triggers",
        0.5,
        [
          "No thresholds or escalation triggers are defined - problems are noticed only when they become severe enough to be obvious.",
          "Informal thresholds exist in some people's judgment but aren't documented or consistently applied.",
          "Documented thresholds and an escalation path exist and are generally followed.",
          "Threshold breaches are actively tracked, with escalation response time measured.",
          "Thresholds are system-monitored with automatic real-time escalation and tracked resolution.",
        ],
        [
          [
            "A13.2.1",
            "Threshold Definition",
            0.5,
            [
              "No thresholds are defined for any operational metric - there's no line between \"normal\" and \"needs attention.\"",
              "Rough thresholds exist informally in experienced staff's judgment, not documented.",
              "Documented thresholds exist for key metrics and are generally referenced.",
              "Thresholds are actively reviewed and recalibrated based on operational experience.",
              "Thresholds are data-derived, continuously recalibrated, and applied automatically across all monitored metrics.",
            ],
          ],
          [
            "A13.2.2",
            "Escalation Response & Closure",
            0.5,
            [
              "When something is escalated, there's no defined response process or expectation of closure.",
              "Escalations are handled informally and inconsistently, often without being tracked to closure.",
              "A documented escalation-response process exists (who responds, in what time) and is generally followed.",
              "Escalation response time and closure are actively tracked against targets.",
              "Escalations are system-tracked end to end with automatic reminders and closure verification.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A14",
    "Market Intelligence & Benchmarking",
    0.04,
    [
      [
        "A14.1",
        "Market Intelligence Capture",
        0.5,
        [
          "No market intelligence is gathered at all - sourcing and pricing decisions are made blind to what's happening in the market.",
          "Market information is picked up informally and inconsistently by individual buyers.",
          "A documented process for daily market intelligence gathering exists and is generally followed.",
          "Market intelligence is actively used to inform sourcing/pricing decisions and reviewed for accuracy.",
          "Market intelligence is systematically captured and directly feeds forecasting and sourcing decisions in near real time.",
        ],
        [
          [
            "A14.1.1",
            "Daily Market Intelligence Discipline",
            0.5,
            [
              "No one is tracking daily market conditions (prices, availability, quality) at all.",
              "Some market awareness exists informally through individual relationships, not systematically captured.",
              "A documented process for daily market intelligence capture exists and is generally followed.",
              "Market intelligence capture is actively reviewed for completeness and accuracy.",
              "Market intelligence is captured systematically from multiple sources and available in near real time.",
            ],
          ],
          [
            "A14.1.2",
            "Seasonal Adjustment Process",
            0.5,
            [
              "Sourcing and planning don't account for seasonality at all - the same approach is used year-round regardless of season.",
              "Seasonal adjustments happen informally based on individual experience.",
              "A documented seasonal adjustment process (product, sourcing area, special instructions) exists and is generally followed.",
              "Seasonal adjustments are actively reviewed for effectiveness after each season and refined.",
              "Seasonal adjustment is data-driven, using historical performance to proactively plan ahead of each season.",
            ],
          ],
        ],
      ],
      [
        "A14.2",
        "Benchmarking & Norms",
        0.5,
        [
          "No benchmarking against other players or defined norms exists - performance is judged with no external or internal reference point.",
          "Benchmarking happens informally and occasionally, not systematically tracked.",
          "A documented benchmarking process (benchmark companies, hub-wise norms) exists and is generally referenced.",
          "Benchmarks are actively reviewed and updated, with performance measured against them regularly.",
          "Benchmarking is continuous and systematically maintained, directly informing target-setting across the business.",
        ],
        [
          [
            "A14.2.1",
            "Benchmark Company Tracking",
            0.5,
            [
              "No benchmark companies are tracked at all - there's no external reference for quality, margins, or variability standards.",
              "Some informal awareness of competitors/benchmarks exists but isn't documented or tracked.",
              "A documented list of benchmark companies (by customer type, quality, margins, variability) exists and is referenced.",
              "Benchmark tracking is actively updated and used to inform strategic decisions.",
              "Benchmark tracking is continuous and systematically maintained, directly informing target-setting.",
            ],
          ],
          [
            "A14.2.2",
            "Hub-wise SKU & S&G Norms",
            0.5,
            [
              "No hub-wise SKU list or sorting & grading norms exist - every hub operates by its own undocumented standard.",
              "A rough SKU/norm understanding exists informally per hub, not documented or consistent across hubs.",
              "A documented hub-wise SKU list and S&G norms exist and are generally followed.",
              "Hub-wise norms are actively reviewed and reconciled across hubs for consistency.",
              "Hub-wise SKU lists and norms are centrally maintained and kept continuously consistent across all hubs.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A15",
    "Training Plan",
    0.03,
    [
      [
        "A15.1",
        "Training Program Design",
        0.5,
        [
          "No training program exists - new staff learn entirely on the job from whoever happens to be nearby.",
          "Informal training happens (shadowing an experienced colleague) but there's no defined curriculum.",
          "A documented training curriculum exists per role and is generally used.",
          "The curriculum is actively reviewed and updated to reflect current SOPs.",
          "Training design is continuously refined based on performance data and directly linked to every current SOP.",
        ],
        [
          [
            "A15.1.1",
            "Role-Based Training Curriculum",
            0.5,
            [
              "No role-specific training curriculum exists - training content (if any) is generic or non-existent.",
              "Some role-specific guidance exists informally but isn't documented as a curriculum.",
              "A documented role-based training curriculum exists and is generally used for new hires.",
              "The curriculum is actively reviewed against actual role requirements and updated.",
              "Curriculum is continuously refined based on performance outcomes and kept current with role changes.",
            ],
          ],
          [
            "A15.1.2",
            "SOP-to-Training Linkage",
            0.5,
            [
              "Training content has no connection to documented SOPs - what's taught and what's supposed to happen can diverge completely.",
              "Some overlap exists informally between training and SOPs, but they aren't deliberately linked.",
              "A documented process links training content directly to current SOPs and is generally maintained.",
              "The SOP-training linkage is actively audited whenever SOPs change.",
              "Training content is automatically flagged for update whenever the linked SOP changes.",
            ],
          ],
        ],
      ],
      [
        "A15.2",
        "Training Delivery & Effectiveness",
        0.5,
        [
          "Training delivery isn't tracked at all - there's no record of who was trained on what, or whether it worked.",
          "Training happens informally with no completion record or effectiveness check.",
          "A documented process tracks training completion and is generally followed.",
          "Training completion is actively tracked against targets, with effectiveness spot-checked.",
          "Training completion and effectiveness are systematically tracked, with competency verified before staff work unsupervised.",
        ],
        [
          [
            "A15.2.1",
            "Training Completion Tracking",
            0.5,
            [
              "No record exists of who has completed what training - there's no way to know who's actually trained.",
              "Completion is tracked informally and inconsistently, often just a memory of who attended.",
              "A documented completion-tracking process exists and is generally maintained.",
              "Completion is actively tracked against a target (e.g. 100% of new hires within X days) and gaps are chased.",
              "Completion tracking is systematic and automated, with real-time visibility into training status per employee.",
            ],
          ],
          [
            "A15.2.2",
            "Post-Training Competency Check",
            0.5,
            [
              "No check happens after training to confirm the person actually learned the material - completion is assumed to equal competency.",
              "A rough informal check happens sometimes (a supervisor watching briefly) but isn't consistent.",
              "A documented competency check (test, supervised trial) exists after training and is generally applied.",
              "Competency check results are actively tracked and used to identify training gaps.",
              "Competency verification is systematic and required before independent work, with results feeding curriculum improvement.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A16",
    "People / Workforce",
    0.04,
    [
      [
        "A16.1",
        "Staffing Adequacy",
        0.5,
        [
          "Staffing levels are never planned against volume - headcount is whatever it happens to be, causing chronic under- or overstaffing.",
          "Staffing is adjusted informally and reactively when problems become visible.",
          "A documented staffing plan tied to volume/activity exists and is generally followed.",
          "Staffing adequacy is actively reviewed against actual volume and adjusted proactively.",
          "Staffing is dynamically planned using volume forecasts, with adequacy continuously monitored and adjusted.",
        ],
        [
          [
            "A16.1.1",
            "Headcount Planning vs Volume",
            0.5,
            [
              "No relationship exists between headcount and actual volume - staffing levels are set arbitrarily.",
              "Headcount is adjusted informally based on gut feel when things feel busy or slow.",
              "A documented headcount plan tied to volume bands exists and is generally followed.",
              "Headcount vs volume is actively tracked and reviewed for efficiency, with adjustments made proactively.",
              "Headcount planning is data-driven and continuously calibrated against forecasted and actual volume.",
            ],
          ],
          [
            "A16.1.2",
            "Peak-Period Staffing Flexibility",
            0.5,
            [
              "No flexibility exists for peak periods - the same staffing runs regardless of known demand spikes.",
              "Extra staffing is arranged informally and inconsistently when a peak is remembered in advance.",
              "A documented plan for peak-period staffing (temp staff, shift extensions) exists and is generally followed.",
              "Peak staffing effectiveness is actively reviewed post-event and refined.",
              "Peak staffing is proactively planned from demand forecasts, with flexibility built into standing contracts/processes.",
            ],
          ],
        ],
      ],
      [
        "A16.2",
        "Role Clarity & Retention",
        0.5,
        [
          "Roles and responsibilities aren't defined - staff figure out what to do based on whatever's in front of them each day.",
          "Roles exist informally but overlap and gaps are common, with no documentation.",
          "Documented role/responsibility definitions exist and are generally followed.",
          "Role clarity is actively reinforced through review, and attrition is tracked with basic follow-up.",
          "Roles are clearly defined, continuously reinforced, and attrition is proactively managed with root-cause analysis.",
        ],
        [
          [
            "A16.2.1",
            "Role/Responsibility Definition",
            0.5,
            [
              "No role definitions exist - who's responsible for what is unclear and constantly renegotiated day to day.",
              "Roles are understood informally by tenured staff but not documented anywhere.",
              "Documented role/responsibility definitions exist and are generally referenced.",
              "Role clarity is actively checked (e.g. via staff surveys or audits) and gaps are corrected.",
              "Roles are clearly documented, continuously reinforced through training, and reviewed as operations evolve.",
            ],
          ],
          [
            "A16.2.2",
            "Attrition Tracking & Response",
            0.5,
            [
              "Attrition isn't tracked at all - staff turnover happens with no visibility into rate or cause.",
              "Attrition is noticed informally (\"we're always hiring\") without being measured.",
              "A documented process tracks attrition rate and basic exit reasons.",
              "Attrition is actively analyzed for root causes and response actions are taken.",
              "Attrition is tracked continuously with root-cause analysis directly informing retention initiatives.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A17",
    "Metrics & Visibility",
    0.04,
    [
      [
        "A17.1",
        "KPI Definition",
        0.5,
        [
          "No KPIs are defined for operations at all - success or failure is judged subjectively, if at all.",
          "Some informal notion of what matters exists but isn't written down as defined metrics.",
          "Documented KPIs exist for key operational areas and are generally referenced.",
          "KPIs are actively reviewed for relevance and ownership is assigned to each one.",
          "KPIs are comprehensively defined, owned, and reviewed on a regular cadence for continued relevance.",
        ],
        [
          [
            "A17.1.1",
            "Metric Definition Completeness",
            0.5,
            [
              "No metrics are defined for most operational areas - there's nothing to even measure against.",
              "A few metrics exist informally for the areas someone happened to care about.",
              "A documented set of metrics covers the key operational areas and is generally maintained.",
              "Metric coverage is actively reviewed for gaps and expanded where needed.",
              "Metric definitions are comprehensive, consistently maintained, and reviewed for relevance on a regular cadence.",
            ],
          ],
          [
            "A17.1.2",
            "Metric Ownership Assignment",
            0.5,
            [
              "No metric has a defined owner - if something isn't tracked or acted on, there's no one accountable.",
              "Ownership is assumed informally rather than assigned.",
              "A documented ownership assignment exists for key metrics and is generally respected.",
              "Ownership is actively reinforced, with owners accountable for reviewing and acting on their metrics.",
              "Every metric has a clear, current owner who is accountable and actively reviewed on metric performance.",
            ],
          ],
        ],
      ],
      [
        "A17.2",
        "KPI Tracking & Dashboarding",
        0.5,
        [
          "Even where KPIs are defined, they're never actually tracked - there's no dashboard, report, or regular view of performance.",
          "Tracking happens informally and inconsistently, often via ad hoc spreadsheets that go stale.",
          "A documented tracking/dashboarding process exists and is generally maintained and reviewed.",
          "Dashboards are actively used to drive decisions, with refresh cadence and data quality actively monitored.",
          "Dashboards are real-time, comprehensive, and demonstrably drive day-to-day decision-making.",
        ],
        [
          [
            "A17.2.1",
            "Dashboard Availability & Refresh Cadence",
            0.5,
            [
              "No dashboard exists for any operational metric - performance data, if it exists, lives in scattered files no one checks.",
              "A basic dashboard/report exists but is updated inconsistently and often stale.",
              "A documented dashboard with a defined refresh cadence exists and is generally maintained.",
              "Dashboard freshness and accuracy are actively monitored, with issues corrected quickly.",
              "Dashboards are real-time or near-real-time, comprehensive, and reliably available to all who need them.",
            ],
          ],
          [
            "A17.2.2",
            "Metric-Driven Decision Making",
            0.5,
            [
              "Metrics, even when tracked, don't actually inform any decisions - operations run the same regardless of what the numbers say.",
              "Metrics occasionally inform a decision informally, but it's not a consistent practice.",
              "A documented process references metrics in regular operational decision-making and is generally followed.",
              "Metric-driven decisions are actively tracked, with outcomes reviewed to confirm the metric was the right one to act on.",
              "Decision-making is systematically metric-driven, with a demonstrated track record of metrics changing operational behavior.",
            ],
          ],
        ],
      ],
    ],
  ],
  [
    "A18",
    "Cost Diagnostics",
    0.03,
    [
      [
        "A18.1",
        "Cost Tracking",
        0.5,
        [
          "No cost tracking exists at the operational level - costs are known only at a high, aggregated financial-statement level, if at all.",
          "Some cost awareness exists informally (\"labor is expensive\") without actual tracked figures.",
          "A documented cost-tracking process (cost-per-unit, per-order, or similar) exists and is generally maintained.",
          "Cost tracking is actively reviewed against targets/benchmarks and used to inform operational decisions.",
          "Cost tracking is granular, real-time, and directly drives operational decision-making across the business.",
        ],
        [
          [
            "A18.1.1",
            "Cost-per-Unit Tracking",
            0.5,
            [
              "No cost-per-unit figure is tracked for any part of the operation - unit economics are unknown at the operational level.",
              "A rough cost estimate exists informally but isn't calculated consistently.",
              "A documented cost-per-unit tracking process exists for key activities and is generally maintained.",
              "Cost-per-unit is actively tracked against a target and reviewed regularly.",
              "Cost-per-unit is tracked in real time across activities and directly informs operational decisions.",
            ],
          ],
          [
            "A18.1.2",
            "Cost Benchmarking vs Target",
            0.5,
            [
              "There's no target or benchmark to compare actual costs against - cost performance can't be judged as good or bad.",
              "A rough informal sense of \"reasonable cost\" exists without a defined benchmark.",
              "Documented cost benchmarks/targets exist and actual costs are generally compared against them.",
              "Cost-vs-benchmark variance is actively reviewed and drives corrective action.",
              "Cost benchmarking is continuous and automatically flags variance for action.",
            ],
          ],
        ],
      ],
      [
        "A18.2",
        "Cost-of-Quality-Failure Visibility",
        0.5,
        [
          "The cost of quality failures (spoilage, rejections, complaints) is invisible - it's absorbed as a general loss with no specific number attached.",
          "The cost is estimated roughly and informally without a consistent calculation method.",
          "A documented process quantifies the cost of quality failures on a basic level.",
          "Cost-of-quality-failure is actively tracked as a KPI and reviewed with stakeholders.",
          "Cost-of-quality-failure is tracked in real time and directly reported to stakeholders to prioritize corrective investment.",
        ],
        [
          [
            "A18.2.1",
            "Spoilage/Rejection Cost Quantification",
            0.5,
            [
              "The cost of spoilage and rejections is never quantified in currency terms - only the physical quantity (if that) is known.",
              "A rough cost estimate is made informally and inconsistently.",
              "A documented process converts spoilage/rejection quantities into a cost figure on a basic level.",
              "Cost quantification is actively tracked and reviewed against a reduction target.",
              "Spoilage/rejection cost is quantified in real time and automatically prioritized against other cost drivers.",
            ],
          ],
          [
            "A18.2.2",
            "Cost-Impact Reporting to Stakeholders",
            0.5,
            [
              "Cost impact of quality failures is never reported to anyone beyond the immediate team, if it's tracked at all.",
              "Reporting happens informally and inconsistently, often only when something goes badly wrong.",
              "A documented reporting process shares cost-of-quality-failure with stakeholders on a defined cadence.",
              "Reporting is actively used to secure investment in corrective action, with outcomes tracked.",
              "Cost-impact reporting is systematic, real-time, and demonstrably drives stakeholder investment decisions.",
            ],
          ],
        ],
      ],
    ],
  ],
];

const TARGET_LEVELS = [2, 3, 4, 5];

function buildRecommendedTasks(name, targetLevel, descs) {
  return `Move ${name} toward: ${descs[targetLevel - 1]}`;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);

  const mastersWs = wb.getWorksheet("Masters");
  const problemsWs = wb.getWorksheet("Problems");
  const recoWs = wb.getWorksheet("Recommendations");

  const mastersHeaders = mastersWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());
  const problemsHeaders = problemsWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());
  const recoHeaders = recoWs.getRow(1).values.slice(1).map((v) => String(v ?? "").trim());

  // 1. Rebalance A1-A7's area_weight in place.
  const areaWeightCol = mastersHeaders.indexOf("area_weight") + 1;
  const areaIdCol = mastersHeaders.indexOf("area_id") + 1;
  const moduleIdCol = mastersHeaders.indexOf("module_id") + 1;
  let rebalanced = 0;
  mastersWs.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const moduleId = row.getCell(moduleIdCol).value;
    const areaId = row.getCell(areaIdCol).value;
    if (moduleId === MODULE_ID && REBALANCED_AREA_WEIGHTS[areaId] !== undefined) {
      row.getCell(areaWeightCol).value = REBALANCED_AREA_WEIGHTS[areaId];
      rebalanced++;
    }
  });

  // 2. Add new Masters rows (Node 2/3) + Problems rows (Node 4) + Recommendations for A8-A18.
  let mastersAdded = 0;
  let problemsAdded = 0;
  let recoAdded = 0;
  for (const [areaId, areaName, areaWeight, subpoints] of AREAS) {
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
  console.log(`Rebalanced area_weight on ${rebalanced} existing A1-A7 Masters rows.`);
  console.log(`Added ${mastersAdded} new Masters rows across ${AREAS.length} new areas (A8-A18).`);
  console.log(`Added ${problemsAdded} new Problems rows.`);
  console.log(`Added ${recoAdded} new Recommendations rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
