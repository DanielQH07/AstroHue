"use client";

import Image from "next/image";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { RevealData } from "@/src/types/game";
import type { PublicPuzzle } from "@/src/types/puzzle";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puzzle: PublicPuzzle;
  reveal?: RevealData;
};

export function ImageZoomDialog({ open, onOpenChange, puzzle, reveal }: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}
      title="Image observatory"
      description="Zoom and pan to inspect color details."
      className="zoom-dialog"
    >
      <div
        className="zoom-viewport"
        onWheel={(event) => {
          event.preventDefault();
          setScale((value) => Math.min(4, Math.max(1, value + (event.deltaY < 0 ? 0.25 : -0.25))));
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrag({ x: event.clientX - offset.x, y: event.clientY - offset.y });
        }}
        onPointerMove={(event) => {
          if (drag && scale > 1) setOffset({ x: event.clientX - drag.x, y: event.clientY - drag.y });
        }}
        onPointerUp={() => setDrag(null)}
      >
        <div
          className="zoom-canvas"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        >
          <Image
            src={puzzle.imageSrc}
            alt={reveal ? reveal.title : "Featured astronomy image enlarged"}
            fill
            sizes="95vw"
            className="challenge-image"
            draggable={false}
          />
        </div>
      </div>
      <div className="zoom-controls">
        <Button variant="secondary" onClick={() => setScale((value) => Math.max(1, value - 0.25))}>
          <ZoomOut size={18} /> Zoom out
        </Button>
        <span>{Math.round(scale * 100)}%</span>
        <Button variant="secondary" onClick={() => setScale((value) => Math.min(4, value + 0.25))}>
          <ZoomIn size={18} /> Zoom in
        </Button>
        <Button variant="quiet" onClick={reset}><RotateCcw size={18} /> Reset</Button>
      </div>
    </Dialog>
  );
}
