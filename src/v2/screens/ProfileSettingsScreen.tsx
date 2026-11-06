"use client";

import {
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/v2/components/Card";
import { Button } from "@/v2/components/Button";
import { Input } from "@/v2/components/Input";
import { PageHeader } from "@/v2/components/PageHeader";
import { v2Api } from "@/v2/lib/api";
import { uploadImage } from "@/v2/lib/upload";
import {
  newEntryId,
  type CertificationEntry,
  type CustomLinkEntry,
  type EducationEntry,
  type ExperienceEntry,
  type ProjectEntry,
} from "@/v2/lib/profileTypes";
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
  linkedinUrl: string | null;
  twitterUrl: string | null;
  resumeUrl: string | null;
  college: string | null;
  skills: string | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  customLinks: CustomLinkEntry[];
};

type SectionId =
  | "basics"
  | "links"
  | "experience"
  | "education"
  | "projects"
  | "certs";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "basics", label: "Basics" },
  { id: "links", label: "Links & resume" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "certs", label: "Certifications" },
];

export function ProfileSettingsScreen({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [section, setSection] = useState<SectionId>("basics");

  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [headline, setHeadline] = useState(user.headline ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [age, setAge] = useState(user.age?.toString() ?? "");
  const [college, setCollege] = useState(user.college ?? "");
  const [skills, setSkills] = useState(user.skills ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(user.websiteUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(user.githubUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(user.twitterUrl ?? "");
  const [resumeUrl, setResumeUrl] = useState(user.resumeUrl ?? "");
  const [education, setEducation] = useState<EducationEntry[]>(
    user.education ?? [],
  );
  const [experience, setExperience] = useState<ExperienceEntry[]>(
    user.experience ?? [],
  );
  const [projects, setProjects] = useState<ProjectEntry[]>(user.projects ?? []);
  const [certifications, setCertifications] = useState<CertificationEntry[]>(
    user.certifications ?? [],
  );
  const [customLinks, setCustomLinks] = useState<CustomLinkEntry[]>(
    user.customLinks ?? [],
  );
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file, "avatars");
      setAvatarUrl(url);
      setMsg("Photo uploaded — click Save to publish");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload image");
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
        linkedinUrl: linkedinUrl.trim() || null,
        twitterUrl: twitterUrl.trim() || null,
        resumeUrl: resumeUrl.trim() || null,
        education,
        experience,
        projects,
        certifications,
        customLinks: customLinks
          .map((l) => ({
            id: l.id,
            label: l.label.trim(),
            url: l.url.trim(),
          }))
          .filter((l) => l.label && l.url),
        avatarUrl: avatarUrl || null,
      });
      setMsg("Profile saved");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[var(--v2-content-max)] px-4 py-5 sm:px-6 sm:py-7">
      <PageHeader
        title="Edit profile"
        description={`@${user.username} · public portfolio content only. Visibility, theme, and account prefs are in Settings.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/u/${user.username}`}>
              <Button size="sm" variant="secondary">
                View public page
              </Button>
            </Link>
            <Button size="sm" loading={pending} onClick={() => void save()}>
              Save
            </Button>
          </div>
        }
      />

      {(error || msg) && (
        <p
          className={cn(
            "mb-4 rounded-[var(--v2-radius-md)] border px-3 py-2 text-[var(--v2-text-xs)]",
            error
              ? "border-[var(--v2-danger)]/30 bg-[var(--v2-danger)]/5 text-[var(--v2-danger)]"
              : "border-[var(--v2-success)]/30 bg-[var(--v2-success)]/5 text-[var(--v2-success)]",
          )}
          role="status"
        >
          {error ?? msg}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:self-start">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "min-h-9 shrink-0 rounded-[var(--v2-radius-md)] px-3 text-left text-[var(--v2-text-sm)] font-medium transition-colors",
                section === s.id
                  ? "bg-[var(--v2-primary-muted)] text-[var(--v2-primary)]"
                  : "text-[var(--v2-fg-muted)] hover:bg-[var(--v2-surface-hover)] hover:text-[var(--v2-fg)]",
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          {section === "basics" ? (
            <>
              <Card>
                <CardHeader>
                  <h2 className="text-[var(--v2-text-sm)] font-semibold">
                    Photo
                  </h2>
                </CardHeader>
                <CardBody className="flex flex-wrap items-center gap-4 pt-0">
                  <div className="relative size-20 overflow-hidden rounded-full bg-[var(--v2-primary-muted)]">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-xl font-semibold text-[var(--v2-primary)]">
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
                      onChange={(e) =>
                        void onPickAvatar(e.target.files?.[0] ?? null)
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      Upload photo
                    </Button>
                    {avatarUrl ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setAvatarUrl("")}
                      >
                        Remove photo
                      </Button>
                    ) : null}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-[var(--v2-text-sm)] font-semibold">
                    Identity
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
                    placeholder="SDE · Competitive programmer · Open to internships"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                  />
                  <label className="flex flex-col gap-1.5 text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
                    About
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={5}
                      maxLength={1200}
                      className="rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
                    />
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      label="Location"
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
                    label="College / organization"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                  <Input
                    label="Skills (comma-separated)"
                    placeholder="DP, Graphs, React, System Design"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </CardBody>
              </Card>
            </>
          ) : null}

          {section === "links" ? (
            <>
              <Card>
                <CardHeader>
                  <h2 className="text-[var(--v2-text-sm)] font-semibold">
                    Resume & common links
                  </h2>
                </CardHeader>
                <CardBody className="flex flex-col gap-3 pt-0">
                  <Input
                    label="Resume / CV URL"
                    type="url"
                    placeholder="https://drive.google.com/… or personal site"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                  />
                  <Input
                    label="Website / portfolio"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                  <Input
                    label="GitHub"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                  <Input
                    label="LinkedIn"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                  <Input
                    label="X / Twitter"
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                  />
                </CardBody>
              </Card>

              <ListEditor
                title="Custom links"
                empty="Add Codeforces, LeetCode, Discord, Notion, blog — any label + URL."
                count={customLinks.length}
                onAdd={() =>
                  setCustomLinks((prev) => [
                    { id: newEntryId(), label: "", url: "" },
                    ...prev,
                  ])
                }
              >
                {customLinks.map((item, idx) => (
                  <div
                    key={item.id}
                    className="space-y-2 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] p-3"
                  >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
                      <Input
                        label="Platform / name"
                        placeholder="Codeforces, Discord, Blog…"
                        value={item.label}
                        onChange={(e) =>
                          setCustomLinks((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, label: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <Input
                        label="URL"
                        type="url"
                        placeholder="https://"
                        value={item.url}
                        onChange={(e) =>
                          setCustomLinks((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, url: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setCustomLinks((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </ListEditor>
            </>
          ) : null}

          {section === "experience" ? (
            <ListEditor
              title="Experience"
              empty="Add roles, internships, or research positions."
              count={experience.length}
              onAdd={() =>
                setExperience((prev) => [
                  {
                    id: newEntryId(),
                    company: "",
                    title: "",
                    current: false,
                  },
                  ...prev,
                ])
              }
            >
              {experience.map((item, idx) => (
                <div
                  key={item.id}
                  className="space-y-2 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] p-3"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      label="Title"
                      value={item.title}
                      onChange={(e) =>
                        setExperience((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, title: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      label="Company"
                      value={item.company}
                      onChange={(e) =>
                        setExperience((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, company: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Start"
                      placeholder="2024-06"
                      value={item.startDate ?? ""}
                      onChange={(e) =>
                        setExperience((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, startDate: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      label="End"
                      placeholder="Present"
                      value={item.endDate ?? ""}
                      disabled={item.current}
                      onChange={(e) =>
                        setExperience((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, endDate: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 text-[var(--v2-text-sm)]">
                    <input
                      type="checkbox"
                      checked={!!item.current}
                      onChange={(e) =>
                        setExperience((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  current: e.target.checked,
                                  endDate: e.target.checked
                                    ? ""
                                    : x.endDate,
                                }
                              : x,
                          ),
                        )
                      }
                    />
                    Current role
                  </label>
                  <textarea
                    value={item.description ?? ""}
                    onChange={(e) =>
                      setExperience((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, description: e.target.value }
                            : x,
                        ),
                      )
                    }
                    rows={3}
                    placeholder="Impact, stack, highlights"
                    className="w-full rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setExperience((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </ListEditor>
          ) : null}

          {section === "education" ? (
            <ListEditor
              title="Education"
              empty="Add degrees, bootcamps, or coursework."
              count={education.length}
              onAdd={() =>
                setEducation((prev) => [
                  { id: newEntryId(), school: "" },
                  ...prev,
                ])
              }
            >
              {education.map((item, idx) => (
                <div
                  key={item.id}
                  className="space-y-2 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] p-3"
                >
                  <Input
                    label="School"
                    value={item.school}
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, school: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      label="Degree"
                      value={item.degree ?? ""}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, degree: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      label="Field"
                      value={item.field ?? ""}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, field: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Start year"
                      value={item.startYear ?? ""}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, startYear: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                    <Input
                      label="End year"
                      value={item.endYear ?? ""}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, endYear: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <textarea
                    value={item.description ?? ""}
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, description: e.target.value }
                            : x,
                        ),
                      )
                    }
                    rows={2}
                    placeholder="Notes, GPA, activities"
                    className="w-full rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setEducation((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </ListEditor>
          ) : null}

          {section === "projects" ? (
            <ListEditor
              title="Projects"
              empty="Showcase apps, research, or contest tools."
              count={projects.length}
              onAdd={() =>
                setProjects((prev) => [
                  { id: newEntryId(), name: "" },
                  ...prev,
                ])
              }
            >
              {projects.map((item, idx) => (
                <div
                  key={item.id}
                  className="space-y-2 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] p-3"
                >
                  <Input
                    label="Name"
                    value={item.name}
                    onChange={(e) =>
                      setProjects((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    label="URL"
                    value={item.url ?? ""}
                    onChange={(e) =>
                      setProjects((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, url: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    label="Tech"
                    placeholder="Next.js, Postgres, Drizzle"
                    value={item.tech ?? ""}
                    onChange={(e) =>
                      setProjects((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, tech: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <textarea
                    value={item.description ?? ""}
                    onChange={(e) =>
                      setProjects((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, description: e.target.value }
                            : x,
                        ),
                      )
                    }
                    rows={3}
                    placeholder="What it does and why it matters"
                    className="w-full rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-2 text-[var(--v2-text-sm)] text-[var(--v2-fg)] outline-none focus:border-[var(--v2-primary)]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setProjects((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </ListEditor>
          ) : null}

          {section === "certs" ? (
            <ListEditor
              title="Certifications"
              empty="Add courses, contest ranks, or professional certs."
              count={certifications.length}
              onAdd={() =>
                setCertifications((prev) => [
                  { id: newEntryId(), name: "" },
                  ...prev,
                ])
              }
            >
              {certifications.map((item, idx) => (
                <div
                  key={item.id}
                  className="space-y-2 rounded-[var(--v2-radius-md)] border border-[var(--v2-border)] p-3"
                >
                  <Input
                    label="Name"
                    value={item.name}
                    onChange={(e) =>
                      setCertifications((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      label="Issuer"
                      value={item.issuer ?? ""}
                      onChange={(e) =>
                        setCertifications((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, issuer: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Input
                      label="Year"
                      value={item.year ?? ""}
                      onChange={(e) =>
                        setCertifications((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, year: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <Input
                    label="Credential URL"
                    value={item.url ?? ""}
                    onChange={(e) =>
                      setCertifications((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, url: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setCertifications((prev) =>
                        prev.filter((_, i) => i !== idx),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </ListEditor>
          ) : null}

          <div className="sticky bottom-4 flex justify-end lg:static">
            <Button size="sm" loading={pending} onClick={() => void save()}>
              Save all changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListEditor({
  title,
  empty,
  count,
  onAdd,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-[var(--v2-text-sm)] font-semibold">{title}</h2>
        <Button size="sm" variant="secondary" onClick={onAdd}>
          Add
        </Button>
      </CardHeader>
      <CardBody className="flex flex-col gap-3 pt-0">
        {count === 0 ? (
          <p className="text-[var(--v2-text-sm)] text-[var(--v2-fg-muted)]">
            {empty}
          </p>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  );
}
