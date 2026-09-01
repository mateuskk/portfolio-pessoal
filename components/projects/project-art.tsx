"use client";

import { useRef, useState, type PointerEvent } from "react";
import { motion } from "motion/react";

import type { Project } from "@/content/portfolio";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { cn } from "@/lib/utils";

type Bounds = Pick<DOMRect, "left" | "top" | "width" | "height">;

type ProjectArtProps = {
  direction: Project["artDirection"];
  title: string;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getProjectTilt(clientX: number, clientY: number, bounds: Bounds) {
  const normalizedX = ((clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 2;
  const normalizedY = ((clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5) * 2;

  return {
    rotateX: clamp(-normalizedY * 5, -5, 5),
    rotateY: clamp(normalizedX * 5, -5, 5),
    z: clamp(Math.max(Math.abs(normalizedX), Math.abs(normalizedY)) * 28, 0, 28),
  };
}

export function supportsProjectTilt(pointerType: string, reduceMotion: boolean, capablePointer: boolean) {
  return pointerType === "mouse" && !reduceMotion && capablePointer;
}

export function ProjectArt({ direction, title, className }: ProjectArtProps) {
  const reduceMotion = useReducedMotionPreference();
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, z: 0 });
  const artRef = useRef<HTMLDivElement>(null);

  const updateTilt = (event: PointerEvent<HTMLDivElement>) => {
    const capablePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!supportsProjectTilt(event.pointerType, reduceMotion, capablePointer) || !artRef.current) {
      setTilt({ rotateX: 0, rotateY: 0, z: 0 });
      return;
    }
    setTilt(getProjectTilt(event.clientX, event.clientY, artRef.current.getBoundingClientRect()));
  };

  const resetTilt = () => setTilt({ rotateX: 0, rotateY: 0, z: 0 });
  const renderedTilt = reduceMotion ? { rotateX: 0, rotateY: 0, z: 0 } : tilt;

  return (
    <div
      aria-hidden="true"
      className={cn("relative min-h-72 overflow-hidden bg-paper/80 text-ink [perspective:1100px] sm:min-h-96 lg:min-h-0", className)}
      onPointerMove={updateTilt}
      onPointerLeave={resetTilt}
      ref={artRef}
    >
      <motion.div
        className="absolute inset-[7%] overflow-hidden border border-black/20 bg-paper shadow-[0_30px_80px_rgb(0_0_0/0.18)] will-change-transform [transform-style:preserve-3d]"
        animate={{ rotateX: renderedTilt.rotateX, rotateY: renderedTilt.rotateY, z: renderedTilt.z }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 20, mass: 0.65 }}
      >
        <span className="absolute left-4 top-4 z-20 text-[0.58rem] uppercase tracking-[0.2em]">Project / {title}</span>
        <span className="absolute bottom-4 right-4 z-20 text-[0.58rem] uppercase tracking-[0.2em]">Selected work</span>

        {direction === "orbital" && (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,transparent_0_20%,rgb(9_9_9/0.05)_21%,transparent_22%)]">
            <div className="absolute aspect-square w-[76%] rounded-full border border-black/25" />
            <div className="absolute aspect-square w-[52%] rotate-[22deg] rounded-[42%] border-[2px] border-black/75" />
            <div className="absolute aspect-[3/1] w-[88%] -rotate-[18deg] rounded-[50%] border border-black/35" />
            <div className="size-[13%] rounded-full bg-ink shadow-[0_0_0_12px_rgb(9_9_9/0.08)]" />
          </div>
        )}

        {direction === "grid" && (
          <div className="absolute inset-0 bg-[linear-gradient(rgb(9_9_9/0.11)_1px,transparent_1px),linear-gradient(90deg,rgb(9_9_9/0.11)_1px,transparent_1px)] bg-[size:12.5%_12.5%]">
            <div className="absolute left-[13%] top-[18%] h-[52%] w-[34%] border-2 border-black/75 bg-black/10" />
            <div className="absolute bottom-[13%] right-[11%] h-[38%] w-[48%] bg-ink p-4 text-paper">
              <span className="block h-px w-full bg-white/35" />
              <span className="mt-4 block h-px w-3/5 bg-white/35" />
              <span className="absolute bottom-4 text-[clamp(2rem,5vw,5rem)] leading-none tracking-[-0.08em]">M / 02</span>
            </div>
          </div>
        )}

        {direction === "wave" && (
          <div className="absolute inset-0 grid place-items-center">
            {[0, 1, 2, 3].map((layer) => (
              <div
                key={layer}
                className="absolute h-[34%] w-[78%] rounded-[48%_52%_45%_55%/57%_42%_58%_43%] border border-black/70"
                style={{ transform: `rotate(${layer * 13 - 20}deg) scale(${1 - layer * 0.12}) translateZ(${layer * 10}px)` }}
              />
            ))}
            <div className="absolute h-[12%] w-[42%] rotate-[-8deg] rounded-full bg-ink" />
          </div>
        )}

        {direction === "type" && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <span className="absolute font-serif text-[clamp(10rem,30vw,32rem)] italic leading-none tracking-[-0.13em] text-black/90">S</span>
            <span className="absolute inset-x-[8%] top-1/2 h-px bg-white mix-blend-difference" />
            <span className="absolute rotate-90 text-[0.65rem] uppercase tracking-[0.55em] text-paper mix-blend-difference">Sillage / Identity</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
