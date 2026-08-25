import type { WeightProfileRow } from "./types";

/**
 * A mandatory 10-question "company profile" quiz a consultant answers on behalf of a client
 * right after starting a diagnostic, before picking Areas - replaces writing a free-text
 * priorities description. Every question is worth an equal 10% of the total; the single
 * answer picked sends that 10% to one of four profiles. Summed across all 10 questions, the
 * per-profile totals always add to 100%, giving a cumulative company-profile weighting that
 * blends the sheet's existing Area-weight profiles (see computeQuizAreaWeights below).
 */
export type ProfileTag = "cost" | "process" | "quality" | "balanced";

export const PROFILE_TAGS: ProfileTag[] = ["cost", "process", "quality", "balanced"];

export const PROFILE_LABELS: Record<ProfileTag, string> = {
  cost: "Cost-sensitive",
  process: "Process-sensitive",
  quality: "Quality-sensitive",
  balanced: "Balanced",
};

export interface QuizOption {
  label: string;
  tag: ProfileTag;
}

export interface QuizQuestion {
  prompt: string;
  /** The user's "Tests: ..." label - shown to the consultant as a quiet caption. */
  theme: string;
  /** Always ordered A=cost, B=process, C=quality, D=balanced. */
  options: [QuizOption, QuizOption, QuizOption, QuizOption];
}

const WEIGHT_PER_QUESTION = 10;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    prompt: "What is the primary basis on which your company wins customers?",
    theme: "Core competitive proposition",
    options: [
      { label: "Competitive price, wide availability and the ability to serve high volumes.", tag: "cost" },
      { label: "Consistent service delivered through a reliable and repeatable operating model.", tag: "process" },
      { label: "Superior product quality, freshness, assortment or customer experience.", tag: "quality" },
      { label: "A deliberate combination of price, availability, reliability and quality.", tag: "balanced" },
    ],
  },
  {
    prompt: "When the business needs to improve profitability, where does management look first?",
    theme: "Profitability philosophy",
    options: [
      { label: "Increase volume, improve utilization and reduce cost per unit.", tag: "cost" },
      { label: "Remove process variation, improve productivity and standardize execution.", tag: "process" },
      { label: "Improve product mix, quality and customer value to increase realization.", tag: "quality" },
      { label: "Evaluate cost, productivity, quality and revenue together before deciding.", tag: "balanced" },
    ],
  },
  {
    prompt: "How does the company approach product assortment and market coverage?",
    theme: "Scale vs curation vs operational complexity",
    options: [
      { label: "Maximize assortment and availability, even if it creates operational complexity.", tag: "cost" },
      { label: "Maintain an assortment that can be consistently managed through defined processes.", tag: "process" },
      {
        label: "Prioritize a curated assortment where product quality and differentiation matter more than breadth.",
        tag: "quality",
      },
      { label: "Expand assortment selectively based on volume, profitability and customer value.", tag: "balanced" },
    ],
  },
  {
    prompt: "When cost and quality come into conflict, what is the company's normal decision?",
    theme: "Cost-quality trade-off",
    options: [
      { label: "Protect cost competitiveness as long as the minimum acceptable quality is maintained.", tag: "cost" },
      {
        label: "Redesign the process so the required quality can be achieved consistently at an efficient cost.",
        tag: "process",
      },
      { label: "Protect quality even when it requires additional cost.", tag: "quality" },
      { label: "Evaluate the financial and customer impact before choosing the trade-off.", tag: "balanced" },
    ],
  },
  {
    prompt: "When customer or operational requirements vary, how does the company prefer to respond?",
    theme: "Standardization vs flexibility",
    options: [
      { label: "Adapt quickly to support volume, availability and customer reach.", tag: "cost" },
      { label: "Minimize variation by defining a standard process and controlled exceptions.", tag: "process" },
      {
        label: "Allow flexibility when it protects product quality or customer-specific requirements.",
        tag: "quality",
      },
      { label: "Standardize the core process while allowing flexibility where it creates business value.", tag: "balanced" },
    ],
  },
  {
    prompt: "What is the company's preferred approach to scaling operations?",
    theme: "Growth model",
    options: [
      { label: "Add capacity, locations, products and volume while continuously reducing unit cost.", tag: "cost" },
      { label: "Build a standardized operating model that can be replicated with minimal variation.", tag: "process" },
      { label: "Scale selectively while protecting product quality and customer experience.", tag: "quality" },
      { label: "Scale based on the optimum combination of capacity, cost, quality and service.", tag: "balanced" },
    ],
  },
  {
    prompt: "What should happen when the defined process does not fit a real-world situation?",
    theme: "Operating culture",
    options: [
      { label: "The team should adapt immediately if it protects availability, speed or cost.", tag: "cost" },
      { label: "The deviation should be controlled through an approved exception process.", tag: "process" },
      { label: "The team should adapt when necessary to protect product or customer quality.", tag: "quality" },
      { label: "The team should assess the impact and choose the best balance between control and flexibility.", tag: "balanced" },
    ],
  },
  {
    prompt: "Which performance outcome would management be least willing to compromise?",
    theme: "Executive priority",
    options: [
      { label: "Cost per unit, capacity utilization and overall productivity.", tag: "cost" },
      { label: "Process consistency, reliability and adherence to defined standards.", tag: "process" },
      { label: "Product quality, freshness, integrity and customer experience.", tag: "quality" },
      { label: "Overall business performance across cost, quality and service.", tag: "balanced" },
    ],
  },
  {
    prompt: "What primarily justifies an investment in a new operational capability?",
    theme: "Investment philosophy",
    options: [
      { label: "Higher capacity, lower unit cost or better asset utilization.", tag: "cost" },
      { label: "Improved standardization, control, productivity and scalability.", tag: "process" },
      { label: "Better product quality, customer experience or product differentiation.", tag: "quality" },
      { label: "A measurable improvement in the overall business equation.", tag: "balanced" },
    ],
  },
  {
    prompt: "Which statement best represents the company's long-term operating philosophy?",
    theme: "Overall strategic orientation",
    options: [
      {
        label: '"Scale efficiently." We win through volume, availability, assortment and cost competitiveness.',
        tag: "cost",
      },
      { label: '"Execute consistently." We win through standardization, control and repeatable execution.', tag: "process" },
      { label: '"Protect the value." We win through quality, differentiation and customer experience.', tag: "quality" },
      { label: '"Optimize the whole." We continuously balance cost, quality, service and scalability.', tag: "balanced" },
    ],
  },
];

