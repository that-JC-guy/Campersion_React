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
  changeUserRole
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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
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
