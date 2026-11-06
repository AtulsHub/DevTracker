import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { PlatformBadge } from "@/v2/components/Badge";
import { EmptyState } from "@/v2/components/EmptyState";
import { Button } from "@/v2/components/Button";
import { MetricCard } from "@/v2/components/MetricCard";
import { PLATFORMS } from "@/v2/design/platforms";
import { formatRelativeTime } from "@/lib/utils";
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
} from "@/v2/lib/profileTypes";
import {
  Briefcase,
  GraduationCap,
  Link2,
  Lock,
  Target,
  FileText,
  FolderKanban,
  Award,
} from "lucide-react";

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
  openToWork?: boolean;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  projects?: ProjectEntry[];
  certifications?: CertificationEntry[];
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
        <Card>
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
  const metaBits = [
    props.location,
    props.age != null ? `${props.age} yrs` : null,
    props.college,
  ].filter(Boolean);

  const links = [
    props.resumeUrl ? { label: "Resume", href: props.resumeUrl } : null,
    props.websiteUrl ? { label: "Website", href: props.websiteUrl } : null,
    props.githubUrl ? { label: "GitHub", href: props.githubUrl } : null,
    props.linkedinUrl ? { label: "LinkedIn", href: props.linkedinUrl } : null,
    props.twitterUrl ? { label: "X / Twitter", href: props.twitterUrl } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  const nav = [
    props.bio ? { id: "about", label: "About" } : null,
    experience.length ? { id: "experience", label: "Experience" } : null,
    education.length ? { id: "education", label: "Education" } : null,
    projects.length ? { id: "projects", label: "Projects" } : null,
    certifications.length ? { id: "certs", label: "Certifications" } : null,
    { id: "platforms", label: "Platforms" },
    { id: "activity", label: "Activity" },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <article className="overflow-hidden rounded-[var(--v2-radius-lg)] border border-[var(--v2-border)] bg-[var(--v2-bg-elevated)]">
        <div
          className="h-24 border-b border-[var(--v2-border)] bg-[linear-gradient(135deg,var(--v2-primary-muted),transparent_60%),var(--v2-bg-muted)] sm:h-28"
          aria-hidden
        />
        <div className="relative px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 mb-3 flex flex-wrap items-end justify-between gap-3 sm:-mt-12">
            <div className="size-20 overflow-hidden rounded-full border-4 border-[var(--v2-bg-elevated)] bg-[var(--v2-primary-muted)] sm:size-24">
              {props.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={props.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-2xl font-semibold text-[var(--v2-primary)]">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {props.resumeUrl ? (
                <a href={props.resumeUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary">
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
                  <Button size="sm">Sign up</Button>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[1.625rem] font-semibold tracking-tight text-[var(--v2-fg)]">
              {name}
            </h1>
            {props.openToWork ? (
              <span className="rounded-[var(--v2-radius-full)] bg-[var(--v2-success)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--v2-success)]">
                Open to work
              </span>
            ) : null}
          </div>
          <p className="font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg-subtle)]">
            @{username}
          </p>
          {props.headline ? (
            <p className="mt-2 max-w-2xl text-[var(--v2-text-sm)] text-[var(--v2-fg)]">
              {props.headline}
            </p>
          ) : null}
          {metaBits.length > 0 ? (
            <p className="mt-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
              {metaBits.join(" · ")}
            </p>
          ) : null}

          {links.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--v2-text-sm)] font-medium text-[var(--v2-primary)]"
                >
                  {l.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </article>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <MetricCard
          label="Total solved"
          value={(props.totalSolved ?? 0).toLocaleString()}
          icon={Target}
        />
        <MetricCard
          label="Platforms"
          value={props.platforms?.length ?? 0}
          icon={Link2}
        />
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-[var(--v2-border)] pb-px">
        {nav.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="min-h-9 shrink-0 px-3 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg-muted)] no-underline transition-colors hover:text-[var(--v2-fg)]"
          >
            {item.label}
          </a>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
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
              icon={<Briefcase className="size-3.5" aria-hidden />}
            >
              <ul className="space-y-4">
                {experience.map((item) => (
                  <li key={item.id} className="relative pl-4">
                    <span className="absolute left-0 top-1.5 size-1.5 rounded-full bg-[var(--v2-primary)]" />
                    <p className="font-medium text-[var(--v2-fg)]">{item.title}</p>
                    <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                      {item.company}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                      {[item.startDate, item.current ? "Present" : item.endDate]
                        .filter(Boolean)
                        .join(" — ")}
                    </p>
                    {item.description ? (
                      <p className="mt-2 whitespace-pre-wrap text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                        {item.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {education.length > 0 ? (
            <SectionCard
              id="education"
              title="Education"
              icon={<GraduationCap className="size-3.5" aria-hidden />}
            >
              <ul className="space-y-4">
                {education.map((item) => (
                  <li key={item.id}>
                    <p className="font-medium text-[var(--v2-fg)]">
                      {item.school}
                    </p>
                    <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                      {[item.degree, item.field].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                      {[item.startYear, item.endYear]
                        .filter(Boolean)
                        .join(" — ")}
                    </p>
                    {item.description ? (
                      <p className="mt-2 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                        {item.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {projects.length > 0 ? (
            <SectionCard
              id="projects"
              title="Projects"
              icon={<FolderKanban className="size-3.5" aria-hidden />}
            >
              <ul className="space-y-4">
                {projects.map((item) => (
                  <li key={item.id}>
                    <p className="font-medium text-[var(--v2-fg)]">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--v2-fg)] no-underline hover:text-[var(--v2-primary)]"
                        >
                          {item.name}
                        </a>
                      ) : (
                        item.name
                      )}
                    </p>
                    {item.tech ? (
                      <p className="font-mono text-[11px] text-[var(--v2-fg-subtle)]">
                        {item.tech}
                      </p>
                    ) : null}
                    {item.description ? (
                      <p className="mt-1 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                        {item.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {certifications.length > 0 ? (
            <SectionCard
              id="certs"
              title="Certifications"
              icon={<Award className="size-3.5" aria-hidden />}
            >
              <ul className="space-y-3">
                {certifications.map((item) => (
                  <li key={item.id}>
                    <p className="font-medium text-[var(--v2-fg)]">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="no-underline hover:text-[var(--v2-primary)]"
                        >
                          {item.name}
                        </a>
                      ) : (
                        item.name
                      )}
                    </p>
                    <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                      {[item.issuer, item.year].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          <SectionCard id="platforms" title="Competitive platforms">
            {!props.platforms?.length ? (
              <EmptyState title="No platforms linked yet" className="py-8" />
            ) : (
              <div className="space-y-2">
                {props.platforms.map((p) => {
                  const meta = PLATFORMS[p.platform as keyof typeof PLATFORMS];
                  return (
                    <div
                      key={p.platform}
                      className="flex items-start justify-between gap-3 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] p-3"
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
                        <p className="font-mono text-xl font-semibold tabular-nums text-[var(--v2-fg)]">
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
                      <div className="mt-1">
                        <PlatformBadge platform={s.platform} />
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

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          {skillList.length > 0 ? (
            <Card>
              <CardHeader>
                <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  Skills
                </h2>
              </CardHeader>
              <CardBody className="flex flex-wrap gap-2 pt-0">
                {skillList.map((s) => (
                  <span
                    key={s}
                    className="rounded-[var(--v2-radius-md)] bg-[var(--v2-bg-muted)] px-2.5 py-1 text-[var(--v2-text-xs)] font-medium text-[var(--v2-fg)]"
                  >
                    {s}
                  </span>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
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
              {props.openToWork ? (
                <p>
                  <span className="text-[var(--v2-fg-subtle)]">Status · </span>
                  Open to work
                </p>
              ) : null}
              {!props.location &&
              !props.college &&
              props.age == null &&
              !props.openToWork ? (
                <p>No extra details yet.</p>
              ) : null}
            </CardBody>
          </Card>
        </aside>
      </div>
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
    <div id={id} className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
            {icon}
            {title}
          </h2>
        </CardHeader>
        <CardBody className="pt-0">{children}</CardBody>
      </Card>
    </div>
  );
}
