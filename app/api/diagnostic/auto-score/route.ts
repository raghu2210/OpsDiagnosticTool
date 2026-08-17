import { NextRequest, NextResponse } from "next/server";

interface AutoScoreRequest {
  observation: string;
  score_1_desc: string;
  score_2_desc: string;
  score_3_desc: string;
  score_4_desc: string;
  score_5_desc: string;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const MIN_OBSERVATION_LENGTH = 8;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ score: null, rationale: null });

  const body: AutoScoreRequest = await request.json();
  const observation = body.observation?.trim() ?? "";
  if (observation.length < MIN_OBSERVATION_LENGTH) return NextResponse.json({ score: null, rationale: null });

  const rubric = [1, 2, 3, 4, 5]
    .map((level) => `${level}: ${body[`score_${level}_desc` as keyof AutoScoreRequest]}`)
    .join("\n");

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You score a maturity-assessment observation against a 5-level rubric. " +
              'Reply with strict JSON only: {"score": <integer 1-5>, "rationale": <string>}. ' +
              "Pick the single level whose description best matches the evidence in the " +
              "observation. The rationale is 1 short sentence (max ~25 words), written directly " +
              "to the reviewer, citing the specific evidence from the observation that matched " +
              "(or fell short of) that level's criteria - not a restatement of the rubric text.",
          },
          {
            role: "user",
            content: `Rubric:\n${rubric}\n\nObservation:\n${observation}`,
          },
        ],
      }),
    });

    if (!res.ok) return NextResponse.json({ score: null, rationale: null });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content ?? "{}");
    const score = Number(parsed.score);
    const rationale = typeof parsed.rationale === "string" ? parsed.rationale.trim() : null;
    if (!Number.isInteger(score) || score < 1 || score > 5) return NextResponse.json({ score: null, rationale: null });

    return NextResponse.json({ score, rationale });
  } catch {
    return NextResponse.json({ score: null, rationale: null });
  }
}
