"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Monitor,
  Moon,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
import { Card, CardBody } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { PageHeader } from "@/v2/components/PageHeader";
import { v2Api } from "@/v2/lib/api";
import { useTheme } from "@/v2/shell/ThemeProvider";
import { cn } from "@/v2/lib/cn";

export type SettingsUser = {
  username: string;
  profileVisibility: "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";
  timezone: string | null;
  discoverable: boolean;
};

type Visibility = SettingsUser["profileVisibility"];

const VISIBILITY_OPTIONS: {
  id: Visibility;
  title: string;
  description: string;
  icon: typeof Eye;
}[] = [
  {
    id: "PUBLIC",
    title: "Public",
    description: "Anyone can open your profile and see your stats.",
    icon: Eye,
  },
  {
    id: "FOLLOWERS_ONLY",
    title: "Followers only",
    description: "Only people who follow you can view your profile.",
    icon: Users,
  },
  {
    id: "PRIVATE",
    title: "Private",
    description: "Your profile stays hidden. Only you can see it.",
    icon: Lock,
  },
];

const THEME_OPTIONS = [
  { id: "light" as const, label: "Light", icon: Sun },
  { id: "dark" as const, label: "Dark", icon: Moon },
  { id: "system" as const, label: "System", icon: Monitor },
];

