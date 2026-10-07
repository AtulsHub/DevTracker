"use client";

/**
 * src/app/(app)/teams/[slug]/page.tsx
 * Team detail page - shows team info, members, join/leave actions.
 */
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { TeamLeaderboard } from "./leaderboard";

interface TeamMember {
  teamId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  inviteCode: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  userRole?: string;
  userStatus?: string;
  owner: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export default function TeamDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "requests" | "leaderboard">("members");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamData() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/teams/${slug}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch team");
        }
        const data = await res.json();
        setTeam(data.team);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch team");
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchTeamData();
    }
  }, [slug]);

  useEffect(() => {
    if (!team) return;

    async function fetchMembers() {
      try {
        const res = await fetch(`/api/teams/${slug}/members`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    }

    async function fetchPendingRequests() {
      if (!team?.userRole || !["OWNER", "ADMIN", "MODERATOR"].includes(team.userRole as "OWNER" | "ADMIN" | "MODERATOR")) {
        return;
      }
      try {
        const res = await fetch(`/api/teams/${slug}/members?pending=true`);
        if (res.ok) {
          const data = await res.json();
          setPendingRequests(data.requests || []);
        }
      } catch (err) {
        console.error("Failed to fetch pending requests:", err);
      }
    }

    fetchMembers();
    fetchPendingRequests();
  }, [team, slug]);

  const handleJoinTeam = async () => {
    if (!team) return;
    try {
      const res = await fetch(`/api/teams/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.reload();
      } else {
        alert(data.error || "Failed to join team");
      }
    } catch (err) {
      alert("Failed to join team");
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    if (!confirm("Are you sure you want to leave this team?")) return;
    try {
      // We need the current user's ID - but we don't have it directly
      // For now, redirect or reload
      window.location.reload();
    } catch (err) {
      alert("Failed to leave team");
    }
  };

  const handleCopyInvite = async () => {
    if (!team?.inviteCode) return;
    const inviteUrl = `${window.location.origin}/teams/join?code=${team.inviteCode}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 1rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "var(--text-tertiary)" }}>Loading team...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😞</div>
        <h1 style={{ marginBottom: "0.5rem" }}>Team not found</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{error || "This team doesn't exist or you don't have permission to view it."}</p>
        <Link href="/teams">
          <button style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", backgroundColor: "var(--accent)", color: "var(--text-inverse)", border: "none", cursor: "pointer", fontWeight: 600 }}>
            Back to Teams
          </button>
        </Link>
      </div>
    );
  }

  const canManageRequests = team.userRole && ["OWNER", "ADMIN", "MODERATOR"].includes(team.userRole);
  const isMember = team.userStatus === "ACTIVE";
  const isPending = team.userStatus === "PENDING";
  const isOwner = team.userRole === "OWNER";

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/teams" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", marginBottom: "1rem" }}>
          ← Back to Teams
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "1.5rem", flex: 1, minWidth: 300 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "16px",
                backgroundColor: "var(--accent-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            >
              {team.owner.avatarUrl ? <img src={team.owner.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px" }} /> : <span>👥</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>{team.name}</h1>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    backgroundColor: team.visibility === "PUBLIC" ? "rgba(34, 197, 94, 0.15)" : team.visibility === "PRIVATE" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: team.visibility === "PUBLIC" ? "#22c55e" : team.visibility === "PRIVATE" ? "#f59e0b" : "#ef4444",
                  }}
                >
                  {team.visibility}
                </span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.875rem", margin: "0 0 0.5rem" }}>/{team.slug}</p>
              {team.description && <p style={{ color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "1rem" }}>{team.description}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", fontSize: "0.875rem", color: "var(--text-tertiary)" }}>
                <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>Owned by @{team.owner.username}</span>
                <span>•</span>
                <span>Created {format(new Date(team.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            {!isMember && !isPending && team.visibility !== "SECRET" && (
              <button
                onClick={handleJoinTeam}
                style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", backgroundColor: "var(--accent)", color: "var(--text-inverse)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
              >
                {team.visibility === "PUBLIC" ? "Join Team" : "Request to Join"}
              </button>
            )}
            {isPending && (
              <span style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b", fontWeight: 600, fontSize: "0.875rem" }}>Join Request Pending</span>
            )}
            {isMember && !isOwner && (
              <button
                onClick={handleLeaveTeam}
                style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
              >
                Leave Team
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
              >
                Invite Members
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("members")}
          style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "members" ? "var(--accent)" : "transparent", color: activeTab === "members" ? "var(--text-inverse)" : "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-mono)" }}
        >
          Members ({members.length})
        </button>
        {canManageRequests && (
          <button
            onClick={() => setActiveTab("requests")}
            style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "requests" ? "var(--accent)" : "transparent", color: activeTab === "requests" ? "var(--text-inverse)" : "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-mono)" }}
          >
            Pending Requests ({pendingRequests.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab("leaderboard")}
          style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", border: "none", backgroundColor: activeTab === "leaderboard" ? "var(--accent)" : "transparent", color: activeTab === "leaderboard" ? "var(--text-inverse)" : "var(--text-secondary)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-mono)" }}
        >
          Leaderboard
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          {members.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
              <p>No members yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {members.map((member) => (
                <div key={`${member.teamId}-${member.userId}`} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>
                    {member.user.avatarUrl ? <img src={member.user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : <span>👤</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/u/${member.user.username}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9375rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {member.user.displayName || member.user.username}
                      </p>
                    </Link>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{member.user.username}</p>
                    {member.user.bio && <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{member.user.bio}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "var(--radius-full)",
                        backgroundColor: member.role === "OWNER" ? "rgba(96,165,250,0.15)" : member.role === "ADMIN" ? "rgba(168,85,247,0.15)" : member.role === "MODERATOR" ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)",
                        color: member.role === "OWNER" ? "#60a5fa" : member.role === "ADMIN" ? "#a855f7" : member.role === "MODERATOR" ? "#22c55e" : "#64748b",
                        fontSize: "0.625rem",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                      }}
                    >
                      {member.role}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === "requests" && canManageRequests && (
        <div className="card" style={{ padding: "1.5rem" }}>
          {pendingRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-tertiary)" }}>
              <p>No pending requests</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {pendingRequests.map((request) => (
                <div key={`${request.teamId}-${request.userId}`} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                    {request.user.avatarUrl ? <img src={request.user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : <span>👤</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/u/${request.user.username}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{request.user.displayName || request.user.username}</p>
                    </Link>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>@{request.user.username}</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={async () => {
                        const res = await fetch(`/api/teams/${slug}/requests/${request.userId}`, { method: "POST" });
                        if (res.ok) window.location.reload();
                        else alert("Failed to approve request");
                      }}
                      style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--accent)", color: "var(--text-inverse)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => {
                        const res = await fetch(`/api/teams/${slug}/requests/${request.userId}`, { method: "DELETE" });
                        if (res.ok) window.location.reload();
                        else alert("Failed to reject request");
                      }}
                      style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <TeamLeaderboard slug={slug} />
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}
          onClick={() => setShowInviteModal(false)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "500px", padding: "2rem" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem", fontWeight: 600 }}>Invite Members</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Share this invite link with others to join {team.name}</p>
            {team.inviteCode && (
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Invite Link</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={`${window.location.origin}/teams/join?code=${team.inviteCode}`}
                    readOnly
                    style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-strong)", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}
                  />
                  <button
                    onClick={handleCopyInvite}
                    style={{ padding: "10px 16px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--accent)", color: "var(--text-inverse)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap" }}
                  >
                    {copySuccess ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginTop: "0.5rem" }}>This code can be used to join {team.visibility === "PUBLIC" ? "the team" : "if invited"}</p>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ padding: "10px 16px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600 }}
              >
                Close
              </button>
            </div>
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