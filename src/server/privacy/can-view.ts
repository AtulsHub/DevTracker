/**
 * src/server/privacy/can-view.ts
 * Single server-side function implementing the 5-step visibility decision.
 * See docs/SPEC.md section 4 for the full privacy model.
 *
 * EVERY query that returns another user's data MUST go through canView().
 * Never filter on the client.
 */
import { and, eq, or } from "drizzle-orm";
import { db } from "@/server/db";
import {
  follows,
  teamMembers,
  privacySettings,
  users,
} from "@/server/db/schema";

/** Fields that can have per-user audience overrides. */
export type PrivacyField =
  | "activity_feed"
  | "solved_problem_details"
  | "ratings"
  | "heatmap"
  | "linked_handles"
  | "contest_history";

/** Audience levels for access decisions. */
export type Audience = "EVERYONE" | "FOLLOWERS" | "TEAM" | "ME";

/**
 * Determines whether viewer V can access a specific field of owner O.
 *
 * Decision order (spec section 4):
 * 1. V == O → allow all
 * 2. V and O share at least one team → allow, subject to team memberVisibility
 * 3. V has an accepted follow on O → allow follower-level fields
 * 4. O.profileVisibility == PUBLIC → allow public-level fields only
 * 5. Otherwise → deny
 *
 * @param viewerId - ID of the viewer (null means unauthenticated)
 * @param ownerId - ID of the profile owner
 * @param field - The specific field being accessed
 * @returns true if the viewer can see the field, false otherwise
 */
export async function canView(
  viewerId: string | null,
  ownerId: string,
  field: PrivacyField
): Promise<boolean> {
  // ── Step 1: Viewer is the owner ─────────────────────────────────────────────
  if (viewerId && viewerId === ownerId) {
    return true;
  }

  // Load the owner's profile visibility
  const owner = await db.query.users.findFirst({
    where: eq(users.id, ownerId),
    columns: { profileVisibility: true, discoverable: true },
  });

  if (!owner) return false;

  // Load the field-specific audience override (if any)
  const fieldAudience = await getFieldAudience(ownerId, field);

  // If authenticated viewer:
  if (viewerId) {
    // ── Step 2: Shared team membership ──────────────────────────────────────
    const sharedTeam = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, viewerId),
        eq(teamMembers.status, "ACTIVE")
      ),
      columns: { teamId: true },
    });

    if (sharedTeam) {
      // Check if owner is also in that team
      const ownerInTeam = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, sharedTeam.teamId),
          eq(teamMembers.userId, ownerId),
          eq(teamMembers.status, "ACTIVE")
        ),
      });

      if (ownerInTeam) {
        // Allow access unless the field is explicitly restricted to ME only
        return fieldAudience !== "ME";
      }
    }

    // ── Step 3: Accepted follow ──────────────────────────────────────────────
    const follow = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, viewerId),
        eq(follows.followeeId, ownerId),
        eq(follows.status, "ACCEPTED")
      ),
    });

    if (follow) {
      return fieldAudience === "EVERYONE" || fieldAudience === "FOLLOWERS";
    }
  }

  // ── Step 4: Public profile ───────────────────────────────────────────────
  if (owner.profileVisibility === "PUBLIC") {
    return fieldAudience === "EVERYONE";
  }

  // ── Step 5: Deny ─────────────────────────────────────────────────────────
  return false;
}

/**
 * Returns the audience setting for a specific field on a user's profile.
 * Falls back to EVERYONE if no explicit setting exists.
 */
async function getFieldAudience(
  userId: string,
  field: PrivacyField
): Promise<Audience> {
  const setting = await db.query.privacySettings.findFirst({
    where: and(
      eq(privacySettings.userId, userId),
      eq(privacySettings.field, field)
    ),
  });

  return (setting?.audience as Audience) ?? "EVERYONE";
}

/**
 * Batch version — checks multiple fields at once.
 * Returns a map of field → boolean.
 */
export async function canViewFields(
  viewerId: string | null,
  ownerId: string,
  fields: PrivacyField[]
): Promise<Record<PrivacyField, boolean>> {
  const results = await Promise.all(
    fields.map(async (field) => [field, await canView(viewerId, ownerId, field)] as const)
  );
  return Object.fromEntries(results) as Record<PrivacyField, boolean>;
}
