import type { Metadata } from "next";
import { Info, Shield, Scale } from "lucide-react";
import { GameHeader } from "@/components/layout/GameHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "About",
  description: "About AstroHue, its offline color sampling, privacy, and independent status.",
};

export default function AboutPage() {
  return (
    <div className="info-layout">
      <GameHeader />
      <main className="content-shell">
        <header><p className="eyebrow">About the project</p><h1>A small observatory for color</h1><p>AstroHue is an independent browser game designed for casual color exploration through astronomy imagery.</p></header>
        <section className="prose-section">
          <h2><Info size={24} className="inline-icon" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />How it works</h2>
          <p>Target colors and sample locations are prepared offline from local image files. No segmentation model runs while you play, and the image is only temporarily recolored when you use the guess sliders.</p>
        </section>
        <section className="prose-section">
          <h2><Shield size={24} className="inline-icon" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />Private by default</h2>
          <p>No account is required. The MVP has no advertising, analytics, or tracking SDK. Onboarding state, unfinished public round data, and game statistics stay securely inside your browser&apos;s local storage.</p>
        </section>
        <section className="prose-section">
          <h2><Scale size={24} className="inline-icon" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />Image responsibility</h2>
          <p>Every image requires an individual attribution and rights review before public release. NASA-hosted content may include third-party material, so AstroHue does not claim that every record is public domain.</p>
          <p><strong>AstroHue is not affiliated with or endorsed by NASA.</strong> NASA insignia, logotypes, and visual identity are not used as AstroHue branding.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
