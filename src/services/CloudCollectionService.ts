import type { SupabaseClient } from '@supabase/supabase-js';
import type { CollectionEntryInput } from '../domain/models';
import type { CollectionRepository } from '../repositories/CollectionRepository';

export interface CloudCollectionSummary { entries:number; species:number; totalQuantity:number }

export class CloudCollectionService {
  constructor(private readonly repository:CollectionRepository,private readonly client:SupabaseClient){}

  async getLocalSummary():Promise<CloudCollectionSummary>{
    const entries=await this.repository.getEntries();
    return {entries:entries.length,species:new Set(entries.map(entry=>entry.speciesId)).size,totalQuantity:entries.reduce((sum,entry)=>sum+entry.quantity,0)};
  }

  async getCloudSummary():Promise<CloudCollectionSummary>{
    const {data,error}=await this.client.rpc('get_collection_summary');
    if(error)throw error;
    const summary=Array.isArray(data)?data[0]:data;
    return {entries:Number(summary?.entries??0),species:Number(summary?.species??0),totalQuantity:Number(summary?.total_quantity??0)};
  }

  async importLocalCollection():Promise<CloudCollectionSummary>{
    const entries=await this.repository.getEntries();
    const payload=entries.map(entry=>({species_id:entry.speciesId,form_id:entry.formId,game_id:entry.gameId,origin_game_id:entry.originGameId??entry.gameId,shiny:entry.shiny,alpha:entry.alpha??false,own_ot:entry.ownOT,quantity:entry.quantity}));
    const {error}=await this.client.rpc('import_local_collection',{p_entries:payload});
    if(error)throw error;
    return this.getCloudSummary();
  }

  async restoreCloudCollection():Promise<CloudCollectionSummary>{
    const {data,error}=await this.client.rpc('get_collection_snapshot');
    if(error)throw error;
    const snapshot=(data??[]) as Array<{species_id:string;form_id:string;game_id:string;origin_game_id:string;shiny:boolean;alpha:boolean;own_ot:boolean;quantity:number}>;
    const entries:CollectionEntryInput[]=snapshot.map(entry=>({speciesId:entry.species_id,formId:entry.form_id,gameId:entry.game_id,originGameId:entry.origin_game_id,shiny:entry.shiny,alpha:entry.alpha,ownOT:entry.own_ot,quantity:entry.quantity}));
    await this.repository.replaceEntries(entries);
    return this.getLocalSummary();
  }
}
