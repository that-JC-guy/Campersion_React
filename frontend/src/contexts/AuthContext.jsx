/**
 * Authentication Context.
 *
 * This context provides authentication state and functions throughout the app.
 * It checks authentication status on mount and provides login/logout functions.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as logoutAPI } from '../api/services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      // Not authenticated or token expired
      setUser(null);
      setError(null); // Don't show error for unauthenticated state
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutAPI();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Clear user even if API call fails
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
