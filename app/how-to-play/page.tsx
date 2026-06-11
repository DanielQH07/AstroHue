import type { Metadata } from "next";
import { Compass, Palette, Target, ScanEye } from "lucide-react";
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
        <section className="prose-section">
          <h2><Target size={24} className="inline-icon" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />The goal</h2>
          <p>Inspect the target area, shape a color with three sliders, and submit it. A transparent gray mask highlights the parts of the image that match your color guess. Your goal is to match the hidden target color perfectly.</p>
        </section>
        <section className="prose-section">
          <h2><Palette size={24} className="inline-icon" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />Three ways to move</h2>
          <ul>
            <li><strong>Hue</strong> travels around a circular color wheel. A clue may send you clockwise through neighboring color families or counter-clockwise across zero.</li>
            <li><strong>Saturation</strong> controls whether a color feels muted or vivid.</li>
            <li><strong>Lightness</strong> moves from shadow toward white.</li>
          </ul>
        </section>
        <section className="prose-section">
          <h2><Compass size={24} className="inline-icon" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />Read the clues</h2>
          <p>After every guess, each component shows one symbol: &lt; means move the slider left, &gt; means move it right, and ✓ means that component is exactly matched. A perfect match scores 100.</p>
        </section>
        <section className="prose-section">
          <h2><ScanEye size={24} className="inline-icon" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />Look closer</h2>
          <p>You can zoom in on the image to inspect the colorful cosmos in detail. Notice how the gray mask only covers pixels of your guessed color!</p>
        </section>
        <section className="prose-section">
          <h2>Accessible play</h2>
          <p>Every clue is written in text, sliders work with arrow keys, focus remains visible, and reduced-motion preferences are respected. Color is never the only way game state is communicated.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
