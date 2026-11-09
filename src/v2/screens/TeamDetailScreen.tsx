"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Flag,
  Megaphone,
  Target,
  Trash2,
  Trophy,
  UserPlus,
  CalendarDays,
  Users,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { Skeleton } from "@/v2/components/Skeleton";
import { EmptyState } from "@/v2/components/EmptyState";
import {
  v2Api,
  type AnnouncementDto,
  type LeaderboardDto,
  type TargetDto,
  type TeamActivityDto,
  type TeamMemberDto,
} from "@/v2/lib/api";
import { uploadImage, type UploadFolder } from "@/v2/lib/upload";
import { LINKABLE_PLATFORMS, platformLabel } from "@/v2/lib/platforms";
import {
  TARGET_TYPE_SECTIONS,
  TARGET_TYPES,
  targetTypeMeta,
  type TargetTypeId,
} from "@/v2/lib/targetTypes";
import { cn } from "@/v2/lib/cn";
import { useToast } from "@/v2/feedback/ToastProvider";
import { useConfirm } from "@/v2/feedback/useConfirm";

type ActivityFilter =
  | "all"
  | "problem"
  | "contest"
  | "day"
  | "target"
  | "joined"
  | "announcement";

type Tab =
  | "overview"
  | "members"
  | "requests"
  | "targets"
  | "board"
  | "announcements"
  | "activity"
  | "settings";

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
  avatarUrl?: string | null;
  memberVisibilityPolicy?: string;
  owner?: { username: string | null; displayName: string | null };
};

