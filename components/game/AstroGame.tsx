"use client";

import { Clipboard, LoaderCircle, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameHeader } from "@/components/layout/GameHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import type { GameStatus, GuessRecord, GuessResponse, RevealData, RoundResponse } from "@/src/types/game";
import type { HslColor, PublicPuzzle } from "@/src/types/puzzle";
import { hslToHex } from "@/src/lib/color/conversions";
import { colorFamilyName } from "@/src/lib/color/naming";
import { closestGuess } from "@/src/lib/game/scoring";
import {
  DEFAULT_STORAGE,
  EMPTY_STATS,
  loadStorage,
  saveStorage,
  updateStats,
  type AstroStorage,
  type GameStats,
} from "@/src/lib/storage/localStats";
import { AstroImageCard } from "./AstroImageCard";
import { AttemptIndicator } from "./AttemptIndicator";
import { ChallengeGrid } from "./ChallengeGrid";
import { FirstPlayDialog } from "./FirstPlayDialog";
import { GuessHistory } from "./GuessHistory";
import { HslSliderField } from "./HslSliderField";
import { ImageZoomDialog } from "./ImageZoomDialog";
import { ResultPanel } from "./ResultPanel";
import { StatsDialog } from "./StatsDialog";
import { TargetRegionInspector } from "./TargetRegionInspector";

