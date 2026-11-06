export type TargetTypeId =
  | "SOLVE_COUNT"
  | "SPECIFIC_PROBLEMS"
  | "CONTEST_PARTICIPATION"
  | "RATING_GOAL"
  | "STREAK"
  | "CUSTOM_CHECKLIST";

export type TargetTypeSection = "practice" | "competition" | "habit" | "custom";

export interface TargetTypeMeta {
  id: TargetTypeId;
  section: TargetTypeSection;
  label: string;
  description: string;
  goalLabel: string;
  goalPlaceholder: string;
}

export const TARGET_TYPE_SECTIONS: {
  id: TargetTypeSection;
  label: string;
}[] = [
  { id: "practice", label: "Practice" },
  { id: "competition", label: "Competition" },
  { id: "habit", label: "Habits" },
  { id: "custom", label: "Custom" },
];

export const TARGET_TYPES: TargetTypeMeta[] = [
  {
    id: "SOLVE_COUNT",
    section: "practice",
    label: "Solve count",
    description: "Solve N problems in the window (optional platform / rating filters).",
    goalLabel: "Problems to solve",
    goalPlaceholder: "20",
  },
  {
    id: "SPECIFIC_PROBLEMS",
    section: "practice",
    label: "Problem list",
    description: "Finish a curated list of problem URLs or IDs.",
    goalLabel: "Problems in list",
    goalPlaceholder: "5",
  },
  {
    id: "CONTEST_PARTICIPATION",
    section: "competition",
    label: "Contest participation",
    description: "Take part in N contests during the period.",
    goalLabel: "Contests to join",
    goalPlaceholder: "3",
  },
  {
    id: "RATING_GOAL",
    section: "competition",
    label: "Rating goal",
    description: "Reach a rating on a linked platform.",
    goalLabel: "Target rating",
    goalPlaceholder: "1600",
  },
  {
    id: "STREAK",
    section: "habit",
    label: "Solve streak",
    description: "Hit a consecutive-day solving streak.",
    goalLabel: "Streak days",
    goalPlaceholder: "7",
  },
  {
    id: "CUSTOM_CHECKLIST",
    section: "custom",
    label: "Custom checklist",
    description: "Any goal — track items manually or by count.",
    goalLabel: "Items / goal value",
    goalPlaceholder: "5",
  },
];

export function targetTypeMeta(id: string): TargetTypeMeta {
  return (
    TARGET_TYPES.find((t) => t.id === id) ??
    TARGET_TYPES[TARGET_TYPES.length - 1]!
  );
}
