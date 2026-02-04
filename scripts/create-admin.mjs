import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "admin@ielts.com",
    password: "Admin123!",
    email_confirm: true,
    user_metadata: { full_name: "System Admin" }
  });

  if (error) {
    console.error("Error creating admin:", error.message);
    return;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", data.user.id);

  if (profileError) {
    console.error("Error updating profile:", profileError.message);
  } else {
    console.log("Admin user created successfully!");
  }
}

createAdmin();