export function AstroGame() {
  const [status, setStatus] = useState<GameStatus>("loading");
  const [challenges, setChallenges] = useState<PublicPuzzle[]>([]);
  const [puzzle, setPuzzle] = useState<PublicPuzzle>();
  const [token, setToken] = useState("");
  const [guess, setGuess] = useState<HslColor>({ h: 210, s: 50, l: 50 });
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [reveal, setReveal] = useState<RevealData>();
  const [error, setError] = useState("");
  const [playedIds, setPlayedIds] = useState<string[]>([]);
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const inspectorRef = useRef<HTMLButtonElement | null>(null);
  const storageRef = useRef<AstroStorage>(structuredClone(DEFAULT_STORAGE));
  const hydrated = useRef(false);

  const persist = useCallback((round?: AstroStorage["round"]) => {
    const next: AstroStorage = {
      ...storageRef.current,
      ...(round ? { round } : { round: undefined }),
    };
    storageRef.current = next;
    saveStorage(next);
  }, []);

  const loadChallenges = useCallback(async () => {
    const response = await fetch("/api/challenges", { cache: "no-store" });
    const data = (await response.json()) as { puzzles?: PublicPuzzle[]; error?: string };
    if (!response.ok || !data.puzzles) {
      throw new Error(data.error || "The challenge list could not be loaded.");
    }
    setChallenges(data.puzzles);
  }, []);

  const loadRound = useCallback(async (excluded: string[], puzzleId?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError("");
    setReveal(undefined);
    setHistory([]);
    try {
      const response = await fetch("/api/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeIds: excluded.slice(-100), ...(puzzleId ? { puzzleId } : {}) }),
        cache: "no-store",
        signal: controller.signal,
      });
      const data = (await response.json()) as RoundResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "A new image could not be loaded.");
      setPuzzle(data.puzzle);
      setToken(data.roundToken);
      setGuess(data.initialGuess);
      setStatus("ready");
      persist({ roundToken: data.roundToken, puzzle: data.puzzle, guess: data.initialGuess, history: [] });
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "A new image could not be loaded.");
      setStatus("error");
    }
  }, [persist]);

  useEffect(() => {
    if (hydrated.current) return;
    const timer = window.setTimeout(() => {
      if (hydrated.current) return;
      hydrated.current = true;
      void (async () => {
      const stored = loadStorage();
      storageRef.current = stored;
      setPlayedIds(stored.playedIds);
      setStats(stored.stats);
      setOnboardingOpen(!stored.onboardingDismissed);
      await loadChallenges();
      if (stored.round) {
        setPuzzle(stored.round.puzzle);
        setToken(stored.round.roundToken);
        setGuess(stored.round.guess);
        setHistory(stored.round.history);
        setStatus("ready");
      } else {
        setStatus("selecting");
      }
      })().catch((caught) => {
        setError(caught instanceof Error ? caught.message : "The challenge list could not be loaded.");
        setStatus("error");
      });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [loadChallenges]);

  useEffect(() => {
    if (!puzzle || !token || status === "loading" || status === "won" || status === "lost") return;
    persist({ roundToken: token, puzzle, guess, history });
  }, [guess, history, persist, puzzle, status, token]);

  const hex = useMemo(() => hslToHex(guess), [guess]);
  const attempt = history.length;
  const won = status === "won";
  const closest = reveal ? closestGuess(history, reveal.target) : undefined;
  const latestScore = history.at(-1)?.score;
  const previousScore = history.at(-2)?.score;
  const scoreDelta =
    latestScore !== undefined && previousScore !== undefined
      ? latestScore - previousScore
      : undefined;

  async function submitGuess() {
    if (status !== "ready" || !puzzle) return;
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundToken: token, guess }),
        cache: "no-store",
      });
      const data = (await response.json()) as GuessResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "Your guess could not be checked.");
      const record: GuessRecord = { attempt: data.attempt, guess, hex, score: data.score, feedback: data.feedback };
      const nextHistory = [...history, record];
      setHistory(nextHistory);
      if (data.completed && data.reveal) {
        setReveal(data.reveal);
        setStatus(data.won ? "won" : "lost");
        setPlayedIds((ids) => [...new Set([...ids, puzzle.id])]);
        const nextStats = updateStats(stats, data.won, data.attempt);
        setStats(nextStats);
        storageRef.current = { ...storageRef.current, playedIds: [...new Set([...playedIds, puzzle.id])], stats: nextStats, round: undefined };
        saveStorage(storageRef.current);
      } else {
        setToken(data.nextRoundToken ?? token);
        setStatus("ready");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your guess could not be checked.");
      setStatus("ready");
    }
  }

  const dismissOnboarding = () => {
    setOnboardingOpen(false);
    storageRef.current = { ...storageRef.current, onboardingDismissed: true };
    saveStorage(storageRef.current);
  };

  if (!puzzle && status === "loading") {
    return (
      <>
        <GameHeader onOpenStats={() => setStatsOpen(true)} />
        <main className="loading-shell" aria-live="polite">
          <LoaderCircle className="spinner" aria-hidden="true" />
          <h1>Opening the observatory</h1>
          <p>Preparing a color challenge from the local archive.</p>
        </main>
      </>
    );
  }

  if (!puzzle && status === "selecting") {
    return (
      <>
        <GameHeader streak={stats.currentStreak} onOpenStats={() => setStatsOpen(true)} />
        <main className="game-shell">
          <section className="game-status">
            <div>
              <p className="eyebrow">Cosmic Archive</p>
              <h1>Pick a hidden color challenge</h1>
            </div>
          </section>
          <ChallengeGrid
            puzzles={challenges}
            playedIds={playedIds}
            onSelect={(item) => void loadRound(playedIds, item.id)}
          />
        </main>
        <SiteFooter />
        <FirstPlayDialog open={onboardingOpen} onDismiss={dismissOnboarding} />
        <StatsDialog open={statsOpen} onOpenChange={setStatsOpen} stats={stats} />
      </>
    );
  }

  if (!puzzle) {
    return (
      <>
        <GameHeader onOpenStats={() => setStatsOpen(true)} />
        <main className="error-shell">
          <p className="eyebrow">Signal interrupted</p>
          <h1>The observatory could not open</h1>
          <p>{error}</p>
          <Button onClick={() => void loadRound(playedIds)}><RefreshCcw size={18} /> Try again</Button>
        </main>
      </>
    );
  }

  return (
    <>
      <a className="skip-link" href="#game-controls">Skip to game controls</a>
      <GameHeader streak={stats.currentStreak} onOpenStats={() => setStatsOpen(true)} />
      <main className="game-shell">
        <section className="game-status">
          <div>
            <p className="eyebrow">{puzzle.collectionLabel}</p>
            <h1>Restore the missing color</h1>
          </div>
          <div className="attempt-summary">
            <strong>
              {status === "won" || status === "lost"
                ? `${attempt} of 5 guesses used`
                : `Guess ${Math.min(attempt + 1, 5)} of 5`}
            </strong>
            <AttemptIndicator
              used={attempt}
              won={won}
              completed={status === "won" || status === "lost"}
            />
          </div>
        </section>

        <div className="game-grid">
          <AstroImageCard
            puzzle={puzzle}
            guess={guess}
            reveal={reveal}
            onInspect={() => inspectorRef.current?.focus()}
            onZoom={() => setZoomOpen(true)}
          />
          <TargetRegionInspector
            ref={inspectorRef}
            puzzle={puzzle}
            guess={guess}
            onOpenZoom={() => setZoomOpen(true)}
          />
          <section id="game-controls" className="control-panel" aria-labelledby="controls-title">
            <p className="eyebrow">Your color</p>
            <div className="current-swatch">
              <div
                style={{ background: hex }}
                role="img"
                aria-label={`Current color ${hex}`}
              />
              <div>
                <h2 id="controls-title">{colorFamilyName(guess.h)}</h2>
                <strong>{hex}</strong>
                <span>H {guess.h} · S {guess.s} · L {guess.l}</span>
              </div>
              <button
                className="icon-button"
                aria-label="Copy current HEX value"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(hex); setCopyStatus("HEX copied."); }
                  catch { setCopyStatus("Clipboard unavailable."); }
                }}
              >
                <Clipboard size={18} />
              </button>
            </div>
            <p className="status-message" role="status">{copyStatus}</p>
            {latestScore !== undefined ? (
              <div className="score-meter" aria-live="polite">
                <div>
                  <span>Last score</span>
                  <strong>{latestScore}/100</strong>
                </div>
                {scoreDelta !== undefined ? (
                  <span className={scoreDelta >= 0 ? "score-delta up" : "score-delta down"}>
                    {scoreDelta >= 0 ? "+" : ""}
                    {scoreDelta}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="slider-stack">
              {(["hue", "saturation", "lightness"] as const).map((kind) => (
                <HslSliderField
                  key={kind}
                  kind={kind}
                  value={kind === "hue" ? guess.h : kind === "saturation" ? guess.s : guess.l}
                  hue={guess.h}
                  disabled={status === "submitting" || status === "won" || status === "lost"}
                  feedback={history.at(-1)?.feedback}
                  onChange={(value) => setGuess((current) => ({ ...current, [kind === "hue" ? "h" : kind === "saturation" ? "s" : "l"]: value }))}
                />
              ))}
            </div>
            <Button
              className="submit-button"
              disabled={status === "submitting" || status === "won" || status === "lost"}
              onClick={submitGuess}
            >
              {status === "submitting" ? <><LoaderCircle className="spinner" size={18} /> Checking color...</> : attempt === 0 ? "Submit first guess" : "Submit guess"}
            </Button>
            {error ? (
              <div className="inline-error" role="alert">
                <span>{error}</span>
                <Button variant="quiet" onClick={submitGuess}>Retry this guess</Button>
              </div>
            ) : null}
            <p className="live-announcement" aria-live="polite">
              {history.length
                ? `Guess ${history.length} checked. Hue ${history.at(-1)?.feedback.hue.symbol}, saturation ${history.at(-1)?.feedback.saturation.symbol}, lightness ${history.at(-1)?.feedback.lightness.symbol}.`
                : ""}
            </p>
          </section>
        </div>

        <GuessHistory history={history} />
      </main>
      <SiteFooter />
      <FirstPlayDialog open={onboardingOpen} onDismiss={dismissOnboarding} />
      <StatsDialog open={statsOpen} onOpenChange={setStatsOpen} stats={stats} />
      <ImageZoomDialog open={zoomOpen} onOpenChange={setZoomOpen} puzzle={puzzle} reveal={reveal} />
      {reveal && closest ? (
        <ResultPanel
          won={won}
          attempt={attempt}
          reveal={reveal}
          closest={closest}
          history={history}
          puzzle={puzzle}
          finalGuess={guess}
          onNext={() => void loadRound([...playedIds, puzzle.id])}
        />
      ) : null}
    </>
  );
}
