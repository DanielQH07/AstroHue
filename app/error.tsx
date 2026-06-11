"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="error-shell"><p className="eyebrow">Signal interrupted</p><h1>Something went off course</h1><p>The page could not be displayed. No game data was sent elsewhere.</p><Button onClick={reset}>Try again</Button></main>;
}
