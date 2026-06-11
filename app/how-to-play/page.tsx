import type { Metadata } from "next";
import { GameHeader } from "@/components/layout/GameHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "How to Play",
  description: "Learn how hue, saturation, lightness, and directional clues work in AstroHue.",
};

export default function HowToPlayPage() {
  return (
    <div className="info-layout">
      <GameHeader />
      <main className="content-shell">
        <header>
          <p className="eyebrow">Field guide</p>
          <h1>How to read color in the cosmos</h1>
          <p>AstroHue asks you to find one sampled color inside a complete astronomy image. You have five coordinated guesses.</p>
        </header>
        <section className="prose-section"><h2>The goal</h2><p>Inspect the target area, shape a color with three sliders, and submit it. The marker identifies the small patch to match, but the HSL answer stays hidden until the round ends.</p></section>
        <section className="prose-section"><h2>Three ways to move</h2><ul><li><strong>Hue</strong> travels around a circular color wheel. A clue may send you clockwise through neighboring color families or counter-clockwise across zero.</li><li><strong>Saturation</strong> controls whether a color feels muted or vivid.</li><li><strong>Lightness</strong> moves from shadow toward white.</li></ul></section>
        <section className="prose-section"><h2>Read the clues</h2><p>After every guess, each component shows one symbol: &lt; means move the slider left, &gt; means move it right, and ✓ means that component is within tolerance.</p></section>
        <section className="prose-section"><h2>Look closer</h2><p>The inspector shows a magnified crop of the target area with a reticle over the exact patch to match. The image remains fully colored throughout play.</p></section>
        <section className="prose-section"><h2>Accessible play</h2><p>Every clue is written in text, sliders work with arrow keys, focus remains visible, and reduced-motion preferences are respected. Color is never the only way game state is communicated.</p></section>
      </main>
      <SiteFooter />
    </div>
  );
}
