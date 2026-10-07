/**
 * src/server/services/teams.ts
 * Business logic for team management.
 */
import { db } from "@/server/db";
import { teams, teamMembers, users, teamAnnouncements } from "@/server/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { teamRoleEnum, teamMemberStatusEnum, teamVisibilityEnum } from "@/server/db/schema";

export interface CreateTeamInput {
  name: string;
  slug: string;
  description?: string;
  visibility?: "PUBLIC" | "PRIVATE" | "SECRET";
  memberVisibilityPolicy?: "EVERYONE" | "FOLLOWERS" | "TEAM" | "ME";
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
 * Get public teams (for discovery).
 */
export async function getPublicTeams(limit = 20, offset = 0): Promise<TeamWithMembers[]> {
  const publicTeams = await db.query.teams.findMany({
    where: eq(teams.visibility, "PUBLIC"),
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

  // Check if already a member
  const existing = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)),
  });

  if (existing) {
    throw new Error("Already a member of this team");
  }

  // Check team visibility
  if (team.visibility === "SECRET") {
    throw new Error("This team is secret and cannot be joined via invite");
  }

  const status = team.visibility === "PUBLIC" ? "ACTIVE" : "PENDING";

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role: "MEMBER",
    status,
  });

  return { teamId: team.id, status };
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
  if (newRole === "OWNER") {
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

/**
 * Approve a join request (admin/owner only).
 */
export async function approveJoinRequest(teamId: string, actorId: string, targetUserId: string) {
  const actorMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });

  if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
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

  return { success: true };
}

/**
 * Reject a join request (admin/owner only).
 */
export async function rejectJoinRequest(teamId: string, actorId: string, targetUserId: string) {
  const actorMembership = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, actorId)),
  });

  if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
    throw new Error("Insufficient permissions");
  }

  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId), eq(teamMembers.status, "PENDING")));

  return { success: true };
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
        columns: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
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