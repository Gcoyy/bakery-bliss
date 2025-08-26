import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "./AuthContext";
import { supabase } from "../supabaseClient";

function RoleBasedRedirect() {
  const { session, loading } = UserAuth(); // 👈 include loading
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      console.log("Still loading session... waiting.");
      return; // 👈 don’t run redirect logic yet
    }

    const checkUserRole = async () => {
      console.log("Checking user role...");

      if (!session?.user) {
        console.log("No user found. Redirecting to login.");
        navigate("/login");
        return;
      }

      const userId = session.user.id;
      console.log("User ID:", userId);
      console.log("User email:", session.user.email);

      // --- CUSTOMER CHECK ---
      const { data: customer, error: customerError } = await supabase
        .from("CUSTOMER")
        .select("cus_id, cus_fname, cus_lname, cus_username, email")
        .eq("auth_user_id", userId)
        .single();

      if (customer) {
        console.log("Customer found:", customer);
        navigate("/");
        setTimeout(() => window.scrollTo(0, 0), 100);
        return;
      }

      // --- ADMIN CHECK ---
      const { data: admin } = await supabase
        .from("ADMIN")
        .select("admin_id, admin_uid")
        .eq("admin_uid", userId)
        .single();

      if (admin) {
        console.log("Admin found:", admin);
        navigate("/adminpage");
        setTimeout(() => window.scrollTo(0, 0), 100);
        return;
      }

      // --- GOOGLE NEW USER HANDLING ---
      console.log("No existing profile, creating customer...");
      const fullName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        "Unknown User";

      const firstName = fullName.split(" ")[0] || "Unknown";
      const lastName = fullName.split(" ").slice(1).join(" ") || "User";
      const username =
        session.user.user_metadata?.preferred_username ||
        session.user.email.split("@")[0] ||
        `user_${Date.now()}`;

      const { data: newCustomer, error: createError } = await supabase
        .from("CUSTOMER")
        .insert([
          {
            cus_fname: firstName,
            cus_lname: lastName,
            cus_username: username,
            email: session.user.email,
            cus_celno: 0,
            auth_user_id: userId,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error("Error creating customer profile:", createError);
      } else {
        console.log("New customer created:", newCustomer);
      }

      navigate("/");
      setTimeout(() => window.scrollTo(0, 0), 100);
    };

    checkUserRole();
  }, [session, loading, navigate]);

  return null; // Or a spinner if you want
}

export default RoleBasedRedirect;
