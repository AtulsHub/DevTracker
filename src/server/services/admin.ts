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
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/server/db";
import {
  auditLog,
  contests,
  platformAccounts,
  solves,
  submissions,
  syncRuns,
  targets,
  teamAnnouncements,
  teams,
  users,
} from "@/server/db/schema";
import { syncAccount } from "@/server/services/sync";
import { refreshContestsFromAdapters } from "@/server/services/contests";
import { writeAudit } from "@/server/admin";

function fillDaySeries(
  from: Date,
  days: number,
  rows: Array<{ day: string; n: number }>,
) {
  const map = new Map(rows.map((r) => [r.day, r.n]));
  const series: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setUTCDate(from.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, count: map.get(key) ?? 0 });
  }
  return series;
}

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
      suspendedAt: teams.suspendedAt,
      description: teams.description,
      avatarUrl: teams.avatarUrl,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .where(where)
    .orderBy(desc(teams.createdAt))
    .limit(Math.min(limit, 100));
}

export async function patchAdminTeam(
  actorId: string,
  teamId: string,
  patch: {
    suspended?: boolean;
    clearDescription?: boolean;
    clearAvatar?: boolean;
  },
) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: {
      id: true,
      slug: true,
      name: true,
      suspendedAt: true,
    },
  });
  if (!team) throw new Error("Team not found");

  const updates: Partial<typeof teams.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.suspended !== undefined) {
    updates.suspendedAt = patch.suspended ? new Date() : null;
  }
  if (patch.clearDescription) updates.description = null;
  if (patch.clearAvatar) updates.avatarUrl = null;

  const [row] = await db
    .update(teams)
    .set(updates)
    .where(eq(teams.id, teamId))
    .returning({
      id: teams.id,
      slug: teams.slug,
      name: teams.name,
      suspendedAt: teams.suspendedAt,
      description: teams.description,
      avatarUrl: teams.avatarUrl,
    });

  await writeAudit({
    actorId,
    action: "team.patch",
    entity: "team",
    entityId: teamId,
    metadata: patch,
  });

  return row;
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

export async function moderateUserContent(
  actorId: string,
  userId: string,
  patch: { clearBio?: boolean; clearAvatar?: boolean; clearHeadline?: boolean },
) {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, username: true },
  });
  if (!existing) throw new Error("User not found");

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.clearBio) updates.bio = null;
  if (patch.clearAvatar) updates.avatarUrl = null;
  if (patch.clearHeadline) updates.headline = null;

  const [user] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      username: users.username,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      headline: users.headline,
    });

  await writeAudit({
    actorId,
    action: "user.moderate_content",
    entity: "user",
    entityId: userId,
    metadata: patch,
  });

  return user;
}

export async function listModerationQueue(limit = 40) {
  const [flaggedUsers, recentAnnouncements] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        bio: users.bio,
        headline: users.headline,
        avatarUrl: users.avatarUrl,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(
        or(
          isNotNull(users.bio),
          isNotNull(users.avatarUrl),
          isNotNull(users.headline),
        ),
      )
      .orderBy(desc(users.updatedAt))
      .limit(Math.min(limit, 80)),
    db
      .select({
        id: teamAnnouncements.id,
        title: teamAnnouncements.title,
        body: teamAnnouncements.body,
        imageUrl: teamAnnouncements.imageUrl,
        createdAt: teamAnnouncements.createdAt,
        teamId: teamAnnouncements.teamId,
        teamName: teams.name,
        teamSlug: teams.slug,
        authorUsername: users.username,
      })
      .from(teamAnnouncements)
      .innerJoin(teams, eq(teamAnnouncements.teamId, teams.id))
      .innerJoin(users, eq(teamAnnouncements.authorId, users.id))
      .orderBy(desc(teamAnnouncements.createdAt))
      .limit(Math.min(limit, 80)),
  ]);

  return { flaggedUsers, recentAnnouncements };
}

