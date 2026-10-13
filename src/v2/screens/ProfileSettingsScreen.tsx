"use client";

import { useRef, useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { v2Api } from "@/v2/lib/api";
import { fileToAvatarDataUrl } from "@/v2/lib/avatar";
import { useTheme } from "@/v2/shell/ThemeProvider";
import { cn } from "@/v2/lib/cn";

export type ProfileUser = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  age: number | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  college: string | null;
  skills: string | null;
  profileVisibility: "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";
  timezone: string | null;
};

export function ProfileSettingsScreen({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [headline, setHeadline] = useState(user.headline ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [age, setAge] = useState(user.age?.toString() ?? "");
  const [college, setCollege] = useState(user.college ?? "");
  const [skills, setSkills] = useState(user.skills ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(user.websiteUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(user.githubUrl ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [visibility, setVisibility] = useState(user.profileVisibility);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarUrl(dataUrl);
      setMsg("Photo ready — click Save to publish");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read image");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setMsg(null);
    setError(null);
    const ageNum = age.trim() === "" ? null : Number.parseInt(age, 10);
    if (ageNum != null && (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120)) {
      setError("Age must be between 13 and 120");
      return;
    }
    try {
      await v2Api.patchMe({
        displayName: displayName.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        age: ageNum,
        college: college.trim() || null,
        skills: skills.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
        avatarUrl: avatarUrl || null,
        profileVisibility: visibility,
      });
      setMsg("Profile saved");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[var(--v2-text-2xl)] font-bold">
            Your profile
          </h1>
          <p className="font-mono text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            @{user.username}
          </p>
        </div>
        <Link
          href={`/u/${user.username}`}
          className="text-[var(--v2-text-sm)] font-semibold text-[var(--v2-primary)] no-underline"
        >
          View public page →
        </Link>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <h2 className="text-[var(--v2-text-sm)] font-semibold">Photo</h2>
        </CardHeader>
        <CardBody className="flex flex-wrap items-center gap-4 pt-0">
          <div className="relative size-24 overflow-hidden rounded-[var(--v2-radius-lg)] bg-[var(--v2-primary-muted)]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--v2-primary)]">
                {(displayName || user.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAvatarUrl("")}
              >
                Remove photo
              </Button>
            ) : null}
            <p className="text-[11px] text-[var(--v2-fg-subtle)]">
              JPEG/PNG/WebP · compressed automatically
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <h2 className="text-[var(--v2-text-sm)] font-semibold">
            Public details
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-3 pt-0">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Headline"
            placeholder="Competitive programmer · CF specialist"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
          <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              className="min-h-24 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 text-[var(--v2-fg)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--v2-primary)]"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Location"
              placeholder="Bengaluru, India"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Input
              label="Age"
              type="number"
              min={13}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <Input
            label="College / org"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          />
          <Input
            label="Skills (comma-separated)"
            placeholder="DP, Graphs, AtCoder, System Design"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
          <Input
            label="Website"
            type="url"
            placeholder="https://"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
          <Input
            label="GitHub"
            type="url"
            placeholder="https://github.com/you"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            Profile visibility
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(
                  e.target.value as "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE",
                )
              }
              className="min-h-11 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 text-[var(--v2-fg)]"
            >
              <option value="PUBLIC">Public</option>
              <option value="FOLLOWERS_ONLY">Followers only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>
          {error ? (
            <p className="text-[var(--v2-text-xs)] text-[var(--v2-danger)]">
              {error}
            </p>
          ) : null}
          {msg ? (
            <p className="text-[var(--v2-text-xs)] text-[var(--v2-success)]">
              {msg}
            </p>
          ) : null}
          <Button loading={pending} onClick={() => void save()}>
            Save changes
          </Button>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <h2 className="text-[var(--v2-text-sm)] font-semibold">Theme</h2>
        </CardHeader>
        <CardBody className="flex gap-2 pt-0">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                "min-h-11 flex-1 rounded-[var(--v2-radius-md)] border capitalize",
                theme === t
                  ? "border-[var(--v2-primary)] bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                  : "border-[var(--v2-border)] text-[var(--v2-fg-muted)]",
              )}
            >
              {t}
            </button>
          ))}
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody className="flex flex-col gap-2">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            Open dashboard
          </Button>
          <Button
            variant="danger"
            onClick={() => void signOut({ callbackUrl: "/" })}
          >
            Log out
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
