"use client";

/**
 * src/components/features/Heatmap.tsx
 * 365-day contribution heatmap (GitHub-style).
 */
import { useMemo } from "react";

interface HeatmapProps {
  data: Array<{ date: string; count: number }>;
  maxCount?: number;
  cellSize?: number;
  gap?: number;
  colors?: string[];
  tooltip?: boolean;
  onCellClick?: (date: string, count: number) => void;
  className?: string;
}

const DEFAULT_COLORS = [
  "var(--heatmap-0)",
  "var(--heatmap-1)",
  "var(--heatmap-2)",
  "var(--heatmap-3)",
  "var(--heatmap-4)",
];

export function Heatmap({
  data,
  maxCount,
  cellSize = 12,
  gap = 2,
  colors = DEFAULT_COLORS,
  tooltip = true,
  onCellClick,
  className = "",
}: HeatmapProps) {
  // Group data by week (columns) and day of week (rows)
  const { weeks, monthLabels } = useMemo(() => {
    if (data.length === 0) return { weeks: [], monthLabels: [] };

    // Find the first Sunday (or Monday) before the start date
    const startDate = new Date(data[0].date);
    const dayOfWeek = startDate.getDay(); // 0 = Sunday
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - dayOfWeek);

    const weeks: Array<Array<{ date: string; count: number } | null>> = [];
    let currentWeek: Array<{ date: string; count: number } | null> = Array(7).fill(null);
    let weekIndex = 0;

    const dataMap = new Map(data.map((d) => [d.date, d.count]));

    // Iterate through all 365 days
    // eslint-disable-next-line prefer-const
    let current = new Date(firstSunday);
    const endDate = new Date(data[data.length - 1].date);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

    const monthLabelSet = new Set<string>();

    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0]!;
      const count = dataMap.get(dateStr) ?? 0;

      currentWeek[current.getDay()] = count > 0 ? { date: dateStr, count } : { date: dateStr, count: 0 };

      // Track month labels (first day of each month)
      if (current.getDate() === 1) {
        const monthLabel = current.toLocaleDateString("en-US", { month: "short" });
        monthLabelSet.add(`${weekIndex}:${monthLabel}`);
      }

      // Week complete (Saturday = 6)
      if (current.getDay() === 6) {
        weeks.push([...currentWeek]);
        currentWeek = Array(7).fill(null);
        weekIndex++;
      }

      current.setDate(current.getDate() + 1);
    }

    // Add final partial week if needed
    if (currentWeek.some((d) => d !== null)) {
      weeks.push([...currentWeek]);
    }

    // Generate month labels for x-axis
    const monthLabels: Array<{ week: number; label: string }> = [];
    const seenMonths = new Set<string>();
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const firstDay = week.find((d) => d !== null);
      if (firstDay) {
        const date = new Date(firstDay.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!seenMonths.has(monthKey)) {
          seenMonths.add(monthKey);
          monthLabels.push({
            week: i,
            label: date.toLocaleDateString("en-US", { month: "short" }),
          });
        }
      }
    }

    return { weeks, monthLabels };
  }, [data]);

  const computedMaxCount = maxCount ?? Math.max(...data.map((d) => d.count), 1);

  const getColorIndex = (count: number) => {
    if (count === 0) return 0;
    const ratio = Math.min(count / computedMaxCount, 1);
    return Math.floor(ratio * (colors.length - 1)) + 1;
  };

  const getCellStyle = (count: number) => ({
    width: cellSize,
    height: cellSize,
    borderRadius: 2,
    backgroundColor: `var(--heatmap-${getColorIndex(count)})`,
    cursor: onCellClick ? "pointer" : "default",
    transition: "transform 0.15s ease, opacity 0.15s ease",
  });

  return (
    <div className={`heatmap-container ${className}`} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
      {/* Day labels (left side) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap,
          marginTop: cellSize, // Offset for month labels
        }}
        aria-hidden="true"
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
          <div
            key={day}
            style={{
              width: 30,
              height: cellSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 4,
              fontSize: 9,
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
            }}
          >
            {i % 2 === 0 ? day : ""} {/* Show only alternate days to reduce clutter */}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Month labels (top) */}
        <div
          style={{
            display: "flex",
            gap,
            paddingLeft: 0,
            minWidth: weeks.length * (cellSize + gap),
          }}
          aria-hidden="true"
        >
          {monthLabels.map(({ week, label }) => (
            <div
              key={week}
              style={{
                width: (cellSize + gap) * (week + 1),
                textAlign: "left",
                fontSize: 9,
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div style={{ display: "flex", gap }}>
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              style={{
                display: "flex",
                flexDirection: "column",
                gap,
              }}
            >
              {week.map((day, dayIndex) => {
                if (!day) return <div key={`${weekIndex}-${dayIndex}`} style={{ width: cellSize, height: cellSize }} />;
                const count = day.count;
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    style={getCellStyle(count)}
                    onClick={() => onCellClick?.(day.date, count)}
                    onMouseEnter={() => {
                      // Tooltip handled by CSS or could use a portal
                    }}
                    title={tooltip && count > 0 ? `${count} problem${count !== 1 ? "s" : ""} on ${new Date(day.date).toLocaleDateString()}` : undefined}
                    role={onCellClick ? "button" : undefined}
                    tabIndex={onCellClick ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (onCellClick && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onCellClick(day.date, count);
                      }
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
            fontSize: 11,
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span>Less</span>
          {colors.map((color, i) => (
            <div
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 2,
                backgroundColor: `var(--heatmap-${i})`,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}