export async function deleteAdminAnnouncement(
  actorId: string,
  announcementId: string,
) {
  const row = await db.query.teamAnnouncements.findFirst({
    where: eq(teamAnnouncements.id, announcementId),
    columns: { id: true, title: true, teamId: true },
  });
  if (!row) throw new Error("Announcement not found");

  await db
    .delete(teamAnnouncements)
    .where(eq(teamAnnouncements.id, announcementId));

  await writeAudit({
    actorId,
    action: "announcement.delete",
    entity: "announcement",
    entityId: announcementId,
    metadata: { title: row.title, teamId: row.teamId },
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

/** Full analytics payload for the admin dashboard. */
export async function getAdminDashboard(days = 30) {
  const windowDays = Math.min(Math.max(days, 7), 90);
  const now = new Date();
  const from = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - (windowDays - 1),
    ),
  );
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    [userCount],
    [verifiedCount],
    [disabledCount],
    [teamCount],
    [targetCount],
    [activeTargetCount],
    [solveCount],
    [solveWindow],
    [submissionCount],
    [submissionWindow],
    [contestCount],
    [upcomingContests],
    [platformCount],
    [syncOk],
    [syncFail],
    signupRows,
    solveDayRows,
    platformRows,
    teamVisRows,
    topSolvers,
  ] = await Promise.all([
    db.select({ n: count() }).from(users),
    db
      .select({ n: count() })
      .from(users)
      .where(isNotNull(users.emailVerified)),
    db.select({ n: count() }).from(users).where(isNotNull(users.disabledAt)),
    db.select({ n: count() }).from(teams),
    db.select({ n: count() }).from(targets),
    db
      .select({ n: count() })
      .from(targets)
      .where(
        or(isNull(targets.endsAt), gte(targets.endsAt, now)),
      ),
    db.select({ n: count() }).from(solves),
    db
      .select({ n: count() })
      .from(solves)
      .where(gte(solves.firstSolvedAt, from)),
    db.select({ n: count() }).from(submissions),
    db
      .select({ n: count() })
      .from(submissions)
      .where(gte(submissions.submittedAt, from)),
    db.select({ n: count() }).from(contests),
    db
      .select({ n: count() })
      .from(contests)
      .where(gte(contests.startsAt, now)),
    db.select({ n: count() }).from(platformAccounts),
    db
      .select({ n: count() })
      .from(syncRuns)
      .where(
        and(gte(syncRuns.startedAt, dayAgo), eq(syncRuns.status, "success")),
      ),
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
      .select({
        day: sql<string>`to_char(date_trunc('day', ${users.createdAt} at time zone 'utc'), 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(users)
      .where(gte(users.createdAt, from))
      .groupBy(sql`date_trunc('day', ${users.createdAt} at time zone 'utc')`)
      .orderBy(sql`date_trunc('day', ${users.createdAt} at time zone 'utc')`),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${solves.firstSolvedAt} at time zone 'utc'), 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(solves)
      .where(gte(solves.firstSolvedAt, from))
      .groupBy(
        sql`date_trunc('day', ${solves.firstSolvedAt} at time zone 'utc')`,
      )
      .orderBy(
        sql`date_trunc('day', ${solves.firstSolvedAt} at time zone 'utc')`,
      ),
    db
      .select({
        platform: platformAccounts.platform,
        n: count(),
      })
      .from(platformAccounts)
      .groupBy(platformAccounts.platform)
      .orderBy(desc(count())),
    db
      .select({
        visibility: teams.visibility,
        n: count(),
      })
      .from(teams)
      .groupBy(teams.visibility),
    db
      .select({
        userId: solves.userId,
        username: users.username,
        displayName: users.displayName,
        solves: count(),
      })
      .from(solves)
      .innerJoin(users, eq(solves.userId, users.id))
      .where(gte(solves.firstSolvedAt, from))
      .groupBy(solves.userId, users.username, users.displayName)
      .orderBy(desc(count()))
      .limit(8),
  ]);

  const totalUsers = userCount?.n ?? 0;

  return {
    windowDays,
    totals: {
      users: totalUsers,
      verifiedUsers: verifiedCount?.n ?? 0,
      disabledUsers: disabledCount?.n ?? 0,
      verifiedRate:
        totalUsers > 0
          ? Math.round(((verifiedCount?.n ?? 0) / totalUsers) * 100)
          : 0,
      teams: teamCount?.n ?? 0,
      targets: targetCount?.n ?? 0,
      activeTargets: activeTargetCount?.n ?? 0,
      solves: solveCount?.n ?? 0,
      solvesInWindow: solveWindow?.n ?? 0,
      submissions: submissionCount?.n ?? 0,
      submissionsInWindow: submissionWindow?.n ?? 0,
      contests: contestCount?.n ?? 0,
      upcomingContests: upcomingContests?.n ?? 0,
      platformAccounts: platformCount?.n ?? 0,
      syncSuccess24h: syncOk?.n ?? 0,
      syncFailures24h: syncFail?.n ?? 0,
    },
    signupsByDay: fillDaySeries(
      from,
      windowDays,
      signupRows.map((r) => ({ day: r.day, n: Number(r.n) })),
    ),
    solvesByDay: fillDaySeries(
      from,
      windowDays,
      solveDayRows.map((r) => ({ day: r.day, n: Number(r.n) })),
    ),
    platforms: platformRows.map((r) => ({
      platform: r.platform,
      count: Number(r.n),
    })),
    teamsByVisibility: teamVisRows.map((r) => ({
      visibility: r.visibility,
      count: Number(r.n),
    })),
    topSolvers: topSolvers.map((r) => ({
      userId: r.userId,
      username: r.username,
      displayName: r.displayName,
      solves: Number(r.solves),
    })),
  };
}
