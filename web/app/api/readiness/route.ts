import { NextResponse } from "next/server";
import { loadReadiness, saveReadiness } from "@/lib/storage";
import { emptyState, type ReadinessState } from "@/lib/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — the current shared launch-readiness state (defaults before first save).
export async function GET() {
  const state = await loadReadiness();
  return NextResponse.json(state);
}

// PUT — overwrite the shared state. The client sends the full state object on
// each (debounced) change; we stamp the save time server-side.
export async function PUT(req: Request) {
  let incoming: Partial<ReadinessState>;
  try {
    incoming = (await req.json()) as Partial<ReadinessState>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const state: ReadinessState = {
    ...emptyState(),
    ...incoming,
    updatedAt: new Date().toISOString(),
  };

  try {
    await saveReadiness(state);
  } catch {
    return NextResponse.json({ error: "Could not persist state" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, updatedAt: state.updatedAt });
}
