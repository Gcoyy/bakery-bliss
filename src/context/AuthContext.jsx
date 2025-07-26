import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);


  //Sign up
  const signUpNewUser = async (email, password, firstName, lastName, username) => {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error("THERE WAS AN ISSUE SIGNING UP:", signUpError);
    return { success: false, error: signUpError };
  }

  const authUser = signUpData.user;

  // Insert user profile to CUSTOMER table
  const { error: insertError } = await supabase.from("CUSTOMER").insert([
    {
      cus_fname: firstName,
      cus_lname: lastName,
      cus_username: username,
      email: email,
      cus_celno: 0, // You can prompt this later in Profile
      auth_user_id: authUser.id,
    },
  ]);

  if (insertError) {
    console.error("Error inserting into CUSTOMER:", insertError);
    return { success: false, error: insertError };
  }

  return { success: true, data: signUpData };
};

  //Sign in
  const signInUser = async ({email, password}) => {
    try {
        const {data, error} = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })
        if(error){
            console.error("sign in error occurred:", error);
            return {success: false, error: error.message};
        }
        console.log("sign-in success: ", data);
        return {success: true, data};


    } catch(error) {
        console.error("an error occurred: ", error);
    }
  }

//Sign out
  const signOut = () => {
    const { error } = supabase.auth.signOut();
    if (error){
        console.error("there was an error: ", error);
    }
};

  useEffect(() => {
    supabase.auth.getSession().then(({data: {session}}) => {
        setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
    })
  }, []);


  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signOut}}>{children}</AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
