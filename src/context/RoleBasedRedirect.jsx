import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "./AuthContext";
import { supabase } from "../supabaseClient";
import LoadingSpinner from "../components/LoadingSpinner";

function RoleBasedRedirect() {
  const { session, loading } = UserAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  // Fetch role from DB once session is ready
  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user) return;

      try {
        // Check if user is admin
        const { data: admin, error: adminError } = await supabase
          .from("ADMIN")
          .select("admin_uid")
          .eq("admin_uid", session.user.id)
          .maybeSingle();

        if (admin && !adminError) {
          setRole("admin");
          return;
        }

        // Check if user is customer
        const { data: customer, error: customerError } = await supabase
          .from("CUSTOMER")
          .select("cus_id")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (customer && !customerError) {
          setRole("customer");
          return;
        }

        // If user exists in neither table, default to customer
        setRole("customer");
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("customer"); // Default to customer on error
      }
    };

    fetchRole();
  }, [session]);

  useEffect(() => {
    if (loading || role === null) return;

    // If not logged in, redirect to login
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    // If logged in, redirect based on role
    if (role === "admin") {
      // Admin default: go to admin dashboard (inventory page)
      navigate("/adminpage", { replace: true });
    } else if (role === "customer") {
      // Customer default: go to home page
      navigate("/home", { replace: true });
    }
  }, [session, loading, role, navigate]);

  if (loading || role === null) return <LoadingSpinner />;

  return null;
}

export default RoleBasedRedirect;