export function TeamDetailScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [tab, setTab] = useState<Tab>("overview");
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [requests, setRequests] = useState<TeamMemberDto[]>([]);
  const [targets, setTargets] = useState<TargetDto[]>([]);
  const [board, setBoard] = useState<LeaderboardDto[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [activity, setActivity] = useState<TeamActivityDto[]>([]);
  const [activityDays, setActivityDays] = useState(14);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
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
  const [targetType, setTargetType] = useState<TargetTypeId>("SOLVE_COUNT");
  const [targetGoal, setTargetGoal] = useState("10");
  const [targetDays, setTargetDays] = useState("7");
  const [targetPlatform, setTargetPlatform] = useState("");
  const [targetMinRating, setTargetMinRating] = useState("");
  const [targetMaxRating, setTargetMaxRating] = useState("");
  const [targetProblemList, setTargetProblemList] = useState("");
  const [targetChecklist, setTargetChecklist] = useState("");
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announceImage, setAnnounceImage] = useState<string | null>(null);
  const [announceLink, setAnnounceLink] = useState("");
  const announceFileRef = useRef<HTMLInputElement>(null);
  const settingsFileRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState<
    "PUBLIC" | "PRIVATE" | "SECRET"
  >("PRIVATE");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editPolicy, setEditPolicy] = useState<
    "EVERYONE" | "FOLLOWERS" | "TEAM" | "ME"
  >("TEAM");
  const [uploading, setUploading] = useState(false);

  const isOwner = team?.userRole === "OWNER";
  const isLeader =
    team?.userRole === "OWNER" || team?.userRole === "ADMIN";
  const canModerate =
    isLeader || team?.userRole === "MODERATOR";
  const isMember = team?.userStatus === "ACTIVE";
  const isPending = team?.userStatus === "PENDING";

  const loadCore = useCallback(async () => {
    const res = (await v2Api.team(slug)) as { team: TeamInfo };
    setTeam(res.team);
    setEditName(res.team.name);
    setEditDescription(res.team.description ?? "");
    setEditVisibility(
      (res.team.visibility as "PUBLIC" | "PRIVATE" | "SECRET") || "PRIVATE",
    );
    setEditAvatar(res.team.avatarUrl ?? null);
    setEditPolicy(
      (res.team.memberVisibilityPolicy as
        | "EVERYONE"
        | "FOLLOWERS"
        | "TEAM"
        | "ME") || "TEAM",
    );

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
      const active = t.userStatus === "ACTIVE";

      if (
        t.userRole &&
        ["OWNER", "ADMIN", "MODERATOR"].includes(t.userRole)
      ) {
        jobs.push(
          v2Api
            .teamPending(slug)
            .then((p) => setRequests(p.requests ?? []))
            .catch(() => setRequests([])),
        );
      }

      if (t.id && active) {
        jobs.push(
          v2Api
            .teamTargets(t.id)
            .then((r) => setTargets(r.targets ?? []))
            .catch(() => setTargets([])),
        );
      }

      if (t.visibility === "PUBLIC" || active) {
        jobs.push(
          v2Api
            .teamLeaderboard(slug, boardRange)
            .then((lb) => setBoard(lb.leaderboard ?? []))
            .catch(() => setBoard([])),
          v2Api
            .teamAnnouncements(slug)
            .then((a) => setAnnouncements(a.announcements ?? []))
            .catch(() => setAnnouncements([])),
          v2Api
            .teamActivity(slug, activityDays)
            .then((a) => setActivity(a.activity ?? []))
            .catch(() => setActivity([])),
        );
      }

      await Promise.all(jobs);
    },
    [slug, boardRange, activityDays],
  );

  const filteredActivity = useMemo(() => {
    if (activityFilter === "all") return activity;
    if (activityFilter === "target") {
      return activity.filter(
        (i) => i.type === "target_created" || i.type === "target_completed",
      );
    }
    return activity.filter((i) => i.type === activityFilter);
  }, [activity, activityFilter]);

  const activityGroups = useMemo(() => {
    const groups: { date: string; items: TeamActivityDto[] }[] = [];
    const byDate = new Map<string, TeamActivityDto[]>();
    for (const item of filteredActivity) {
      const date = item.at.slice(0, 10);
      const list = byDate.get(date) ?? [];
      list.push(item);
      byDate.set(date, list);
    }
    for (const [date, items] of byDate) {
      groups.push({ date, items });
    }
    groups.sort((a, b) => b.date.localeCompare(a.date));
    return groups;
  }, [filteredActivity]);

  const activityCounts = useMemo(() => {
    const counts: Record<ActivityFilter, number> = {
      all: activity.length,
      problem: 0,
      contest: 0,
      day: 0,
      target: 0,
      joined: 0,
      announcement: 0,
    };
    for (const item of activity) {
      if (item.type === "target_created" || item.type === "target_completed") {
        counts.target += 1;
      } else if (item.type in counts) {
        counts[item.type as ActivityFilter] += 1;
      }
    }
    return counts;
  }, [activity]);

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
      toast.success("Invite link copied");
      setMsg("Invite link copied");
    } catch {
      setMsg(url);
    }
  }

  async function regenerateInvite() {
    const ok = await confirm({
      title: "Regenerate invite code?",
      description: "Old invite links will stop working immediately.",
      confirmLabel: "Regenerate",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await v2Api.regenerateInvite(slug);
      setTeam((prev) =>
        prev ? { ...prev, inviteCode: res.inviteCode } : prev,
      );
      toast.success("New invite code generated");
      setMsg("New invite code generated");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Could not regenerate";
      toast.error(m);
      setMsg(m);
    } finally {
      setBusy(false);
    }
  }

  async function inviteByUsername(mode: "invite" | "add") {
    setBusy(true);
    setMsg(null);
    try {
      await v2Api.inviteMember(slug, inviteUser.trim(), mode);
      setInviteOpen(false);
      setInviteUser("");
      toast.success(
        mode === "invite" ? "Invite emailed" : "Member added",
        mode === "invite"
          ? "They’ll get an in-app notice and email with the join link."
          : "They’ll get an in-app notice and email.",
      );
      setMsg(mode === "invite" ? "Invite sent" : "Member added");
      await refreshAll();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Could not invite member";
      toast.error(m);
      setMsg(m);
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
    const ok = await confirm({
      title: "Remove this member?",
      description: "They will lose access to this team immediately.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await v2Api.removeMember(slug, userId);
      toast.success("Member removed");
      if (userId === meId) {
        router.push("/teams");
        return;
      }
      await refreshAll();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Remove failed";
      toast.error(m);
      setMsg(m);
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(
    userId: string,
    role: "ADMIN" | "MODERATOR" | "MEMBER",
  ) {
    setBusy(true);
    setMsg(null);
    try {
      await v2Api.updateMemberRole(slug, userId, role);
      setMsg(`Role updated to ${role}`);
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Role update failed");
    } finally {
      setBusy(false);
    }
  }

  async function transferTo(userId: string) {
    const ok = await confirm({
      title: "Transfer ownership?",
      description:
        "You will become an admin. This cannot be undone by you alone.",
      confirmLabel: "Transfer",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await v2Api.transferOwnership(slug, userId);
      toast.success("Ownership transferred");
      setMsg("Ownership transferred");
      await refreshAll();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Transfer failed";
      toast.error(m);
      setMsg(m);
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    setMsg(null);
    try {
      await v2Api.updateTeam(slug, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        visibility: editVisibility,
        memberVisibilityPolicy: editPolicy,
        avatarUrl: editAvatar,
      });
      setMsg("Settings saved");
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  async function onPickImage(
    file: File | null,
    setter: (url: string | null) => void,
    folder: UploadFolder = "teams",
  ) {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      setter(await uploadImage(file, folder));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  }

  async function deleteTeam() {
    const ok = await confirm({
      title: "Delete this team permanently?",
      description:
        "Members, targets, and announcements for this team will be removed.",
      confirmLabel: "Delete team",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await v2Api.deleteTeam(slug);
      router.push("/teams");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not delete team");
      setBusy(false);
    }
  }

  async function removeTarget(target: TargetDto) {
    const ok = await confirm({
      title: `Delete “${target.title}”?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await v2Api.deleteTarget(target.id);
      await refreshAll();
      toast.success("Target deleted");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not delete target");
    } finally {
      setBusy(false);
    }
  }

  async function createTarget() {
    if (!team) return;
    const meta = targetTypeMeta(targetType);
    let goal = Number.parseInt(targetGoal, 10);
    const days = Number.parseInt(targetDays, 10);
    const criteria: Record<string, unknown> = {};

    if (targetPlatform) criteria.platform = targetPlatform;

    if (targetType === "SOLVE_COUNT") {
      const minR = Number.parseInt(targetMinRating, 10);
      const maxR = Number.parseInt(targetMaxRating, 10);
      if (Number.isFinite(minR)) criteria.minRating = minR;
      if (Number.isFinite(maxR)) criteria.maxRating = maxR;
    }

    if (targetType === "SPECIFIC_PROBLEMS") {
      const lines = targetProblemList
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        setMsg("Add at least one problem URL or external id");
        return;
      }
      criteria.problemUrls = lines.filter((l) => /^https?:\/\//i.test(l));
      criteria.externalIds = lines.filter((l) => !/^https?:\/\//i.test(l));
      goal = lines.length;
    }

    if (targetType === "CUSTOM_CHECKLIST") {
      const items = targetChecklist
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 0) {
        criteria.items = items;
        goal = items.length;
      }
    }

    if (!targetTitle.trim() || !Number.isFinite(goal) || goal < 1) {
      setMsg(`Enter a title and ${meta.goalLabel.toLowerCase()} ≥ 1`);
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
        description: null,
        type: targetType,
        goalValue: goal,
        startsAt,
        endsAt,
        criteria,
        teamId: team.id,
      });
      setTargetOpen(false);
      setTargetTitle("");
      setTargetGoal(meta.goalPlaceholder);
      setTargetProblemList("");
      setTargetChecklist("");
      setTargetPlatform("");
      setTargetMinRating("");
      setTargetMaxRating("");
      setMsg("Target created");
      setTab("targets");
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not create target");
    } finally {
      setBusy(false);
    }
  }

  async function postAnnouncement() {
    if (!announceTitle.trim() || !announceBody.trim()) {
      setMsg("Title and body are required");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await v2Api.createAnnouncement(slug, {
        title: announceTitle.trim(),
        body: announceBody.trim(),
        imageUrl: announceImage,
        linkUrl: announceLink.trim() || null,
      });
      setAnnounceOpen(false);
      setAnnounceTitle("");
      setAnnounceBody("");
      setAnnounceImage(null);
      setAnnounceLink("");
      setMsg("Announcement posted");
      setTab("announcements");
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not post");
    } finally {
      setBusy(false);
    }
  }

  async function removeAnnouncement(id: string) {
    const ok = await confirm({
      title: "Delete this announcement?",
      description: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await v2Api.deleteAnnouncement(slug, id);
      await refreshAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--v2-content-max)] space-y-3 px-4 py-7 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
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
              <Button variant="secondary" size="sm">
                Back to teams
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; hide?: boolean }[] = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity", hide: !isMember && team.visibility !== "PUBLIC" },
    { id: "announcements", label: "News", hide: !isMember && team.visibility !== "PUBLIC" },
    { id: "members", label: "Members" },
    {
      id: "requests",
      label: `Requests${requests.length ? ` (${requests.length})` : ""}`,
      hide: !canModerate,
    },
    { id: "targets", label: "Targets", hide: !isMember },
    { id: "board", label: "Board", hide: !isMember && team.visibility !== "PUBLIC" },
    { id: "settings", label: "Settings", hide: !isOwner },
  ];

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <Link
        href="/teams"
        className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg-muted)] no-underline transition-colors hover:text-[var(--v2-fg)]"
      >
        ← Teams
      </Link>

      <header className="mt-3 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]">
              {team.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <Users className="size-5" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
            <h1 className="text-[1.625rem] font-semibold tracking-tight text-[var(--v2-fg)]">
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
              {isPending ? " · request pending" : ""}
            </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isMember && !isPending && meId ? (
              <Button size="sm" loading={busy} onClick={() => void requestJoin()}>
                {team.visibility === "PUBLIC" ? "Join team" : "Request to join"}
              </Button>
            ) : null}
            {!meId ? (
              <Link href="/sign-up">
                <Button size="sm">Sign up to join</Button>
              </Link>
            ) : null}
            {isLeader ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setInviteOpen(true)}
                >
                  Add member
                </Button>
                <Button size="sm" onClick={() => setTargetOpen(true)}>
                  Set target
                </Button>
              </>
            ) : null}
            {canModerate ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAnnounceOpen(true)}
              >
                Create post
              </Button>
            ) : null}
          </div>
        </div>
        {msg ? (
          <p
            className="mt-3 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg-muted)] px-3 py-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]"
            role="status"
          >
            {msg}
          </p>
        ) : null}
      </header>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-[var(--v2-border)]">
        {tabs
          .filter((t) => !t.hide)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-9 shrink-0 border-b-2 px-3 text-[var(--v2-text-sm)] font-medium transition-colors duration-[var(--v2-duration)]",
                tab === t.id
                  ? "border-[var(--v2-primary)] text-[var(--v2-fg)]"
                  : "border-transparent text-[var(--v2-fg-muted)] hover:text-[var(--v2-fg)]",
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
                <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  Invite people
                </h2>
              </CardHeader>
              <CardBody className="space-y-3 pt-0">
                <p className="font-mono text-[var(--v2-text-xl)] font-semibold tracking-widest text-[var(--v2-fg)]">
                  {team.inviteCode}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void copyInvite()}
                  >
                    Copy invite link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busy}
                    onClick={() => void regenerateInvite()}
                  >
                    Regenerate
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Latest news
              </h2>
              {(isMember || team.visibility === "PUBLIC") ? (
                <button
                  type="button"
                  className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] hover:underline"
                  onClick={() => setTab("announcements")}
                >
                  View all
                </button>
              ) : null}
            </CardHeader>
            <CardBody className="pt-0">
              {announcements.length === 0 ? (
                <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                  No announcements yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {announcements.slice(0, 2).map((a) => (
                    <li key={a.id}>
                      <p className="font-medium text-[var(--v2-fg)]">{a.title}</p>
                      <p className="line-clamp-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                        {a.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Targets snapshot
              </h2>
              {isMember ? (
                <button
                  type="button"
                  className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-primary)] hover:underline"
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
                  action={
                    isLeader ? (
                      <Button size="sm" onClick={() => setTargetOpen(true)}>
                        Set target
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {targets.slice(0, 3).map((t) => (
                    <TargetCard
                      key={t.id}
                      target={t}
                      showMembers={isLeader}
                      onDelete={isLeader ? removeTarget : undefined}
                    />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "activity" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "All"],
                  ["problem", "Solves"],
                  ["contest", "Contests"],
                  ["day", "Days"],
                  ["target", "Targets"],
                  ["announcement", "News"],
                  ["joined", "Joins"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActivityFilter(id)}
                  className={cn(
                    "rounded-[var(--v2-radius-md)] px-2.5 py-1 text-[11px] font-medium transition-colors",
                    activityFilter === id
                      ? "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)]"
                      : "text-[var(--v2-fg-subtle)] hover:text-[var(--v2-fg)]",
                  )}
                >
                  {label}
                  {activityCounts[id] ? (
                    <span className="ml-1 font-mono text-[10px] opacity-70">
                      {activityCounts[id]}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {([7, 14, 30, 60] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActivityDays(d)}
                  className={cn(
                    "rounded-[var(--v2-radius-md)] px-2 py-1 text-[11px] font-medium transition-colors",
                    activityDays === d
                      ? "bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                      : "text-[var(--v2-fg-subtle)] hover:text-[var(--v2-fg)]",
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {filteredActivity.length === 0 ? (
            <Card>
              <EmptyState title="No activity in this range" />
            </Card>
          ) : (
            activityGroups.map((group) => (
              <section key={group.date} className="flex flex-col gap-2">
                <h3 className="px-1 font-mono text-[11px] font-medium uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                  {formatActivityDay(group.date)}
                </h3>
                <Card>
                  <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0">
                    {group.items.map((item, idx) => (
                      <div
                        key={`${item.type}-${item.at}-${idx}`}
                        className="px-4 py-3"
                      >
                        <ActivityRow item={item} />
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </section>
            ))
          )}
        </div>
      ) : null}

      {tab === "announcements" ? (
        <div className="flex flex-col gap-4">
          {canModerate ? (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAnnounceOpen(true)}>
                New announcement
              </Button>
            </div>
          ) : null}
          {announcements.length === 0 ? (
            <Card>
              <EmptyState title="No announcements" />
            </Card>
          ) : (
            announcements.map((a) => (
              <Card key={a.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-[var(--v2-fg)]">{a.title}</h3>
                      <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                        {a.author.displayName ?? `@${a.author.username}`} ·{" "}
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {isLeader || a.author.id === meId ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busy}
                        onClick={() => void removeAnnouncement(a.id)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.imageUrl}
                      alt=""
                      className="mt-3 max-h-72 w-full rounded-[var(--v2-radius-md)] object-cover"
                    />
                  ) : null}
                  <p className="mt-3 whitespace-pre-wrap text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                    {a.body}
                  </p>
                  {a.linkUrl ? (
                    <a
                      href={a.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-[var(--v2-text-sm)] font-medium text-[var(--v2-primary)]"
                    >
                      Open link →
                    </a>
                  ) : null}
                </CardBody>
              </Card>
            ))
          )}
        </div>
      ) : null}

      {tab === "members" ? (
        <Card>
          <CardHeader>
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Members ({members.length})
            </h2>
          </CardHeader>
          <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0">
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
                const canEditRole =
                  isLeader && m.role !== "OWNER" && m.userId !== meId;
                const isSelf = m.userId === meId;
                return (
                  <div
                    key={m.userId}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      {privateProfile || !m.user.username ? (
                        <p className="font-medium">Private member</p>
                      ) : (
                        <Link
                          href={`/u/${m.user.username}`}
                          className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                        >
                          {m.user.displayName ?? `@${m.user.username}`}
                        </Link>
                      )}
                      <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                        {m.role}
                        {m.user.username ? ` · @${m.user.username}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canEditRole ? (
                        <select
                          className="min-h-8 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-2 text-[11px] text-[var(--v2-fg)]"
                          value={m.role}
                          disabled={busy}
                          onChange={(e) =>
                            void changeRole(
                              m.userId,
                              e.target.value as "ADMIN" | "MODERATOR" | "MEMBER",
                            )
                          }
                        >
                          {isOwner ? <option value="ADMIN">Admin</option> : null}
                          <option value="MODERATOR">Moderator</option>
                          <option value="MEMBER">Member</option>
                        </select>
                      ) : null}
                      {isOwner && m.role !== "OWNER" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() => void transferTo(m.userId)}
                        >
                          Make owner
                        </Button>
                      ) : null}
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
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Pending requests
            </h2>
          </CardHeader>
          <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0">
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
              <Button size="sm" onClick={() => setTargetOpen(true)}>
                New target
              </Button>
            </div>
          ) : null}
          {targets.length === 0 ? (
            <Card>
              <EmptyState title="No team targets" />
            </Card>
          ) : (
            targets.map((t) => (
              <TargetCard
                key={t.id}
                target={t}
                showMembers={isLeader}
                onDelete={isLeader ? removeTarget : undefined}
              />
            ))
          )}
        </div>
      ) : null}

      {tab === "board" ? (
        <Card>
          <CardHeader>
            <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
              Leaderboard
            </h2>
            <div className="flex gap-1">
              {(["daily", "weekly", "monthly", "all-time"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setBoardRange(r)}
                  className={cn(
                    "rounded-[var(--v2-radius-md)] px-2 py-1 text-[11px] font-medium capitalize transition-colors duration-[var(--v2-duration)]",
                    boardRange === r
                      ? "bg-[var(--v2-bg-muted)] text-[var(--v2-fg)]"
                      : "text-[var(--v2-fg-subtle)] hover:text-[var(--v2-fg)]",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody className="divide-y divide-[var(--v2-border-subtle)] p-0">
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
                  <p className="font-mono font-semibold tabular-nums text-[var(--v2-fg)]">
                    {row.totalSolved}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      ) : null}

      {tab === "settings" && isOwner ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Team settings
              </h2>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 pt-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => settingsFileRef.current?.click()}
                  className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--v2-radius-md)] border border-dashed border-[var(--v2-border)] bg-[var(--v2-bg-muted)]"
                >
                  {editAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editAvatar}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Users className="size-5 text-[var(--v2-fg-subtle)]" />
                  )}
                </button>
                <div>
                  <p className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                    Team photo
                  </p>
                  <div className="mt-1 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={uploading}
                      onClick={() => settingsFileRef.current?.click()}
                    >
                      Upload
                    </Button>
                    {editAvatar ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditAvatar(null)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
                <input
                  ref={settingsFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) =>
                    void onPickImage(e.target.files?.[0] ?? null, setEditAvatar)
                  }
                />
              </div>
              <Input
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                Description
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                Visibility
                <select
                  value={editVisibility}
                  onChange={(e) =>
                    setEditVisibility(
                      e.target.value as "PUBLIC" | "PRIVATE" | "SECRET",
                    )
                  }
                  className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="SECRET">Secret</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                Member profiles visible to
                <select
                  value={editPolicy}
                  onChange={(e) =>
                    setEditPolicy(
                      e.target.value as
                        | "EVERYONE"
                        | "FOLLOWERS"
                        | "TEAM"
                        | "ME",
                    )
                  }
                  className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
                >
                  <option value="TEAM">Team members</option>
                  <option value="EVERYONE">Everyone</option>
                  <option value="FOLLOWERS">Followers</option>
                  <option value="ME">Only self</option>
                </select>
              </label>
              <Button size="sm" loading={busy} onClick={() => void saveSettings()}>
                Save changes
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-danger)]">
                Danger zone
              </h2>
            </CardHeader>
            <CardBody className="pt-0">
              <Button
                size="sm"
                variant="secondary"
                loading={busy}
                onClick={() => void deleteTeam()}
              >
                Delete team
              </Button>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <BottomSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite or add member"
      >
        <Input
          label="Username"
          placeholder="their_handle"
          value={inviteUser}
          onChange={(e) => setInviteUser(e.target.value)}
        />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            className="w-full"
            size="sm"
            loading={busy}
            onClick={() => void inviteByUsername("invite")}
          >
            Send invite
          </Button>
          <Button
            className="w-full"
            size="sm"
            variant="secondary"
            loading={busy}
            onClick={() => void inviteByUsername("add")}
          >
            Add now
          </Button>
        </div>
      </BottomSheet>
      {confirmDialog}

      <BottomSheet
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
        title="Set team target"
      >
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          <div className="space-y-3">
            {TARGET_TYPE_SECTIONS.map((section) => (
              <div key={section.id}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                  {section.label}
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {TARGET_TYPES.filter((t) => t.section === section.id).map(
                    (t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTargetType(t.id);
                          setTargetGoal(t.goalPlaceholder);
                        }}
                        className={cn(
                          "rounded-[var(--v2-radius-md)] border px-3 py-2 text-left transition-colors",
                          targetType === t.id
                            ? "border-[var(--v2-primary)] bg-[var(--v2-primary-muted)]"
                            : "border-[var(--v2-border)] hover:bg-[var(--v2-surface-hover)]",
                        )}
                      >
                        <span className="block text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                          {t.label}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>

          <Input
            label="Title"
            placeholder={targetTypeMeta(targetType).label}
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
          />

          {(targetType === "SOLVE_COUNT" ||
            targetType === "CONTEST_PARTICIPATION" ||
            targetType === "RATING_GOAL" ||
            targetType === "STREAK") && (
            <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Platform (optional)
              <select
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
              >
                <option value="">Any linked platform</option>
                {LINKABLE_PLATFORMS.map((id) => (
                  <option key={id} value={id}>
                    {platformLabel(id)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {targetType === "SOLVE_COUNT" ? (
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Min rating"
                type="number"
                value={targetMinRating}
                onChange={(e) => setTargetMinRating(e.target.value)}
                placeholder="optional"
              />
              <Input
                label="Max rating"
                type="number"
                value={targetMaxRating}
                onChange={(e) => setTargetMaxRating(e.target.value)}
                placeholder="optional"
              />
            </div>
          ) : null}

          {targetType === "SPECIFIC_PROBLEMS" ? (
            <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Problem URLs or IDs (one per line)
              <textarea
                value={targetProblemList}
                onChange={(e) => setTargetProblemList(e.target.value)}
                rows={4}
                placeholder={"https://...\n1234A"}
                className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
              />
            </label>
          ) : null}

          {targetType === "CUSTOM_CHECKLIST" ? (
            <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Checklist items (one per line)
              <textarea
                value={targetChecklist}
                onChange={(e) => setTargetChecklist(e.target.value)}
                rows={4}
                placeholder={"Read editorial\nUpsolve contest A\nReview DP notes"}
                className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
              />
            </label>
          ) : null}

          {targetType !== "SPECIFIC_PROBLEMS" &&
          !(
            targetType === "CUSTOM_CHECKLIST" &&
            targetChecklist.trim().length > 0
          ) ? (
            <Input
              label={targetTypeMeta(targetType).goalLabel}
              type="number"
              min={1}
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder={targetTypeMeta(targetType).goalPlaceholder}
            />
          ) : null}

          <Input
            label="Duration (days)"
            type="number"
            min={1}
            value={targetDays}
            onChange={(e) => setTargetDays(e.target.value)}
          />
          <Button size="sm" loading={busy} onClick={() => void createTarget()}>
            Create target
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={announceOpen}
        onClose={() => setAnnounceOpen(false)}
        title="Create post"
      >
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          <Input
            label="Title"
            value={announceTitle}
            onChange={(e) => setAnnounceTitle(e.target.value)}
          />
          <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Body
            <textarea
              value={announceBody}
              onChange={(e) => setAnnounceBody(e.target.value)}
              rows={5}
              className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
            />
          </label>
          <Input
            label="Link (optional)"
            value={announceLink}
            onChange={(e) => setAnnounceLink(e.target.value)}
            placeholder="https://..."
          />
          <div>
            <p className="mb-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Image (optional)
            </p>
            {announceImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={announceImage}
                alt=""
                className="mb-2 max-h-40 w-full rounded-[var(--v2-radius-md)] object-cover"
              />
            ) : null}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                loading={uploading}
                onClick={() => announceFileRef.current?.click()}
              >
                {announceImage ? "Change image" : "Add image"}
              </Button>
              {announceImage ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAnnounceImage(null)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <input
              ref={announceFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) =>
                void onPickImage(
                  e.target.files?.[0] ?? null,
                  setAnnounceImage,
                  "announcements",
                )
              }
            />
          </div>
          <Button size="sm" loading={busy} onClick={() => void postAnnouncement()}>
            Post
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function formatActivityDay(date: string) {
  const d = new Date(`${date}T12:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const iso = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  if (iso(today) === date) return "Today";
  if (iso(yesterday) === date) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function formatRelativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActorLink({
  username,
  displayName,
}: {
  username: string;
  displayName: string | null;
}) {
  return (
    <Link
      href={`/u/${username}`}
      className="font-medium text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
    >
      {displayName ?? `@${username}`}
    </Link>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[var(--v2-radius-full)] bg-[var(--v2-bg-muted)] px-2 py-0.5 font-mono text-[10px] text-[var(--v2-fg-subtle)]">
      {children}
    </span>
  );
}

function ActivityIcon({
  type,
}: {
  type: TeamActivityDto["type"];
}) {
  const cls = "size-3.5 shrink-0";
  switch (type) {
    case "problem":
      return <CheckCircle2 className={cn(cls, "text-[var(--v2-success)]")} />;
    case "contest":
      return <Trophy className={cn(cls, "text-[var(--v2-warning)]")} />;
    case "day":
      return <CalendarDays className={cn(cls, "text-[var(--v2-info)]")} />;
    case "joined":
      return <UserPlus className={cn(cls, "text-[var(--v2-primary)]")} />;
    case "announcement":
      return <Megaphone className={cn(cls, "text-[var(--v2-accent)]")} />;
    case "target_created":
      return <Flag className={cn(cls, "text-[var(--v2-primary)]")} />;
    case "target_completed":
      return <Target className={cn(cls, "text-[var(--v2-success)]")} />;
    default:
      return null;
  }
}

function ActivityRow({ item }: { item: TeamActivityDto }) {
  const time = (
    <time
      dateTime={item.at}
      className="shrink-0 font-mono text-[10px] text-[var(--v2-fg-subtle)]"
      title={new Date(item.at).toLocaleString()}
    >
      {formatRelativeTime(item.at)}
    </time>
  );

  if (item.type === "problem") {
    const title = item.problemUrl ? (
      <a
        href={item.problemUrl}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-[var(--v2-fg)] underline-offset-2 hover:underline"
      >
        {item.problemTitle}
      </a>
    ) : (
      <span className="font-medium text-[var(--v2-fg)]">{item.problemTitle}</span>
    );
    return (
      <div className="flex items-start gap-3">
        <ActivityIcon type={item.type} />
        <div className="min-w-0 flex-1">
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
            <ActorLink username={item.username} displayName={item.displayName} />{" "}
            solved {title}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <MetaChip>{platformLabel(item.platform)}</MetaChip>
            {item.difficulty ? <MetaChip>{item.difficulty}</MetaChip> : null}
            {item.rating != null ? <MetaChip>{item.rating}</MetaChip> : null}
            {item.inContest ? <MetaChip>contest</MetaChip> : null}
            {(item.tags ?? []).slice(0, 3).map((tag) => (
              <MetaChip key={tag}>{tag}</MetaChip>
            ))}
          </div>
        </div>
        {time}
      </div>
    );
  }

  if (item.type === "day") {
    const parts = [
      item.solvedCount > 0 ? `${item.solvedCount} solved` : null,
      item.submissionsCount > 0 ? `${item.submissionsCount} submissions` : null,
      item.contestsCount > 0 ? `${item.contestsCount} contests` : null,
      item.points > 0 ? `${item.points} pts` : null,
    ].filter(Boolean);
    return (
      <div className="flex items-start gap-3">
        <ActivityIcon type={item.type} />
        <div className="min-w-0 flex-1">
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
            <ActorLink username={item.username} displayName={item.displayName} />{" "}
            logged a practice day
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <MetaChip>{item.date}</MetaChip>
            {parts.map((p) => (
              <MetaChip key={p as string}>{p}</MetaChip>
            ))}
          </div>
        </div>
        {time}
      </div>
    );
  }

  if (item.type === "contest") {
    const name = item.contestUrl ? (
      <a
        href={item.contestUrl}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-[var(--v2-fg)] underline-offset-2 hover:underline"
      >
        {item.contestName}
      </a>
    ) : (
      <span className="font-medium text-[var(--v2-fg)]">{item.contestName}</span>
    );
    const delta =
      item.ratingDelta == null
        ? null
        : item.ratingDelta > 0
          ? `+${item.ratingDelta}`
          : `${item.ratingDelta}`;
    return (
      <div className="flex items-start gap-3">
        <ActivityIcon type={item.type} />
        <div className="min-w-0 flex-1">
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
            <ActorLink username={item.username} displayName={item.displayName} />{" "}
            competed in {name}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <MetaChip>{platformLabel(item.platform)}</MetaChip>
            {item.rank != null ? <MetaChip>rank #{item.rank}</MetaChip> : null}
            {item.solvedCount != null ? (
              <MetaChip>{item.solvedCount} solved</MetaChip>
            ) : null}
            {delta ? (
              <MetaChip>
                rating {item.ratingBefore ?? "—"} → {item.ratingAfter ?? "—"} (
                {delta})
              </MetaChip>
            ) : null}
          </div>
        </div>
        {time}
      </div>
    );
  }

  if (item.type === "joined") {
    return (
      <div className="flex items-start gap-3">
        <ActivityIcon type={item.type} />
        <div className="min-w-0 flex-1">
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
            <ActorLink username={item.username} displayName={item.displayName} />{" "}
            joined as {item.role.toLowerCase()}
          </p>
        </div>
        {time}
      </div>
    );
  }

  if (item.type === "announcement") {
    return (
      <div className="flex items-start gap-3">
        <ActivityIcon type={item.type} />
        <div className="min-w-0 flex-1">
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
            <ActorLink
              username={item.authorUsername}
              displayName={item.authorDisplayName}
            />{" "}
            posted <span className="font-medium">“{item.title}”</span>
          </p>
          {item.bodyPreview ? (
            <p className="mt-1 line-clamp-2 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
              {item.bodyPreview}
            </p>
          ) : null}
        </div>
        {time}
      </div>
    );
  }

  if (item.type === "target_created") {
    return (
      <div className="flex items-start gap-3">
        <ActivityIcon type={item.type} />
        <div className="min-w-0 flex-1">
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
            <ActorLink username={item.username} displayName={item.displayName} />{" "}
            set target <span className="font-medium">{item.title}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <MetaChip>{item.targetType.replace(/_/g, " ")}</MetaChip>
            {item.endsAt ? (
              <MetaChip>
                ends {new Date(item.endsAt).toLocaleDateString()}
              </MetaChip>
            ) : null}
          </div>
        </div>
        {time}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <ActivityIcon type={item.type} />
      <div className="min-w-0 flex-1">
        <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
          <ActorLink username={item.username} displayName={item.displayName} />{" "}
          completed <span className="font-medium">{item.title}</span>
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <MetaChip>
            {item.currentValue}/{item.goalValue}
          </MetaChip>
        </div>
      </div>
      {time}
    </div>
  );
}

function TargetCard({
  target,
  showMembers,
  onDelete,
}: {
  target: TargetDto;
  showMembers?: boolean;
  onDelete?: (t: TargetDto) => void | Promise<void>;
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
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--v2-fg)]">{target.title}</h3>
            <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
              {targetTypeMeta(target.type).label}
              {target.endsAt
                ? ` · ends ${new Date(target.endsAt).toLocaleDateString()}`
                : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {target.progress?.isCompleted ? (
              <span className="rounded-[var(--v2-radius-full)] bg-[var(--v2-success)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--v2-success)]">
                Done
              </span>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                aria-label={`Delete ${target.title}`}
                onClick={() => void onDelete(target)}
                className="flex size-8 items-center justify-center rounded-[var(--v2-radius-md)] text-[var(--v2-fg-subtle)] transition-colors hover:bg-[var(--v2-danger)]/10 hover:text-[var(--v2-danger)]"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
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