export const MAX_PICKS_PER_QUESTION = 2;

/** Splits each answered question's full 10% evenly across whichever 1-2 tags were picked for
 * it (1 pick -> its tag gets the full 10%; 2 picks of different tags -> 5% each; 2 picks
 * sharing a tag -> that tag still gets the full 10%). A completed run (every question
 * answered) always sums to 100 across the four tags. */
export function computeProfileShares(picks: ProfileTag[][]): Record<ProfileTag, number> {
  const shares: Record<ProfileTag, number> = { cost: 0, process: 0, quality: 0, balanced: 0 };
  for (const tags of picks) {
    if (tags.length === 0) continue;
    const share = WEIGHT_PER_QUESTION / tags.length;
    for (const tag of tags) shares[tag] += share;
  }
  return shares;
}

/** Maps a profile tag to the sheet-authored weight profile it reuses - "balanced" has no
 * sheet row of its own and falls back to baseline (1) for every area, i.e. today's default
 * equal weighting, since a balanced company doesn't lean into any single archetype. */
const TAG_TO_PROFILE_ID: Record<Exclude<ProfileTag, "balanced">, string> = {
  cost: "cost_breadth",
  process: "process_standard",
  quality: "quality_curation",
};

/** Blends the cumulative profile shares into one area_id -> weight map, reusing whichever
 * sheet-authored WeightProfileRow rows exist for cost/process/quality and a flat 1 for
 * balanced - same shape/fallback convention as overrideAreaWeights() in weight-profiles.ts. */
export function computeQuizAreaWeights(
  profiles: WeightProfileRow[],
  shares: Record<ProfileTag, number>
): Record<string, number> {
  const areaIds = new Set(profiles.map((p) => p.area_id));
  const weights: Record<string, number> = {};
  for (const areaId of areaIds) {
    let sum = 0;
    for (const tag of PROFILE_TAGS) {
      const share = shares[tag] / 100;
      if (share === 0) continue;
      if (tag === "balanced") {
        sum += share * 1;
        continue;
      }
      const profileId = TAG_TO_PROFILE_ID[tag];
      const row = profiles.find((p) => p.profile_id === profileId && p.area_id === areaId);
      sum += share * (row ? Number(row.area_weight) : 1);
    }
    weights[areaId] = sum;
  }
  return weights;
}

/** One short sentence naming the leading profile and its %, for reuse in the same
 * `customSummary` slot the free-text/AI weighting path already renders. */
export function summarizeProfile(shares: Record<ProfileTag, number>): string {
  const ranked = [...PROFILE_TAGS].sort((a, b) => shares[b] - shares[a]);
  const top = ranked[0];
  return `${PROFILE_LABELS[top]} came through strongest at ${Math.round(shares[top])}% of the profile quiz.`;
}
