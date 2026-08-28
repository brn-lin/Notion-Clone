import { createContext, useContext, useState, useEffect } from "react";

import type { ReactNode, Dispatch, SetStateAction } from "react";

import api from "../api/axios";
import type { User } from "../types/auth";

type AuthContextType = {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  authLoading: boolean;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Load current user when app starts
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = sessionStorage.getItem("token");

      // No token means there is no authenticated user
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        // Get current user's account data from the backend
        const res = await api.get<User>("/auth/me");

        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch current user:", err);

        // Remove invalid or expired token
        sessionStorage.removeItem("token");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for cleaner usage
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
