import Image from "next/image";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { GameHeader } from "@/components/layout/GameHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getPublicCredits } from "@/src/data/puzzles.server";

export const metadata: Metadata = {
  title: "Image Credits",
  description: "Sources and attribution for imagery included in AstroHue.",
};

export default function CreditsPage() {
  const credits = getPublicCredits();
  return (
    <div className="info-layout">
      <GameHeader />
      <main className="content-shell">
        <header><p className="eyebrow">Image ledger</p><h1>Credits and source notes</h1><p>Only approved local records appear in the game. Each external record still requires manual attribution and rights review before release.</p></header>
        <div className="credits-grid">
          {credits.map((item) => (
            <article className="credit-card" key={item.id}>
              <div className="credit-image"><Image src={item.imageSrc} alt="" fill sizes="160px" loading="lazy" /></div>
              <div className="credit-copy">
                <h2>{item.title}</h2>
                <p><strong>Credit:</strong> {item.credit}</p>
                {item.nasaId ? <p><strong>NASA ID:</strong> {item.nasaId}</p> : null}
                <p>{item.rightsReview.notes}</p>
                <a href={item.sourceUrl} target={item.sourceUrl.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer">
                  {item.sourceLabel} <ExternalLink size={14} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
        <section className="prose-section"><h2>Independent-project notice</h2><p>AstroHue is an independent educational project and is not affiliated with or endorsed by NASA. NASA identifiers and logos are not part of the project identity.</p></section>
      </main>
      <SiteFooter />
    </div>
  );
}
