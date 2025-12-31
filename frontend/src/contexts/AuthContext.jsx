/**
 * Authentication Context.
 *
 * This context provides authentication state and functions throughout the app.
 * It checks authentication status on mount and provides login/logout functions.
 * Also manages theme preference for dark mode.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as logoutAPI } from '../api/services/auth';
import apiClient from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize theme from localStorage to prevent flash
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme_preference');
    return savedTheme || 'light';
  });

  // Apply theme immediately on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme_preference') || 'light';
    applyTheme(savedTheme);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const applyTheme = (newTheme) => {
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme_preference', newTheme);
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getCurrentUser();
      setUser(userData);

      // Sync theme from user's saved preference (backend is source of truth for authenticated users)
      if (userData.theme_preference) {
        const userTheme = userData.theme_preference;
        setTheme(userTheme);
        applyTheme(userTheme);
      }
      // If no preference saved, keep current theme from localStorage
    } catch (err) {
      // Not authenticated or token expired
      setUser(null);
      setError(null); // Don't show error for unauthenticated state
      // Keep theme from localStorage - don't reset
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    // Set theme from user preference on login (backend is source of truth)
    if (userData.theme_preference) {
      const userTheme = userData.theme_preference;
      setTheme(userTheme);
      applyTheme(userTheme);
    }
  };

  const logout = async () => {
    try {
      await logoutAPI();
      setUser(null);
      // Keep theme preference in localStorage - don't reset
    } catch (err) {
      console.error('Logout error:', err);
      // Clear user even if API call fails
      setUser(null);
      // Keep theme preference in localStorage - don't reset
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Apply immediately for instant feedback
    setTheme(newTheme);
    applyTheme(newTheme);

    // Save to backend
    try {
      await apiClient.put('/users/me/profile', {
        theme_preference: newTheme
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Revert on error
      setTheme(theme);
      applyTheme(theme);
    }
  };

  const value = {
    user,
    loading,
    error,
    theme,
    login,
    logout,
    toggleTheme,
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
