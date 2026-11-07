export const RANGE_KEYS = ["7d", "30d", "90d", "1y", "custom"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const DIFFICULTY_KEYS = ["easy", "medium", "hard"] as const;
export type DifficultyKey = (typeof DIFFICULTY_KEYS)[number];

export const STATUS_KEYS = ["accepted", "failed"] as const;
export type StatusKey = (typeof STATUS_KEYS)[number];

export type DashboardFilterState = {
  /** Selected platform ids. Empty array means "all linked". */
  platforms: string[];
  range: RangeKey;
  customFrom: string | null;
  customTo: string | null;
  compare: boolean;
  difficulty: DifficultyKey[];
  status: StatusKey[];
};

export const DEFAULT_FILTERS: DashboardFilterState = {
  platforms: [],
  range: "90d",
  customFrom: null,
  customTo: null,
  compare: false,
  difficulty: [],
  status: [],
};

export type DateWindow = {
  from: Date;
  to: Date;
  label: string;
};
