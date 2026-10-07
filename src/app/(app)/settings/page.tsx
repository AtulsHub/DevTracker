"use client";

import { useState } from "react";
import { platformEnum } from "@/server/db/schema";

type PlatformEnum = typeof platformEnum.enumValues[number];

interface Platform {
  id: PlatformEnum;
  name: string;
  color: string;
  icon: string;
}

const PLATFORMS: Platform[] = [
  { id: "codeforces", name: "Codeforces", color: "#1976D2", icon: "📊" },
  { id: "leetcode", name: "LeetCode", color: "#FFA116", icon: "🔥" },
  { id: "atcoder", name: "AtCoder", color: "#006FCC", icon: "🇯🇵" },
  { id: "codechef", name: "CodeChef", color: "#5B4638", icon: "👨‍🍳" },
];

export default function SettingsPage() {
  const [activePlatform, setActivePlatform] = useState<PlatformEnum | null>(null);
  const [handle, setHandle] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Fetch existing linked accounts from API
  // For now, we just build the UI to link a new one

  const handleLinkInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlatform || !handle.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/platforms/${activePlatform}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate link");

      setToken(data.verificationToken);
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initiate link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!activePlatform || !handle.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/platforms/${activePlatform}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      // Reset on success
      setStep("input");
      setActivePlatform(null);
      setHandle("");
      setToken("");
      // TODO: refresh account list
      alert("Successfully linked!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <p className="terminal-header" style={{ marginBottom: "0.25rem" }}>
          ~/settings $
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Settings</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Manage your account and platform links.
        </p>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.5rem" }}>
          Linked Platforms
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {PLATFORMS.map((p) => (
            <div
              key={p.id}
              style={{
                border: `1px solid ${activePlatform === p.id ? p.color : "var(--border)"}`,
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                backgroundColor: activePlatform === p.id ? "var(--bg-elevated)" : "var(--bg-surface)",
                transition: "all 200ms",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: activePlatform === p.id ? "default" : "pointer",
                }}
                onClick={() => {
                  if (activePlatform !== p.id) {
                    setActivePlatform(p.id);
                    setStep("input");
                    setHandle("");
                    setError(null);
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "8px",
                      backgroundColor: `${p.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                    }}
                  >
                    {p.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 500, margin: 0 }}>{p.name}</h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>
                      Not linked
                    </p>
                  </div>
                </div>
                
                {activePlatform !== p.id && (
                  <button
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                    }}
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Expansion panel for active platform */}
              {activePlatform === p.id && (
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                  {error && (
                    <div style={{
                      backgroundColor: "rgba(239,68,68,0.1)",
                      color: "#fca5a5",
                      padding: "0.75rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.8125rem",
                      marginBottom: "1rem",
                    }}>
                      {error}
                    </div>
                  )}

                  {step === "input" ? (
                    <form onSubmit={handleLinkInitiate}>
                      <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        Enter your {p.name} handle
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="text"
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          placeholder="e.g. tourist"
                          required
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-strong)",
                            backgroundColor: "var(--bg-surface)",
                            color: "var(--text-primary)",
                            outline: "none",
                            fontFamily: "var(--font-mono)",
                          }}
                        />
                        <button
                          type="submit"
                          disabled={isLoading}
                          style={{
                            backgroundColor: "var(--accent)",
                            color: "var(--text-inverse)",
                            border: "none",
                            padding: "0 1rem",
                            borderRadius: "var(--radius-sm)",
                            fontWeight: 600,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                          }}
                        >
                          {isLoading ? "..." : "Next →"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
                        To verify ownership of <strong>{handle}</strong>, please complete the following steps:
                      </p>
                      <div style={{
                        backgroundColor: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "1rem",
                        marginBottom: "1rem",
                        fontSize: "0.875rem",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-secondary)",
                      }}>
                        {p.id === "codeforces" ? (
                          <>
                            1. Go to Codeforces<br/>
                            2. Submit a compile error solution to ANY problem<br/>
                            3. Include this exact string in your code:<br/><br/>
                            <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{token}</span>
                          </>
                        ) : (
                          <>Follow the {p.name} specific verification rules using token: <strong>{token}</strong></>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          onClick={handleVerify}
                          disabled={isLoading}
                          style={{
                            backgroundColor: "var(--accent)",
                            color: "var(--text-inverse)",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "var(--radius-sm)",
                            fontWeight: 600,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                          }}
                        >
                          {isLoading ? "Verifying..." : "I've done it — Verify"}
                        </button>
                        <button
                          onClick={() => setStep("input")}
                          disabled={isLoading}
                          style={{
                            backgroundColor: "transparent",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                            padding: "8px 16px",
                            borderRadius: "var(--radius-sm)",
                            cursor: isLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
