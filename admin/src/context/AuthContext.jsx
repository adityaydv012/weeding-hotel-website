
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCurrentAdmin,
  loginAdmin,
} from '../api/client.js';

// ============================================================
// AUTH CONTEXT
// ============================================================

export const AuthContext = createContext(null);

// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('adminUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Read the current authentication token.
  const token = localStorage.getItem('adminToken');

  // ==========================================================
  // RESTORE EXISTING SESSION
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      if (!token) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getCurrentAdmin();

        if (!mounted) return;

        const currentUser = response.user;

        setUser(currentUser);

        localStorage.setItem(
          'adminUser',
          JSON.stringify(currentUser)
        );
      } catch {
        if (!mounted) return;

        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');

        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    restoreSession();

    return () => {
      mounted = false;
    };
  }, [token]);

  // ==========================================================
  // LOGIN
  // ==========================================================

  async function login(email, password) {
    const response = await loginAdmin({
      email,
      password,
    });

    const {
      token: authToken,
      user: loggedInUser,
    } = response;

    localStorage.setItem('adminToken', authToken);

    localStorage.setItem(
      'adminUser',
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    return loggedInUser;
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    setUser(null);
  }

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(
        user && localStorage.getItem('adminToken')
      ),
      login,
      logout,
    }),
    [user, loading, token]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// USE AUTH HOOK — REQUIRED BY ProtectedRoute.jsx
// ============================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider'
    );
  }

  return context;
}
