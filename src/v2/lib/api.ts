/**
 * Typed API client for DevTrack v2 UI.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await parseJson(res);
  if (!res.ok) {
    const msg =
      (data as { error?: string | { message?: string } }).error;
    const message =
      typeof msg === "string"
        ? msg
        : msg?.message ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export const v2Api = {
  me: () => api<{ user: Record<string, unknown> }>("/api/users/me"),
  patchMe: (body: Record<string, unknown>) =>
    api("/api/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  contests: (q = "") =>
    api<{ contests: ContestDto[] }>(`/api/contests${q}`),
  syncAll: () =>
    api<{ ok: boolean; synced: number; results: unknown[] }>(
      "/api/platforms/sync-all",
      { method: "POST" },
    ),
  linkPlatform: (platform: string, handle: string) =>
    api(`/api/platforms/${platform}/link`, {
      method: "POST",
      body: JSON.stringify({ handle }),
    }),
  teams: () => api<{ teams: TeamDto[] }>("/api/teams"),
  createTeam: (body: Record<string, unknown>) =>
    api("/api/teams", { method: "POST", body: JSON.stringify(body) }),
  team: (slug: string) => api<{ team: TeamDto & Record<string, unknown> }>(`/api/teams/${slug}`),
  teamMembers: (slug: string) =>
    api<{ members: TeamMemberDto[] }>(`/api/teams/${slug}/members`),
  teamPending: (slug: string) =>
    api<{ requests: TeamMemberDto[] }>(`/api/teams/${slug}/members?pending=true`),
  approveRequest: (slug: string, userId: string) =>
    api(`/api/teams/${slug}/requests/${userId}`, { method: "POST" }),
  rejectRequest: (slug: string, userId: string) =>
    api(`/api/teams/${slug}/requests/${userId}`, { method: "DELETE" }),
  inviteMember: (slug: string, username: string) =>
    api(`/api/teams/${slug}/invite`, {
      method: "POST",
      body: JSON.stringify({ username }),
    }),
  requestJoin: (slug: string) =>
    api(`/api/teams/${slug}/members`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  joinByCode: (inviteCode: string) =>
    api<{ slug?: string; status?: string }>("/api/teams/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    }),
  removeMember: (slug: string, userId: string) =>
    api(`/api/teams/${slug}/members/${userId}`, { method: "DELETE" }),
  teamLeaderboard: (slug: string, range = "weekly") =>
    api<{ leaderboard: LeaderboardDto[]; range: string }>(
      `/api/teams/${slug}/leaderboard?range=${range}`,
    ),
  teamTargets: (teamId: string) =>
    api<{ targets: TargetDto[] }>(`/api/targets?teamId=${teamId}`),
  createTarget: (body: Record<string, unknown>) =>
    api("/api/targets", { method: "POST", body: JSON.stringify(body) }),
  register: (body: { username: string; email: string; password: string }) =>
    api("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
};

export interface TeamMemberDto {
  userId: string;
  role: string;
  status?: string;
  user: {
    id?: string;
    username: string | null;
    displayName: string | null;
    avatarUrl?: string | null;
    profileVisibility?: string;
  };
}

export interface LeaderboardDto {
  userId: string;
  username: string;
  displayName: string | null;
  totalSolved: number;
  rank: number;
}

export interface TargetDto {
  id: string;
  title: string;
  type: string;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  progress: {
    currentValue: number;
    goalValue: number;
    isCompleted: boolean;
  } | null;
  memberProgress?: Array<{
    userId: string;
    username: string | null;
    displayName: string | null;
    currentValue: number;
    goalValue: number;
    isCompleted: boolean;
  }>;
  completedCount?: number;
  assigneeCount?: number;
}

export interface ContestDto {
  id: string;
  platform: string;
  externalId: string;
  name: string;
  url?: string | null;
  startsAt: string | Date;
  durationSeconds?: number | null;
  phase?: string;
}

export interface TeamDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility?: string;
  memberCount?: number;
}
