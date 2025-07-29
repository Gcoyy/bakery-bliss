import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'customer'
  const [loading, setLoading] = useState(true);   // To prevent route flicker

  // Sign up
  const signUpNewUser = async (email, password, firstName, lastName, username) => {
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
        cus_celno: 0,
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
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      await fetchUserRole(session?.user?.id);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchUserRole(session?.user?.id);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, signInUser, signUpNewUser, signOut, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
