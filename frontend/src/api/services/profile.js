/**
 * Profile service.
 *
 * This module provides functions for user profile operations including
 * viewing, updating, and email change functionality.
 */

import apiClient from '../client';

/**
 * Get current user's profile.
 *
 * @returns {Promise} API response with profile, OAuth providers, and camp memberships
 */
export const getProfile = async () => {
  const response = await apiClient.get('/users/me/profile');
  return response.data.data;
};

/**
 * Update current user's profile.
 *
 * @param {Object} data - Profile data
 * @param {string} data.first_name - First name
 * @param {string} data.last_name - Last name
 * @param {string} data.preferred_name - Preferred name
 * @param {boolean} data.show_full_name - Show full name preference
 * @param {string} data.pronouns - Pronouns
 * @param {boolean} data.show_pronouns - Show pronouns preference
 * @param {string} data.home_phone - Home phone
 * @param {string} data.mobile_phone - Mobile phone
 * @param {string} data.work_phone - Work phone
 * @param {string} data.address_line1 - Address line 1
 * @param {string} data.address_line2 - Address line 2
 * @param {string} data.city - City
 * @param {string} data.state - State
 * @param {string} data.zip_code - Zip code
 * @param {string} data.country - Country
 * @returns {Promise} API response
 */
export const updateProfile = async (data) => {
  const response = await apiClient.put('/users/me/profile', data);
  return response.data;
};

/**
 * Request email address change.
 *
 * @param {string} newEmail - New email address
 * @returns {Promise} API response
 */
export const requestEmailChange = async (newEmail) => {
  const response = await apiClient.post('/users/me/change-email', {
    new_email: newEmail
  });
  return response.data;
};

/**
 * Verify email change with token.
 *
 * @param {string} token - Verification token
 * @returns {Promise} API response
 */
export const verifyEmailChange = async (token) => {
  const response = await apiClient.post(`/users/me/verify-email-change/${token}`);
  return response.data;
};

/**
 * Get all users (GLOBAL_ADMIN only).
 *
 * @returns {Promise} API response with users list
 */
export const getAllUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data.data;
};

/**
 * Change user role (GLOBAL_ADMIN only).
 *
 * @param {number} userId - User ID
 * @param {string} role - New role
 * @returns {Promise} API response
 */
export const changeUserRole = async (userId, role) => {
  const response = await apiClient.put(`/users/${userId}/role`, { role });
  return response.data;
};
