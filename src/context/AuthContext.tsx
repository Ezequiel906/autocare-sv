import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

const ACCESS_TOKEN_KEY = "autocare_access_token";
const USER_KEY = "autocare_user";

type AuthUser = Record<string, unknown>;

type AuthSession = {
  user: AuthUser | null;
  accessToken: string | null;
};

type AuthContextValue = AuthSession & {
  isAuthenticated: boolean;
  login: (user: AuthUser, accessToken: string, rememberMe: boolean) => void;
  logout: () => void;
};

const emptySession: AuthSession = {
  user: null,
  accessToken: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function clearStoredSession(storage: Storage) {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(USER_KEY);
}

function getSessionFromStorage(storage: Storage): AuthSession | null {
  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  const storedUser = storage.getItem(USER_KEY);

  if (!accessToken?.trim() || !storedUser) {
    if (accessToken !== null || storedUser !== null) {
      clearStoredSession(storage);
    }

    return null;
  }

  try {
    const user: unknown = JSON.parse(storedUser);
    const isValidUser =
      typeof user === "object" && user !== null && !Array.isArray(user);

    if (!isValidUser) {
      clearStoredSession(storage);
      return null;
    }

    return {
      user: user as AuthUser,
      accessToken,
    };
  } catch {
    clearStoredSession(storage);
    return null;
  }
}

function getStoredSession(): AuthSession {
  return (
    getSessionFromStorage(localStorage) ??
    getSessionFromStorage(sessionStorage) ??
    emptySession
  );
}

function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>(getStoredSession);

  const login = useCallback(
    (user: AuthUser, accessToken: string, rememberMe: boolean) => {
      const storage = rememberMe ? localStorage : sessionStorage;
      const previousStorage = rememberMe ? sessionStorage : localStorage;

      clearStoredSession(previousStorage);
      storage.setItem(ACCESS_TOKEN_KEY, accessToken);
      storage.setItem(USER_KEY, JSON.stringify(user));
      setSession({ user, accessToken });
    },
    [],
  );

  const logout = useCallback(() => {
    clearStoredSession(localStorage);
    clearStoredSession(sessionStorage);
    setSession(emptySession);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...session,
      isAuthenticated: session.user !== null && session.accessToken !== null,
      login,
      logout,
    }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}

// This module intentionally colocates the provider and its consumer hook.
// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth };
