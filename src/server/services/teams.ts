/**
 * src/server/services/teams.ts
 * Business logic for team management.
 */
import { db } from "@/server/db";
import {
  teams,
  teamMembers,
  users,
  teamAnnouncements,
  dailyActivity,
  solves,
  problems,
  platformAccounts,
  contestResults,
  contests,
  targets,
  targetProgress,
} from "@/server/db/schema";
import {
  eq,
  and,
  desc,
  count,
  sql,
  ilike,
  or,
  inArray,
  gte,
  isNull,
} from "drizzle-orm";
import { formatISO, subDays } from "date-fns";
import {
  notifyJoinApproved,
  notifyJoinRequestToLeaders,
  notifyMemberAdded,
  notifyMemberInvited,
} from "@/server/services/team-events";

export interface CreateTeamInput {
  name: string;
  slug: string;
  description?: string;
  visibility?: "PUBLIC" | "PRIVATE" | "SECRET";
  memberVisibilityPolicy?: "EVERYONE" | "FOLLOWERS" | "TEAM" | "ME";
  avatarUrl?: string | null;
  ownerId: string;
}

export interface TeamWithMembers {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  memberVisibilityPolicy: string;
  avatarUrl: string | null;
  ownerId: string;
  inviteCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  memberCount: number;
  userRole?: string;
  userStatus?: string;
}

/**
 * Create a new team.
 */
export async function createTeam(input: CreateTeamInput) {
  // Check if slug is taken
  const existing = await db.query.teams.findFirst({
    where: eq(teams.slug, input.slug),
    columns: { id: true },
  });

  if (existing) {
    throw new Error("Team slug is already taken");
  }

  // Generate invite code
  const inviteCode = generateInviteCode();

  const [newTeam] = await db
    .insert(teams)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      visibility: input.visibility ?? "PUBLIC",
      memberVisibilityPolicy: input.memberVisibilityPolicy ?? "TEAM",
      avatarUrl: input.avatarUrl ?? null,
      ownerId: input.ownerId,
      inviteCode,
    })
    .returning();

  // Add owner as team member
  await db.insert(teamMembers).values({
    teamId: newTeam.id,
    userId: input.ownerId,
    role: "OWNER",
    status: "ACTIVE",
  });

  return newTeam;
}

/**
 * Get team by slug with full details.
 */
export async function getTeamBySlug(slug: string, viewerId?: string): Promise<TeamWithMembers | null> {
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, slug),
  });

  if (!team) return null;

  // Get owner
  const owner = await db.query.users.findFirst({
    where: eq(users.id, team.ownerId),
    columns: { id: true, username: true, displayName: true, avatarUrl: true },
  });

  // Get member count
  const memberCountResult = await db
    .select({ count: count() })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.status, "ACTIVE")));

  // Get user's role/status if authenticated
  let userRole: string | undefined;
  let userStatus: string | undefined;

  if (viewerId) {
    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, viewerId)),
      columns: { role: true, status: true },
    });
    userRole = membership?.role;
    userStatus = membership?.status;
  }

  return {
    ...team,
    owner: owner!,
    memberCount: memberCountResult[0]?.count ?? 0,
    userRole,
    userStatus,
  };
}

/**
 * Get teams for a user (where they are a member).
 */
export async function getUserTeams(userId: string): Promise<TeamWithMembers[]> {
  const memberships = await db.query.teamMembers.findMany({
    where: and(eq(teamMembers.userId, userId), eq(teamMembers.status, "ACTIVE")),
    with: {
      team: true,
    },
  });

  const result: TeamWithMembers[] = [];

  for (const m of memberships) {
    const owner = await db.query.users.findFirst({
      where: eq(users.id, m.team.ownerId),
      columns: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    const memberCountResult = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, m.team.id), eq(teamMembers.status, "ACTIVE")));

    result.push({
      ...m.team,
      owner: owner!,
      memberCount: memberCountResult[0]?.count ?? 0,
      userRole: m.role,
      userStatus: m.status,
    });
  }

  return result;
}

