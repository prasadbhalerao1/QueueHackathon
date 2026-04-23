import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/api';
import { Token, QueueStatus, AdvanceTokenRequest, JSendResponse, Branch, Service, AnalyticsData } from '../types';
import { get, set } from 'idb-keyval';

export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data } = await api.get<JSendResponse<Branch[]>>('/api/queue/branches');
      if (data.status !== 'success') throw new Error(data.message || 'Failed to fetch branches');
      return data.data;
    },
  });
};

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get<JSendResponse<Service[]>>('/api/queue/services');
      if (data.status !== 'success') throw new Error(data.message || 'Failed to fetch services');
      return data.data;
    },
  });
};

export const useAnalytics = (branchId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', branchId],
    queryFn: async () => {
      const { data } = await api.get<JSendResponse<AnalyticsData>>(`/api/queue/analytics/${branchId}`);
      if (data.status !== 'success') throw new Error(data.message || 'Failed to fetch analytics');
      return data.data;
    },
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false;
      return 5000;
    },
    retry: 1,
    enabled: !!branchId && enabled,
  });
};

export const useLiveQueue = (branchId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['queue', branchId],
    queryFn: async () => {
      const { data } = await api.get<JSendResponse<Token[]>>(`/api/queue/${branchId}`);
      if (data.status !== 'success') throw new Error(data.message || 'Failed to fetch queue');
      return data.data;
    },
    refetchInterval: (query) => {
      // Stop hammering on error — only poll when last fetch succeeded
      if (query.state.status === 'error') return false;
      return 5000; // Increased to 5s to reduce network noise
    },
    staleTime: 4000,
    retry: 1,
    enabled: !!branchId && enabled,
    placeholderData: (previousData) => previousData, // Maintain UI state during background refetch
  });
};

export const useAdvanceToken = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tokenId, newStatus, deskNumber }: { tokenId: string; newStatus: QueueStatus; deskNumber?: number }) => {
      const payload: AdvanceTokenRequest & { desk_number?: number } = { 
        new_status: newStatus,
        desk_number: deskNumber 
      };
      const { data } = await api.patch<JSendResponse<Token>>(`/api/queue/advance/${tokenId}`, payload);
      if (data.status !== 'success') throw new Error(data.message || 'Failed to advance token');
      return data.data;
    },
    
    onMutate: async ({ tokenId, newStatus }: { tokenId: string; newStatus: QueueStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['queue', branchId] });
      const previousQueue = queryClient.getQueryData<Token[]>(['queue', branchId]);

      if (!navigator.onLine) {
        console.warn('Network offline. Caching mutation to IndexedDB for sync...');
        const mutations = await get('offline_mutations') || [];
        mutations.push({ type: 'ADVANCE_TOKEN', tokenId, newStatus, branchId });
        await set('offline_mutations', mutations);
      }

      if (previousQueue) {
        queryClient.setQueryData<Token[]>(
          ['queue', branchId],
          previousQueue.map((token: Token) =>
            token.id === tokenId ? { ...token, status: newStatus } : token
          )
        );
      }

      return { previousQueue };
    },
    
    onError: (err: any, _variables: any, context: any) => {
      if (context?.previousQueue) {
        queryClient.setQueryData<Token[]>(['queue', branchId], context.previousQueue);
      }
      console.error('Queue mutation failed, cache rolled back:', err);
    },
    
    onSettled: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
      }
    },
  });
};
export const useTransferToken = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tokenId, targetBranchId }: { tokenId: string; targetBranchId: string }) => {
      const { data } = await api.post<JSendResponse<Token>>(`/api/queue/transfer/${tokenId}`, { target_branch_id: targetBranchId });
      if (data.status !== 'success') throw new Error(data.message || 'Failed to transfer token');
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
      queryClient.invalidateQueries({ queryKey: ['queue', variables.targetBranchId] });
    },
  });
};

export const useToggleRush = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<JSendResponse<Branch>>(`/api/queue/rush/${branchId}`);
      if (data.status !== 'success') throw new Error(data.message || 'Failed to toggle rush mode');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', branchId] });
    },
  });
};

export const useUndoAction = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokenId: string) => {
      const { data } = await api.post<JSendResponse<Token>>(`/api/queue/undo/${tokenId}`);
      if (data.status !== 'success') throw new Error(data.message || 'Undo failed');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', branchId] });
    },
  });
};

export const usePauseDesk = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deskNumber: number) => {
      const { data } = await api.post<JSendResponse<{ affected: number }>>(`/api/queue/pause-desk/${branchId}/${deskNumber}`);
      if (data.status !== 'success') throw new Error(data.message || 'Failed to pause desk');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', branchId] });
    },
  });
};

export const useIssueVip = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<JSendResponse<Token>>(`/api/queue/vip/${branchId}`);
      if (data.status !== 'success') throw new Error(data.message || 'Failed to issue VIP token');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
    },
  });
};

export const useResetQueue = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<JSendResponse<{ affected: number }>>(`/api/queue/admin/reset/${branchId}`);
      if (data.status !== 'success') throw new Error(data.message || 'Reset failed');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', branchId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', branchId] });
    },
  });
};

export const useUpdateCapacity = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (capacity: number) => {
      const { data } = await api.patch<JSendResponse<Branch>>(`/api/queue/admin/branch/${branchId}/capacity`, null, {
        params: { capacity }
      });
      if (data.status !== 'success') throw new Error(data.message || 'Capacity update failed');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', branchId] });
    },
  });
};
