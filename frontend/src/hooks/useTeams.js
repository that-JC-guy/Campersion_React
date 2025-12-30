/**
 * Teams React Query hooks.
 *
 * Custom hooks for managing team data with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  moveTeam
} from '../api/services/teams';

export const useTeams = (clusterId, includeMembers = false) => {
  return useQuery({
    queryKey: ['clusters', clusterId, 'teams', includeMembers],
    queryFn: () => getTeams(clusterId, includeMembers),
    enabled: !!clusterId,
  });
};

export const useTeam = (teamId) => {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => getTeam(teamId),
    enabled: !!teamId,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clusterId, data }) => createTeam(clusterId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clusters', variables.clusterId, 'teams'] });
      queryClient.invalidateQueries({ queryKey: ['clusters', variables.clusterId] });
      if (variables.campId) {
        queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'clusters'] });
      }
      toast.success(data.message || 'Team created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create team');
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, clusterId, data }) => updateTeam(teamId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['clusters', variables.clusterId, 'teams'] });
      if (variables.campId) {
        queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'clusters'] });
      }
      toast.success(data.message || 'Team updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update team');
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, clusterId }) => deleteTeam(teamId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clusters', variables.clusterId, 'teams'] });
      queryClient.invalidateQueries({ queryKey: ['clusters', variables.clusterId] });
      if (variables.campId) {
        queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'clusters'] });
      }
      toast.success(data.message || 'Team deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete team');
    },
  });
};

export const useAddTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }) => addTeamMember(teamId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId] });
      if (variables.campId) {
        queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'clusters'] });
      }
      toast.success(data.message || 'Team member added successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add team member');
    },
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }) => removeTeamMember(teamId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId] });
      if (variables.campId) {
        queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'clusters'] });
      }
      toast.success(data.message || 'Team member removed successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to remove team member');
    },
  });
};

export const useMoveTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, newClusterId }) => moveTeam(teamId, newClusterId),
    onSuccess: (data, variables) => {
      // Invalidate queries for both clusters and the camp to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'clusters'] });
      toast.success(data.message || 'Team moved successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to move team');
    },
  });
};
