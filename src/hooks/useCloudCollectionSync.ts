import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { collectionRepository } from '../app/dependencies';
import { CloudCollectionSyncService } from '../services/CloudCollectionSyncService';
import { collectionFingerprint } from '../services/CloudCollectionService';
import { useCloudSyncStore } from '../store/cloudSyncStore';
import { cloudCollectionSummaryKey } from './useCloudCollectionSummary';
import { useCollection } from './useCollection';

export function useCloudCollectionSync(session:Session|null){
  const collection=useCollection();
  const queryClient=useQueryClient();
  const setStatus=useCloudSyncStore(state=>state.setStatus);
  const service=useRef<CloudCollectionSyncService|null>(null);
  const running=useRef(false);
  const rerun=useRef(false);
  const requestedUser=useRef<string|undefined>(undefined);
  const fingerprint=collectionFingerprint(collection.data??[]);

  const getService=useCallback(async()=>{
    if(service.current)return service.current;
    const {supabase}=await import('../lib/supabase');
    if(!supabase)return null;
    service.current=new CloudCollectionSyncService(collectionRepository,supabase);
    return service.current;
  },[]);

  const synchronize=useCallback(async()=>{
    const userId=session?.user.id;
    if(!userId||!collection.isSuccess)return;
    requestedUser.current=userId;
    if(running.current){rerun.current=true;return}
    running.current=true;
    let targetUser=userId;
    try{
      const syncService=await getService();
      if(!syncService)return;
      do{
        rerun.current=false;
        const nextUser=requestedUser.current;
        if(!nextUser)return;
        targetUser=nextUser;
        setStatus('syncing');
        const result=await syncService.synchronize(targetUser);
        if(requestedUser.current!==targetUser)continue;
        setStatus(result.status);
        if(result.status==='synced'){
          if(result.direction==='device')await queryClient.invalidateQueries({queryKey:['collection']});
          await queryClient.invalidateQueries({queryKey:cloudCollectionSummaryKey});
        }
      }while(rerun.current&&requestedUser.current);
    }catch{
      if(requestedUser.current===targetUser)setStatus('error');
    }finally{running.current=false}
  },[collection.isSuccess,getService,queryClient,session?.user.id,setStatus]);

  useEffect(()=>{
    if(!session){requestedUser.current=undefined;setStatus('disconnected');return}
    const timer=window.setTimeout(()=>void synchronize(),350);
    return()=>window.clearTimeout(timer);
  },[fingerprint,session,synchronize,setStatus]);

  useEffect(()=>{
    if(!session)return;
    const refresh=()=>void synchronize();
    const interval=window.setInterval(refresh,30_000);
    window.addEventListener('focus',refresh);
    return()=>{window.clearInterval(interval);window.removeEventListener('focus',refresh)};
  },[session,synchronize]);
}
