import { NextResponse } from "next/server";
import { loadTracker } from "@/lib/data/tracker-source";

export async function GET() {
  const rows = await loadTracker();
  return NextResponse.json(rows);
}
