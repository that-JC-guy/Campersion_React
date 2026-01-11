/**
 * Profile React Query hooks.
 *
 * Custom hooks for managing profile data with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getProfile,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
  getAllUsers,
  changeUserRole,
  registerForEvent,
  updateEventRegistration,
  deleteEventRegistration,
  deleteOwnAccount
} from '../api/services/profile';

/**
 * Hook to fetch current user's profile.
 */
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
};

/**
 * Hook to update profile.
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Invalidate profile and auth queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });

      // Invalidate all other queries since user data appears in camps, teams, events, etc.
      // This ensures pronouns changes are reflected everywhere immediately
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      queryClient.invalidateQueries({ queryKey: ['camp'] });
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });

      toast.success(data.message || 'Profile updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to update profile';
      toast.error(message);
    },
  });
};

/**
 * Hook to request email change.
 */
export const useRequestEmailChange = () => {
  return useMutation({
    mutationFn: requestEmailChange,
    onSuccess: (data) => {
      toast.success(data.message || 'Verification email sent!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to request email change';
      toast.error(message);
    },
  });
};

/**
 * Hook to verify email change.
 */
export const useVerifyEmailChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyEmailChange,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      toast.success(data.message || 'Email changed successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to verify email change';
      toast.error(message);
    },
  });
};

/**
 * Hook to fetch all users (admin only).
 */
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['all-users'],
    queryFn: getAllUsers,
  });
};

/**
 * Hook to change user role (admin only).
 */
export const useChangeUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }) => changeUserRole(userId, role),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(data.message || 'User role updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to change user role';
      toast.error(message);
    },
  });
};

/**
 * Hook to register for an event.
 */
export const useRegisterForEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerForEvent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(data.message || 'Successfully registered for event!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to register for event';
      toast.error(message);
    },
  });
};

/**
 * Hook to update event registration.
 */
export const useUpdateEventRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ registrationId, data }) => updateEventRegistration(registrationId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(data.message || 'Registration updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to update registration';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete event registration.
 */
export const useDeleteEventRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEventRegistration,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(data.message || 'Registration deleted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to delete registration';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete current user's own account.
 */
export const useDeleteOwnAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOwnAccount,
    onSuccess: (data) => {
      // Clear all queries
      queryClient.clear();
      toast.success(data.message || 'Account deleted successfully');
      // The auth context will handle logout and redirect
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to delete account';
      toast.error(message);
    },
  });
};
