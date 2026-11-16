import { apiNotFound } from "@/lib/api/response";
import { NextResponse } from "next/server";
import { recipes } from "@/lib/data/recipes";
import { workouts } from "@/lib/data/workouts";
import { routineItems } from "@/lib/data/routines";

const catalogs = {
  recipes,
  workouts,
  routines: routineItems,
} as const;

type CatalogType = keyof typeof catalogs;

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string }> },
) {
  const { type } = await context.params;
  if (!(type in catalogs)) {
    return apiNotFound();
  }

  const key = type as CatalogType;
  return NextResponse.json(
    { items: catalogs[key] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
