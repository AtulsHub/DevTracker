/**
 * Admin read/write operations for the platform console.
 */
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  or,
} from "drizzle-orm";
import { db } from "@/server/db";
import {
  auditLog,
  platformAccounts,
  syncRuns,
  teams,
  users,
} from "@/server/db/schema";
import { syncAccount } from "@/server/services/sync";
import { refreshContestsFromAdapters } from "@/server/services/contests";
import { writeAudit } from "@/server/admin";

export async function getAdminStats() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    [userCount],
    [teamCount],
    [disabledCount],
    [adminCount],
    [platformCount],
    [syncFail],
    [syncOk],
    recentUsers,
  ] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(teams),
    db.select({ n: count() }).from(users).where(isNotNull(users.disabledAt)),
    db.select({ n: count() }).from(users).where(eq(users.isAdmin, true)),
    db.select({ n: count() }).from(platformAccounts),
    db
      .select({ n: count() })
      .from(syncRuns)
      .where(
        and(
          gte(syncRuns.startedAt, dayAgo),
          or(eq(syncRuns.status, "error"), eq(syncRuns.status, "degraded")),
        ),
      ),
    db
      .select({ n: count() })
      .from(syncRuns)
      .where(and(gte(syncRuns.startedAt, dayAgo), eq(syncRuns.status, "success"))),
    db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(8),
  ]);

  return {
    users: userCount?.n ?? 0,
    teams: teamCount?.n ?? 0,
    disabledUsers: disabledCount?.n ?? 0,
    admins: adminCount?.n ?? 0,
    platformAccounts: platformCount?.n ?? 0,
    syncFailures24h: syncFail?.n ?? 0,
    syncSuccess24h: syncOk?.n ?? 0,
    recentUsers,
  };
}

export async function listAdminUsers(q: string, limit = 50) {
  const term = q.trim();
  const where = term
    ? or(
        ilike(users.username, `%${term}%`),
        ilike(users.email, `%${term}%`),
        ilike(users.displayName, `%${term}%`),
      )
    : undefined;

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      isAdmin: users.isAdmin,
      disabledAt: users.disabledAt,
      emailVerified: users.emailVerified,
      discoverable: users.discoverable,
      profileVisibility: users.profileVisibility,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(Math.min(limit, 100));

  return rows;
}

export async function patchAdminUser(
  actorId: string,
  userId: string,
  patch: {
    disabled?: boolean;
    isAdmin?: boolean;
    emailVerified?: boolean;
    discoverable?: boolean;
  },
) {
  if (userId === actorId && patch.disabled) {
    throw new Error("You cannot disable your own account");
  }
  if (userId === actorId && patch.isAdmin === false) {
    throw new Error("You cannot remove your own admin role");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      isAdmin: true,
      disabledAt: true,
      emailVerified: true,
      discoverable: true,
    },
  });
  if (!existing) throw new Error("User not found");

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (patch.disabled !== undefined) {
    updates.disabledAt = patch.disabled ? new Date() : null;
  }
  if (patch.isAdmin !== undefined) {
    updates.isAdmin = patch.isAdmin;
  }
  if (patch.emailVerified !== undefined) {
    updates.emailVerified = patch.emailVerified ? new Date() : null;
  }
  if (patch.discoverable !== undefined) {
    updates.discoverable = patch.discoverable;
  }

  const [user] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      isAdmin: users.isAdmin,
      disabledAt: users.disabledAt,
      emailVerified: users.emailVerified,
      discoverable: users.discoverable,
    });

  await writeAudit({
    actorId,
    action: "user.patch",
    entity: "user",
    entityId: userId,
    metadata: patch,
  });

  return user;
}

export async function listAdminTeams(q: string, limit = 50) {
  const term = q.trim();
  const where = term
    ? or(ilike(teams.name, `%${term}%`), ilike(teams.slug, `%${term}%`))
    : undefined;

  return db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      visibility: teams.visibility,
      ownerId: teams.ownerId,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .where(where)
    .orderBy(desc(teams.createdAt))
    .limit(Math.min(limit, 100));
}

export async function deleteAdminTeam(actorId: string, teamId: string) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: { id: true, slug: true, name: true },
  });
  if (!team) throw new Error("Team not found");

  await db.delete(teams).where(eq(teams.id, teamId));
  await writeAudit({
    actorId,
    action: "team.delete",
    entity: "team",
    entityId: teamId,
    metadata: { slug: team.slug, name: team.name },
  });
}

export async function listRecentSyncRuns(limit = 40) {
  const rows = await db
    .select({
      id: syncRuns.id,
      status: syncRuns.status,
      startedAt: syncRuns.startedAt,
      finishedAt: syncRuns.finishedAt,
      itemsFetched: syncRuns.itemsFetched,
      error: syncRuns.error,
      platform: platformAccounts.platform,
      handle: platformAccounts.handle,
      userId: platformAccounts.userId,
      username: users.username,
    })
    .from(syncRuns)
    .innerJoin(
      platformAccounts,
      eq(syncRuns.platformAccountId, platformAccounts.id),
    )
    .innerJoin(users, eq(platformAccounts.userId, users.id))
    .orderBy(desc(syncRuns.startedAt))
    .limit(Math.min(limit, 100));

  return rows;
}

export async function forceSyncUser(actorId: string, userId: string) {
  const accounts = await db.query.platformAccounts.findMany({
    where: eq(platformAccounts.userId, userId),
    columns: { id: true, platform: true, handle: true },
  });

  const results: Array<{
    platform: string;
    handle: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const account of accounts) {
    try {
      await syncAccount(account.id, { full: true });
      results.push({
        platform: account.platform,
        handle: account.handle,
        ok: true,
      });
    } catch (e) {
      results.push({
        platform: account.platform,
        handle: account.handle,
        ok: false,
        error: e instanceof Error ? e.message : "Sync failed",
      });
    }
  }

  await writeAudit({
    actorId,
    action: "user.force_sync",
    entity: "user",
    entityId: userId,
    metadata: { synced: results.length, results },
  });

  return { synced: results.length, results };
}

export async function adminRefreshContests(actorId: string) {
  const result = await refreshContestsFromAdapters();
  await writeAudit({
    actorId,
    action: "contests.refresh",
    entity: "contests",
    metadata: result as unknown as Record<string, unknown>,
  });
  return result;
}

export async function listAuditLog(limit = 50) {
  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
      actorId: auditLog.actorId,
      actorUsername: users.username,
      actorEmail: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorId, users.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(Math.min(limit, 100));

  return rows;
}
