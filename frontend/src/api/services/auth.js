/**
 * Authentication service.
 *
 * This module provides functions for authentication operations including
 * login, registration, OAuth, password reset, and email verification.
 */

import apiClient from '../client';

/**
 * Register new user with email and password.
 *
 * @param {Object} data - Registration data
 * @param {string} data.email - User email
 * @param {string} data.name - User full name
 * @param {string} data.password - User password
 * @returns {Promise} API response
 */
export const register = async (data) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

/**
 * Login with email and password.
 *
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @param {boolean} credentials.remember_me - Remember me option
 * @returns {Promise} API response with user data
 */
export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

/**
 * Logout current user.
 *
 * @returns {Promise} API response
 */
export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

/**
 * Refresh access token.
 *
 * @returns {Promise} API response
 */
export const refreshToken = async () => {
  const response = await apiClient.post('/auth/refresh');
  return response.data;
};

/**
 * Get current authenticated user.
 *
 * @returns {Promise} API response with user data
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data.data.user;
};

/**
 * Verify email address with token.
 *
 * @param {string} token - Email verification token
 * @returns {Promise} API response
 */
export const verifyEmail = async (token) => {
  const response = await apiClient.post(`/auth/verify-email/${token}`);
  return response.data;
};

/**
 * Resend email verification link.
 *
 * @param {string} email - User email address
 * @returns {Promise} API response
 */
export const resendVerification = async (email) => {
  const response = await apiClient.post('/auth/resend-verification', { email });
  return response.data;
};

/**
 * Request password reset link.
 *
 * @param {string} email - User email address
 * @returns {Promise} API response
 */
export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset password with token.
 *
 * @param {string} token - Password reset token
 * @param {string} password - New password
 * @returns {Promise} API response
 */
export const resetPassword = async (token, password) => {
  const response = await apiClient.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};

/**
 * Get OAuth authorization URL.
 *
 * @param {string} provider - OAuth provider ('google' or 'microsoft')
 * @returns {string} OAuth authorization URL
 */
export const getOAuthUrl = (provider) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  return `${baseUrl}/auth/oauth/authorize/${provider}`;
};
