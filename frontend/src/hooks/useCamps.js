/**
 * Camps React Query hooks.
 *
 * Custom hooks for managing camp data with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getCamps,
  getCamp,
  createCamp,
  updateCamp,
  requestCampMembership,
  approveCampMember,
  rejectCampMember,
  promoteCampMember,
  demoteCampManager,
  requestEventAssociation,
  updateCampLocation,
  getPendingMemberRequests
} from '../api/services/camps';

export const useCamps = () => {
  return useQuery({
    queryKey: ['camps'],
    queryFn: getCamps,
  });
};

export const useCamp = (campId) => {
  return useQuery({
    queryKey: ['camps', campId],
    queryFn: () => getCamp(campId),
    enabled: !!campId,
  });
};

export const useCreateCamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCamp,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      toast.success(data.message || 'Camp created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create camp');
    },
  });
};

export const useUpdateCamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, data }) => updateCamp(campId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId] });
      toast.success(data.message || 'Camp updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update camp');
    },
  });
};

export const useRequestCampMembership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestCampMembership,
    onSuccess: (data, campId) => {
      queryClient.invalidateQueries({ queryKey: ['camps', campId] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to request membership');
    },
  });
};

export const useApproveCampMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, userId }) => approveCampMember(campId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId] });
      queryClient.invalidateQueries({ queryKey: ['pending-member-requests'] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to approve member');
    },
  });
};

export const useRejectCampMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, userId }) => rejectCampMember(campId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId] });
      queryClient.invalidateQueries({ queryKey: ['pending-member-requests'] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reject member');
    },
  });
};

export const usePromoteCampMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, userId }) => promoteCampMember(campId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to promote member');
    },
  });
};

export const useDemoteCampManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, userId }) => demoteCampManager(campId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to demote manager');
    },
  });
};

export const useRequestEventAssociation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, eventId }) => requestEventAssociation(campId, eventId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to request event association');
    },
  });
};

export const useUpdateCampLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ associationId, location }) => updateCampLocation(associationId, location),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update location');
    },
  });
};

export const usePendingMemberRequests = () => {
  return useQuery({
    queryKey: ['pending-member-requests'],
    queryFn: getPendingMemberRequests,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds - check for new requests more frequently
  });
};
