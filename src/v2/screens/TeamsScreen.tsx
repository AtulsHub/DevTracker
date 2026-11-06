"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { EmptyState } from "@/v2/components/EmptyState";
import { PageHeader } from "@/v2/components/PageHeader";
import { v2Api, type TeamDto } from "@/v2/lib/api";
import { fileToAvatarDataUrl } from "@/v2/lib/avatar";
import { cn } from "@/v2/lib/cn";

export function TeamsScreen({
  teams,
  discover: initialDiscover,
  signedIn,
}: {
  teams: TeamDto[];
  discover: TeamDto[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE" | "SECRET">(
    "PRIVATE",
  );
  const [memberPolicy, setMemberPolicy] = useState<
    "EVERYONE" | "FOLLOWERS" | "TEAM" | "ME"
  >("TEAM");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discover, setDiscover] = useState(initialDiscover);
  const [searching, setSearching] = useState(false);
  const [section, setSection] = useState<"mine" | "discover">(
    teams.length > 0 ? "mine" : "discover",
  );

  const myIds = useMemo(() => new Set(teams.map((t) => t.id)), [teams]);

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  }

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setAvatarUrl(await fileToAvatarDataUrl(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read image");
    } finally {
      setUploading(false);
    }
  }

  async function create() {
    setError(null);
    if (!name.trim()) {
      setError("Team name is required");
      return;
    }
    try {
      const finalSlug =
        (slugTouched ? slugify(slug) : slugify(name)) ||
        `team-${Date.now().toString(36)}`;
      if (finalSlug.length < 3) {
        setError("Slug must be at least 3 characters");
        return;
      }
      const res = (await v2Api.createTeam({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || undefined,
        visibility,
        memberVisibilityPolicy: memberPolicy,
        avatarUrl: avatarUrl || undefined,
      })) as { team?: { slug: string } };
      setOpen(false);
      setName("");
      setSlug("");
      setSlugTouched(false);
      setDescription("");
      setAvatarUrl(null);
      setVisibility("PRIVATE");
      setMemberPolicy("TEAM");
      startTransition(() => {
        if (res.team?.slug) router.push(`/teams/${res.team.slug}`);
        else router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create team");
    }
  }

  async function searchDiscover(q: string) {
    setDiscoverQuery(q);
    setSearching(true);
    try {
      const res = await v2Api.publicTeams(q.trim(), 36);
      setDiscover((res.teams ?? []).filter((t) => !myIds.has(t.id)));
    } catch {
      /* keep current list */
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title="Teams"
        description="Create a squad, discover public teams, invite members, set targets, and track the board."
        actions={
          signedIn ? (
            <>
              <Link href="/teams/join">
                <Button variant="secondary" size="sm">
                  Join with code
                </Button>
              </Link>
              <Button size="sm" onClick={() => setOpen(true)}>
                Create team
              </Button>
            </>
          ) : (
            <Link href="/sign-up">
              <Button size="sm">Sign up to create</Button>
            </Link>
          )
        }
      />

      <div className="mb-5 flex gap-1 border-b border-[var(--v2-border)]">
        {(
          [
            {
              id: "mine" as const,
              label: `My teams${teams.length ? ` (${teams.length})` : ""}`,
            },
            { id: "discover" as const, label: "Discover" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSection(tab.id)}
            className={cn(
              "min-h-9 border-b-2 px-3 text-[var(--v2-text-sm)] font-medium transition-colors",
              section === tab.id
                ? "border-[var(--v2-primary)] text-[var(--v2-fg)]"
                : "border-transparent text-[var(--v2-fg-muted)] hover:text-[var(--v2-fg)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {section === "mine" ? (
        !signedIn ? (
          <Card>
            <EmptyState
              title="Sign up to use teams"
              description="Browse public teams on Discover — your own teams need a login."
              action={
                <Link href="/sign-up">
                  <Button size="sm">Sign up</Button>
                </Link>
              }
            />
          </Card>
        ) : teams.length === 0 ? (
          <Card>
            <EmptyState
              title="No teams yet"
              description="Create a team for your club, join with an invite code, or browse public teams."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" onClick={() => setOpen(true)}>
                    Create team
                  </Button>
                  <Link href="/teams/join">
                    <Button size="sm" variant="secondary">
                      Join with code
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSection("discover")}
                  >
                    Discover
                  </Button>
                </div>
              }
            />
          </Card>
        ) : (
          <TeamGrid teams={teams} />
        )
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--v2-fg-subtle)]"
              aria-hidden
            />
            <input
              type="search"
              value={discoverQuery}
              onChange={(e) => void searchDiscover(e.target.value)}
              placeholder="Search public teams"
              className="min-h-10 w-full rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] py-2 pl-10 pr-3 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
            />
          </div>
          {searching ? (
            <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              Searching…
            </p>
          ) : discover.length === 0 ? (
            <Card>
              <EmptyState
                title="No public teams found"
                description={
                  discoverQuery
                    ? "Try a different search."
                    : "Be the first to create a public team."
                }
              />
            </Card>
          ) : (
            <TeamGrid teams={discover} showJoinHint />
          )}
        </div>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Create team">
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--v2-radius-md)] border border-dashed border-[var(--v2-border)] bg-[var(--v2-bg-muted)] text-[var(--v2-fg-subtle)]"
              aria-label="Upload team photo"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <Users className="size-5" aria-hidden />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                Team photo
              </p>
              <p className="text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                Optional square image for the squad.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  loading={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  Upload
                </Button>
                {avatarUrl ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAvatarUrl(null)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)}
            />
          </div>

          <Input
            label="Team name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            error={error ?? undefined}
          />
          <Input
            label="URL slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="my-team"
          />
          <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this team about?"
              className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Visibility
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "PUBLIC" | "PRIVATE" | "SECRET")
              }
              className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
            >
              <option value="PRIVATE">Private — approve joiners</option>
              <option value="PUBLIC">Public — open join & discoverable</option>
              <option value="SECRET">Secret — invite only, hidden</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Member profiles visible to
            <select
              value={memberPolicy}
              onChange={(e) =>
                setMemberPolicy(
                  e.target.value as "EVERYONE" | "FOLLOWERS" | "TEAM" | "ME",
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
          <Button className="w-full" loading={pending} onClick={() => void create()}>
            Create
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function TeamGrid({
  teams,
  showJoinHint,
}: {
  teams: TeamDto[];
  showJoinHint?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {teams.map((t) => (
        <Link key={t.id} href={`/teams/${t.slug}`} className="group no-underline">
          <Card className="h-full transition-colors duration-[var(--v2-duration)] group-hover:border-[var(--v2-border-strong)] group-hover:bg-[var(--v2-surface-hover)]">
            <CardBody>
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex size-9 items-center justify-center overflow-hidden rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]">
                  {t.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.avatarUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Users className="size-4" aria-hidden />
                  )}
                </span>
                <span
                  className={cn(
                    "rounded-[var(--v2-radius-full)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    t.visibility === "PUBLIC"
                      ? "bg-[var(--v2-info)]/10 text-[var(--v2-info)]"
                      : t.visibility === "SECRET"
                        ? "bg-[var(--v2-warning)]/10 text-[var(--v2-warning)]"
                        : "bg-[var(--v2-bg-muted)] text-[var(--v2-fg-subtle)]",
                  )}
                >
                  {t.visibility}
                </span>
              </div>
              <h2 className="text-[var(--v2-text-base)] font-semibold text-[var(--v2-fg)]">
                {t.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                {t.description || "No description"}
              </p>
              <p className="mt-3 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                {typeof t.memberCount === "number"
                  ? `${t.memberCount} members`
                  : "—"}
                {showJoinHint ? " · open to join" : ""}
              </p>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}
