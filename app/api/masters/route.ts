import { NextResponse } from "next/server";
import { loadMasters } from "@/lib/data/masters-source";

export async function GET() {
  const masters = await loadMasters();
  const active = masters.filter((row) => row.status === "active");
  return NextResponse.json(active);
}
