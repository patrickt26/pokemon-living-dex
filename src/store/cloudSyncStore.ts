import { create } from 'zustand';

export type CloudSyncStatus='disconnected'|'setup'|'syncing'|'synced'|'conflict'|'error';

interface CloudSyncState {
  status:CloudSyncStatus;
  setStatus:(status:CloudSyncStatus)=>void;
}

export const useCloudSyncStore=create<CloudSyncState>(set=>({
  status:'disconnected',
  setStatus:status=>set({status}),
}));
