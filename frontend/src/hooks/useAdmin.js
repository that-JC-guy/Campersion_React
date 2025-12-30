/**
 * Admin React Query hooks.
 *
 * Custom hooks for managing admin data with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getAdminStats,
  getAllUsers,
  createUser,
  suspendUser,
  reactivateUser,
  changeEventStatus,
  getAllAssociations,
  revokeAssociation,
  cancelAssociationRejection
} from '../api/services/admin';

/**
 * Hook to fetch admin dashboard statistics.
 */
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
  });
};

/**
 * Hook to fetch all users with optional filtering.
 * @param {Object} params - Query parameters (status, role, search)
 */
export const useAllUsers = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => getAllUsers(params),
  });
};

/**
 * Hook to create a new user.
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(data.message || 'User created successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to create user';
      toast.error(message);
    },
  });
};

/**
 * Hook to suspend a user.
 */
export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suspendUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(data.message || 'User suspended successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to suspend user';
      toast.error(message);
    },
  });
};

/**
 * Hook to reactivate a user.
 */
export const useReactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(data.message || 'User reactivated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to reactivate user';
      toast.error(message);
    },
  });
};

/**
 * Hook to change event status.
 */
export const useChangeEventStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }) => changeEventStatus(eventId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(data.message || 'Event status changed successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to change event status';
      toast.error(message);
    },
  });
};

/**
 * Hook to fetch all camp-event associations.
 * @param {Object} params - Query parameters (status, event_id, camp_id)
 */
export const useAllAssociations = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'associations', params],
    queryFn: () => getAllAssociations(params),
  });
};

/**
 * Hook to revoke a camp-event association.
 */
export const useRevokeAssociation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ associationId, data }) => revokeAssociation(associationId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'associations'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(data.message || 'Association revoked successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to revoke association';
      toast.error(message);
    },
  });
};

/**
 * Hook to cancel rejection of a camp-event association.
 */
export const useCancelAssociationRejection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAssociationRejection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'associations'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(data.message || 'Association rejection cancelled successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to cancel rejection';
      toast.error(message);
    },
  });
};
