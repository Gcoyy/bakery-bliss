import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserAuth } from "./AuthContext";
import { supabase } from "../supabaseClient";
import LoadingSpinner from "../components/LoadingSpinner";

function RoleBasedRedirect() {
  const { session, loading } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);

  // Fetch role from DB once session is ready
  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user) return;

      const { data: customer } = await supabase
        .from("CUSTOMER")
        .select("role")
        .eq("auth_user_id", session.user.id)
        .single();

      if (customer?.role) setRole("customer");

      const { data: admin } = await supabase
        .from("ADMIN")
        .select("username") // or admin role field
        .eq("admin_uid", session.user.id)
        .single();

      if (admin) setRole("admin");
    };

    fetchRole();
  }, [session]);

  useEffect(() => {
    if (loading || role === null) return;

    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    const lastPath = localStorage.getItem("lastPath");

    if (role === "admin") {
      const safePath =
        lastPath?.startsWith("/admin") ? lastPath : "/adminpage";
      if (location.pathname !== safePath) {
        navigate(safePath, { replace: true });
      }
    } else if (role === "customer") {
      const safePath =
        lastPath?.startsWith("/admin") ? "/" : lastPath || "/";
      if (location.pathname !== safePath) {
        navigate(safePath, { replace: true });
      }
    }
  }, [session, loading, role, location.pathname]);

  if (loading || role === null) return <LoadingSpinner />;

  return null;
}
export default RoleBasedRedirect;



/*
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserAuth } from "./AuthContext";
import { supabase } from "../supabaseClient";
import LoadingSpinner from "../components/LoadingSpinner";

function RoleBasedRedirect() {
  const { session, loading } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);

  // Fetch role from DB once session is ready
  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user) return;

      const { data: customer } = await supabase
        .from("CUSTOMER")
        .select("role")
        .eq("auth_user_id", session.user.id)
        .single();

      if (customer?.role) setRole("customer");

      const { data: admin } = await supabase
        .from("ADMIN")
        .select("username") // or admin role field
        .eq("admin_uid", session.user.id)
        .single();

      if (admin) setRole("admin");
    };

    fetchRole();
  }, [session]);

  useEffect(() => {
    if (loading || role === null) return;

    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    const lastPath = localStorage.getItem("lastPath");

    if (role === "admin") {
      const safePath =
        lastPath?.startsWith("/admin") ? lastPath : "/adminpage";
      if (location.pathname !== safePath) {
        navigate(safePath, { replace: true });
      }
    } else if (role === "customer") {
      const safePath =
        lastPath?.startsWith("/admin") ? "/" : lastPath || "/";
      if (location.pathname !== safePath) {
        navigate(safePath, { replace: true });
      }
    }
  }, [session, loading, role, location.pathname]);

  if (loading || role === null) return <LoadingSpinner />;

  return null;
}
*/