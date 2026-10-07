"use client";

/**
 * src/app/(app)/teams/page.tsx
 * Teams list page - shows user's teams and public teams to discover.
 */
import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  avatarUrl: string | null;
  owner: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  memberCount: number;
  userRole?: string;
  createdAt: string;
}

interface TeamsPageProps {
  initialUserTeams?: Team[];
  initialPublicTeams?: Team[];
}

export default function TeamsPage({ initialUserTeams = [], initialPublicTeams = [] }: TeamsPageProps) {
  const [userTeams, setUserTeams] = useState<Team[]>(initialUserTeams);
  const [publicTeams, setPublicTeams] = useState<Team[]>(initialPublicTeams);
  const [isLoading, setIsLoading] = useState(!initialUserTeams.length);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"my" | "discover">("my");
  const [error, setError] = useState<string | null>(null);

  // Form state for creating team
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    description: "",
    visibility: "PUBLIC" as "PUBLIC" | "PRIVATE" | "SECRET",
    memberVisibilityPolicy: "TEAM" as "EVERYONE" | "FOLLOWERS" | "TEAM" | "ME",
  });

  // Fetch teams on mount
  useEffect(() => {
    if (initialUserTeams.length > 0 && initialPublicTeams.length > 0) return;

    async function fetchTeams() {
      try {
        setIsLoading(true);
        // Fetch user's teams
        const userRes = await fetch("/api/teams");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserTeams(userData.teams || []);
        }

        // Fetch public teams
        const publicRes = await fetch("/api/teams?public=true&limit=20");
        if (publicRes.ok) {
          const publicData = await publicRes.json();
          setPublicTeams(publicData.teams || []);
        }
      } catch (err) {
        setError("Failed to load teams");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeams();
  }, [initialUserTeams.length, initialPublicTeams.length]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create team");

      // Add to user teams list
      setUserTeams((prev) => [data.team, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        slug: "",
        description: "",
        visibility: "PUBLIC",
        memberVisibilityPolicy: "TEAM",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCreateForm((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  if (isLoading && userTeams.length === 0 && publicTeams.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 1rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "var(--text-tertiary)" }}>Loading teams...</p>
      </div>
    );
  }

  const currentTeams = activeTab === "my" ? userTeams : publicTeams;

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p className="terminal-header" style={{ marginBottom: "0.25rem" }}>
            ~/teams $
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Teams</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: "10px 16px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--accent)",
            color: "var(--text-inverse)",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.875rem",
            fontFamily: "var(--font-mono)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          + Create Team
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("my")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            backgroundColor: activeTab === "my" ? "var(--accent)" : "transparent",
            color: activeTab === "my" ? "var(--text-inverse)" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
          }}
        >
          My Teams ({userTeams.length})
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            border: "none",
            backgroundColor: activeTab === "discover" ? "var(--accent)" : "transparent",
            color: activeTab === "discover" ? "var(--text-inverse)" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
          }}
        >
          Discover ({publicTeams.length})
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "var(--radius-md)", backgroundColor: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Teams Grid */}
      {currentTeams.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>
            {activeTab === "my" ? "👥" : "🔍"}
          </div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem" }}>
            {activeTab === "my" ? "No teams yet" : "No public teams found"}
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {activeTab === "my"
              ? "Create your first team to start collaborating with others"
              : "Check back later for public teams to join"}
          </p>
          {activeTab === "my" && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "10px 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--accent)",
                color: "var(--text-inverse)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Create Team
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {currentTeams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", height: "100%", transition: "all 0.2s ease" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      backgroundColor: "var(--accent-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    {team.avatarUrl ? (
                      <img src={team.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} />
                    ) : (
                      <span>👥</span>
                    )}
                  </div>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      backgroundColor:
                        team.visibility === "PUBLIC"
                          ? "rgba(34, 197, 94, 0.15)"
                          : team.visibility === "PRIVATE"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      color:
                        team.visibility === "PUBLIC"
                          ? "#22c55e"
                          : team.visibility === "PRIVATE"
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  >
                    {team.visibility}
                  </span>
                </div>

                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", fontWeight: 600 }}>{team.name}</h3>
                {team.description && (
                  <p style={{ margin: "0 0 1rem", color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {team.description}
                  </p>
                )}

                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: "var(--bg-elevated)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                      }}
                    >
                      {team.owner.avatarUrl ? (
                        <img src={team.owner.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      ) : (
                        <span style={{ fontSize: "0.75rem" }}>👤</span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                      @{team.owner.username}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                    </span>
                    {activeTab === "my" && team.userRole && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: "var(--accent-bg)",
                          color: "var(--accent)",
                          fontSize: "0.625rem",
                          fontWeight: 600,
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase",
                        }}
                      >
                        {team.userRole}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "480px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 600" }}>Create New Team</h2>

            <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Team Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={handleNameChange}
                  required
                  maxLength={100}
                  placeholder="e.g. Algorithm Masters"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-strong)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Slug (URL)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>devtrack.team/</span>
                  <input
                    type="text"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                    maxLength={60}
                    pattern="[a-z0-9-]+"
                    placeholder="algorithm-masters"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-strong)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </div>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Description (optional)
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  maxLength={500}
                  rows={3}
                  placeholder="What's this team about?"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-strong)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Visibility
                </label>
                <select
                  value={createForm.visibility}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, visibility: e.target.value as any }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-strong)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <option value="PUBLIC">Public - Anyone can discover and request to join</option>
                  <option value="PRIVATE">Private - Hidden from discovery, invite only</option>
                  <option value="SECRET">Secret - Completely hidden, invite link only</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Member Visibility
                </label>
                <select
                  value={createForm.memberVisibilityPolicy}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, memberVisibilityPolicy: e.target.value as any }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-strong)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <option value="EVERYONE">Everyone - Public profile data visible to all</option>
                  <option value="FOLLOWERS">Followers - Only followers can see member data</option>
                  <option value="TEAM">Team Members - Only team members can see member data</option>
                  <option value="ME">Only Me - Member data is private</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    backgroundColor: "var(--accent)",
                    color: "var(--text-inverse)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}