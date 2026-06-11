import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HslSliderField } from "@/components/game/HslSliderField";
import { GuessHistory } from "@/components/game/GuessHistory";
import { FirstPlayDialog } from "@/components/game/FirstPlayDialog";
import { TargetRegionInspector } from "@/components/game/TargetRegionInspector";
import { createFeedback } from "@/src/lib/game/feedback";
import type { PublicPuzzle } from "@/src/types/puzzle";

const puzzle: PublicPuzzle = {
  id: "test",
  imageSrc: "/astro/nasa/pia08516.webp",
  width: 1200,
  height: 800,
  collectionLabel: "Studio Observatory",
  maxAttempts: 5,
  samplePoint: { x: 0.57, y: 0.39 },
  sampleRadius: 0.018,
  inspectionRegion: { centerX: 0.57, centerY: 0.39, width: 0.3, height: 0.3 },
};

describe("game components", () => {
  it("labels sliders and emits live values", () => {
    const onChange = vi.fn();
    render(<HslSliderField kind="hue" value={210} hue={210} disabled={false} onChange={onChange} />);
    const slider = screen.getByLabelText("Hue");
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "359");
    fireEvent.change(slider, { target: { value: "220" } });
    expect(onChange).toHaveBeenCalledWith(220);
  });

  it("hides feedback until provided and renders directional feedback afterward", () => {
    const { rerender } = render(<HslSliderField kind="hue" value={210} hue={210} disabled={false} onChange={() => {}} />);
    expect(screen.queryByLabelText("Move Hue slider right")).not.toBeInTheDocument();
    rerender(<HslSliderField kind="hue" value={210} hue={210} disabled={false} feedback={createFeedback({ h: 210, s: 50, l: 50 }, { h: 250, s: 50, l: 50 })} onChange={() => {}} />);
    expect(screen.getByText(">")).toBeInTheDocument();
    expect(screen.getByLabelText("Move Hue slider right")).toBeInTheDocument();
  });

  it("wraps hue keyboard input at slider boundaries", () => {
    const onChange = vi.fn();
    const { rerender } = render(<HslSliderField kind="hue" value={359} hue={359} disabled={false} onChange={onChange} />);
    fireEvent.keyDown(screen.getByLabelText("Hue"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(0);
    rerender(<HslSliderField kind="hue" value={0} hue={0} disabled={false} onChange={onChange} />);
    fireEvent.keyDown(screen.getByLabelText("Hue"), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith(359);
  });

  it("renders a persistent target inspector with a sample reticle", () => {
    render(<TargetRegionInspector puzzle={puzzle} guess={{ h: 210, s: 50, l: 50 }} onOpenZoom={() => {}} />);
    expect(screen.getByRole("heading", { name: "Inspect the sample" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open larger target inspector" })).toBeInTheDocument();
    expect(screen.getByText("Match this area")).toBeInTheDocument();
  });

  it("renders compact guess history", () => {
    const feedback = createFeedback({ h: 10, s: 30, l: 40 }, { h: 20, s: 60, l: 40 });
    render(<GuessHistory history={[{ attempt: 1, guess: { h: 10, s: 30, l: 40 }, hex: "#AA0000", score: 84, feedback }]} />);
    expect(screen.getByText("Guess 1")).toBeInTheDocument();
    expect(screen.getByText("84/100")).toBeInTheDocument();
    expect(screen.getByText("#AA0000")).toBeInTheDocument();
    expect(screen.getByText("More vivid")).toBeInTheDocument();
  });

  it("dismisses onboarding", () => {
    const dismiss = vi.fn();
    render(<FirstPlayDialog open onDismiss={dismiss} />);
    expect(screen.getByText("Find a color hidden in the cosmos")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(dismiss).toHaveBeenCalled();
  });
});
