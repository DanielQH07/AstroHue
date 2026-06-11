"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

const STEPS = [
  ["Find a color hidden in the cosmos", "The target marker shows the small image patch you are matching."],
  ["Shape your color", "Hue chooses the color family. Saturation controls how vivid or muted it is. Lightness controls how bright or dark it is."],
  ["Follow the clues", "< means move the slider left. > means move it right. ✓ means that component is correct."],
] as const;

export function FirstPlayDialog({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  const [step, setStep] = useState(0);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => { if (!next) onDismiss(); }}
      title={STEPS[step][0]}
      description={`Step ${step + 1} of ${STEPS.length}`}
    >
      <div className="onboarding-art" aria-hidden="true">
        <span style={{ background: ["#315BDB", "#A653C5", "#2F7251"][step] }} />
      </div>
      <p className="onboarding-copy">{STEPS[step][1]}</p>
      <div className="onboarding-progress" aria-hidden="true">
        {STEPS.map((_, index) => <span className={index === step ? "active" : ""} key={index} />)}
      </div>
      <div className="dialog-actions">
        <Button variant="quiet" onClick={onDismiss}>Skip</Button>
        <Button onClick={() => step === STEPS.length - 1 ? onDismiss() : setStep((value) => value + 1)}>
          {step === STEPS.length - 1 ? "Start exploring" : "Continue"}
        </Button>
      </div>
    </Dialog>
  );
}
