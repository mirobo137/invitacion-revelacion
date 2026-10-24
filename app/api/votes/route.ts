import { count, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { votes } from "../../../db/schema";

export const dynamic = "force-dynamic";

const visitorIdPattern = /^[A-Za-z0-9-]{16,80}$/;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

async function getTotals() {
  const db = getDb();
  const rows = await db
    .select({ choice: votes.choice, total: count() })
    .from(votes)
    .groupBy(votes.choice);

  const totals = { boy: 0, girl: 0 };
  for (const row of rows) totals[row.choice] = Number(row.total);
  return { ...totals, total: totals.boy + totals.girl };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const visitorId = url.searchParams.get("visitorId");
    const counts = await getTotals();
    let existingChoice: "boy" | "girl" | null = null;

    if (visitorId && visitorIdPattern.test(visitorId)) {
      const [existing] = await getDb()
        .select({ choice: votes.choice })
        .from(votes)
        .where(eq(votes.visitorId, visitorId))
        .limit(1);
      existingChoice = existing?.choice ?? null;
    }

    return json({ counts, existingChoice });
  } catch {
    return json(
      { error: "La votación todavía se está preparando. Intenta de nuevo en un momento." },
      503,
    );
  }
}

export async function POST(request: Request) {
  let payload: { visitorId?: unknown; choice?: unknown };
  try {
    payload = (await request.json()) as { visitorId?: unknown; choice?: unknown };
  } catch {
    return json({ error: "No pudimos leer tu voto." }, 400);
  }

  const visitorId = typeof payload.visitorId === "string" ? payload.visitorId : "";
  const choice = payload.choice;
  if (!visitorIdPattern.test(visitorId)) {
    return json({ error: "No pudimos identificar este navegador. Recarga la invitación e inténtalo otra vez." }, 400);
  }
  if (choice !== "boy" && choice !== "girl") {
    return json({ error: "Elige niño o niña para votar." }, 400);
  }

  try {
    const db = getDb();
    const inserted = await db
      .insert(votes)
      .values({ visitorId, choice })
      .onConflictDoNothing()
      .returning({ visitorId: votes.visitorId });

    const [existing] = await db
      .select({ choice: votes.choice })
      .from(votes)
      .where(eq(votes.visitorId, visitorId))
      .limit(1);
    const counts = await getTotals();

    return json(
      {
        counts,
        choice: existing?.choice ?? null,
        accepted: inserted.length > 0,
      },
      inserted.length > 0 ? 201 : 200,
    );
  } catch {
    return json(
      { error: "No pudimos guardar el voto ahora. Intenta de nuevo en un momento." },
      503,
    );
  }
}
