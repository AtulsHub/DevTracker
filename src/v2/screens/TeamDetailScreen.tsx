"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { Skeleton } from "@/v2/components/Skeleton";
import { EmptyState } from "@/v2/components/EmptyState";
import {
  v2Api,
  type LeaderboardDto,
  type TargetDto,
  type TeamMemberDto,
} from "@/v2/lib/api";
import { cn } from "@/v2/lib/cn";

type Tab = "overview" | "members" | "requests" | "targets" | "board";

type TeamInfo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  inviteCode?: string | null;
  memberCount?: number;
  userRole?: string;
  userStatus?: string;
  ownerId?: string;
  owner?: { username: string | null; displayName: string | null };
};

export function TeamDetailScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [requests, setRequests] = useState<TeamMemberDto[]>([]);
  const [targets, setTargets] = useState<TargetDto[]>([]);
  const [board, setBoard] = useState<LeaderboardDto[]>([]);
  const [boardRange, setBoardRange] = useState("weekly");
  const [meId, setMeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUser, setInviteUser] = useState("");
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetTitle, setTargetTitle] = useState("");
  const [targetGoal, setTargetGoal] = useState("10");
  const [targetDays, setTargetDays] = useState("7");

  const isLeader =
    team?.userRole === "OWNER" || team?.userRole === "ADMIN";
  const isMember = team?.userStatus === "ACTIVE" || !!team?.userRole;

  const loadCore = useCallback(async () => {
    const res = (await v2Api.team(slug)) as { team: TeamInfo };
    setTeam(res.team);

    const [meRes, membersRes] = await Promise.all([
      v2Api.me().catch(() => null),
      v2Api.teamMembers(slug).catch(() => ({ members: [] as TeamMemberDto[] })),
    ]);
    if (meRes?.user?.id) setMeId(String(meRes.user.id));
    setMembers(membersRes.members ?? []);
    return res.team;
  }, [slug]);

  const loadExtras = useCallback(
    async (t: TeamInfo) => {
      const jobs: Promise<void>[] = [];

      if (t.userRole && ["OWNER", "ADMIN", "MODERATOR"].includes(t.userRole)) {
        jobs.push(
          v2Api
            .teamPending(slug)
            .then((p) => setRequests(p.requests ?? []))
            .catch(() => setRequests([])),
        );
      }

      if (t.id && (t.userRole || t.userStatus === "ACTIVE")) {
        jobs.push(
          v2Api
            .teamTargets(t.id)
            .then((r) => setTargets(r.targets ?? []))
            .catch(() => setTargets([])),
        );
      }

      jobs.push(
        v2Api
          .teamLeaderboard(slug, boardRange)
          .then((lb) => setBoard(lb.leaderboard ?? []))
          .catch(() => setBoard([])),
      );

      await Promise.all(jobs);
    },
    [slug, boardRange],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const t = await loadCore();
        if (cancelled) return;
        setLoading(false);
        await loadExtras(t);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load team");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCore, loadExtras]);

  async function refreshAll() {
    const t = await loadCore();
    await loadExtras(t);
  }

  async function copyInvite() {
    if (!team?.inviteCode) return;
    const url = `${window.location.origin}/teams/join?code=${team.inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Invite link copied");
    } catch {
      setMsg(url);
    }
  }

  async function addByUsername() {
    setBusy(true);
    setMsg(null);
    try {
      await v2Api.inviteMember(slug, inviteUser.trim());
      setInviteOpen(false);
      setInviteUser("");
      setMsg("Member added");
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not add member");
    } finally {
      setBusy(false);
    }
  }

  async function requestJoin() {
    setBusy(true);
    setMsg(null);
    try {
      const r = (await v2Api.requestJoin(slug)) as { status?: string };
      setMsg(
        r.status === "PENDING"
          ? "Join request sent — waiting for approval"
          : "Joined the team",
      );
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not request join");
    } finally {
      setBusy(false);
    }
  }

  async function approve(userId: string) {
    setBusy(true);
    try {
      await v2Api.approveRequest(slug, userId);
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function reject(userId: string) {
    setBusy(true);
    try {
      await v2Api.rejectRequest(slug, userId);
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    if (!confirm("Remove this member from the team?")) return;
    setBusy(true);
    try {
      await v2Api.removeMember(slug, userId);
      if (userId === meId) {
        router.push("/teams");
        return;
      }
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  async function createTarget() {
    if (!team) return;
    const goal = Number.parseInt(targetGoal, 10);
    const days = Number.parseInt(targetDays, 10);
    if (!targetTitle.trim() || !Number.isFinite(goal) || goal < 1) {
      setMsg("Enter a title and goal ≥ 1");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const startsAt = new Date().toISOString();
      const endsAt = new Date(
        Date.now() + (Number.isFinite(days) ? days : 7) * 86400000,
      ).toISOString();
      await v2Api.createTarget({
        title: targetTitle.trim(),
        type: "SOLVE_COUNT",
        goalValue: goal,
        startsAt,
        endsAt,
        teamId: team.id,
      });
      setTargetOpen(false);
      setTargetTitle("");
      setTargetGoal("10");
      setMsg("Target created for all active members");
      setTab("targets");
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not create target");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 px-4 py-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Team unavailable"
          description={error ?? "This team could not be loaded."}
          action={
            <Link href="/teams">
              <Button variant="secondary">Back to teams</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; hide?: boolean }[] = [
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    {
      id: "requests",
      label: `Requests${requests.length ? ` (${requests.length})` : ""}`,
      hide: !isLeader && team.userRole !== "MODERATOR",
    },
    { id: "targets", label: "Targets", hide: !isMember },
    { id: "board", label: "Board" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
      <Link
        href="/teams"
        className="text-[var(--v2-text-sm)] text-[var(--v2-primary)] no-underline"
      >
        ← Teams
      </Link>

      <header className="mt-3 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight">
              {team.name}
            </h1>
            {team.description ? (
              <p className="mt-1 max-w-xl text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                {team.description}
              </p>
            ) : null}
            <p className="mt-2 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
              {team.visibility} · {team.memberCount ?? members.length} members
              {team.userRole ? ` · you: ${team.userRole}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isMember && meId ? (
              <Button loading={busy} onClick={() => void requestJoin()}>
                Request to join
              </Button>
            ) : null}
            {!meId ? (
              <Link href="/sign-up">
                <Button>Sign up to join</Button>
              </Link>
            ) : null}
            {isLeader ? (
              <>
                <Button variant="secondary" onClick={() => setInviteOpen(true)}>
                  Add member
                </Button>
                <Button onClick={() => setTargetOpen(true)}>Set target</Button>
              </>
            ) : null}
          </div>
        </div>
        {msg ? (
          <p className="mt-3 text-[var(--v2-text-sm)] text-[var(--v2-primary)]">
            {msg}
          </p>
        ) : null}
      </header>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--v2-border)] pb-px">
        {tabs
          .filter((t) => !t.hide)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-10 shrink-0 border-b-2 px-3 text-[var(--v2-text-sm)] font-medium",
                tab === t.id
                  ? "border-[var(--v2-primary)] text-[var(--v2-primary)]"
                  : "border-transparent text-[var(--v2-fg-muted)]",
              )}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === "overview" ? (
        <div className="flex flex-col gap-4">
          {isLeader && team.inviteCode ? (
            <Card>
              <CardHeader>
                <h2 className="text-[var(--v2-text-sm)] font-semibold">
                  Invite people
                </h2>
              </CardHeader>
              <CardBody className="space-y-3 pt-0">
                <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                  Share this code or link. For private teams, joiners wait for
                  your approval.
                </p>
                <p className="font-mono text-[var(--v2-text-xl)] font-bold tracking-widest text-[var(--v2-fg)]">
                  {team.inviteCode}
                </p>
                <Button variant="secondary" onClick={() => void copyInvite()}>
                  Copy invite link
                </Button>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold">
                Targets snapshot
              </h2>
              {isMember ? (
                <button
                  type="button"
                  className="text-[var(--v2-text-xs)] text-[var(--v2-primary)]"
                  onClick={() => setTab("targets")}
                >
                  View all
                </button>
              ) : null}
            </CardHeader>
            <CardBody className="pt-0">
              {!isMember ? (
                <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                  Join the team to see shared targets.
                </p>
              ) : targets.length === 0 ? (
                <EmptyState
                  title="No targets yet"
                  description={
                    isLeader
                      ? "Set a solve goal for the whole team."
                      : "Leaders can set practice targets here."
                  }
                  action={
                    isLeader ? (
                      <Button onClick={() => setTargetOpen(true)}>
                        Set target
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {targets.slice(0, 3).map((t) => (
                    <TargetCard key={t.id} target={t} showMembers={isLeader} />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "members" ? (
        <Card>
          <CardHeader>
            <h2 className="text-[var(--v2-text-sm)] font-semibold">
              Members ({members.length})
            </h2>
          </CardHeader>
          <CardBody className="divide-y divide-[var(--v2-border)] p-0">
            {members.length === 0 ? (
              <p className="p-4 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                No members listed.
              </p>
            ) : (
              members.map((m) => {
                const privateProfile =
                  m.user.profileVisibility &&
                  m.user.profileVisibility !== "PUBLIC";
                const canKick =
                  isLeader && m.role !== "OWNER" && m.userId !== meId;
                const isSelf = m.userId === meId;
                return (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      {privateProfile || !m.user.username ? (
                        <p className="font-medium">Private member</p>
                      ) : (
                        <Link
                          href={`/u/${m.user.username}`}
                          className="font-medium text-[var(--v2-primary)] no-underline"
                        >
                          {m.user.displayName ?? `@${m.user.username}`}
                        </Link>
                      )}
                      <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                        {m.role}
                        {m.user.username ? ` · @${m.user.username}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canKick ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() => void remove(m.userId)}
                        >
                          Remove
                        </Button>
                      ) : null}
                      {isSelf && m.role !== "OWNER" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() => void remove(m.userId)}
                        >
                          Leave
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      ) : null}

      {tab === "requests" ? (
        <Card>
          <CardHeader>
            <h2 className="text-[var(--v2-text-sm)] font-semibold">
              Pending requests
            </h2>
          </CardHeader>
          <CardBody className="divide-y divide-[var(--v2-border)] p-0">
            {requests.length === 0 ? (
              <EmptyState title="No pending requests" />
            ) : (
              requests.map((r) => (
                <div
                  key={r.userId}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {r.user.displayName ?? r.user.username ?? "User"}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                      @{r.user.username}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={busy}
                      onClick={() => void approve(r.userId)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy}
                      onClick={() => void reject(r.userId)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      ) : null}

      {tab === "targets" ? (
        <div className="flex flex-col gap-4">
          {isLeader ? (
            <div className="flex justify-end">
              <Button onClick={() => setTargetOpen(true)}>New target</Button>
            </div>
          ) : null}
          {targets.length === 0 ? (
            <Card>
              <EmptyState
                title="No team targets"
                description="Leaders set solve goals that track automatically from synced platforms."
              />
            </Card>
          ) : (
            targets.map((t) => (
              <TargetCard key={t.id} target={t} showMembers={isLeader} />
            ))
          )}
        </div>
      ) : null}

      {tab === "board" ? (
        <Card>
          <CardHeader>
            <h2 className="text-[var(--v2-text-sm)] font-semibold">
              Leaderboard
            </h2>
            <div className="flex gap-1">
              {(["daily", "weekly", "monthly", "all-time"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setBoardRange(r)}
                  className={cn(
                    "rounded-[var(--v2-radius-sm)] px-2 py-1 text-[11px] font-medium capitalize",
                    boardRange === r
                      ? "bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                      : "text-[var(--v2-fg-subtle)]",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody className="divide-y divide-[var(--v2-border)] p-0">
            {board.length === 0 ? (
              <EmptyState title="No activity in this range yet" />
            ) : (
              board.map((row) => (
                <div
                  key={row.userId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg-subtle)]">
                      #{row.rank}
                    </span>
                    <div>
                      <Link
                        href={`/u/${row.username}`}
                        className="font-medium text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                      >
                        {row.displayName ?? row.username}
                      </Link>
                      <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                        @{row.username}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono font-bold text-[var(--v2-primary)]">
                    {row.totalSolved}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      ) : null}

      <BottomSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Add member by username"
      >
        <Input
          label="Username"
          placeholder="their_handle"
          value={inviteUser}
          onChange={(e) => setInviteUser(e.target.value)}
        />
        <p className="mt-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
          Adds them immediately. Or share the invite code so they request to
          join.
        </p>
        <Button
          className="mt-4 w-full"
          loading={busy}
          onClick={() => void addByUsername()}
        >
          Add to team
        </Button>
      </BottomSheet>

      <BottomSheet
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
        title="Set team target"
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Title"
            placeholder="Solve 20 problems this week"
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
          />
          <Input
            label="Goal (problems solved)"
            type="number"
            min={1}
            value={targetGoal}
            onChange={(e) => setTargetGoal(e.target.value)}
          />
          <Input
            label="Duration (days)"
            type="number"
            min={1}
            value={targetDays}
            onChange={(e) => setTargetDays(e.target.value)}
          />
          <p className="text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
            Assigned to every active member. Progress updates from synced
            solves.
          </p>
          <Button loading={busy} onClick={() => void createTarget()}>
            Create target
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function TargetCard({
  target,
  showMembers,
}: {
  target: TargetDto;
  showMembers?: boolean;
}) {
  const goal =
    target.progress?.goalValue ?? target.memberProgress?.[0]?.goalValue ?? 1;
  const current = target.progress?.currentValue ?? 0;
  const pct = Math.min(100, Math.round((current / Math.max(goal, 1)) * 100));
  const teamPct =
    target.assigneeCount && target.assigneeCount > 0
      ? Math.round(((target.completedCount ?? 0) / target.assigneeCount) * 100)
      : 0;

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-[var(--v2-fg)]">{target.title}</h3>
            <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
              {target.type.replace(/_/g, " ")}
              {target.endsAt
                ? ` · ends ${new Date(target.endsAt).toLocaleDateString()}`
                : ""}
            </p>
          </div>
          {target.progress?.isCompleted ? (
            <span className="rounded-[var(--v2-radius-sm)] bg-[var(--v2-primary-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--v2-primary)]">
              Done
            </span>
          ) : null}
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
            <span>Your progress</span>
            <span className="font-mono">
              {current}/{goal}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--v2-bg-muted)]">
            <div
              className="h-full rounded-full bg-[var(--v2-primary)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {typeof target.completedCount === "number" &&
        typeof target.assigneeCount === "number" ? (
          <p className="mt-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
            Team: {target.completedCount}/{target.assigneeCount} completed (
            {teamPct}%)
          </p>
        ) : null}

        {showMembers &&
        target.memberProgress &&
        target.memberProgress.length > 0 ? (
          <ul className="mt-3 space-y-2 border-t border-[var(--v2-border)] pt-3">
            {target.memberProgress.map((m) => {
              const mp = Math.min(
                100,
                Math.round((m.currentValue / Math.max(m.goalValue, 1)) * 100),
              );
              return (
                <li key={m.userId}>
                  <div className="mb-0.5 flex justify-between text-[11px]">
                    <span className="text-[var(--v2-fg)]">
                      {m.displayName ?? m.username ?? "Member"}
                      {m.isCompleted ? " · done" : ""}
                    </span>
                    <span className="font-mono text-[var(--v2-fg-subtle)]">
                      {m.currentValue}/{m.goalValue}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--v2-bg-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--v2-accent)]"
                      style={{ width: `${mp}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardBody>
    </Card>
  );
}
