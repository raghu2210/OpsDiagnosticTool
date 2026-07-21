// One-off structural migration: the 7 area-picker categories (Planning & Sourcing,
// Inbound & Quality, Storage & Inventory, Fulfillment Operations, Loss/Returns &
// Complaints, Governance & Performance, People & Training) become the actual areas
// (Node 2), and today's 24 areas are re-parented as sub-points (Node 3) directly under
// them - Node 3 and Node 4 content is fully preserved, only re-IDed and re-weighted.
//
// Why this loses zero content: the old "Area" level never carried its own score
// descriptions - only a name and a weight, aggregated from its sub-point rows. So
// instead of squeezing a whole old-area (with its own sub-points/problems) into one new
// sub-point slot (which WOULD be lossy), each old area's sub-points are individually
// re-parented under the new category-area, keeping their own name/weight/descriptions/
// problem statements completely intact.
//
// Weight math (preserves every subpoint's GLOBAL importance in the module, so a fully
// scored diagnostic produces the same module score before and after):
//   new_area_weight        = sum of the old area_weight values of its constituent old areas
//   new_subpoint_weight    = (old_area_weight * old_subpoint_weight) / new_area_weight
// Problem statements keep their own problem_weight unchanged - only their IDs and
// subpoint_id foreign key are renamed to match the new subpoint_id.
//
// ID scheme: new area A<n> in category order; new subpoint A<n>.<i> numbered
// sequentially across all of that category's old areas (old-area order, then old
// subpoint_id order within each); new problem IDs keep their old trailing suffix
// (old "A8.1.1" -> new subpoint "A1.1" -> new problem "A1.1.1").
//
// Run once: node scripts/collapse-categories-to-areas.mjs
// Then: node scripts/generate-fallback-json.mjs
import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, "../../sample_data/LongArc_Masters.xlsx");
const MODULE_ID = "FNV_WH_V1";

// Mirrors lib/domain/grouping.ts's AREA_CATEGORIES exactly (confirmed order/membership).
const CATEGORIES = [
  { name: "Planning & Sourcing", areaIds: ["A8", "A14"] },
  { name: "Inbound & Quality", areaIds: ["A1", "A2", "A10"] },
  { name: "Storage & Inventory", areaIds: ["A3", "A4", "A9"] },
  { name: "Fulfillment Operations", areaIds: ["A5", "A6", "A19", "A20", "A21"] },
  { name: "Loss, Returns & Complaints", areaIds: ["A7", "A11", "A12"] },
  { name: "Governance & Performance", areaIds: ["A13", "A17", "A18", "A22", "A23", "A24"] },
  { name: "People & Training", areaIds: ["A15", "A16"] },
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

  // 1. Read all active FNV_WH_V1 Masters rows into memory (row object + old values).
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

  // area_weight is the same across every row sharing an area_id - reduce to one value.
  const oldAreaWeight = new Map();
  for (const r of masterRows) oldAreaWeight.set(r.area_id, r.area_weight);

  // 2. Compute the subpoint_id -> subpoint_id rename map + new area/subpoint weights.
  const subpointRename = new Map(); // old subpoint_id -> new subpoint_id
  const newAreaOf = new Map(); // new area_id -> { name, weight }
  const newSubpointWeight = new Map(); // new subpoint_id -> weight

  CATEGORIES.forEach((cat, catIdx) => {
    const newAreaId = `A${catIdx + 1}`;
    const newAreaWeight = cat.areaIds.reduce((sum, id) => sum + (oldAreaWeight.get(id) ?? 0), 0);
    newAreaOf.set(newAreaId, { name: cat.name, weight: newAreaWeight });

    let subIdx = 0;
    for (const oldAreaId of cat.areaIds) {
      const subs = masterRows
        .filter((r) => r.area_id === oldAreaId)
        .sort((a, b) => numericCompare(a.subpoint_id, b.subpoint_id));
      for (const s of subs) {
        subIdx++;
        const newSubpointId = `${newAreaId}.${subIdx}`;
        subpointRename.set(s.subpoint_id, newSubpointId);
        const globalWeight = s.area_weight * s.subpoint_weight;
        newSubpointWeight.set(newSubpointId, newAreaWeight > 0 ? globalWeight / newAreaWeight : 0);
      }
    }
  });

  // 3. Write the new area_id/area_name/area_weight/subpoint_id/subpoint_weight back onto
  //    each existing Masters row in place (no row reordering needed - the app sorts by
  //    area_id/subpoint_id at read time regardless of sheet row order).
  for (const r of masterRows) {
    const newSubpointId = subpointRename.get(r.subpoint_id);
    const newAreaId = newSubpointId.split(".")[0];
    const areaInfo = newAreaOf.get(newAreaId);
    r.row.getCell(mCols.areaId).value = newAreaId;
    r.row.getCell(mCols.areaName).value = areaInfo.name;
    r.row.getCell(mCols.areaWeight).value = areaInfo.weight;
    r.row.getCell(mCols.subpointId).value = newSubpointId;
    r.row.getCell(mCols.subpointWeight).value = newSubpointWeight.get(newSubpointId);
  }

  // 4. Problems sheet: rename subpoint_id (foreign key) and problem_id (keeps its old
  //    trailing suffix after the old subpoint_id prefix).
  const pCols = {
    moduleId: col(problemsHeaders, "module_id"),
    subpointId: col(problemsHeaders, "subpoint_id"),
    problemId: col(problemsHeaders, "problem_id"),
  };
  const problemRename = new Map(); // old problem_id -> new problem_id
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

  // 5. Recommendations sheet: its "subpoint_id" column holds either an old subpoint_id
  //    (direct-scored, no Node-4 problems) or an old problem_id (Node-4 scored) - try
  //    the problem map first, then the subpoint map.
  const rCols = {
    moduleId: col(recoHeaders, "module_id"),
    subpointId: col(recoHeaders, "subpoint_id"),
  };
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

  await wb.xlsx.writeFile(XLSX_PATH);
  console.log(`New areas: ${newAreaOf.size}`);
  console.log(`Sub-points renamed: ${subpointRename.size}`);
  console.log(`Problems renamed: ${problemRename.size}`);
  console.log(`Recommendation rows updated: ${recoRenamed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