/**
 * Get public teams (for discovery), optionally filtered by name/description.
 */
export async function getPublicTeams(
  limit = 20,
  offset = 0,
  query?: string,
): Promise<TeamWithMembers[]> {
  const q = query?.trim();
  const publicTeams = await db.query.teams.findMany({
    where: q
      ? and(
          eq(teams.visibility, "PUBLIC"),
          isNull(teams.suspendedAt),
          or(ilike(teams.name, `%${q}%`), ilike(teams.description, `%${q}%`)),
        )
      : and(eq(teams.visibility, "PUBLIC"), isNull(teams.suspendedAt)),
    limit,
    offset,
    orderBy: [desc(teams.createdAt)],
  });

  const result: TeamWithMembers[] = [];

  for (const t of publicTeams) {
    const owner = await db.query.users.findFirst({
      where: eq(users.id, t.ownerId),
      columns: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    const memberCountResult = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, t.id), eq(teamMembers.status, "ACTIVE")));

    result.push({
      ...t,
      owner: owner!,
      memberCount: memberCountResult[0]?.count ?? 0,
    });
  }

  return result;
}

/**
 * Join a team via invite code.
 */
export async function joinTeamByInvite(inviteCode: string, userId: string) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.inviteCode, inviteCode),
  });

  if (!team) {
    throw new Error("Invalid invite code");
  }
  if (team.suspendedAt) {
    throw new Error("This team is suspended");
  }

  // Check if already a member
  const existing = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)),
  });

  if (existing) {
    // Accept a personal INVITED row via the shared invite code.
    if (existing.status === "INVITED") {
      await db
        .update(teamMembers)
        .set({ status: "ACTIVE", role: "MEMBER" })
        .where(
          and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)),
        );
      return { teamId: team.id, slug: team.slug, status: "ACTIVE" as const };
    }
    // Idempotent: opening an invite link while already a member should succeed
    return { teamId: team.id, slug: team.slug, status: existing.status };
  }

  // Invite codes are the intended join path for PRIVATE and SECRET teams.
  // PUBLIC codes join immediately; others wait for approval.
  const status = team.visibility === "PUBLIC" ? "ACTIVE" : "PENDING";

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role: "MEMBER",
    status,
  });

  if (status === "PENDING") {
    void notifyJoinRequestToLeaders({ teamId: team.id, requesterId: userId });
  }

  return { teamId: team.id, slug: team.slug, status };
}

/**
 * Request to join a team (for PRIVATE teams).
 */
export async function requestToJoinTeam(teamId: string, userId: string) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    throw new Error("Team not found");
  }

  if (team.visibility === "SECRET") {
    throw new Error("Cannot join secret team");
  }

  // Check if already a member or requested
  const existing = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
  });

  if (existing) {
    throw new Error("Already a member or request pending");
  }

  const status = team.visibility === "PUBLIC" ? "ACTIVE" : "PENDING";

  await db.insert(teamMembers).values({
    teamId,
    userId,
    role: "MEMBER",
    status,
  });

  if (status === "PENDING") {
    void notifyJoinRequestToLeaders({ teamId, requesterId: userId });
  }

  return { teamId, status };
}

/**
 * Update team member role (admin/owner only).
 */
export async function updateMemberRole(
  teamId: string,
  actorId: string,
  targetUserId: string,
  newRole: "ADMIN" | "MODERATOR" | "MEMBER"
) {
  // Check actor's role
  const actorMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });

  if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
    throw new Error("Insufficient permissions");
  }

  // Cannot change owner's role
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: { ownerId: true },
  });

  if (team?.ownerId === targetUserId) {
    throw new Error("Cannot change owner's role");
  }

  // Cannot promote to OWNER
  if (newRole === "OWNER" as unknown as "ADMIN" | "MODERATOR" | "MEMBER") {
    throw new Error("Cannot promote to owner");
  }

  // Check target membership
  const targetMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId)),
  });

  if (!targetMembership) {
    throw new Error("User is not a member of this team");
  }

  // Actor must have higher role than target's new role
  const roleHierarchy = { OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1 };
  if (roleHierarchy[actorMembership.role] <= roleHierarchy[newRole]) {
    throw new Error("Insufficient permissions for this role change");
  }

  await db
    .update(teamMembers)
    .set({ role: newRole })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId)));

  return { success: true };
}

