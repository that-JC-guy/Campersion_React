/**
 * Clusters service.
 *
 * This module provides functions for cluster operations including
 * CRUD operations and cluster lead management within camps.
 */

import apiClient from '../client';

/**
 * Get all clusters for a camp.
 *
 * @param {number} campId - Camp ID
 * @param {boolean} includeTeams - Include teams in response
 * @returns {Promise} API response with clusters list
 */
export const getClusters = async (campId, includeTeams = false) => {
  const params = includeTeams ? { include_teams: 'true' } : {};
  const response = await apiClient.get(`/camps/${campId}/clusters`, { params });
  return response.data.data;
};

/**
 * Get single cluster details.
 *
 * @param {number} clusterId - Cluster ID
 * @returns {Promise} API response with cluster data
 */
export const getCluster = async (clusterId) => {
  const response = await apiClient.get(`/clusters/${clusterId}`);
  return response.data.data.cluster;
};

/**
 * Create new cluster.
 *
 * @param {number} campId - Camp ID
 * @param {Object} data - Cluster data
 * @returns {Promise} API response
 */
export const createCluster = async (campId, data) => {
  const response = await apiClient.post(`/camps/${campId}/clusters`, data);
  return response.data;
};

/**
 * Update cluster.
 *
 * @param {number} clusterId - Cluster ID
 * @param {Object} data - Updated cluster data
 * @returns {Promise} API response
 */
export const updateCluster = async (clusterId, data) => {
  const response = await apiClient.put(`/clusters/${clusterId}`, data);
  return response.data;
};

/**
 * Delete cluster.
 *
 * @param {number} clusterId - Cluster ID
 * @returns {Promise} API response
 */
export const deleteCluster = async (clusterId) => {
  const response = await apiClient.delete(`/clusters/${clusterId}`);
  return response.data;
};
