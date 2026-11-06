import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { PlatformBadge } from "@/v2/components/Badge";
import { EmptyState } from "@/v2/components/EmptyState";
import { Button } from "@/v2/components/Button";
import { PLATFORMS } from "@/v2/design/platforms";
import { formatRelativeTime } from "@/lib/utils";
import { platformColor, platformLabel } from "@/v2/lib/platforms";
import type {
  CertificationEntry,
  CustomLinkEntry,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
} from "@/v2/lib/profileTypes";
import {
  Award,
  Briefcase,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  Link2,
  Lock,
  MapPin,
  Target,
  Building2,
} from "lucide-react";
import { cn } from "@/v2/lib/cn";

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
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  resumeUrl?: string | null;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  projects?: ProjectEntry[];
  certifications?: CertificationEntry[];
  customLinks?: CustomLinkEntry[];
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
        <Card className="shadow-[var(--v2-shadow-sm)]">
          <CardBody className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--v2-bg-muted)] text-[var(--v2-fg-subtle)]">
              <Lock className="size-5" aria-hidden />
            </div>
            <h1 className="text-[var(--v2-text-xl)] font-semibold text-[var(--v2-fg)]">
              This profile is private
            </h1>
            <p className="mt-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              @{username} has not shared their profile publicly.
            </p>
            <Link href="/explore" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">
                Back to Explore
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const name = props.displayName ?? username;
  const skillList = (props.skills ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const experience = props.experience ?? [];
  const education = props.education ?? [];
  const projects = props.projects ?? [];
  const certifications = props.certifications ?? [];
  const platforms = props.platforms ?? [];
  const bestRating = platforms.reduce(
    (m, p) => Math.max(m, p.currentRating ?? 0),
    0,
  );

  const links = [
    props.resumeUrl ? { label: "Resume", href: props.resumeUrl } : null,
    props.websiteUrl ? { label: "Website", href: props.websiteUrl } : null,
    props.githubUrl ? { label: "GitHub", href: props.githubUrl } : null,
    props.linkedinUrl ? { label: "LinkedIn", href: props.linkedinUrl } : null,
    props.twitterUrl ? { label: "X / Twitter", href: props.twitterUrl } : null,
    ...(props.customLinks ?? [])
      .filter((l) => l.label?.trim() && l.url?.trim())
      .map((l) => ({ label: l.label.trim(), href: l.url.trim() })),
  ].filter(Boolean) as { label: string; href: string }[];

  const nav = [
    props.bio ? { id: "about", label: "About" } : null,
    experience.length ? { id: "experience", label: "Experience" } : null,
    education.length ? { id: "education", label: "Education" } : null,
    projects.length ? { id: "projects", label: "Projects" } : null,
    certifications.length ? { id: "certs", label: "Certs" } : null,
    { id: "platforms", label: "Platforms" },
    { id: "activity", label: "Activity" },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      {/* Hero */}
      <article className="overflow-hidden rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] shadow-[var(--v2-shadow-sm)]">
        <div
          className="relative h-28 overflow-hidden sm:h-36"
          aria-hidden
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--v2-primary) 28%, transparent), color-mix(in srgb, var(--v2-accent) 18%, transparent) 45%, var(--v2-bg-muted))",
          }}
        >
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_45%),radial-gradient(circle_at_80%_0%,white_0,transparent_35%)]" />
        </div>
        <div className="relative px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-12 mb-4 flex flex-wrap items-end justify-between gap-4 sm:-mt-14">
            <div className="size-24 overflow-hidden rounded-[1.25rem] border-4 border-[var(--v2-bg-elevated)] bg-[var(--v2-primary-muted)] shadow-[var(--v2-shadow-md)] sm:size-28">
              {props.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={props.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-3xl font-semibold text-[var(--v2-primary)]">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {props.resumeUrl ? (
                <a href={props.resumeUrl} target="_blank" rel="noreferrer">
                  <Button size="sm">
                    <FileText className="mr-1.5 size-3.5" aria-hidden />
                    Resume
                  </Button>
                </a>
              ) : null}
              {props.isOwner ? (
                <Link href="/profile">
                  <Button size="sm" variant="secondary">
                    Edit profile
                  </Button>
                </Link>
              ) : !props.viewerSignedIn ? (
                <Link href="/sign-up">
                  <Button size="sm" variant="secondary">
                    Sign up
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--v2-fg)]">
            {name}
          </h1>
          <p className="mt-0.5 font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg-subtle)]">
            @{username}
          </p>
          {props.headline ? (
            <p className="mt-2 max-w-2xl text-[var(--v2-text-base)] leading-snug text-[var(--v2-fg)]">
              {props.headline}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            {props.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-[var(--v2-fg-subtle)]" />
                {props.location}
              </span>
            ) : null}
            {props.college ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5 text-[var(--v2-fg-subtle)]" />
                {props.college}
              </span>
            ) : null}
            {props.age != null ? <span>{props.age} yrs</span> : null}
          </div>

          {links.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-1.5 text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg)] no-underline transition-colors hover:border-[var(--v2-border-strong)] hover:bg-[var(--v2-surface-hover)]"
                >
                  {l.label}
                  <ExternalLink className="size-3 text-[var(--v2-fg-subtle)]" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </article>

      {/* Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Solved"
          value={(props.totalSolved ?? 0).toLocaleString()}
          icon={<Target className="size-3.5" />}
        />
        <StatTile
          label="Platforms"
          value={String(platforms.length)}
          icon={<Link2 className="size-3.5" />}
        />
        <StatTile
          label="Best rating"
          value={bestRating > 0 ? bestRating.toLocaleString() : "—"}
          icon={<Award className="size-3.5" />}
        />
        <StatTile
          label="Projects"
          value={String(projects.length)}
          icon={<FolderKanban className="size-3.5" />}
        />
      </div>

      {/* Section nav */}
      <nav className="sticky top-14 z-10 -mx-4 mt-5 border-b border-[var(--v2-border)] bg-[color-mix(in_srgb,var(--v2-bg)_92%,transparent)] px-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex gap-1 overflow-x-auto">
          {nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="min-h-10 shrink-0 border-b-2 border-transparent px-3 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)] no-underline transition-colors hover:border-[var(--v2-border-strong)] hover:text-[var(--v2-fg)]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-5">
          {props.bio ? (
            <SectionCard id="about" title="About">
              <p className="whitespace-pre-wrap text-[var(--v2-text-sm)] leading-relaxed text-[var(--v2-fg)]">
                {props.bio}
              </p>
            </SectionCard>
          ) : null}

          {experience.length > 0 ? (
            <SectionCard
              id="experience"
              title="Experience"
              icon={<Briefcase className="size-3.5" />}
            >
              <ol className="relative space-y-0 border-l border-[var(--v2-border)] pl-5">
                {experience.map((item) => (
                  <li key={item.id} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full border-2 border-[var(--v2-bg-elevated)] bg-[var(--v2-primary)]" />
                    <div className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border-subtle)] bg-[var(--v2-bg)]/50 p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[var(--v2-fg)]">
                            {item.title}
                          </p>
                          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                            {item.company}
                          </p>
                        </div>
                        <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                          {[
                            item.startDate,
                            item.current ? "Present" : item.endDate,
                          ]
                            .filter(Boolean)
                            .join(" — ")}
                        </p>
                      </div>
                      {item.description ? (
                        <p className="mt-2 whitespace-pre-wrap text-[var(--v2-text-sm)] leading-relaxed text-[var(--v2-fg-muted)]">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>
          ) : null}

          {education.length > 0 ? (
            <SectionCard
              id="education"
              title="Education"
              icon={<GraduationCap className="size-3.5" />}
            >
              <div className="grid gap-3">
                {education.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)]/40 p-4"
                  >
                    <p className="font-semibold text-[var(--v2-fg)]">
                      {item.school}
                    </p>
                    <p className="mt-0.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                      {[item.degree, item.field].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                      {[item.startYear, item.endYear]
                        .filter(Boolean)
                        .join(" — ")}
                    </p>
                    {item.description ? (
                      <p className="mt-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {projects.length > 0 ? (
            <SectionCard
              id="projects"
              title="Projects"
              icon={<FolderKanban className="size-3.5" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((item) => (
                  <div
                    key={item.id}
                    className="group flex h-full flex-col rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)]/40 p-4 transition-colors hover:border-[var(--v2-border-strong)] hover:bg-[var(--v2-surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[var(--v2-fg)]">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                          >
                            {item.name}
                            <ExternalLink className="size-3.5 opacity-50" />
                          </a>
                        ) : (
                          item.name
                        )}
                      </p>
                    </div>
                    {item.tech ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.tech.split(",").map((t) => (
                          <span
                            key={t}
                            className="rounded-[var(--v2-radius-full)] bg-[var(--v2-bg-muted)] px-2 py-0.5 font-mono text-[10px] text-[var(--v2-fg-subtle)]"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {item.description ? (
                      <p className="mt-2 flex-1 text-[var(--v2-text-sm)] leading-relaxed text-[var(--v2-fg-muted)]">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {certifications.length > 0 ? (
            <SectionCard
              id="certs"
              title="Certifications"
              icon={<Award className="size-3.5" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {certifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)]/40 p-4"
                  >
                    <p className="font-semibold text-[var(--v2-fg)]">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 no-underline hover:text-[var(--v2-primary)]"
                        >
                          {item.name}
                          <ExternalLink className="size-3.5 opacity-50" />
                        </a>
                      ) : (
                        item.name
                      )}
                    </p>
                    <p className="mt-1 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                      {[item.issuer, item.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard id="platforms" title="Competitive platforms">
            {!platforms.length ? (
              <EmptyState title="No platforms linked yet" className="py-8" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {platforms.map((p) => {
                  const meta = PLATFORMS[p.platform as keyof typeof PLATFORMS];
                  const color = platformColor(p.platform);
                  return (
                    <a
                      key={p.platform}
                      href={meta?.profileUrl(p.handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)]/40 p-4 no-underline transition-colors hover:border-[var(--v2-border-strong)] hover:bg-[var(--v2-surface-hover)]"
                      style={{
                        boxShadow: `inset 3px 0 0 ${color}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <PlatformBadge platform={p.platform} />
                          <p className="mt-2 font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg)] group-hover:text-[var(--v2-primary)]">
                            @{p.handle}
                          </p>
                          {p.rank ? (
                            <p className="mt-0.5 text-[11px] capitalize text-[var(--v2-fg-subtle)]">
                              {p.rank}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xl font-semibold tabular-nums text-[var(--v2-fg)]">
                            {p.solvedCount}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-[var(--v2-fg-subtle)]">
                            Solved
                          </p>
                          {p.currentRating != null ? (
                            <p className="mt-1 font-mono text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                              {p.currentRating} rating
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard id="activity" title="Recent activity">
            {!props.recent?.length ? (
              <EmptyState title="No recent activity to show" className="py-8" />
            ) : (
              <ul className="divide-y divide-[var(--v2-border-subtle)]">
                {props.recent.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
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
                      <div className="mt-1.5 flex items-center gap-2">
                        <PlatformBadge platform={s.platform} />
                        <span className="text-[11px] text-[var(--v2-fg-subtle)]">
                          {platformLabel(s.platform)}
                        </span>
                      </div>
                    </div>
                    <time className="shrink-0 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                      {formatRelativeTime(s.submittedAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          {skillList.length > 0 ? (
            <Card className="shadow-[var(--v2-shadow-sm)]">
              <CardHeader>
                <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  Skills
                </h2>
              </CardHeader>
              <CardBody className="flex flex-wrap gap-2 pt-0">
                {skillList.map((s) => (
                  <span
                    key={s}
                    className="rounded-[var(--v2-radius-full)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-2.5 py-1 text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg)]"
                  >
                    {s}
                  </span>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <Card className="shadow-[var(--v2-shadow-sm)]">
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                Snapshot
              </h2>
            </CardHeader>
            <CardBody className="space-y-3 pt-0">
              <SnapshotRow label="Location" value={props.location} />
              <SnapshotRow label="Organization" value={props.college} />
              <SnapshotRow
                label="Age"
                value={props.age != null ? String(props.age) : null}
              />
              {!props.location && !props.college && props.age == null ? (
                <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                  No extra details yet.
                </p>
              ) : null}
            </CardBody>
          </Card>

          {links.length > 0 ? (
            <Card className="shadow-[var(--v2-shadow-sm)]">
              <CardHeader>
                <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  Links
                </h2>
              </CardHeader>
              <CardBody className="flex flex-col gap-2 pt-0">
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] px-3 py-2 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)] no-underline transition-colors hover:bg-[var(--v2-surface-hover)]"
                  >
                    {l.label}
                    <ExternalLink className="size-3.5 text-[var(--v2-fg-subtle)]" />
                  </a>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] p-4 shadow-[var(--v2-shadow-sm)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg-muted)]">
          {label}
        </p>
        <span className="flex size-7 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]">
          {icon}
        </span>
      </div>
      <p className="mt-2 font-mono text-[1.5rem] font-semibold tabular-nums tracking-tight text-[var(--v2-fg)]">
        {value}
      </p>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--v2-border-subtle)] pb-2 last:border-0 last:pb-0">
      <span className="text-[var(--v2-text-xs)] text-[var(--v2-fg-subtle)]">
        {label}
      </span>
      <span className="text-right text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
        {value}
      </span>
    </div>
  );
}

function SectionCard({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <Card className={cn("shadow-[var(--v2-shadow-sm)]")}>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
            {icon ? (
              <span className="flex size-7 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]">
                {icon}
              </span>
            ) : null}
            {title}
          </h2>
        </CardHeader>
        <CardBody className="pt-0">{children}</CardBody>
      </Card>
    </div>
  );
}
