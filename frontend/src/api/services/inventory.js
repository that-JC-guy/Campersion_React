/**
 * Inventory service.
 *
 * This module provides functions for inventory operations including
 * CRUD, bulk updates, and quick-add functionality.
 */

import apiClient from '../client';

/**
 * Get all user's inventory items.
 *
 * @returns {Promise} API response with items and common items list
 */
export const getInventory = async () => {
  const response = await apiClient.get('/inventory');
  return response.data.data;
};

/**
 * Create new inventory item.
 *
 * @param {Object} data - Item data
 * @param {string} data.name - Item name
 * @param {number} data.quantity - Item quantity
 * @param {string} data.description - Item description
 * @param {boolean} data.is_shared_gear - Whether item is shared gear
 * @returns {Promise} API response
 */
export const createInventoryItem = async (data) => {
  const response = await apiClient.post('/inventory', data);
  return response.data;
};

/**
 * Get single inventory item.
 *
 * @param {number} itemId - Item ID
 * @returns {Promise} API response with item data
 */
export const getInventoryItem = async (itemId) => {
  const response = await apiClient.get(`/inventory/${itemId}`);
  return response.data.data.item;
};

/**
 * Update inventory item.
 *
 * @param {number} itemId - Item ID
 * @param {Object} data - Updated item data
 * @returns {Promise} API response
 */
export const updateInventoryItem = async (itemId, data) => {
  const response = await apiClient.put(`/inventory/${itemId}`, data);
  return response.data;
};

/**
 * Delete inventory item.
 *
 * @param {number} itemId - Item ID
 * @returns {Promise} API response
 */
export const deleteInventoryItem = async (itemId) => {
  const response = await apiClient.delete(`/inventory/${itemId}`);
  return response.data;
};

/**
 * Bulk update inventory items.
 *
 * @param {Object} data - Bulk update data
 * @param {Object} data.new_item - New item to create (optional)
 * @param {Array} data.updates - Array of updates for existing items
 * @returns {Promise} API response
 */
export const bulkUpdateInventory = async (data) => {
  const response = await apiClient.post('/inventory/bulk-update', data);
  return response.data;
};

/**
 * Quick-add a common inventory item.
 *
 * @param {string} itemKey - Key for common item (e.g., 'tent', 'chairs')
 * @returns {Promise} API response
 */
export const quickAddInventoryItem = async (itemKey) => {
  const response = await apiClient.post(`/inventory/quick-add/${itemKey}`);
  return response.data;
};
