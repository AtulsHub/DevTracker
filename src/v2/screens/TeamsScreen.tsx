"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { BottomSheet } from "@/v2/components/BottomSheet";
import { EmptyState } from "@/v2/components/EmptyState";
import { v2Api, type TeamDto } from "@/v2/lib/api";

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
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[var(--v2-text-2xl)] font-bold">
            Teams
          </h1>
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Create a squad, invite members, set targets, track the board
          </p>
        </div>
        {signedIn ? (
          <div className="flex gap-2">
            <Link href="/teams/join">
              <Button variant="secondary">Join with code</Button>
            </Link>
            <Button onClick={() => setOpen(true)}>Create team</Button>
          </div>
        ) : (
          <Link href="/sign-up">
            <Button>Sign up to create</Button>
          </Link>
        )}
      </div>

      {!signedIn ? (
        <Card>
          <EmptyState
            title="Sign up to use teams"
            description="Browse contests without an account — teams need a login."
            action={
              <Link href="/sign-up">
                <Button>Sign up</Button>
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
                <Button onClick={() => setOpen(true)}>Create team</Button>
                <Link href="/teams/join">
                  <Button variant="secondary">Join with code</Button>
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <Link key={t.id} href={`/teams/${t.slug}`} className="no-underline">
              <Card className="h-full transition-shadow hover:shadow-[var(--v2-shadow-md)]">
                <CardHeader>
                  <h2 className="font-semibold text-[var(--v2-fg)]">{t.name}</h2>
                  <span className="font-mono text-[10px] uppercase text-[var(--v2-fg-subtle)]">
                    {t.visibility}
                  </span>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="line-clamp-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                    {t.description || "No description"}
                  </p>
                  {typeof t.memberCount === "number" ? (
                    <p className="mt-2 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
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
              className="min-h-11 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-fg)]"
            >
              <option value="PRIVATE">Private — approve joiners</option>
              <option value="PUBLIC">Public — open join</option>
            </select>
          </label>
          <Button
            className="w-full"
            loading={pending}
            onClick={() => void create()}
          >
            Create
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
