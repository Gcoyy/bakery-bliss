import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "./AuthContext";
import { supabase } from "../supabaseClient";

function RoleBasedRedirect() {
  const { session } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Checking user role..."); // 👈 Add this
    const checkUserRole = async () => {
      if (!session?.user) {
        console.log("No user found. Redirecting to login.");
        navigate("/login");
        return;
      }

      const userId = session.user.id;
      console.log("User ID:", userId);
      console.log("User email:", session.user.email);

      // Check if this is a new Google user (no profile exists yet)
      let isNewUser = false;

      // Check CUSTOMER table first
      const { data: customer, error: customerError } = await supabase
        .from("CUSTOMER")
        .select("cus_id, cus_fname, cus_lname, cus_username, email")
        .eq("auth_user_id", userId)
        .single();

      if (customerError && customerError.code === 'PGRST116') {
        // No customer found, check if it's a new Google user
        console.log("No customer profile found, checking if new Google user");
        isNewUser = true;
      } else if (customer) {
        console.log("Customer found:", customer);
        navigate("/");
        // Scroll to top after navigation
        setTimeout(() => window.scrollTo(0, 0), 100);
        return;
      }

      // Check ADMIN table
      const { data: admin, error: adminError } = await supabase
        .from("ADMIN")
        .select("admin_id, admin_uid")
        .eq("admin_uid", userId)
        .single();

      if (adminError && adminError.code === 'PGRST116') {
        // No admin found
        console.log("No admin profile found");
      } else if (admin) {
        console.log("Admin found:", admin);
        navigate("/adminpage");
        // Scroll to top after navigation
        setTimeout(() => window.scrollTo(0, 0), 100);
        return;
      }

      // If no profile exists and this is a new Google user, create a customer profile
      if (isNewUser && session.user.email) {
        console.log("Creating new customer profile for Google user");
        try {
          // Extract name from Google profile
          const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Unknown User';
          const firstName = fullName.split(' ')[0] || 'Unknown';
          const lastName = fullName.split(' ').slice(1).join(' ') || 'User';
          const username = session.user.user_metadata?.preferred_username ||
            session.user.email.split('@')[0] ||
            `user_${Date.now()}`;

          const { data: newCustomer, error: createError } = await supabase
            .from("CUSTOMER")
            .insert([
              {
                cus_fname: firstName,
                cus_lname: lastName,
                cus_username: username,
                email: session.user.email,
                cus_celno: 0, // Default phone number
                auth_user_id: userId,
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error("Error creating customer profile:", createError);
            // Redirect to home anyway, profile can be updated later
            navigate("/");
            setTimeout(() => window.scrollTo(0, 0), 100);
            return;
          }

          console.log("New customer profile created:", newCustomer);
          navigate("/");
          // Scroll to top after navigation
          setTimeout(() => window.scrollTo(0, 0), 100);
          return;
        } catch (profileError) {
          console.error("Error in profile creation:", profileError);
          // Redirect to home anyway
          navigate("/");
          setTimeout(() => window.scrollTo(0, 0), 100);
          return;
        }
      }

      // If we get here, redirect to home (default customer experience)
      console.log("Not admin. Redirecting to /");
      navigate("/");
      // Scroll to top after navigation
      setTimeout(() => window.scrollTo(0, 0), 100);
    };

    checkUserRole();
  }, [session, navigate]);

  return null; // or a loading spinner if you want
}

export default RoleBasedRedirect;