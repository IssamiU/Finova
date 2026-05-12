import { useMemo } from "react";

/**
 * Subtle floating hearts background. CSS-animated, no dependencies.
 * Pre-positioned with random offsets/durations so it stays performant.
 */
export function HeartsBackground({ count = 14 }: { count?: number }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const size = 12 + Math.random() * 18;
        const duration = 18 + Math.random() * 16;
        const delay = -Math.random() * duration;
        const opacity = 0.3 + Math.random() * 0.35;
        return { i, left, size, duration, delay, opacity };
      }),
    [count],
  );

  return (
    <div className="hearts-bg" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.i}
          className="heart"
          style={{
            left: `${h.left}%`,
            width: `${h.size}px`,
            height: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            ["--max-opacity" as any]: h.opacity,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-7.5-4.6-9.6-9.3C1.1 8.5 3 5 6.4 5c2 0 3.5 1 4.6 2.6l1 1.4 1-1.4C14.1 6 15.6 5 17.6 5 21 5 22.9 8.5 21.6 11.7 19.5 16.4 12 21 12 21z" />
          </svg>
        </span>
      ))}
    </div>
  );
}