/**
 * Remove a member from team (admin/owner only, or self).
 */
export async function removeMember(teamId: string, actorId: string, targetUserId: string) {
  const actorMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });

  if (!actorMembership) {
    throw new Error("Not a team member");
  }

  const isSelf = actorId === targetUserId;
  const isAdminOrOwner = ["OWNER", "ADMIN"].includes(actorMembership.role);

  if (!isSelf && !isAdminOrOwner) {
    throw new Error("Insufficient permissions");
  }

  // Cannot remove owner
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: { ownerId: true },
  });

  if (team?.ownerId === targetUserId) {
    throw new Error("Cannot remove owner");
  }

  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId)));

  return { success: true };
}

const CAN_MANAGE_REQUESTS = ["OWNER", "ADMIN", "MODERATOR"] as const;

/**
 * Approve a join request (owner / admin / moderator).
 */
export async function approveJoinRequest(teamId: string, actorId: string, targetUserId: string) {
  const actorMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });

  if (
    !actorMembership ||
    !CAN_MANAGE_REQUESTS.includes(
      actorMembership.role as (typeof CAN_MANAGE_REQUESTS)[number],
    )
  ) {
    throw new Error("Insufficient permissions");
  }

  const targetMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId), eq(teamMembers.status, "PENDING")),
  });

  if (!targetMembership) {
    throw new Error("No pending request found");
  }

  await db
    .update(teamMembers)
    .set({ status: "ACTIVE" })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId)));

  void notifyJoinApproved({ teamId, targetUserId });

  return { success: true };
}

/**
 * Reject a join request (owner / admin / moderator).
 */
export async function rejectJoinRequest(teamId: string, actorId: string, targetUserId: string) {
  const actorMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });

  if (
    !actorMembership ||
    !CAN_MANAGE_REQUESTS.includes(
      actorMembership.role as (typeof CAN_MANAGE_REQUESTS)[number],
    )
  ) {
    throw new Error("Insufficient permissions");
  }

  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId), eq(teamMembers.status, "PENDING")));

  return { success: true };
}

/**
 * Leader/admin adds a member by username (ACTIVE immediately).
 * Use inviteMemberByUsername when you want them to opt in.
 */
export async function addMemberByUsername(
  teamId: string,
  actorId: string,
  username: string,
) {
  const actorMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });

  if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
    throw new Error("Only owners and admins can add members");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, username.trim().replace(/^@/, "")),
    columns: { id: true, username: true },
  });
  if (!user) throw new Error("User not found");

  const existing = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id)),
  });

  if (existing?.status === "ACTIVE") {
    throw new Error("User is already a member");
  }

  if (existing?.status === "PENDING" || existing?.status === "INVITED") {
    await db
      .update(teamMembers)
      .set({ status: "ACTIVE", role: "MEMBER" })
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id)),
      );
    void notifyMemberAdded({
      teamId,
      targetUserId: user.id,
      actorId,
    });
    return { userId: user.id, username: user.username, status: "ACTIVE" as const };
  }

  await db.insert(teamMembers).values({
    teamId,
    userId: user.id,
    role: "MEMBER",
    status: "ACTIVE",
  });

  void notifyMemberAdded({
    teamId,
    targetUserId: user.id,
    actorId,
  });

  return { userId: user.id, username: user.username, status: "ACTIVE" as const };
}

