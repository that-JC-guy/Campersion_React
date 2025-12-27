/**
 * Camps service.
 *
 * This module provides functions for camp operations including
 * CRUD, membership management, and event associations.
 */

import apiClient from '../client';

/**
 * Get all camps.
 *
 * @returns {Promise} API response with camps list
 */
export const getCamps = async () => {
  const response = await apiClient.get('/camps');
  return response.data.data;
};

/**
 * Get single camp details.
 *
 * @param {number} campId - Camp ID
 * @returns {Promise} API response with camp data
 */
export const getCamp = async (campId) => {
  const response = await apiClient.get(`/camps/${campId}`);
  return response.data.data.camp;
};

/**
 * Create new camp.
 *
 * @param {Object} data - Camp data
 * @returns {Promise} API response
 */
export const createCamp = async (data) => {
  const response = await apiClient.post('/camps', data);
  return response.data;
};

/**
 * Update camp.
 *
 * @param {number} campId - Camp ID
 * @param {Object} data - Updated camp data
 * @returns {Promise} API response
 */
export const updateCamp = async (campId, data) => {
  const response = await apiClient.put(`/camps/${campId}`, data);
  return response.data;
};

/**
 * Request to join a camp.
 *
 * @param {number} campId - Camp ID
 * @returns {Promise} API response
 */
export const requestCampMembership = async (campId) => {
  const response = await apiClient.post(`/camps/${campId}/request-membership`);
  return response.data;
};

/**
 * Approve a camp member.
 *
 * @param {number} campId - Camp ID
 * @param {number} userId - User ID
 * @returns {Promise} API response
 */
export const approveCampMember = async (campId, userId) => {
  const response = await apiClient.post(`/camps/${campId}/members/${userId}/approve`);
  return response.data;
};

/**
 * Reject a camp member.
 *
 * @param {number} campId - Camp ID
 * @param {number} userId - User ID
 * @returns {Promise} API response
 */
export const rejectCampMember = async (campId, userId) => {
  const response = await apiClient.post(`/camps/${campId}/members/${userId}/reject`);
  return response.data;
};

/**
 * Promote a member to manager.
 *
 * @param {number} campId - Camp ID
 * @param {number} userId - User ID
 * @returns {Promise} API response
 */
export const promoteCampMember = async (campId, userId) => {
  const response = await apiClient.post(`/camps/${campId}/members/${userId}/promote`);
  return response.data;
};

/**
 * Demote a manager to member.
 *
 * @param {number} campId - Camp ID
 * @param {number} userId - User ID
 * @returns {Promise} API response
 */
export const demoteCampManager = async (campId, userId) => {
  const response = await apiClient.post(`/camps/${campId}/members/${userId}/demote`);
  return response.data;
};

/**
 * Request to join an event.
 *
 * @param {number} campId - Camp ID
 * @param {number} eventId - Event ID
 * @returns {Promise} API response
 */
export const requestEventAssociation = async (campId, eventId) => {
  const response = await apiClient.post(`/camps/${campId}/request-event/${eventId}`);
  return response.data;
};

/**
 * Update camp location for an event.
 *
 * @param {number} associationId - Association ID
 * @param {string} location - Camp location
 * @returns {Promise} API response
 */
export const updateCampLocation = async (associationId, location) => {
  const response = await apiClient.put(`/camps/associations/${associationId}/location`, { location });
  return response.data;
};

/**
 * Get pending member requests for managed camps.
 *
 * @returns {Promise} API response with pending requests
 */
export const getPendingMemberRequests = async () => {
  const response = await apiClient.get('/camps/pending-members');
  return response.data.data;
};
