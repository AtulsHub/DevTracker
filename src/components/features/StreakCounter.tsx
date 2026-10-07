"use client";

/**
 * src/components/features/StreakCounter.tsx
 * Animated streak counter with flame icon.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StreakCounterProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { fontSize: "1.25rem", flameSize: "1.25rem", labelSize: "0.625rem" },
  md: { fontSize: "2rem", flameSize: "2rem", labelSize: "0.75rem" },
  lg: { fontSize: "3rem", flameSize: "3rem", labelSize: "0.875rem" },
};

export function StreakCounter({
  streak,
  size = "md",
  showLabel = true,
  animated = true,
  className = "",
}: StreakCounterProps) {
  const [displayStreak, setDisplayStreak] = useState(0);
  const config = sizeConfig[size];

  // Animate counting up on mount
  useEffect(() => {
    if (!animated) {
      // Use a timeout to avoid synchronous state update in effect
      const timer = setTimeout(() => {
        setDisplayStreak(streak);
      }, 0);
      return () => clearTimeout(timer);
    }

    const duration = 800;
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (streak - startValue) * eased);
      setDisplayStreak(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [streak, animated]);

  return (
    <div className={`streak-counter ${className}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <motion.span
        className="streak-flame"
        style={{
          fontSize: config.flameSize,
          display: "inline-block",
          lineHeight: 1,
        }}
        animate={animated && streak > 0 ? { scale: [1, 1.1, 1], rotate: [-3, 3, -3] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      >
        🔥
      </motion.span>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <motion.span
          style={{
            fontSize: config.fontSize,
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
            lineHeight: 1,
          }}
          animate={animated ? { textShadow: ["0 0 0 transparent", "0 0 20px var(--accent)", "0 0 0 transparent"] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {displayStreak.toLocaleString()}
        </motion.span>
        {showLabel && (
          <span
            style={{
              fontSize: config.labelSize,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginTop: 2,
            }}
          >
            {streak === 1 ? "day streak" : "day streak"}
          </span>
        )}
      </div>
    </div>
  );
}