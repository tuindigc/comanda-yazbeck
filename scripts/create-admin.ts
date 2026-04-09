import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const email = process.argv[2] || "tuindi.gc@gmail.com";
  console.log(`Looking up user ${email} in Supabase Auth...`);

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error.message);
    process.exit(1);
  }

  const user = data.users.find((u) => u.email === email);
  if (!user) {
    console.error("User not found in Auth");
    process.exit(1);
  }

  console.log("Found user:", user.id);

  const existing = await sql`SELECT id FROM "UserProfile" WHERE id = ${user.id}`;
  if (existing.length > 0) {
    console.log("Profile already exists, updating to ADMIN...");
    await sql`UPDATE "UserProfile" SET role = 'ADMIN' WHERE id = ${user.id}`;
  } else {
    console.log("Creating admin profile...");
    await sql`
      INSERT INTO "UserProfile" (id, email, name, role, "isActive", "activatedAt", "createdAt", "updatedAt")
      VALUES (${user.id}, ${email}, 'Admin', 'ADMIN', true, NOW(), NOW(), NOW())
    `;
  }

  console.log("Done! Admin ready.");
  await sql.end();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