export function SettingsScreen({ user }: { user: SettingsUser }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState(user.profileVisibility);
  const [discoverable, setDiscoverable] = useState(user.discoverable);
  const [timezone, setTimezone] = useState(user.timezone ?? "UTC");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return ["UTC", "Asia/Kolkata", "America/New_York", "Europe/London"];
    }
  }, []);

  const dirty =
    visibility !== user.profileVisibility ||
    discoverable !== user.discoverable ||
    (timezone || "UTC") !== (user.timezone ?? "UTC");

  async function save() {
    setMsg(null);
    setError(null);
    try {
      await v2Api.patchMe({
        profileVisibility: visibility,
        discoverable,
        timezone: timezone || "UTC",
      });
      setMsg("Settings saved");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title="Settings"
        description="Control how your account appears, where you’re discoverable, and how DevTrack looks."
        actions={
          <Button
            size="sm"
            loading={pending}
            disabled={!dirty && !pending}
            onClick={() => void save()}
          >
            Save changes
          </Button>
        }
      />

      {(error || msg) && (
        <p
          className={cn(
            "mb-5 rounded-[var(--v2-radius-md)] border px-3.5 py-2.5 text-[var(--v2-text-sm)]",
            error
              ? "border-[var(--v2-danger)]/30 bg-[var(--v2-danger)]/5 text-[var(--v2-danger)]"
              : "border-[var(--v2-success)]/30 bg-[var(--v2-success)]/5 text-[var(--v2-success)]",
          )}
          role="status"
        >
          {error ?? msg}
        </p>
      )}

      <div className="space-y-6">
        <SettingsSection
          title="Profile content"
          description="Bio, experience, projects, and resume live on the profile editor."
        >
          <Card className="shadow-[var(--v2-shadow-sm)]">
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]">
                  <UserRound className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                    @{user.username}
                  </p>
                  <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                    Update the public portfolio people see on your page.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/u/${user.username}`}>
                  <Button size="sm" variant="ghost">
                    <Eye className="mr-1.5 size-3.5" aria-hidden />
                    View page
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button size="sm" variant="secondary">
                    Edit profile
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </SettingsSection>

        <SettingsSection
          title="Privacy"
          description="Choose who can open your public profile."
        >
          <div className="grid gap-2.5">
            {VISIBILITY_OPTIONS.map((opt) => {
              const selected = visibility === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibility(opt.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[var(--v2-radius-lg)] border px-4 py-3.5 text-left transition-colors",
                    selected
                      ? "border-[var(--v2-primary)] bg-[var(--v2-primary-muted)]/40 shadow-[var(--v2-shadow-sm)]"
                      : "border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] hover:border-[var(--v2-border-strong)]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--v2-radius-md)]",
                      selected
                        ? "bg-[var(--v2-primary)] text-[var(--v2-on-primary)]"
                        : "bg-[var(--v2-bg-muted)] text-[var(--v2-fg-muted)]",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                        {opt.title}
                      </span>
                      {selected ? (
                        <Check
                          className="size-3.5 text-[var(--v2-primary)]"
                          aria-hidden
                        />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[var(--v2-text-xs)] leading-relaxed text-[var(--v2-fg-muted)]">
                      {opt.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection
          title="Discovery"
          description="Control whether you appear in Explore."
        >
          <Card className="shadow-[var(--v2-shadow-sm)]">
            <CardBody>
              <label className="flex cursor-pointer items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--v2-radius-md)] bg-[var(--v2-bg-muted)] text-[var(--v2-fg-muted)]">
                  {discoverable ? (
                    <Compass className="size-4" aria-hidden />
                  ) : (
                    <EyeOff className="size-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                      Show in Explore
                    </span>
                    <input
                      type="checkbox"
                      checked={discoverable}
                      onChange={(e) => setDiscoverable(e.target.checked)}
                      className="size-4 accent-[var(--v2-primary)]"
                    />
                  </span>
                  <span className="mt-1 block text-[var(--v2-text-xs)] leading-relaxed text-[var(--v2-fg-muted)]">
                    When enabled and your profile is public, others can find you
                    from the Explore page.
                  </span>
                </span>
              </label>
            </CardBody>
          </Card>
        </SettingsSection>

        <SettingsSection
          title="Regional"
          description="Used for contest times and local scheduling."
        >
          <Card className="shadow-[var(--v2-shadow-sm)]">
            <CardBody>
              <label className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-[var(--v2-text-sm)] font-medium text-[var(--v2-fg)]">
                  <Clock
                    className="size-3.5 text-[var(--v2-fg-subtle)]"
                    aria-hidden
                  />
                  Timezone
                </span>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="min-h-10 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </label>
            </CardBody>
          </Card>
        </SettingsSection>

        <SettingsSection
          title="Appearance"
          description="Applies immediately on this device."
        >
          <div className="grid grid-cols-3 gap-2.5">
            {THEME_OPTIONS.map((opt) => {
              const selected = theme === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-[var(--v2-radius-lg)] border px-3 py-4 text-[var(--v2-text-sm)] font-medium transition-colors",
                    selected
                      ? "border-[var(--v2-primary)] bg-[var(--v2-primary-muted)]/50 text-[var(--v2-primary)] shadow-[var(--v2-shadow-sm)]"
                      : "border-[var(--v2-border)] bg-[var(--v2-bg-elevated)] text-[var(--v2-fg-muted)] hover:border-[var(--v2-border-strong)] hover:text-[var(--v2-fg)]",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection
          title="Session"
          description="Sign out of DevTrack on this browser."
        >
          <Card className="border-[var(--v2-danger)]/20 shadow-[var(--v2-shadow-sm)]">
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
                  Sign out
                </p>
                <p className="mt-0.5 text-[var(--v2-text-xs)] text-[var(--v2-fg-muted)]">
                  You’ll need to sign in again to sync platforms or edit your
                  profile.
                </p>
              </div>
              <Button
                size="lg"
                variant="danger"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                <LogOut className="mr-1.5 size-3.5" aria-hidden />
                Log out
              </Button>
            </CardBody>
          </Card>
        </SettingsSection>

        <div className="sticky bottom-4 flex justify-end pt-1 lg:static">
          <Button
            size="sm"
            loading={pending}
            disabled={!dirty && !pending}
            onClick={() => void save()}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
      <div className="min-w-0 sm:pt-1">
        <h2 className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-fg)]">
          {title}
        </h2>
        <p className="mt-1 text-[var(--v2-text-xs)] leading-relaxed text-[var(--v2-fg-muted)]">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
