import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if dummy user session is active
    const savedDummy = localStorage.getItem("dummy_admin_user");
    if (savedDummy) {
      setUser(JSON.parse(savedDummy));
      setLoading(false);
      return;
    }

    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth events (sign in, sign out, token refreshes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    // Local dummy admin login credentials
    if (email === "admin@paradise.com" && password === "admin123") {
      const dummyUser = {
        id: "dummy-admin-id",
        email: "admin@paradise.com",
        role: "authenticated",
        user_metadata: { role: "admin" }
      };
      setUser(dummyUser);
      localStorage.setItem("dummy_admin_user", JSON.stringify(dummyUser));
      return { data: { user: dummyUser }, error: null };
    }
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    localStorage.removeItem("dummy_admin_user");
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
