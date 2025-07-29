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

    const { data: admin, error } = await supabase
      .from("ADMIN")
      .select("admin_uid")
      .eq("admin_uid", userId)
      .single();

    if (admin) {
      console.log("Admin detected. Redirecting to /admin");
      navigate("/adminpage");
    } else {
      console.log("Not admin. Redirecting to /");
      navigate("/");
    }
  };

  checkUserRole();
}, [session, navigate]);


  return null; // or a loading spinner if you want
}

export default RoleBasedRedirect;