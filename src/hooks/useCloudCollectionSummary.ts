import type { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import type { CloudCollectionSummary } from '../services/CloudCollectionService';

export const cloudCollectionSummaryKey=['cloud-collection-summary'] as const;

export function useCloudCollectionSummary(session:Session|null){
  return useQuery({
    queryKey:[...cloudCollectionSummaryKey,session?.user.id],
    enabled:Boolean(session),
    queryFn:async():Promise<CloudCollectionSummary>=>{
      const {supabase}=await import('../lib/supabase');
      if(!supabase)throw new Error('Cloud is not configured');
      const {data,error}=await supabase.rpc('get_collection_summary');
      if(error)throw error;
      const summary=Array.isArray(data)?data[0]:data;
      return {entries:Number(summary?.entries??0),species:Number(summary?.species??0),totalQuantity:Number(summary?.total_quantity??0)};
    },
  });
}
