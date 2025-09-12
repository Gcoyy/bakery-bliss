import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserAuth } from "./AuthContext";
import { supabase } from "../supabaseClient";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from 'react-hot-toast';

// Global flag to prevent race conditions when creating Google users
let isCreatingGoogleUser = false;

function RoleBasedRedirect() {
  const { session, loading } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Handle OAuth redirect processing
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      if (location.pathname === '/redirect' && session?.user && !isProcessing) {
        setIsProcessing(true);

        try {
          // Wait a moment for the auth state to fully settle
          await new Promise(resolve => setTimeout(resolve, 1000));

          // The fetchUserRole in AuthContext will handle creating the customer record
          // We just need to wait for the role to be determined
        } catch (error) {
          toast.error("Login failed. Please try again.");
          navigate("/login");
        }
      }
    };

    handleOAuthRedirect();
  }, [location.pathname, session, isProcessing, navigate]);

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

        // If user exists in neither table, they might be a new Google user
        // Create a customer record for them
        if (session.user.app_metadata?.provider === 'google' && !creatingUser && !isCreatingGoogleUser) {
          setCreatingUser(true);
          isCreatingGoogleUser = true;

          try {
            // First check if user already exists to prevent duplicate creation
            const { data: existingCustomer, error: checkError } = await supabase
              .from("CUSTOMER")
              .select("cus_id")
              .eq("auth_user_id", session.user.id)
              .maybeSingle();

            if (checkError) {
              setCreatingUser(false);
              isCreatingGoogleUser = false;
              throw checkError;
            }

            if (existingCustomer) {
              setRole("customer");
              setCreatingUser(false);
              isCreatingGoogleUser = false;
              toast.success("Welcome back to Bakery Bliss!");
              return;
            }

            const userMetadata = session.user.user_metadata || {};
            const email = session.user.email || '';
            const fullName = userMetadata.full_name || userMetadata.name || '';
            const firstName = fullName.split(' ')[0] || 'Google';
            const lastName = fullName.split(' ').slice(1).join(' ') || 'User';
            const username = userMetadata.preferred_username || userMetadata.name || email.split('@')[0] || 'googleuser';

            const { error: insertError } = await supabase.from("CUSTOMER").insert([
              {
                cus_fname: firstName,
                cus_lname: lastName,
                cus_username: username,
                email: email,
                cus_celno: 0,
                auth_user_id: session.user.id,
              },
            ]);

            if (insertError) {
              setCreatingUser(false);
              isCreatingGoogleUser = false;
              // If it's a duplicate key error, the user might already exist
              if (insertError.code === '23505') {
                // Try to fetch the role again in case the user was created elsewhere
                const { data: existingCustomer } = await supabase
                  .from("CUSTOMER")
                  .select("cus_id")
                  .eq("auth_user_id", session.user.id)
                  .maybeSingle();

                if (existingCustomer) {
                  setRole("customer");
                  toast.success("Welcome back to Bakery Bliss!");
                  return;
                }
              }
              // If it's not a duplicate key error or user still doesn't exist, show error
              toast.error("Failed to create account. Please try again.");
              navigate("/login");
              return;
            }

            setRole("customer");
            setCreatingUser(false);
            isCreatingGoogleUser = false;
            toast.success("Welcome to Bakery Bliss!");
            return;
          } catch (error) {
            setCreatingUser(false);
            isCreatingGoogleUser = false;
            toast.error("Failed to create account. Please try again.");
            navigate("/login");
            return;
          }
        }

        // Default to customer for other cases
        setRole("customer");
      } catch (error) {
        toast.error("Login failed. Please try again.");
        navigate("/login");
      }
    };

    fetchRole();
  }, [session, navigate]);

  useEffect(() => {
    if (loading) return;

    // If not logged in, redirect to home page (for guests)
    if (!session) {
      navigate("/home", { replace: true });
      return;
    }

    // If logged in but role is still loading, wait
    if (role === null) return;

    // If logged in, redirect based on role
    if (role === "admin") {
      // Admin default: go to admin dashboard (inventory page)
      navigate("/adminpage", { replace: true });
    } else if (role === "customer") {
      // Customer default: go to home page
      navigate("/home", { replace: true });
    }
  }, [session, loading, role, navigate]);

  // Show loading spinner while processing
  if (loading || role === null || (location.pathname === '/redirect' && isProcessing)) {
    return <LoadingSpinner message="Setting up your account..." />;
  }

  return null;
}

export default RoleBasedRedirect;