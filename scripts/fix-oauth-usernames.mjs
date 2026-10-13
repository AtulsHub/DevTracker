import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, email, username, display_name
  FROM users
  WHERE username IS NULL OR username = ''
`;

console.log("users missing username:", rows.length);

for (const u of rows) {
  const base =
    (u.email?.split("@")[0] || u.display_name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24) || "user";
  let candidate = base;
  for (let i = 0; i < 10; i++) {
    const clash = await sql`SELECT id FROM users WHERE username = ${candidate} LIMIT 1`;
    if (clash.length === 0) break;
    candidate = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
  }
  await sql`
    UPDATE users
    SET username = ${candidate},
        display_name = COALESCE(display_name, ${candidate}),
        updated_at = NOW()
    WHERE id = ${u.id}
  `;
  console.log("fixed", u.email, "->", candidate);
}

console.log("done");
