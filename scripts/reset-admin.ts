import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const newPassword = process.argv[2];
  if (!newPassword || newPassword.length < 6) {
    console.error("Usage: npx tsx scripts/reset-admin.ts <new-password>");
    console.error("Password must be at least 6 characters");
    process.exit(1);
  }

  const { data } = await supabase.auth.admin.listUsers();
  const user = data?.users.find((u) => u.email === "tuindi.gc@gmail.com");
  if (!user) {
    console.log("User not found");
    return;
  }

  console.log("User ID:", user.id);

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true,
  });

  if (error) console.error("Error:", error.message);
  else console.log("Password updated successfully");
}

main().catch((e) => console.error(e));
