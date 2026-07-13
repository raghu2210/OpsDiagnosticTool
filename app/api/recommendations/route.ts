import { NextResponse } from "next/server";
import { loadRecommendations } from "@/lib/data/masters-source";

export async function GET() {
  const recommendations = await loadRecommendations();
  return NextResponse.json(recommendations);
}
