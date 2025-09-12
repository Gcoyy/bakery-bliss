import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export const AuthContext = createContext();

// Global flag to prevent race conditions when creating Google users
let isCreatingGoogleUser = false;

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'customer'
  const [loading, setLoading] = useState(true);   // To prevent route flicker
  const [creatingUser, setCreatingUser] = useState(false); // To prevent race conditions

  // Sign up
  const signUpNewUser = async (email, password, firstName, lastName, username, phoneNumber) => {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return { success: false, error: signUpError };
    }

    const authUser = signUpData.user;

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
        return { success: false, error: error.message };
      }

      const user = data.user;
      const role = user?.user_metadata?.role || null;

      return { success: true, data, role };
    } catch (error) {
      return { success: false, error: "Unexpected error" };
    }
  };


  // Sign out
  const signOut = async () => {
    // If no session exists, just clear the local state
    if (!session) {
      setUserRole(null);
      setSession(null);
      return;
    }

    try {
      // Use scope: 'local' to sign out locally without requiring an active session
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        // Even if Supabase signOut fails, clear local state
        setUserRole(null);
        setSession(null);
      } else {
        setUserRole(null);
        setSession(null);
      }
    } catch (error) {
      // Clear local state even if there's an unexpected error
      setUserRole(null);
      setSession(null);
    }

    // Additional fallback: Clear any remaining session data from localStorage
    try {
      localStorage.removeItem('sb-' + supabase.supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
    } catch (localStorageError) {
      // Silently handle localStorage errors
    }
  };

  // Sign in OR sign up with Google (merged)
  const signInOrUpWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/redirect`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
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
        return { success: false, error: error.message };
      }

      return { success: true, message: "Password reset email sent successfully!" };
    } catch (error) {
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

    // If user exists in neither table, they might be a new Google user
    // Let's check if they have a valid session and create a customer record
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === userId && !creatingUser) {
      setCreatingUser(true);
      try {
        await createCustomerForGoogleUser(session.user);
        setUserRole("customer");
        setCreatingUser(false);
        return;
      } catch (error) {
        setCreatingUser(false);
        // If it's a duplicate key error, the user might already exist
        if (error.code === '23505') {
          // Try to fetch the role again in case the user was created elsewhere
          const { data: existingCustomer } = await supabase
            .from("CUSTOMER")
            .select("cus_id")
            .eq("auth_user_id", userId)
            .maybeSingle();

          if (existingCustomer) {
            setUserRole("customer");
            return;
          }
        }
        // If we can't create or find the user, set role to null
        setUserRole(null);
        return;
      }
    }

    // Unknown role
    setUserRole(null);
  };

  // Create customer record for new Google users
  const createCustomerForGoogleUser = async (user, retryCount = 0) => {
    // Check global flag to prevent race conditions
    if (isCreatingGoogleUser) {
      // Wait a bit and check if user was created by another process
      await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)));
      const { data: existingCustomer } = await supabase
        .from("CUSTOMER")
        .select("cus_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (existingCustomer) {
        return; // User was created by another process
      }
    }

    isCreatingGoogleUser = true;

    try {
      // First check if user already exists to prevent duplicate creation
      const { data: existingCustomer, error: checkError } = await supabase
        .from("CUSTOMER")
        .select("cus_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingCustomer) {
        return; // User already exists, no need to create
      }

      const userMetadata = user.user_metadata || {};
      const email = user.email || '';
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
          cus_celno: 0, // Google users don't provide phone by default
          auth_user_id: user.id,
        },
      ]);

      if (insertError) {
        // If it's a duplicate key error, the user might have been created by another process
        if (insertError.code === '23505') {
          // Check again if the user now exists
          const { data: existingAfterError } = await supabase
            .from("CUSTOMER")
            .select("cus_id")
            .eq("auth_user_id", user.id)
            .maybeSingle();

          if (existingAfterError) {
            return; // User was created by another process, that's fine
          }

          // If user still doesn't exist and we haven't retried too many times, try again
          if (retryCount < 3) {
            isCreatingGoogleUser = false;
            await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)));
            return createCustomerForGoogleUser(user, retryCount + 1);
          }
        }
        throw insertError;
      }
    } catch (error) {
      throw error;
    } finally {
      isCreatingGoogleUser = false;
    }
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
        setLoading(false); // only once, at the very end
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
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
  const context = useContext(AuthContext);

  if (context === undefined) {
    // Return default values instead of throwing an error
    return {
      session: null,
      userRole: null,
      loading: true,
      signInUser: () => Promise.resolve({ success: false, error: 'Context not available' }),
      signUpNewUser: () => Promise.resolve({ success: false, error: 'Context not available' }),
      signInOrUpWithGoogle: () => Promise.resolve({ success: false, error: 'Context not available' }),
      signOut: () => Promise.resolve(),
      resetPassword: () => Promise.resolve({ success: false, error: 'Context not available' })
    };
  }

  return context;
};
