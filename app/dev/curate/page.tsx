import { notFound } from "next/navigation";
import { Curator } from "@/components/dev/Curator";
import { getPuzzlesForCuration } from "@/src/data/puzzles.server";

export const dynamic = "force-dynamic";

export default function CuratePage() {
  if (process.env.NODE_ENV === "production") notFound();
  const puzzles = getPuzzlesForCuration();
  return (
    <main className="content-shell">
      <header><p className="eyebrow">Development only</p><h1>Target review</h1><p>Inspect generated candidates and copy a record for manual editing. This route is unavailable in production.</p></header>
      <Curator puzzles={puzzles} />
    </main>
  );
}
