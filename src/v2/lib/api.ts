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
  refreshContests: () =>
    api<{
      ok: boolean;
      upserted: number;
      sources?: string[];
      errors?: string[];
    }>("/api/contests/refresh", { method: "POST" }),
  syncAll: (opts?: { full?: boolean }) =>
    api<{ ok: boolean; synced: number; results: unknown[] }>(
      "/api/platforms/sync-all",
      {
        method: "POST",
        body: JSON.stringify({ full: opts?.full ?? true }),
      },
    ),
  syncPlatform: (platform: string, id: string) =>
    api(`/api/platforms/${platform}/${id}/sync`, { method: "POST" }),
  linkPlatform: (platform: string, handle: string) =>
    api(`/api/platforms/${platform}/link`, {
      method: "POST",
      body: JSON.stringify({ handle }),
    }),
  forgotPassword: (email: string) =>
    api("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (body: {
    email: string;
    token: string;
    password: string;
  }) =>
    api("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  teams: () => api<{ teams: TeamDto[] }>("/api/teams"),
  publicTeams: (q = "", limit = 24) =>
    api<{ teams: TeamDto[] }>(
      `/api/teams?public=true&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}`,
    ),
  createTeam: (body: Record<string, unknown>) =>
    api("/api/teams", { method: "POST", body: JSON.stringify(body) }),
  team: (slug: string) =>
    api<{ team: TeamDto & Record<string, unknown> }>(`/api/teams/${slug}`),
  updateTeam: (slug: string, body: Record<string, unknown>) =>
    api(`/api/teams/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTeam: (slug: string) =>
    api(`/api/teams/${slug}`, { method: "DELETE" }),
  teamMembers: (slug: string) =>
    api<{ members: TeamMemberDto[] }>(`/api/teams/${slug}/members`),
  teamPending: (slug: string) =>
    api<{ requests: TeamMemberDto[] }>(
      `/api/teams/${slug}/members?pending=true`,
    ),
  updateMemberRole: (
    slug: string,
    userId: string,
    role: "ADMIN" | "MODERATOR" | "MEMBER",
  ) =>
    api(`/api/teams/${slug}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  approveRequest: (slug: string, userId: string) =>
    api(`/api/teams/${slug}/requests/${userId}`, { method: "POST" }),
  rejectRequest: (slug: string, userId: string) =>
    api(`/api/teams/${slug}/requests/${userId}`, { method: "DELETE" }),
  inviteMember: (
    slug: string,
    username: string,
    mode: "invite" | "add" = "invite",
  ) =>
    api(`/api/teams/${slug}/invite`, {
      method: "POST",
      body: JSON.stringify({ username, mode }),
    }),
  notifications: () =>
    api<{ notifications: NotificationDto[]; unread: number }>(
      "/api/notifications",
    ),
  markAllNotificationsRead: () =>
    api("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ all: true }),
    }),
  markNotificationRead: (id: string) =>
    api(`/api/notifications/${id}/read`, { method: "POST" }),
  resendVerification: (email: string) =>
    api("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  credentialsStatus: (body: { email: string; password: string }) =>
    api<{ ok: boolean; needsVerification?: boolean }>(
      "/api/auth/credentials-status",
      { method: "POST", body: JSON.stringify(body) },
    ),
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
  regenerateInvite: (slug: string) =>
    api<{ inviteCode: string }>(`/api/teams/${slug}/regenerate-invite`, {
      method: "POST",
    }),
  transferOwnership: (slug: string, userId: string) =>
    api(`/api/teams/${slug}/transfer`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  teamAnnouncements: (slug: string) =>
    api<{ announcements: AnnouncementDto[] }>(
      `/api/teams/${slug}/announcements`,
    ),
  createAnnouncement: (
    slug: string,
    body: {
      title: string;
      body: string;
      imageUrl?: string | null;
      linkUrl?: string | null;
    },
  ) =>
    api(`/api/teams/${slug}/announcements`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteAnnouncement: (slug: string, id: string) =>
    api(`/api/teams/${slug}/announcements/${id}`, { method: "DELETE" }),
  teamActivity: (slug: string, days = 14) =>
    api<{ activity: TeamActivityDto[]; days: number; limit: number }>(
      `/api/teams/${slug}/activity?days=${days}&limit=100`,
    ),
  teamLeaderboard: (slug: string, range = "weekly") =>
    api<{ leaderboard: LeaderboardDto[]; range: string }>(
      `/api/teams/${slug}/leaderboard?range=${range}`,
    ),
  myTargets: () => api<{ targets: TargetDto[] }>("/api/targets"),
  teamTargets: (teamId: string) =>
    api<{ targets: TargetDto[] }>(`/api/targets?teamId=${teamId}`),
  createTarget: (body: Record<string, unknown>) =>
    api("/api/targets", { method: "POST", body: JSON.stringify(body) }),
  register: (body: { username: string; email: string; password: string }) =>
    api<{ ok: boolean; needsVerification?: boolean; autoVerified?: boolean }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify(body) },
    ),
};

export interface AnnouncementDto {
  id: string;
  teamId: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  createdAt: string | Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl?: string | null;
  };
}

type TeamActivityActor = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
};

export type TeamActivityDto =
  | (TeamActivityActor & {
      type: "problem";
      at: string;
      date: string;
      problemId: string;
      problemTitle: string;
      problemUrl: string | null;
      platform: string;
      difficulty: string | null;
      rating: number | null;
      tags: string[] | null;
      inContest: boolean;
    })
  | (TeamActivityActor & {
      type: "day";
      at: string;
      date: string;
      solvedCount: number;
      submissionsCount: number;
      contestsCount: number;
      points: number;
    })
  | (TeamActivityActor & {
      type: "contest";
      at: string;
      contestId: string;
      contestName: string;
      contestUrl: string | null;
      platform: string;
      rank: number | null;
      ratingBefore: number | null;
      ratingAfter: number | null;
      ratingDelta: number | null;
      solvedCount: number | null;
    })
  | (TeamActivityActor & {
      type: "joined";
      at: string;
      role: string;
    })
  | {
      type: "announcement";
      at: string;
      id: string;
      title: string;
      bodyPreview: string;
      authorUserId: string;
      authorUsername: string;
      authorDisplayName: string | null;
      authorAvatarUrl?: string | null;
    }
  | (TeamActivityActor & {
      type: "target_created";
      at: string;
      targetId: string;
      title: string;
      targetType: string;
      endsAt: string | null;
    })
  | (TeamActivityActor & {
      type: "target_completed";
      at: string;
      targetId: string;
      title: string;
      goalValue: number;
      currentValue: number;
    });

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
  avatarUrl?: string | null;
}

export interface NotificationDto {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  readAt: string | Date | null;
  createdAt: string | Date;
}

export interface TargetDto {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  teamId?: string | null;
  criteria?: Record<string, unknown> | null;
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
  teamName?: string | null;
  teamSlug?: string | null;
  source?: "personal" | "team";
}
