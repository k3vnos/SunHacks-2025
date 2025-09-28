import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from './api';
import { webSocketService } from './websocket';
import { useMapStore, useAuthStore } from '../stores';
import { 
  CreateIncidentRequest, 
  VoteRequest, 
  CommentRequest,
  Incident,
  Comment,
  WebSocketMessage 
} from '../types';
import { getGeohashPrefixes, calculateDistance } from '../utils';
import { INCIDENT_CONFIG } from '../constants';

// Query keys
export const queryKeys = {
  me: ['me'] as const,
  nearbyIncidents: (lat: number, lon: number, radius: number, after?: string) => 
    ['incidents', 'nearby', lat, lon, radius, after] as const,
  incidentDetail: (id: string) => ['incidents', 'detail', id] as const,
};

// Auth queries
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: apiService.getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Incident queries
export function useNearbyIncidents(
  lat: number,
  lon: number,
  radius: number = 5,
  after?: string
) {
  const { setIncidents, addIncident, updateIncident } = useMapStore();

  return useQuery({
    queryKey: queryKeys.nearbyIncidents(lat, lon, radius, after),
    queryFn: () => apiService.getNearbyIncidents(lat, lon, radius, after),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    onSuccess: (data) => {
      if (after) {
        // Append to existing incidents
        setIncidents([...useMapStore.getState().incidents, ...data.items]);
      } else {
        // Replace incidents
        setIncidents(data.items);
      }
    },
    onError: (error) => {
      console.error('Failed to fetch nearby incidents:', error);
    },
  });
}

export function useIncidentDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.incidentDetail(id),
    queryFn: () => apiService.getIncidentDetail(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
}

// Incident mutations
export function useCreateIncident() {
  const queryClient = useQueryClient();
  const { addIncident } = useMapStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (data: CreateIncidentRequest) => {
      // Request upload URL if photo is provided
      let photoKey: string | undefined;
      if (data.photoKey) {
        const uploadResponse = await apiService.requestUpload();
        await apiService.uploadPhoto(uploadResponse.uploadUrl, data.photoKey);
        photoKey = uploadResponse.photoKey;
      }

      // Create incident
      return apiService.createIncident({
        ...data,
        photoKey,
      });
    },
    onSuccess: (incident) => {
      // Add to map store
      addIncident(incident);
      
      // Invalidate nearby incidents query to refetch
      queryClient.invalidateQueries({
        queryKey: ['incidents', 'nearby'],
      });

      // Subscribe to this incident for real-time updates
      if (webSocketService.isConnected) {
        webSocketService.subscribe({
          action: 'subscribeIncident',
          incidentId: incident.id,
        });
      }
    },
    onError: (error) => {
      console.error('Failed to create incident:', error);
    },
  });
}

export function useVoteIncident() {
  const queryClient = useQueryClient();
  const { updateIncident } = useMapStore();

  return useMutation({
    mutationFn: ({ id, vote }: { id: string; vote: VoteRequest }) =>
      apiService.voteIncident(id, vote),
    onSuccess: (data, variables) => {
      // Update incident in map store
      const currentIncidents = useMapStore.getState().incidents;
      const incident = currentIncidents.find(i => i.id === variables.id);
      if (incident) {
        updateIncident({
          ...incident,
          score: data.score,
        });
      }

      // Invalidate incident detail query
      queryClient.invalidateQueries({
        queryKey: queryKeys.incidentDetail(variables.id),
      });
    },
    onError: (error) => {
      console.error('Failed to vote on incident:', error);
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: CommentRequest }) =>
      apiService.addComment(id, comment),
    onSuccess: (data, variables) => {
      // Invalidate incident detail query to refetch comments
      queryClient.invalidateQueries({
        queryKey: queryKeys.incidentDetail(variables.id),
      });
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
    },
  });
}

// WebSocket integration hook
export function useWebSocketIntegration() {
  const { addIncident, updateIncident } = useMapStore();
  const queryClient = useQueryClient();

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'incident.created':
        addIncident(message.data as Incident);
        break;
        
      case 'incident.updated':
        updateIncident(message.data as Incident);
        break;
        
      case 'incident.voted':
        const votedIncident = message.data as Incident;
        updateIncident(votedIncident);
        
        // Invalidate incident detail query
        queryClient.invalidateQueries({
          queryKey: queryKeys.incidentDetail(votedIncident.id),
        });
        break;
        
      case 'incident.commented':
        const commentedIncident = message.data as Incident;
        
        // Invalidate incident detail query to refetch comments
        queryClient.invalidateQueries({
          queryKey: queryKeys.incidentDetail(commentedIncident.id),
        });
        break;
    }
  };

  return {
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect(),
    subscribeToArea: (lat: number, lon: number) => {
      const prefixes = getGeohashPrefixes(lat, lon, INCIDENT_CONFIG.NEARBY_RADIUS_KM);
      prefixes.forEach(prefix => {
        webSocketService.subscribe({
          action: 'subscribeArea',
          geohashPrefix: prefix,
        });
      });
    },
    subscribeToIncident: (incidentId: string) => {
      webSocketService.subscribe({
        action: 'subscribeIncident',
        incidentId,
      });
    },
    unsubscribeFromIncident: (incidentId: string) => {
      webSocketService.unsubscribe({
        action: 'subscribeIncident',
        incidentId,
      });
    },
    handleWebSocketMessage,
  };
}

// Location-based queries hook
export function useLocationBasedQueries() {
  const { currentLocation } = useMapStore();
  
  const nearbyIncidentsQuery = useNearbyIncidents(
    currentLocation?.latitude ?? 0,
    currentLocation?.longitude ?? 0,
    INCIDENT_CONFIG.NEARBY_RADIUS_KM
  );

  return {
    nearbyIncidentsQuery,
    isLoading: nearbyIncidentsQuery.isLoading,
    error: nearbyIncidentsQuery.error,
    refetch: nearbyIncidentsQuery.refetch,
  };
}

// Optimistic updates for better UX
export function useOptimisticVote() {
  const { updateIncident } = useMapStore();
  const voteMutation = useVoteIncident();

  const optimisticVote = async (incidentId: string, voteValue: 1 | -1) => {
    // Optimistically update the UI
    const currentIncidents = useMapStore.getState().incidents;
    const incident = currentIncidents.find(i => i.id === incidentId);
    
    if (incident) {
      updateIncident({
        ...incident,
        score: incident.score + voteValue,
      });
    }

    // Perform the actual vote
    try {
      await voteMutation.mutateAsync({
        id: incidentId,
        vote: { value: voteValue },
      });
    } catch (error) {
      // Revert optimistic update on error
      if (incident) {
        updateIncident({
          ...incident,
          score: incident.score - voteValue,
        });
      }
      throw error;
    }
  };

  return {
    optimisticVote,
    isVoting: voteMutation.isPending,
    error: voteMutation.error,
  };
}
