import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import type { CollectionEntry } from '../domain/models';
import type { CollectionRepository } from '../repositories/CollectionRepository';
import { CloudCollectionService } from './CloudCollectionService';

const entry:CollectionEntry={id:'entry-1',speciesId:'species-25',formId:'form-25',gameId:'sv',originGameId:'home',shiny:true,alpha:false,ownOT:true,quantity:2,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'};

function setup(){
  const repository={getEntries:vi.fn().mockResolvedValue([entry]),getEntriesBySpecies:vi.fn(),addEntry:vi.fn(),updateEntry:vi.fn(),removeEntry:vi.fn(),applyBatch:vi.fn(),replaceEntries:vi.fn()} satisfies CollectionRepository;
  const rpc=vi.fn().mockImplementation((name:string)=>Promise.resolve(name==='get_collection_summary'?{data:[{entries:1,species:1,total_quantity:2}],error:null}:name==='get_collection_snapshot'?{data:[{species_id:'species-25',form_id:'form-25',game_id:'sv',origin_game_id:'home',shiny:true,alpha:false,own_ot:true,quantity:2}],error:null}:name==='get_collection_sync_snapshot'?{data:{revision:3,entries:[{species_id:'species-25',form_id:'form-25',game_id:'sv',origin_game_id:'home',shiny:true,alpha:false,own_ot:true,quantity:2}]},error:null}:{data:4,error:null}));
  const client={rpc} as unknown as SupabaseClient;
  return {repository,client,rpc,service:new CloudCollectionService(repository,client)};
}

describe('CloudCollectionService',()=>{
  it('summarizes the existing local collection without changing it',async()=>{
    const {repository,service}=setup();
    await expect(service.getLocalSummary()).resolves.toEqual({entries:1,species:1,totalQuantity:2});
    expect(repository.addEntry).not.toHaveBeenCalled();
    expect(repository.updateEntry).not.toHaveBeenCalled();
    expect(repository.removeEntry).not.toHaveBeenCalled();
    expect(repository.replaceEntries).not.toHaveBeenCalled();
  });

  it('sends a normalized snapshot through the atomic import function',async()=>{
    const {repository,rpc,service}=setup();
    await expect(service.importLocalCollection()).resolves.toEqual({entries:1,species:1,totalQuantity:2});
    expect(rpc).toHaveBeenCalledWith('import_local_collection',{p_entries:[{species_id:'species-25',form_id:'form-25',game_id:'sv',origin_game_id:'home',shiny:true,alpha:false,own_ot:true,quantity:2}]});
    expect(rpc).toHaveBeenCalledWith('get_collection_summary');
    expect(repository.replaceEntries).not.toHaveBeenCalled();
  });

  it('only replaces local data when cloud restoration is explicitly requested',async()=>{
    const {repository,service}=setup();
    await service.restoreCloudCollection();
    expect(repository.replaceEntries).toHaveBeenCalledWith([{speciesId:'species-25',formId:'form-25',gameId:'sv',originGameId:'home',shiny:true,alpha:false,ownOT:true,quantity:2}]);
  });

  it('reads and replaces revisioned cloud snapshots',async()=>{
    const {rpc,service}=setup();
    await expect(service.getCloudSnapshot()).resolves.toEqual({revision:3,entries:[{speciesId:'species-25',formId:'form-25',gameId:'sv',originGameId:'home',shiny:true,alpha:false,ownOT:true,quantity:2}]});
    await expect(service.replaceCloudCollection(3)).resolves.toBe(4);
    expect(rpc).toHaveBeenCalledWith('replace_cloud_collection',{p_entries:[{species_id:'species-25',form_id:'form-25',game_id:'sv',origin_game_id:'home',shiny:true,alpha:false,own_ot:true,quantity:2}],p_expected_revision:3});
  });
});
