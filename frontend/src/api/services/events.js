/**
 * Events service.
 *
 * This module provides functions for event operations including
 * CRUD, approval workflows, and camp association management.
 */

import apiClient from '../client';

/**
 * Get all events (role-filtered).
 *
 * @param {string} status - Optional status filter
 * @returns {Promise} API response with events list
 */
export const getEvents = async (status) => {
  const params = {};
  if (status) {
    params.status = status;
  }
  const response = await apiClient.get('/events', { params });
  return response.data.data;
};

/**
 * Get single event details.
 *
 * @param {number} eventId - Event ID
 * @returns {Promise} API response with event data
 */
export const getEvent = async (eventId) => {
  const response = await apiClient.get(`/events/${eventId}`);
  return response.data.data.event;
};

/**
 * Create new event.
 *
 * @param {Object} data - Event data
 * @param {string} data.title - Event title
 * @param {string} data.description - Event description
 * @param {string} data.location - Event location
 * @param {string} data.start_date - Start date (ISO format)
 * @param {string} data.end_date - End date (ISO format)
 * @param {string} data.event_manager_email - Event manager email
 * @param {string} data.event_manager_phone - Event manager phone
 * @param {string} data.safety_manager_email - Safety manager email
 * @param {string} data.safety_manager_phone - Safety manager phone
 * @param {string} data.business_manager_email - Business manager email
 * @param {string} data.business_manager_phone - Business manager phone
 * @param {string} data.board_email - Board email
 * @returns {Promise} API response
 */
export const createEvent = async (data) => {
  const response = await apiClient.post('/events', data);
  return response.data;
};

/**
 * Update event.
 *
 * @param {number} eventId - Event ID
 * @param {Object} data - Updated event data
 * @returns {Promise} API response
 */
export const updateEvent = async (eventId, data) => {
  const response = await apiClient.put(`/events/${eventId}`, data);
  return response.data;
};

/**
 * Approve a pending event (SITE_ADMIN+).
 *
 * @param {number} eventId - Event ID
 * @returns {Promise} API response
 */
export const approveEvent = async (eventId) => {
  const response = await apiClient.post(`/events/${eventId}/approve`);
  return response.data;
};

/**
 * Reject a pending event (SITE_ADMIN+).
 *
 * @param {number} eventId - Event ID
 * @returns {Promise} API response
 */
export const rejectEvent = async (eventId) => {
  const response = await apiClient.post(`/events/${eventId}/reject`);
  return response.data;
};

/**
 * Cancel an approved event.
 *
 * @param {number} eventId - Event ID
 * @returns {Promise} API response
 */
export const cancelEvent = async (eventId) => {
  const response = await apiClient.post(`/events/${eventId}/cancel`);
  return response.data;
};

/**
 * Approve a camp request for an event.
 *
 * @param {number} eventId - Event ID
 * @param {number} campId - Camp ID
 * @returns {Promise} API response
 */
export const approveCampForEvent = async (eventId, campId) => {
  const response = await apiClient.post(`/events/${eventId}/camps/${campId}/approve`);
  return response.data;
};

/**
 * Reject a camp request for an event.
 *
 * @param {number} eventId - Event ID
 * @param {number} campId - Camp ID
 * @returns {Promise} API response
 */
export const rejectCampForEvent = async (eventId, campId) => {
  const response = await apiClient.post(`/events/${eventId}/camps/${campId}/reject`);
  return response.data;
};

/**
 * Get pending camp requests for user's events.
 *
 * @returns {Promise} API response with pending requests
 */
export const getPendingCampRequests = async () => {
  const response = await apiClient.get('/events/pending-camps');
  return response.data.data;
};
