import { NextRequest, NextResponse } from "next/server";

interface AreaRef {
  area_id: string;
  area_name: string;
}

interface WeightProfileAiRequest {
  description: string;
  areas: AreaRef[];
}

interface WeightProfileAiResult {
  weights: Record<string, number>;
  reasons: Record<string, string>;
  summary: string;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const MIN_DESCRIPTION_LENGTH = 12;
const MAX_ATTEMPTS = 3;

const NULL_RESULT = { weights: null, reasons: null, summary: null };

function buildSystemPrompt(): string {
  return (
    "You turn a company's free-text description of its business priorities into a " +
    "per-area importance weighting for a warehouse-operations maturity diagnostic. " +
    'Reply with strict JSON only: {"weights": {"<area_id>": <positive number>, ...}, ' +
    '"reasons": {"<area_id>": <string>, ...}, "summary": <string>}. Every area_id ' +
    "listed by the user must appear as a key in both weights and reasons. Use any " +
    "positive scale you like for weights (e.g. 1 for baseline, higher for areas that " +
    "matter more to this company) - the numbers are relative shares, not percentages, " +
    "and don't need to sum to anything in particular.\n\n" +
    "Each reason must be a real, specific causal explanation (roughly 12-20 words), " +
    "not a one- or two-word label. Name the concrete operational mechanism connecting " +
    "THIS area to something the company described, instead of just restating the " +
    "direction of the number (avoid bare tags like not a priority, deprioritized, or " +
    "low relevance on their own - say WHY, not just THAT). For example, for an area " +
    "that got weighted down because quality is not a stated priority, explain that " +
    "cutting governance overhead there reduces audit steps and speeds throughput, " +
    "rather than just saying it is not a focus. If the description genuinely didn't " +
    "speak to an area either way, say so plainly and leave it at baseline.\n\n" +
    "Formatting rule, strictly enforced: never place a double-quote character inside " +
    "any string value (weights keys/values are numbers, but reasons and summary are " +
    "prose) - paraphrase what the company said instead of quoting it verbatim, so no " +
    'field ever contains an embedded \\" that could break the JSON.\n\n' +
    "The summary is 1-2 short sentences, written directly to the reviewer, naming the " +
    "areas that moved most and why, based on what the company described."
  );
}

/** One attempt at the Groq call. Returns null (never throws) on any failure - HTTP error,
 * Groq's own JSON-mode validator rejecting the generation (a real, stochastic Groq failure
 * mode for longer structured outputs - retrying the identical request often succeeds), or
 * a response that doesn't match the expected shape. */
async function attemptGenerate(
  apiKey: string,
  description: string,
  areas: AreaRef[],
  areaList: string
): Promise<WeightProfileAiResult | null> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      // gpt-oss-120b is a reasoning model - at the default "medium" effort it burns enough
      // hidden reasoning tokens on a 25-area request to regularly blow this key's 8k
      // tokens/minute cap for this model, truncating the generation mid-JSON and tripping
      // Groq's own json_validate_failed check. "low" keeps total usage well under that cap.
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: `Company's stated priorities:\n${description}\n\nAreas to weight:\n${areaList}` },
      ],
    }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content ?? "{}");
  } catch {
    return null;
  }

  const rawWeights = parsed.weights;
  const rawReasons = parsed.reasons;
  if (!rawWeights || typeof rawWeights !== "object") return null;

  const weights: Record<string, number> = {};
  const reasons: Record<string, string> = {};
  for (const area of areas) {
    const value = Number((rawWeights as Record<string, unknown>)[area.area_id]);
    weights[area.area_id] = Number.isFinite(value) && value > 0 ? value : 1;

    const reason =
      rawReasons && typeof rawReasons === "object" ? (rawReasons as Record<string, unknown>)[area.area_id] : null;
    reasons[area.area_id] = typeof reason === "string" && reason.trim() ? reason.trim() : "";
  }

  const summary = typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : null;
  if (!summary) return null;

  return { weights, reasons, summary };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json(NULL_RESULT);

  const body: WeightProfileAiRequest = await request.json();
  const description = body.description?.trim() ?? "";
  const areas = body.areas ?? [];
  if (description.length < MIN_DESCRIPTION_LENGTH || areas.length === 0) {
    return NextResponse.json(NULL_RESULT);
  }

  const areaList = areas.map((a) => `${a.area_id}: ${a.area_name}`).join("\n");

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const result = await attemptGenerate(apiKey, description, areas, areaList);
      if (result) return NextResponse.json(result);
    } catch {
      // fall through and retry, same as a validation failure
    }
  }

  return NextResponse.json(NULL_RESULT);
}
