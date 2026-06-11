import type { GuessFeedback } from "@/src/types/game";

type Props = {
  kind: "hue" | "saturation" | "lightness";
  value: number;
  hue: number;
  disabled: boolean;
  feedback?: GuessFeedback;
  onChange: (value: number) => void;
};

function descriptor(kind: Props["kind"], value: number) {
  if (kind === "saturation") {
    return value < 20 ? "Muted" : value < 40 ? "Soft" : value < 65 ? "Balanced" : value < 85 ? "Vivid" : "Intense";
  }
  if (kind === "lightness") {
    return value < 20 ? "Very dark" : value < 40 ? "Dark" : value < 65 ? "Midtone" : value < 85 ? "Light" : "Very light";
  }
  return "Color wheel";
}

function feedbackHint(kind: Props["kind"], feedback?: GuessFeedback) {
  if (!feedback) return null;
  const label = kind[0].toUpperCase() + kind.slice(1);
  const symbol = feedback[kind].symbol;
  return {
    symbol,
    label:
      symbol === "✓"
        ? `${label} is correct`
        : `Move ${label} slider ${symbol === ">" ? "right" : "left"}`,
  };
}

export function HslSliderField({
  kind,
  value,
  hue,
  disabled,
  feedback,
  onChange,
}: Props) {
  const label = kind[0].toUpperCase() + kind.slice(1);
  const max = kind === "hue" ? 359 : 100;
  const style =
    kind === "hue"
      ? undefined
      : kind === "saturation"
        ? { background: `linear-gradient(90deg,hsl(${hue} 0% 50%),hsl(${hue} 100% 50%))` }
        : { background: `linear-gradient(90deg,#000,hsl(${hue} 75% 50%),#fff)` };
  const hint = feedbackHint(kind, feedback);

  return (
    <div className="slider-field">
      <div className="slider-heading">
        <label htmlFor={`slider-${kind}`}>{label}</label>
        <span className="slider-value">
          <strong>{value}</strong> · {descriptor(kind, value)}
          {hint ? (
            <b className="feedback-symbol" aria-label={hint.label} title={hint.label}>
              {hint.symbol}
            </b>
          ) : null}
        </span>
      </div>
      <input
        id={`slider-${kind}`}
        className={`hsl-slider ${kind}`}
        type="range"
        min="0"
        max={max}
        step="1"
        value={value}
        disabled={disabled}
        aria-valuetext={`${value}, ${descriptor(kind, value)}`}
        style={style}
        onChange={(event) => onChange(Number(event.target.value))}
        onKeyDown={(event) => {
          if (kind !== "hue") return;
          if (event.key === "ArrowRight" && value === 359) {
            event.preventDefault();
            onChange(0);
          }
          if (event.key === "ArrowLeft" && value === 0) {
            event.preventDefault();
            onChange(359);
          }
        }}
      />
    </div>
  );
}
