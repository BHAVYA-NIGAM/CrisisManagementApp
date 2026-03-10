import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setAuthToken } from "../api/client";

const TOKEN_KEY = "crisis_token";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bootstrap = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (!stored) return;
      setAuthToken(stored);
      const me = await api.me();
      setToken(stored);
      setUser(me.user);
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setToken("");
      setUser(null);
      setAuthToken("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const persistSession = async (sessionToken, nextUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, sessionToken);
    setAuthToken(sessionToken);
    setToken(sessionToken);
    setUser(nextUser);
  };

  const login = async ({ identifier, password, role }) => {
    setError("");
    const data = await api.login({ identifier, password, role });
    await persistSession(data.token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    setError("");
    const data = await api.register(payload);
    await persistSession(data.token, data.user);
    return data.user;
  };

  const refreshMe = async () => {
    if (!token) return;
    const data = await api.me();
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken("");
    setAuthToken("");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      setError,
      login,
      register,
      refreshMe,
      logout,
      isAdmin: user?.role === "ADMIN"
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
