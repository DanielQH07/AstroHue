import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>AstroHue</strong>
        <p>Independent color exploration, built around credited astronomy imagery.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/how-to-play">How to Play</Link>
        <Link href="/about">About</Link>
        <Link href="/credits">Credits</Link>
      </nav>
      <p className="disclaimer">
        AstroHue is an independent educational project and is not affiliated with
        or endorsed by NASA.
      </p>
    </footer>
  );
}
