/**
 * Clusters React Query hooks.
 *
 * Custom hooks for managing cluster data with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getClusters,
  getCluster,
  createCluster,
  updateCluster,
  deleteCluster
} from '../api/services/clusters';

export const useClusters = (campId, includeTeams = false) => {
  return useQuery({
    queryKey: ['camps', campId, 'clusters', includeTeams],
    queryFn: () => getClusters(campId, includeTeams),
    enabled: !!campId,
  });
};

export const useCluster = (clusterId) => {
  return useQuery({
    queryKey: ['clusters', clusterId],
    queryFn: () => getCluster(clusterId),
    enabled: !!clusterId,
  });
};

export const useCreateCluster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, data }) => createCluster(campId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'clusters'] });
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId] });
      toast.success(data.message || 'Cluster created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create cluster');
    },
  });
};

export const useUpdateCluster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clusterId, campId, data }) => updateCluster(clusterId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clusters', variables.clusterId] });
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'clusters'] });
      toast.success(data.message || 'Cluster updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update cluster');
    },
  });
};

export const useDeleteCluster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clusterId, campId }) => deleteCluster(clusterId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'clusters'] });
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId] });
      toast.success(data.message || 'Cluster deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete cluster');
    },
  });
};