/**
 * Leader/admin invites a member by username (INVITED until they accept via code).
 * Sends an important email with the invite link.
 */
export async function inviteMemberByUsername(
  teamId: string,
  actorId: string,
  username: string,
) {
  const actorMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });

  if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
    throw new Error("Only owners and admins can invite members");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, username.trim().replace(/^@/, "")),
    columns: { id: true, username: true },
  });
  if (!user) throw new Error("User not found");

  const existing = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id)),
  });

  if (existing?.status === "ACTIVE") {
    throw new Error("User is already a member");
  }
  if (existing?.status === "INVITED") {
    void notifyMemberInvited({
      teamId,
      targetUserId: user.id,
      actorId,
    });
    return {
      userId: user.id,
      username: user.username,
      status: "INVITED" as const,
    };
  }
  if (existing?.status === "PENDING") {
    await db
      .update(teamMembers)
      .set({ status: "INVITED", role: "MEMBER" })
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id)),
      );
  } else {
    await db.insert(teamMembers).values({
      teamId,
      userId: user.id,
      role: "MEMBER",
      status: "INVITED",
    });
  }

  void notifyMemberInvited({
    teamId,
    targetUserId: user.id,
    actorId,
  });

  return {
    userId: user.id,
    username: user.username,
    status: "INVITED" as const,
  };
}

/**
 * Get pending join requests for a team.
 */
export async function getPendingRequests(teamId: string, actorId: string) {
  const actorMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });

  if (!actorMembership || !["OWNER", "ADMIN", "MODERATOR"].includes(actorMembership.role)) {
    throw new Error("Insufficient permissions");
  }

  return db.query.teamMembers.findMany({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.status, "PENDING")),
    with: {
      user: {
        columns: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: [desc(teamMembers.joinedAt)],
  });
}

/**
 * Get team members with pagination.
 */
export async function getTeamMembers(teamId: string, limit = 50, offset = 0) {
  return db.query.teamMembers.findMany({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.status, "ACTIVE")),
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          profileVisibility: true,
        },
      },
    },
    limit,
    offset,
    orderBy: [desc(teamMembers.joinedAt)],
  });
}

/**
 * Generate a random invite code.
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function requireLeader(teamId: string, actorId: string) {
  const membership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("Insufficient permissions");
  }
  return membership;
}

/**
 * Regenerate invite code (owner/admin).
 */
export async function regenerateInviteCode(teamId: string, actorId: string) {
  await requireLeader(teamId, actorId);
  const inviteCode = generateInviteCode();
  const [updated] = await db
    .update(teams)
    .set({ inviteCode, updatedAt: new Date() })
    .where(eq(teams.id, teamId))
    .returning({ inviteCode: teams.inviteCode });
  return updated;
}

/**
 * Transfer ownership to another active member.
 */
export async function transferOwnership(
  teamId: string,
  actorId: string,
  newOwnerId: string,
) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: { ownerId: true },
  });
  if (!team) throw new Error("Team not found");
  if (team.ownerId !== actorId) {
    throw new Error("Only the owner can transfer ownership");
  }
  if (newOwnerId === actorId) {
    throw new Error("You already own this team");
  }

  const target = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.userId, newOwnerId),
      eq(teamMembers.status, "ACTIVE"),
    ),
  });
  if (!target) throw new Error("New owner must be an active member");

  await db
    .update(teams)
    .set({ ownerId: newOwnerId, updatedAt: new Date() })
    .where(eq(teams.id, teamId));

  await db
    .update(teamMembers)
    .set({ role: "OWNER" })
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, newOwnerId)),
    );

  await db
    .update(teamMembers)
    .set({ role: "ADMIN" })
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
    );

  return { success: true };
}

