import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'customer'
  const [loading, setLoading] = useState(true);   // To prevent route flicker

  // Sign up
  const signUpNewUser = async (email, password, firstName, lastName, username, phoneNumber) => {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error("Sign-up error:", signUpError);
      return { success: false, error: signUpError };
    }

    const authUser = signUpData.user;
    console.log("Supabase signUp result:", signUpData);

    // If no auth user (e.g., email confirmation required)
    if (!authUser) {
      setLoading(false);
      return { success: true, message: "Verification email sent. Please check your inbox." };
    }

    // Update session
    if (signUpData.session) {
      setSession(signUpData.session);
    }

    // Insert into CUSTOMER table
    const { error: insertError } = await supabase.from("CUSTOMER").insert([
      {
        cus_fname: firstName,
        cus_lname: lastName,
        cus_username: username,
        email,
        cus_celno: phoneNumber ? parseInt(phoneNumber.replace(/\D/g, '')) : 0,
        auth_user_id: authUser.id,
      },
    ]);

    if (insertError) {
      console.error("Error inserting into CUSTOMER:", insertError);
      return { success: false, error: insertError };
    }

    setUserRole("customer");
    setLoading(false);
    return { success: true, data: signUpData, userRole: "customer" };
  };

  // Sign in
  // Sign in
  const signInUser = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign-in error:", error);
        return { success: false, error: error.message };
      }

      const user = data.user;
      const role = user?.user_metadata?.role || null;

      return { success: true, data, role };
    } catch (error) {
      console.error("Unexpected sign-in error:", error);
      return { success: false, error: "Unexpected error" };
    }
  };


  // Sign out
  const signOut = async () => {
    console.log("=== Sign Out Called ===");
    console.log("Current session before sign out:", session);

    // If no session exists, just clear the local state
    if (!session) {
      console.log("No session found, clearing local state only");
      setUserRole(null);
      setSession(null);
      return;
    }

    try {
      // Use scope: 'local' to sign out locally without requiring an active session
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error("Sign-out error:", error);
        // Even if Supabase signOut fails, clear local state
        setUserRole(null);
        setSession(null);
      } else {
        console.log("Sign out successful, clearing user role");
        setUserRole(null);
        setSession(null);
      }
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      // Clear local state even if there's an unexpected error
      setUserRole(null);
      setSession(null);
    }

    // Additional fallback: Clear any remaining session data from localStorage
    try {
      localStorage.removeItem('sb-' + supabase.supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
      console.log("Cleared auth token from localStorage");
    } catch (localStorageError) {
      console.log("Could not clear localStorage:", localStorageError);
    }
  };

  // Sign in OR sign up with Google (merged)
  const signInOrUpWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/redirect`,
        },
      });

      if (error) {
        console.error("Google auth error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Unexpected Google auth error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };


  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Password reset error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, message: "Password reset email sent successfully!" };
    } catch (error) {
      console.error("Unexpected password reset error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  // Determine role
  const fetchUserRole = async (userId) => {
    if (!userId) {
      setUserRole(null);
      return;
    }

    // Check CUSTOMER table
    const { data: customer, error: customerError } = await supabase
      .from("CUSTOMER")
      .select("cus_id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (customer && !customerError) {
      setUserRole("customer");
      return;
    }

    // Check ADMIN table
    const { data: admin, error: adminError } = await supabase
      .from("ADMIN")
      .select("admin_id")
      .eq("admin_uid", userId)
      .maybeSingle();

    if (admin && !adminError) {
      setUserRole("admin");
      return;
    }

    // Unknown role
    setUserRole(null);
  };

  // On auth state change
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);

        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setLoading(false); // only once, at the very end
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("=== Auth State Change ===");
        console.log("Event:", event);
        console.log("Session:", session);

        setSession(session);
        if (session?.user) {
          console.log("User found, fetching role...");
          fetchUserRole(session.user.id);
        } else {
          console.log("No user, clearing role");
          setUserRole(null);
        }
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);


  return (
    <AuthContext.Provider value={{
      session,
      signInUser,
      signUpNewUser,
      signInOrUpWithGoogle,
      signOut,
      resetPassword,
      userRole,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
