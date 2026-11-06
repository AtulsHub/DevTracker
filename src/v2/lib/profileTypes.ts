export type EducationEntry = {
  id: string;
  school: string;
  degree?: string;
  field?: string;
  startYear?: string;
  endYear?: string;
  description?: string;
};

export type ExperienceEntry = {
  id: string;
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
};

export type ProjectEntry = {
  id: string;
  name: string;
  url?: string;
  description?: string;
  tech?: string;
};

export type CertificationEntry = {
  id: string;
  name: string;
  issuer?: string;
  year?: string;
  url?: string;
};

/** User-defined profile links (Codeforces blog, Notion, Discord, etc.) */
export type CustomLinkEntry = {
  id: string;
  /** Display label / platform name */
  label: string;
  url: string;
};

export function newEntryId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
