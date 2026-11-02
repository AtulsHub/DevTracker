"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { EmptyState } from "@/v2/components/EmptyState";
import { PageHeader } from "@/v2/components/PageHeader";
import { v2Api, type TeamDto } from "@/v2/lib/api";
import { cn } from "@/v2/lib/cn";

export function TeamsScreen({
  teams,
  signedIn,
}: {
  teams: TeamDto[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    if (!name.trim()) {
      setError("Team name is required");
      return;
    }
    try {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
      const res = (await v2Api.createTeam({
        name: name.trim(),
        slug: slug.length >= 3 ? slug : `team-${Date.now().toString(36)}`,
        description: description.trim() || undefined,
        visibility,
      })) as { team?: { slug: string } };
      setOpen(false);
      setName("");
      setDescription("");
      startTransition(() => {
        if (res.team?.slug) router.push(`/teams/${res.team.slug}`);
        else router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create team");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title="Teams"
        description="Create a squad, invite members, set targets, and track the board."
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

      {!signedIn ? (
        <Card>
          <EmptyState
            title="Sign up to use teams"
            description="Browse contests without an account — teams need a login."
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
            description="Create a team for your club, or join with an invite code."
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
              </div>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <Link key={t.id} href={`/teams/${t.slug}`} className="group no-underline">
              <Card className="h-full transition-colors duration-[var(--v2-duration)] group-hover:border-[var(--v2-border-strong)] group-hover:bg-[var(--v2-surface-hover)]">
                <CardBody>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="flex size-9 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]">
                      <Users className="size-4" aria-hidden />
                    </span>
                    <span
                      className={cn(
                        "rounded-[var(--v2-radius-full)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        t.visibility === "PUBLIC"
                          ? "bg-[var(--v2-info)]/10 text-[var(--v2-info)]"
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
                  {typeof t.memberCount === "number" ? (
                    <p className="mt-3 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
                      {t.memberCount} members
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Create team">
        <div className="flex flex-col gap-3">
          <Input
            label="Team name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error ?? undefined}
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Visibility
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
              }
              className="min-h-9 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
            >
              <option value="PRIVATE">Private — approve joiners</option>
              <option value="PUBLIC">Public — open join</option>
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
