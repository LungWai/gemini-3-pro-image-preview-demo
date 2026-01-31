import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const AUTH_STORAGE_KEY = 'gemini_studio_auth';
const AUTH_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AuthState {
  isAuthenticated: boolean;
  expiresAt: number | null;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (passphrase: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    expiresAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check stored auth on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthState;
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          setAuthState(parsed);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (passphrase: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });

      if (response.ok) {
        const expiresAt = Date.now() + AUTH_EXPIRY_MS;
        const newState: AuthState = { isAuthenticated: true, expiresAt };
        setAuthState(newState);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({ isAuthenticated: false, expiresAt: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

