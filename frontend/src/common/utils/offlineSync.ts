import { QueryClient } from '@tanstack/react-query';
import { get, clear } from 'idb-keyval';
import api from '../api';

export const syncOfflineMutations = async (queryClient: QueryClient) => {
  try {
    const offlineMutations: any[] = await get('offline_mutations') || [];
    if (offlineMutations.length > 0) {
      console.log(`[OfflineSync] Connecting to network. Syncing ${offlineMutations.length} offline mutations to MongoDB...`);
      for (const mutation of offlineMutations) {
        try {
          if (mutation.type === 'ADVANCE_TOKEN') {
            await api.patch(`/api/queue/advance/${mutation.tokenId}`, {
              new_status: mutation.newStatus
            });
            console.log(`[OfflineSync] Synced token ${mutation.tokenId} to status ${mutation.newStatus}`);
          }
        } catch (e) {
            console.error('[OfflineSync] Failed to sync mutation:', mutation, e);
        }
      }
      await clear();
      console.log('[OfflineSync] Offline sync complete. Local cache cleared.');
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    } else {
      console.log('[OfflineSync] Network connected. No offline mutations to sync.');
    }
  } catch (error) {
    console.error('[OfflineSync] Offline sync failed:', error);
  }
};
