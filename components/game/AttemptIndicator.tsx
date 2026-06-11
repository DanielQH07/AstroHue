type Props = { used: number; won: boolean; completed: boolean };

export function AttemptIndicator({ used, won, completed }: Props) {
  return (
    <div className="attempt-indicator">
      <div className="attempt-dots" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => {
          const state =
            index < used
              ? won && index === used - 1
                ? "winning"
                : "used"
              : !completed && index === used
                ? "current"
                : "remaining";
          return <span className={`attempt-dot ${state}`} key={index} />;
        })}
      </div>
      <span className="sr-only">
        {used} of five guesses used. {5 - used} guesses remaining.
      </span>
    </div>
  );
}
