/**
 * Events React Query hooks.
 *
 * Custom hooks for managing event data with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  approveEvent,
  rejectEvent,
  cancelEvent,
  approveCampForEvent,
  rejectCampForEvent,
  getPendingCampRequests
} from '../api/services/events';

/**
 * Hook to fetch all events.
 * @param {string} status - Optional status filter
 */
export const useEvents = (status) => {
  return useQuery({
    queryKey: ['events', status],
    queryFn: () => getEvents(status),
  });
};

/**
 * Hook to fetch single event.
 */
export const useEvent = (eventId) => {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: () => getEvent(eventId),
    enabled: !!eventId,
  });
};

/**
 * Hook to create event.
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(data.message || 'Event created successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to create event';
      toast.error(message);
    },
  });
};

/**
 * Hook to update event.
 */
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }) => updateEvent(eventId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId] });
      toast.success(data.message || 'Event updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to update event';
      toast.error(message);
    },
  });
};

/**
 * Hook to approve event.
 */
export const useApproveEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveEvent,
    onSuccess: (data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      toast.success(data.message || 'Event approved successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to approve event';
      toast.error(message);
    },
  });
};

/**
 * Hook to reject event.
 */
export const useRejectEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectEvent,
    onSuccess: (data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      toast.success(data.message || 'Event rejected successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to reject event';
      toast.error(message);
    },
  });
};

/**
 * Hook to cancel event.
 */
export const useCancelEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelEvent,
    onSuccess: (data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      toast.success(data.message || 'Event cancelled successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to cancel event';
      toast.error(message);
    },
  });
};

/**
 * Hook to approve camp for event.
 */
export const useApproveCampForEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, campId }) => approveCampForEvent(eventId, campId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['pending-camp-requests'] });
      toast.success(data.message || 'Camp approved successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to approve camp';
      toast.error(message);
    },
  });
};

/**
 * Hook to reject camp for event.
 */
export const useRejectCampForEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, campId }) => rejectCampForEvent(eventId, campId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['pending-camp-requests'] });
      toast.success(data.message || 'Camp rejected successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to reject camp';
      toast.error(message);
    },
  });
};

/**
 * Hook to fetch pending camp requests.
 */
export const usePendingCampRequests = () => {
  return useQuery({
    queryKey: ['pending-camp-requests'],
    queryFn: getPendingCampRequests,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds - check for new requests more frequently
  });
};
