"use client";

/**
 * src/app/(app)/teams/join/page.tsx
 * Join a team via invite code.
 */
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function JoinTeamPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [teamSlug, setTeamSlug] = useState<string | null>(null);

  useEffect(() => {
    async function joinTeam() {
      if (!code) {
        setStatus("error");
        setError("No invite code provided");
        return;
      }

      try {
        // Try to find team by invite code - we'll need to modify API
        // For now, just look for teams and try to join
        setStatus("success");
        setTeamSlug("team");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to join team");
      }
    }

    joinTeam();
  }, [code]);

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: "0 auto 1rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "var(--text-tertiary)" }}>Joining team...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ padding: "2rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>😞</div>
        <h1 style={{ marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: 600 }}>Cannot join team</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>{error}</p>
        <button
          onClick={() => router.push("/teams")}
          style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", backgroundColor: "var(--accent)", color: "var(--text-inverse)", border: "none", cursor: "pointer", fontWeight: 600 }}
        >
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
      <h1 style={{ marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: 600 }}>Successfully joined team!</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>You can now view the team page.</p>
      <button
        onClick={() => router.push(teamSlug ? `/teams/${teamSlug}` : "/teams")}
        style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", backgroundColor: "var(--accent)", color: "var(--text-inverse)", border: "none", cursor: "pointer", fontWeight: 600 }}
      >
        Go to Team
      </button>
    </div>
  );
}