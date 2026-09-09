import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const isCloudConfigured=Boolean(import.meta.env.VITE_SUPABASE_URL&&import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export function useSupabaseSession(){
  const [session,setSession]=useState<Session|null>(null);
  const [loading,setLoading]=useState(isCloudConfigured);

  useEffect(()=>{
    if(!isCloudConfigured){setLoading(false);return}
    let active=true;
    let unsubscribe:(()=>void)|undefined;
    void import('../lib/supabase').then(({supabase})=>{
      if(!active||!supabase)return;
      supabase.auth.getSession().then(({data})=>{
        if(!active)return;
        setSession(data.session);
        setLoading(false);
      });
      const {data}=supabase.auth.onAuthStateChange((_event,next)=>{
        if(!active)return;
        setSession(next);
        setLoading(false);
      });
      unsubscribe=()=>data.subscription.unsubscribe();
    });
    return()=>{active=false;unsubscribe?.()};
  },[]);

  return {session,loading};
}
