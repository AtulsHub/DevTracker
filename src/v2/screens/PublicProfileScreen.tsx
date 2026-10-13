import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { PlatformBadge } from "@/v2/components/Badge";
import { EmptyState } from "@/v2/components/EmptyState";
import { Button } from "@/v2/components/Button";
import { PLATFORMS } from "@/v2/design/platforms";
import { formatRelativeTime } from "@/lib/utils";

export type PublicProfileData = {
  locked?: boolean;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  headline?: string | null;
  location?: string | null;
  age?: number | null;
  college?: string | null;
  skills?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  platforms?: Array<{
    platform: string;
    handle: string;
    currentRating: number | null;
    solvedCount: number;
    rank?: string | null;
  }>;
  recent?: Array<{
    id: string;
    platform: string;
    title: string;
    url: string | null;
    submittedAt: Date | string;
  }>;
  totalSolved?: number;
  isOwner?: boolean;
  viewerSignedIn?: boolean;
};

export function PublicProfileScreen(props: PublicProfileData) {
  const { locked, username } = props;

  if (locked) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="overflow-hidden rounded-[var(--v2-radius-xl)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]">
          <div className="profile-cover h-24" />
          <div className="px-5 pb-6 pt-4 text-center">
            <h1 className="font-[family-name:var(--font-display)] text-[var(--v2-text-xl)] font-bold">
              This profile is private
            </h1>
            <p className="mt-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              @{username} has not shared their stats publicly.
            </p>
            <Link href="/explore" className="mt-4 inline-block">
              <Button variant="secondary">Back to Explore</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = props.displayName ?? username;
  const skillList = (props.skills ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const metaBits = [
    props.location,
    props.age != null ? `${props.age} yrs` : null,
    props.college,
  ].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
      {/* Intro card — professional profile, not a LI clone */}
      <article className="overflow-hidden rounded-[var(--v2-radius-xl)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-sm)]">
        <div className="profile-cover relative h-28 sm:h-36" aria-hidden />
        <div className="relative px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-12 mb-3 flex flex-wrap items-end justify-between gap-3 sm:-mt-14">
            <div className="size-[88px] overflow-hidden rounded-[var(--v2-radius-lg)] border-4 border-[var(--v2-bg-elevated)] bg-[var(--v2-primary-muted)] sm:size-[112px]">
              {props.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={props.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--v2-primary)]">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {props.isOwner ? (
                <Link href="/profile">
                  <Button size="sm" variant="secondary">
                    Edit profile
                  </Button>
                </Link>
              ) : !props.viewerSignedIn ? (
                <Link href="/sign-up">
                  <Button size="sm">Sign up</Button>
                </Link>
              ) : null}
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[var(--v2-fg)]">
            {name}
          </h1>
          <p className="font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg-subtle)]">
            @{username}
          </p>
          {props.headline ? (
            <p className="mt-2 max-w-2xl text-[var(--v2-text-base)] text-[var(--v2-fg)]">
              {props.headline}
            </p>
          ) : null}
          {metaBits.length > 0 ? (
            <p className="mt-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              {metaBits.join(" · ")}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-4 text-[var(--v2-text-sm)]">
            {typeof props.totalSolved === "number" ? (
              <span>
                <strong className="font-mono text-[var(--v2-primary)]">
                  {props.totalSolved}
                </strong>{" "}
                <span className="text-[var(--v2-fg-muted)]">solved</span>
              </span>
            ) : null}
            {props.platforms?.length ? (
              <span>
                <strong className="font-mono text-[var(--v2-primary)]">
                  {props.platforms.length}
                </strong>{" "}
                <span className="text-[var(--v2-fg-muted)]">platforms</span>
              </span>
            ) : null}
          </div>

          {(props.websiteUrl || props.githubUrl) && (
            <div className="mt-3 flex flex-wrap gap-3">
              {props.websiteUrl ? (
                <a
                  href={props.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-primary)]"
                >
                  Website
                </a>
              ) : null}
              {props.githubUrl ? (
                <a
                  href={props.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-primary)]"
                >
                  GitHub
                </a>
              ) : null}
            </div>
          )}
        </div>
      </article>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          {props.bio ? (
            <Card>
              <CardHeader>
                <h2 className="text-[var(--v2-text-sm)] font-semibold">About</h2>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="whitespace-pre-wrap text-[var(--v2-text-sm)] leading-relaxed text-[var(--v2-fg)]">
                  {props.bio}
                </p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold">
                Platforms
              </h2>
            </CardHeader>
            <CardBody className="space-y-3 pt-0">
              {!props.platforms?.length ? (
                <EmptyState title="No platforms linked yet" />
              ) : (
                props.platforms.map((p) => {
                  const meta = PLATFORMS[p.platform as keyof typeof PLATFORMS];
                  return (
                    <div
                      key={p.platform}
                      className="flex items-start justify-between gap-3 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] p-3"
                      style={{
                        borderLeft: `3px solid ${meta?.colorVar ?? "var(--v2-primary)"}`,
                      }}
                    >
                      <div>
                        <PlatformBadge platform={p.platform} />
                        <a
                          href={meta?.profileUrl(p.handle)}
                          className="mt-1.5 block font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          @{p.handle}
                        </a>
                        {p.rank ? (
                          <p className="mt-0.5 text-[11px] capitalize text-[var(--v2-fg-subtle)]">
                            {p.rank}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xl font-bold text-[var(--v2-primary)]">
                          {p.solvedCount}
                        </p>
                        <p className="text-[10px] uppercase text-[var(--v2-fg-subtle)]">
                          Solved
                        </p>
                        {p.currentRating != null ? (
                          <p className="mt-1 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                            {p.currentRating}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold">
                Recent activity
              </h2>
            </CardHeader>
            <CardBody className="pt-0">
              {!props.recent?.length ? (
                <EmptyState title="No recent activity to show" />
              ) : (
                <ul className="divide-y divide-[var(--v2-border)]">
                  {props.recent.map((s) => (
                    <li
                      key={s.id}
                      className="flex justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[var(--v2-text-sm)] font-medium">
                          {s.url ? (
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                            >
                              {s.title}
                            </a>
                          ) : (
                            s.title
                          )}
                        </p>
                        <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                          {s.platform}
                        </p>
                      </div>
                      <time className="shrink-0 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                        {formatRelativeTime(s.submittedAt)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          {skillList.length > 0 ? (
            <Card>
              <CardHeader>
                <h2 className="text-[var(--v2-text-sm)] font-semibold">
                  Focus areas
                </h2>
              </CardHeader>
              <CardBody className="flex flex-wrap gap-2 pt-0">
                {skillList.map((s) => (
                  <span
                    key={s}
                    className="rounded-[var(--v2-radius-sm)] bg-[var(--v2-bg-muted)] px-2.5 py-1 text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg)]"
                  >
                    {s}
                  </span>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold">
                Snapshot
              </h2>
            </CardHeader>
            <CardBody className="space-y-2 pt-0 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              {props.location ? (
                <p>
                  <span className="text-[var(--v2-fg-subtle)]">Location · </span>
                  {props.location}
                </p>
              ) : null}
              {props.college ? (
                <p>
                  <span className="text-[var(--v2-fg-subtle)]">Org · </span>
                  {props.college}
                </p>
              ) : null}
              {props.age != null ? (
                <p>
                  <span className="text-[var(--v2-fg-subtle)]">Age · </span>
                  {props.age}
                </p>
              ) : null}
              {!props.location && !props.college && props.age == null ? (
                <p>No extra details yet.</p>
              ) : null}
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