export interface AnnouncementDto {
  id: string;
  teamId: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

/**
 * List team announcements (newest first).
 */
export async function listAnnouncements(
  teamId: string,
  limit = 30,
): Promise<AnnouncementDto[]> {
  const rows = await db.query.teamAnnouncements.findMany({
    where: eq(teamAnnouncements.teamId, teamId),
    orderBy: [desc(teamAnnouncements.createdAt)],
    limit,
  });

  if (rows.length === 0) return [];

  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const authors = await db.query.users.findMany({
    where: inArray(users.id, authorIds),
    columns: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  });
  const byId = new Map(authors.map((a) => [a.id, a]));

  return rows.map((r) => ({
    id: r.id,
    teamId: r.teamId,
    title: r.title,
    body: r.body,
    imageUrl: r.imageUrl ?? null,
    linkUrl: r.linkUrl ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    author: byId.get(r.authorId) ?? {
      id: r.authorId,
      username: "unknown",
      displayName: null,
      avatarUrl: null,
    },
  }));
}

/**
 * Create announcement (owner/admin/moderator).
 */
export async function createAnnouncement(
  teamId: string,
  actorId: string,
  input: {
    title: string;
    body: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
  },
) {
  const membership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });
  if (
    !membership ||
    !CAN_MANAGE_REQUESTS.includes(
      membership.role as (typeof CAN_MANAGE_REQUESTS)[number],
    )
  ) {
    throw new Error("Insufficient permissions");
  }

  const [row] = await db
    .insert(teamAnnouncements)
    .values({
      teamId,
      authorId: actorId,
      title: input.title.trim(),
      body: input.body.trim(),
      imageUrl: input.imageUrl?.trim() || null,
      linkUrl: input.linkUrl?.trim() || null,
    })
    .returning();

  return row;
}

/**
 * Delete announcement (author, or owner/admin).
 */
export async function deleteAnnouncement(
  teamId: string,
  announcementId: string,
  actorId: string,
) {
  const row = await db.query.teamAnnouncements.findFirst({
    where: and(
      eq(teamAnnouncements.id, announcementId),
      eq(teamAnnouncements.teamId, teamId),
    ),
  });
  if (!row) throw new Error("Announcement not found");

  const membership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });
  const isLeader =
    membership && ["OWNER", "ADMIN"].includes(membership.role);
  if (row.authorId !== actorId && !isLeader) {
    throw new Error("Insufficient permissions");
  }

  await db
    .delete(teamAnnouncements)
    .where(eq(teamAnnouncements.id, announcementId));

  return { success: true };
}

