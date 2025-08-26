import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
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

    return { success: true, data: signUpData };
  };

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

      return { success: true, data };
    } catch (error) {
      console.error("Unexpected sign-in error:", error);
      return { success: false, error: "Unexpected error" };
    }
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign-out error:", error);
    } else {
      setUserRole(null);
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
    setLoading(true);
    if (!userId) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    // Check CUSTOMER table
    const { data: customer } = await supabase
      .from("CUSTOMER")
      .select("cus_id")
      .eq("auth_user_id", userId)
      .single();

    if (customer) {
      setUserRole("customer");
      setLoading(false);
      return;
    }

    // Check ADMIN table
    const { data: admin } = await supabase
      .from("ADMIN")
      .select("admin_id")
      .eq("admin_uid", userId)
      .single();

    if (admin) {
      setUserRole("admin");
      setLoading(false);
      return;
    }

    // Unknown role
    setUserRole(null);
    setLoading(false);
  };

  // On auth state change
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      await fetchUserRole(session?.user?.id);
      setLoading(false);
    };
  
    init();
  
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        setSession(session);
  
        const user = session?.user;
        if (user) {
          // Check if user exists in CUSTOMER
          const { data: existing } = await supabase
            .from("CUSTOMER")
            .select("cus_id")
            .eq("auth_user_id", user.id)
            .maybeSingle();
  
          if (!existing) {
            // Insert new Google user
            await supabase.from("CUSTOMER").insert([
              {
                cus_fname: user.user_metadata.given_name || "",
                cus_lname: user.user_metadata.family_name || "",
                cus_username: user.user_metadata.full_name || user.email,
                cus_celno: 0,
                email: user.email,
                auth_user_id: user.id,
              },
            ]);
          }
  
          await fetchUserRole(user.id);
        } else {
          setUserRole(null);
        }
        setLoading(false);
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
