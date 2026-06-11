import Link from "next/link";

export default function NotFound() {
  return <main className="error-shell"><p className="eyebrow">Uncharted space</p><h1>This page is not in the archive</h1><p>The address may have changed, or the page may only exist during development.</p><Link className="button button-primary" href="/">Return to the game</Link></main>;
}
