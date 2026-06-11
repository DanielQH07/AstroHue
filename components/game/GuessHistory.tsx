import { Check, RotateCcw, RotateCw, SunDim, SunMedium } from "lucide-react";
import type { GuessRecord } from "@/src/types/game";

const feedbackLabel: Record<string, string> = {
  correct: "Correct",
  clockwise: "Clockwise",
  "counter-clockwise": "Counter-clockwise",
  "more-vivid": "More vivid",
  "more-muted": "More muted",
  lighter: "Lighter",
  darker: "Darker",
};

function FeedbackIcon({ status }: { status: string }) {
  if (status === "correct") return <Check size={16} />;
  if (status === "clockwise") return <RotateCw size={16} />;
  if (status === "counter-clockwise") return <RotateCcw size={16} />;
  if (status === "lighter" || status === "more-vivid") return <SunMedium size={16} />;
  return <SunDim size={16} />;
}

export function GuessHistory({ history }: { history: GuessRecord[] }) {
  if (history.length === 0) return null;
  return (
    <section className="history-section" aria-labelledby="history-title">
      <div className="section-heading">
        <p className="eyebrow">Field notes</p>
        <h2 id="history-title">Previous guesses</h2>
      </div>
      <div className="history-list">
        {[...history].reverse().map((record) => (
          <article className="history-row" key={record.attempt}>
            <div className="history-color">
              <span style={{ background: record.hex }} aria-hidden="true" />
              <div>
                <small>Guess {record.attempt}</small>
                <strong>{record.score}/100</strong>
                <span>{record.hex}</span>
              </div>
            </div>
            {(["hue", "saturation", "lightness"] as const).map((kind) => {
              const status = record.feedback[kind].status;
              return (
                <div className="history-feedback" key={kind}>
                  <small>{kind}</small>
                  <span><FeedbackIcon status={status} /> {feedbackLabel[status]}</span>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </section>
  );
}