type ActorFields = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type TeamActivityItem =
  | (ActorFields & {
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
  | (ActorFields & {
      type: "day";
      at: string;
      date: string;
      solvedCount: number;
      submissionsCount: number;
      contestsCount: number;
      points: number;
    })
  | (ActorFields & {
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
  | (ActorFields & {
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
      authorAvatarUrl: string | null;
    }
  | (ActorFields & {
      type: "target_created";
      at: string;
      targetId: string;
      title: string;
      targetType: string;
      endsAt: string | null;
    })
  | (ActorFields & {
      type: "target_completed";
      at: string;
      targetId: string;
      title: string;
      goalValue: number;
      currentValue: number;
    });

function actor(
  u: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  },
): ActorFields {
  return {
    userId: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
  };
}

/**
 * Detailed team activity: problems, day rollups, contests, targets, joins, news.
 */
export async function getTeamActivity(
  teamId: string,
  days = 14,
  limit = 80,
): Promise<TeamActivityItem[]> {
  const sinceDate = formatISO(subDays(new Date(), days), {
    representation: "date",
  });
  const sinceTs = subDays(new Date(), days);

  const members = await db.query.teamMembers.findMany({
    where: and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.status, "ACTIVE"),
    ),
    columns: { userId: true, role: true, joinedAt: true },
  });
  const memberIds = members.map((m) => m.userId);
  if (memberIds.length === 0) return [];

  const memberUsers = await db.query.users.findMany({
    where: inArray(users.id, memberIds),
    columns: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  });
  const userById = new Map(memberUsers.map((u) => [u.id, u]));

  const items: TeamActivityItem[] = [];
  /** userId|date keys that already have per-problem events */
  const problemDays = new Set<string>();

  const problemRows = await db
    .select({
      userId: solves.userId,
      firstSolvedAt: solves.firstSolvedAt,
      inContest: solves.solvedInContest,
      problemId: problems.id,
      problemTitle: problems.title,
      problemUrl: problems.url,
      platform: problems.platform,
      difficulty: problems.difficultyLabel,
      rating: problems.rating,
      tags: problems.tags,
    })
    .from(solves)
    .innerJoin(problems, eq(problems.id, solves.problemId))
    .where(
      and(
        inArray(solves.userId, memberIds),
        gte(solves.firstSolvedAt, sinceTs),
      ),
    )
    .orderBy(desc(solves.firstSolvedAt))
    .limit(Math.min(limit * 2, 200));

  for (const row of problemRows) {
    const u = userById.get(row.userId);
    if (!u) continue;
    const at = row.firstSolvedAt.toISOString();
    const date = formatISO(row.firstSolvedAt, { representation: "date" });
    problemDays.add(`${row.userId}|${date}`);
    items.push({
      type: "problem",
      at,
      date,
      ...actor(u),
      problemId: row.problemId,
      problemTitle: row.problemTitle,
      problemUrl: row.problemUrl,
      platform: row.platform,
      difficulty: row.difficulty,
      rating: row.rating,
      tags: row.tags,
      inContest: row.inContest,
    });
  }

  const dayRows = await db
    .select({
      userId: dailyActivity.userId,
      date: dailyActivity.date,
      solvedCount: dailyActivity.solvedCount,
      submissionsCount: dailyActivity.submissionsCount,
      contestsCount: dailyActivity.contestsCount,
      points: dailyActivity.points,
      updatedAt: dailyActivity.updatedAt,
    })
    .from(dailyActivity)
    .where(
      and(
        inArray(dailyActivity.userId, memberIds),
        gte(dailyActivity.date, sinceDate),
        sql`(
          ${dailyActivity.solvedCount} > 0
          OR ${dailyActivity.submissionsCount} > 0
          OR ${dailyActivity.contestsCount} > 0
        )`,
      ),
    )
    .orderBy(desc(dailyActivity.date))
    .limit(Math.min(limit * 2, 200));

  for (const row of dayRows) {
    const u = userById.get(row.userId);
    if (!u) continue;
    // Prefer per-problem detail when we already have solves that day.
    if (
      row.solvedCount > 0 &&
      problemDays.has(`${row.userId}|${row.date}`)
    ) {
      // Still surface busy submission days without new AC counts.
      if (row.submissionsCount <= row.solvedCount && row.contestsCount === 0) {
        continue;
      }
    }
    items.push({
      type: "day",
      at: row.updatedAt?.toISOString?.() ?? `${row.date}T20:00:00.000Z`,
      date: row.date,
      ...actor(u),
      solvedCount: row.solvedCount,
      submissionsCount: row.submissionsCount,
      contestsCount: row.contestsCount,
      points: row.points,
    });
  }

  const accounts = await db.query.platformAccounts.findMany({
    where: inArray(platformAccounts.userId, memberIds),
    columns: { id: true, userId: true, platform: true },
  });
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const accountIds = accounts.map((a) => a.id);

  if (accountIds.length > 0) {
    const contestRows = await db
      .select({
        platformAccountId: contestResults.platformAccountId,
        contestId: contests.id,
        contestName: contests.name,
        contestUrl: contests.url,
        platform: contests.platform,
        rank: contestResults.rank,
        ratingBefore: contestResults.ratingBefore,
        ratingAfter: contestResults.ratingAfter,
        solvedCount: contestResults.solvedCount,
        participatedAt: contestResults.participatedAt,
        startsAt: contests.startsAt,
      })
      .from(contestResults)
      .innerJoin(contests, eq(contests.id, contestResults.contestId))
      .where(
        and(
          inArray(contestResults.platformAccountId, accountIds),
          or(
            gte(contestResults.participatedAt, sinceTs),
            gte(contests.startsAt, sinceTs),
          ),
        ),
      )
      .orderBy(desc(sql`COALESCE(${contestResults.participatedAt}, ${contests.startsAt})`))
      .limit(Math.min(limit, 100));

    for (const row of contestRows) {
      const account = accountById.get(row.platformAccountId);
      const u = account ? userById.get(account.userId) : undefined;
      if (!u) continue;
      const at = (row.participatedAt ?? row.startsAt).toISOString();
      const ratingDelta =
        row.ratingBefore != null && row.ratingAfter != null
          ? row.ratingAfter - row.ratingBefore
          : null;
      items.push({
        type: "contest",
        at,
        ...actor(u),
        contestId: row.contestId,
        contestName: row.contestName,
        contestUrl: row.contestUrl,
        platform: row.platform,
        rank: row.rank,
        ratingBefore: row.ratingBefore,
        ratingAfter: row.ratingAfter,
        ratingDelta,
        solvedCount: row.solvedCount,
      });
    }
  }

  const allTeamTargets = await db.query.targets.findMany({
    where: eq(targets.teamId, teamId),
    columns: {
      id: true,
      title: true,
      type: true,
      createdBy: true,
      createdAt: true,
      endsAt: true,
    },
    limit: 120,
  });
  const titleByTargetId = new Map(allTeamTargets.map((t) => [t.id, t.title]));

  for (const t of allTeamTargets) {
    if (t.createdAt < sinceTs) continue;
    const u = userById.get(t.createdBy);
    if (!u) continue;
    items.push({
      type: "target_created",
      at: t.createdAt.toISOString(),
      ...actor(u),
      targetId: t.id,
      title: t.title,
      targetType: t.type,
      endsAt: t.endsAt?.toISOString() ?? null,
    });
  }

  const targetIds = allTeamTargets.map((t) => t.id);
  if (targetIds.length > 0) {
    const completed = await db
      .select({
        userId: targetProgress.userId,
        targetId: targetProgress.targetId,
        goalValue: targetProgress.goalValue,
        currentValue: targetProgress.currentValue,
        completedAt: targetProgress.completedAt,
      })
      .from(targetProgress)
      .where(
        and(
          inArray(targetProgress.targetId, targetIds),
          inArray(targetProgress.userId, memberIds),
          gte(targetProgress.completedAt, sinceTs),
        ),
      )
      .orderBy(desc(targetProgress.completedAt))
      .limit(60);

    for (const row of completed) {
      if (!row.completedAt) continue;
      const u = userById.get(row.userId);
      if (!u) continue;
      items.push({
        type: "target_completed",
        at: row.completedAt.toISOString(),
        ...actor(u),
        targetId: row.targetId,
        title: titleByTargetId.get(row.targetId) ?? "Target",
        goalValue: row.goalValue,
        currentValue: row.currentValue,
      });
    }
  }

  for (const m of members) {
    if (m.joinedAt < sinceTs) continue;
    const u = userById.get(m.userId);
    if (!u) continue;
    items.push({
      type: "joined",
      at: m.joinedAt.toISOString(),
      ...actor(u),
      role: m.role,
    });
  }

  const announcements = await listAnnouncements(teamId, 30);
  for (const a of announcements) {
    if (a.createdAt < sinceTs) continue;
    items.push({
      type: "announcement",
      at: a.createdAt.toISOString(),
      id: a.id,
      title: a.title,
      bodyPreview:
        a.body.length > 160 ? `${a.body.slice(0, 157).trimEnd()}…` : a.body,
      authorUserId: a.author.id,
      authorUsername: a.author.username,
      authorDisplayName: a.author.displayName,
      authorAvatarUrl: a.author.avatarUrl,
    });
  }

  items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  return items.slice(0, limit);
}