/**
 * Inventory React Query hooks.
 *
 * Custom hooks for managing inventory data with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  bulkUpdateInventory,
  quickAddInventoryItem
} from '../api/services/inventory';

/**
 * Hook to fetch inventory items.
 */
export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });
};

/**
 * Hook to create inventory item.
 */
export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      toast.success(data.message || 'Item added successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to create item';
      toast.error(message);
    },
  });
};

/**
 * Hook to update inventory item.
 */
export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }) => updateInventoryItem(itemId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      toast.success(data.message || 'Item updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to update item';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete inventory item.
 */
export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      toast.success(data.message || 'Item deleted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to delete item';
      toast.error(message);
    },
  });
};

/**
 * Hook to bulk update inventory items.
 */
export const useBulkUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUpdateInventory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      toast.success(data.message || 'Inventory updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to update inventory';
      toast.error(message);
    },
  });
};

/**
 * Hook to quick-add inventory item.
 */
export const useQuickAddInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quickAddInventoryItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      toast.success(data.message || 'Item added successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to add item';
      toast.error(message);
    },
  });
};
