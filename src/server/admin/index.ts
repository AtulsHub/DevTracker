/**
 * Platform admin helpers (site-wide — not team ADMIN role).
 */
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog, users } from "@/server/db/schema";
import { emailIsAdminBootstrap } from "@/server/admin/emails";

export { emailIsAdminBootstrap, adminEmailsFromEnv } from "@/server/admin/emails";

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
};

export async function getAdminUser(
  userId: string,
): Promise<AdminUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      disabledAt: true,
    },
  });
  if (!user || user.disabledAt) return null;

  const bootstrapped = emailIsAdminBootstrap(user.email);
  if (!user.isAdmin && !bootstrapped) return null;

  if (!user.isAdmin && bootstrapped) {
    await db
      .update(users)
      .set({ isAdmin: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    isAdmin: true,
  };
}

export async function requireAdmin(): Promise<
  | { ok: true; admin: AdminUser }
  | { ok: false; status: 401 | 403; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  const admin = await getAdminUser(session.user.id);
  if (!admin) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, admin };
}

export async function writeAudit(input: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await db.insert(auditLog).values({
    actorId: input.actorId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? null,
  });
}

export async function userIsAdmin(userId: string | null | undefined) {
  if (!userId) return false;
  return Boolean(await getAdminUser(userId));
}
