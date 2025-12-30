/**
 * Teams service.
 *
 * This module provides functions for team operations including
 * CRUD operations, team lead management, and team member management.
 */

import apiClient from '../client';

/**
 * Get all teams for a cluster.
 *
 * @param {number} clusterId - Cluster ID
 * @param {boolean} includeMembers - Include team members in response
 * @returns {Promise} API response with teams list
 */
export const getTeams = async (clusterId, includeMembers = false) => {
  const params = includeMembers ? { include_members: 'true' } : {};
  const response = await apiClient.get(`/clusters/${clusterId}/teams`, { params });
  return response.data.data;
};

/**
 * Get single team details.
 *
 * @param {number} teamId - Team ID
 * @returns {Promise} API response with team data
 */
export const getTeam = async (teamId) => {
  const response = await apiClient.get(`/teams/${teamId}`);
  return response.data.data.team;
};

/**
 * Create new team.
 *
 * @param {number} clusterId - Cluster ID
 * @param {Object} data - Team data
 * @returns {Promise} API response
 */
export const createTeam = async (clusterId, data) => {
  const response = await apiClient.post(`/clusters/${clusterId}/teams`, data);
  return response.data;
};

/**
 * Update team.
 *
 * @param {number} teamId - Team ID
 * @param {Object} data - Updated team data
 * @returns {Promise} API response
 */
export const updateTeam = async (teamId, data) => {
  const response = await apiClient.put(`/teams/${teamId}`, data);
  return response.data;
};

/**
 * Delete team.
 *
 * @param {number} teamId - Team ID
 * @returns {Promise} API response
 */
export const deleteTeam = async (teamId) => {
  const response = await apiClient.delete(`/teams/${teamId}`);
  return response.data;
};

/**
 * Add member to team.
 *
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID to add
 * @returns {Promise} API response
 */
export const addTeamMember = async (teamId, userId) => {
  const response = await apiClient.post(`/teams/${teamId}/members`, { user_id: userId });
  return response.data;
};

/**
 * Remove member from team.
 *
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID to remove
 * @returns {Promise} API response
 */
export const removeTeamMember = async (teamId, userId) => {
  const response = await apiClient.delete(`/teams/${teamId}/members/${userId}`);
  return response.data;
};

/**
 * Move team to a different cluster.
 *
 * @param {number} teamId - Team ID
 * @param {number} newClusterId - New cluster ID
 * @returns {Promise} API response
 */
export const moveTeam = async (teamId, newClusterId) => {
  const response = await apiClient.put(`/teams/${teamId}/move`, {
    new_cluster_id: newClusterId
  });
  return response.data;
};
