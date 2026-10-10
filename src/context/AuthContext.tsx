import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  User,
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../config/firebase";

import {
  ensurePublicProfile,
} from "../services/profileService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext =
  createContext<AuthContextType>({
    user: null,
    loading: true,
  });

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          setUser(firebaseUser);

          if (firebaseUser) {
            try {
              await ensurePublicProfile(
                firebaseUser
              );
            } catch (error) {
              console.error(
                "Ensure public profile error:",
                error
              );
            }
          }

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}