/**
 * Admin API service.
 *
 * Provides functions for administrative operations:
 * - Dashboard statistics
 * - User management (list, create, suspend, reactivate)
 * - Event status management
 * - Camp-event association management
 */

import apiClient from '../client';

/**
 * Get admin dashboard statistics.
 * @returns {Promise} - Statistics data
 */
export const getAdminStats = async () => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

/**
 * Get all users with optional filtering.
 * @param {Object} params - Query parameters (status, role, search)
 * @returns {Promise} - List of users
 */
export const getAllUsers = async (params = {}) => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

/**
 * Create a new user (Global Admin only).
 * @param {Object} data - User data (email, name, password, role)
 * @returns {Promise} - Created user
 */
export const createUser = async (data) => {
  const response = await apiClient.post('/admin/users', data);
  return response.data;
};

/**
 * Suspend a user account.
 * @param {number} userId - User ID to suspend
 * @returns {Promise} - Updated user
 */
export const suspendUser = async (userId) => {
  const response = await apiClient.put(`/admin/users/${userId}/suspend`);
  return response.data;
};

/**
 * Reactivate a suspended user account.
 * @param {number} userId - User ID to reactivate
 * @returns {Promise} - Updated user
 */
export const reactivateUser = async (userId) => {
  const response = await apiClient.put(`/admin/users/${userId}/reactivate`);
  return response.data;
};

/**
 * Permanently delete a user account (Global Admin only).
 * @param {number} userId - User ID to delete
 * @returns {Promise} - Success message
 */
export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Change event status (admin override).
 * @param {number} eventId - Event ID
 * @param {Object} data - Status data (status, reason)
 * @returns {Promise} - Updated event
 */
export const changeEventStatus = async (eventId, data) => {
  const response = await apiClient.put(`/admin/events/${eventId}/status`, data);
  return response.data;
};

/**
 * Get all camp-event associations with optional filtering.
 * @param {Object} params - Query parameters (status, event_id, camp_id)
 * @returns {Promise} - List of associations
 */
export const getAllAssociations = async (params = {}) => {
  const response = await apiClient.get('/admin/associations', { params });
  return response.data;
};

/**
 * Revoke an approved camp-event association.
 * @param {number} associationId - Association ID
 * @param {Object} data - Revocation data (reason)
 * @returns {Promise} - Updated association
 */
export const revokeAssociation = async (associationId, data = {}) => {
  const response = await apiClient.put(`/admin/associations/${associationId}/revoke`, data);
  return response.data;
};

/**
 * Cancel rejection of a camp-event association (revert to pending).
 * @param {number} associationId - Association ID
 * @returns {Promise} - Updated association
 */
export const cancelAssociationRejection = async (associationId) => {
  const response = await apiClient.put(`/admin/associations/${associationId}/cancel-rejection`);
  return response.data;
};
