"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/cn";

interface ATSGaugeProps {
  /** Final score, 0..100 */
  value: number;
  size?: number;
  /** Stroke width of the progress arc, in px. */
  thickness?: number;
  /** Sub-label shown beneath the big number. */
  label?: string;
  className?: string;
}

const STROKE_GRADIENT_ID = "procv-gauge-gradient";
const GLOW_FILTER_ID = "procv-gauge-glow";

/**
 * ATSGauge — circular SVG gauge with a tri-stop gradient, soft glow filter,
 * and an animated numeric value that counts up as the score changes.
 *
 * Implementation notes:
 *   - The arc is drawn with `pathLength=1` so we can drive progress via
 *     a single normalized motion value (0..1).
 *   - The text is animated with Framer Motion via `useMotionValue` →
 *     `useTransform` → `motion.span` to avoid a layout-thrashing setInterval.
 */
export function ATSGauge({
  value,
  size = 200,
  thickness = 14,
  label = "ProCV Score",
  className,
}: ATSGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const progress = useMotionValue(0);
  const display = useTransform(progress, (v) => Math.round(v * 100));

  React.useEffect(() => {
    const controls = animate(progress, clamped / 100, {
      duration: 1.05,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [clamped, progress]);

  const radius = size / 2 - thickness / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  // Color mood inferred from the score range — kept in component so callers
  // don't need to thread tones down through the prop chain.
  const mood = scoreMood(clamped);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={`${label} ${clamped} out of 100`}
      role="img"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id={STROKE_GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <filter id={GLOW_FILTER_ID} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
        />

        {/* Progress arc */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={`url(#${STROKE_GRADIENT_ID})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          pathLength={1}
          style={{
            pathLength: progress,
            filter: `url(#${GLOW_FILTER_ID})`,
          }}
        />

        {/* Decorative outer ring tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * Math.PI * 2;
          const r1 = radius + thickness / 2 + 6;
          const r2 = r1 + (i % 5 === 0 ? 4 : 2);
          const x1 = cx + Math.cos(angle) * r1;
          const y1 = cy + Math.sin(angle) * r1;
          const x2 = cx + Math.cos(angle) * r2;
          const y2 = cy + Math.sin(angle) * r2;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={i % 5 === 0 ? 1.25 : 0.75}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">
        <div className="flex flex-col items-center">
          <motion.span
            className="text-5xl font-semibold tracking-tight text-brand-gradient tabular-nums"
            style={{ lineHeight: 1 }}
          >
            <motion.span>{display}</motion.span>
          </motion.span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-tertiary">
            {label}
          </span>
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide",
              mood.tone,
            )}
          >
            <span className={cn("h-1 w-1 rounded-full", mood.dot)} />
            {mood.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function scoreMood(score: number) {
  if (score >= 85)
    return {
      label: "Excellent",
      tone: "border-state-success/40 bg-state-success/10 text-state-success",
      dot: "bg-state-success shadow-[0_0_8px_-1px_rgba(34,197,94,0.7)]",
    };
  if (score >= 70)
    return {
      label: "Strong",
      tone: "border-accent-400/40 bg-accent-400/10 text-accent-300",
      dot: "bg-accent-400 shadow-[0_0_8px_-1px_rgba(99,102,241,0.7)]",
    };
  if (score >= 55)
    return {
      label: "Fair",
      tone: "border-state-warn/40 bg-state-warn/10 text-state-warn",
      dot: "bg-state-warn",
    };
  return {
    label: "Needs work",
    tone: "border-state-danger/40 bg-state-danger/10 text-state-danger",
    dot: "bg-state-danger",
  };
}
