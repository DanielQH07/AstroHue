"use client";

import Link from "next/link";
import { BarChart3, CircleHelp, Menu, Telescope, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  streak?: number;
  onOpenStats?: () => void;
};

export function GameHeader({ streak = 0, onOpenStats }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="wordmark" aria-label="AstroHue home">
          <span className="orbit-mark" aria-hidden="true">
            <Telescope size={17} />
          </span>
          <span>ASTRO<br />HUE</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/how-to-play">How to Play</Link>
          <Link href="/about">About</Link>
          {onOpenStats ? (
            <Button variant="quiet" onClick={onOpenStats}>
              <BarChart3 size={18} aria-hidden="true" /> Stats
            </Button>
          ) : null}
          {streak > 0 ? <span className="streak">{streak} streak</span> : null}
        </nav>
        <button
          className="icon-button mobile-menu-button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {menuOpen ? (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
          <Link href="/how-to-play"><CircleHelp size={18} /> How to Play</Link>
          <Link href="/about">About</Link>
          <Link href="/credits">Credits</Link>
          {onOpenStats ? (
            <button onClick={() => { onOpenStats(); setMenuOpen(false); }}>
              <BarChart3 size={18} /> Stats
            </button>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
