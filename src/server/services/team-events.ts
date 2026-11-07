/**
 * Side effects for important team membership changes:
 * in-app notifications + Resend email (important only).
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { teamMembers, teams, users } from "@/server/db/schema";
import { sendImportantEmail, appUrl } from "@/server/mail";
import {
  teamAddedMail,
  teamApprovedMail,
  teamInviteMail,
  teamJoinUrl,
} from "@/server/mail/templates";
import { createNotification } from "@/server/services/notifications";

async function loadUser(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      username: true,
      displayName: true,
    },
  });
}

async function loadTeam(teamId: string) {
  return db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: {
      id: true,
      name: true,
      slug: true,
      inviteCode: true,
    },
  });
}

export async function notifyMemberAdded(opts: {
  teamId: string;
  targetUserId: string;
  actorId: string;
}) {
  const [team, target, actor] = await Promise.all([
    loadTeam(opts.teamId),
    loadUser(opts.targetUserId),
    loadUser(opts.actorId),
  ]);
  if (!team || !target) return;

  const actorName = actor?.displayName ?? actor?.username ?? "A teammate";
  const teamUrl = appUrl(`/teams/${team.slug}`);

  await createNotification({
    userId: target.id,
    type: "team_added",
    payload: {
      teamId: team.id,
      teamSlug: team.slug,
      teamName: team.name,
      addedBy: actorName,
      href: `/teams/${team.slug}`,
    },
  });

  const mail = teamAddedMail({
    displayName: target.displayName ?? target.username,
    teamName: team.name,
    teamUrl,
    addedBy: actorName,
  });
  await sendImportantEmail({ to: target.email, ...mail });
}

export async function notifyMemberInvited(opts: {
  teamId: string;
  targetUserId: string;
  actorId: string;
}) {
  const [team, target, actor] = await Promise.all([
    loadTeam(opts.teamId),
    loadUser(opts.targetUserId),
    loadUser(opts.actorId),
  ]);
  if (!team || !target) return;

  const actorName = actor?.displayName ?? actor?.username ?? "A teammate";
  const inviteUrl = teamJoinUrl(team.slug, team.inviteCode);

  await createNotification({
    userId: target.id,
    type: "team_invited",
    payload: {
      teamId: team.id,
      teamSlug: team.slug,
      teamName: team.name,
      invitedBy: actorName,
      href: `/teams/join?code=${team.inviteCode}`,
    },
  });

  const mail = teamInviteMail({
    displayName: target.displayName ?? target.username,
    teamName: team.name,
    inviteUrl,
    invitedBy: actorName,
  });
  await sendImportantEmail({ to: target.email, ...mail });
}

export async function notifyJoinApproved(opts: {
  teamId: string;
  targetUserId: string;
}) {
  const [team, target] = await Promise.all([
    loadTeam(opts.teamId),
    loadUser(opts.targetUserId),
  ]);
  if (!team || !target) return;

  const teamUrl = appUrl(`/teams/${team.slug}`);

  await createNotification({
    userId: target.id,
    type: "team_join_approved",
    payload: {
      teamId: team.id,
      teamSlug: team.slug,
      teamName: team.name,
      href: `/teams/${team.slug}`,
    },
  });

  const mail = teamApprovedMail({
    displayName: target.displayName ?? target.username,
    teamName: team.name,
    teamUrl,
  });
  await sendImportantEmail({ to: target.email, ...mail });
}

/** In-app only — join requests are useful but not email-worthy by default. */
export async function notifyJoinRequestToLeaders(opts: {
  teamId: string;
  requesterId: string;
}) {
  const [team, requester, leaders] = await Promise.all([
    loadTeam(opts.teamId),
    loadUser(opts.requesterId),
    db.query.teamMembers.findMany({
      where: and(
        eq(teamMembers.teamId, opts.teamId),
        eq(teamMembers.status, "ACTIVE"),
        inArray(teamMembers.role, ["OWNER", "ADMIN", "MODERATOR"]),
      ),
      columns: { userId: true },
    }),
  ]);
  if (!team || !requester) return;

  const name = requester.displayName ?? requester.username;
  await Promise.all(
    leaders
      .filter((l) => l.userId !== opts.requesterId)
      .map((l) =>
        createNotification({
          userId: l.userId,
          type: "team_join_request",
          payload: {
            teamId: team.id,
            teamSlug: team.slug,
            teamName: team.name,
            requester: name,
            href: `/teams/${team.slug}`,
          },
        }),
      ),
  );
}
