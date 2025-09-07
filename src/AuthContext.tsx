import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { supabase } from "./db";

export type User = {
  id: string; // Add id property
  username: string;
  email?: string;
  role?: string; // 관리자 권한 필드 추가
};

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
  isAdmin: () => boolean; // 관리자 권한 확인 함수
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem("authUser");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true); // 초기 로딩 상태를 true로 설정

  useEffect(() => {
    // 페이지 로드 시 세션 복원
    console.log("AuthProvider mounted, starting session restore");
    const getSession = async () => {
      try {
        const res = await supabase.auth.getSession();
        const session = res?.data?.session ?? null;
        console.log("Session restored:", !!session);

        if (session && session.user && session.user.id) {
          // 프로필 정보 가져오기
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username, realname, role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.warn(
              "Failed to load profile during session restore:",
              profileError
            );
          }

          if (profileData) {
            setUser({
              id: session.user.id, // Pass id to user object
              username: profileData.username,
              email: (session.user as any).email || "",
              role: profileData.role || undefined,
            });
          }
        } else {
          // no session -> ensure user is null
          setUser(null);
        }
      } catch (error) {
        console.error("Session restore error:", error);
      } finally {
        setLoading(false);
      }
    };

    let didFinish = false;
    getSession()
      .then(() => {
        didFinish = true;
      })
      .catch(() => {
        didFinish = true;
      });

    // fallback: if session restore hangs, clear loading after 3s so UI can proceed
    const fallback = setTimeout(() => {
      if (!didFinish) {
        console.warn(
          "Session restore fallback triggered: clearing loading after timeout"
        );
        setLoading(false);
      }
    }, 3000);

    // 인증 상태 변화 감지
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        try {
          console.log("Auth state change:", event, !!session);
          if (event === "SIGNED_OUT" || !session) {
            setUser(null);
          } else if (event === "SIGNED_IN" && session.user && session.user.id) {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("username, realname")
              .eq("id", session.user.id)
              .single();

            if (profileError) {
              console.warn(
                "Failed to load profile on auth state change:",
                profileError
              );
            }

            if (profileData) {
              setUser({
                id: session.user.id,
                username: profileData.username,
                email: (session.user as any).email || "",
              });
            }
          }
        } catch (err) {
          console.error("Error in auth state change handler:", err);
        } finally {
          setLoading(false);
        }
      })();
    });

    // authListener may return { data, error } or { subscription } depending on supabase version
    const subscription =
      (authListener as any)?.data?.subscription ??
      (authListener as any)?.subscription ??
      null;

    return () => {
      clearTimeout(fallback);
      try {
        if (subscription && typeof subscription.unsubscribe === "function")
          subscription.unsubscribe();
        else if (typeof (authListener as any)?.unsubscribe === "function")
          (authListener as any).unsubscribe();
      } catch (e) {
        // ignore unsubscribe errors
      }
    };
  }, []);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.email === 'admin@amico.dev';
  };

  localStorage.setItem("authUser", JSON.stringify(user));

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
