import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import type { CollectionEntry, CollectionEntryInput } from '../domain/models';
import type { CollectionRepository } from '../repositories/CollectionRepository';
import { CloudCollectionSyncService } from './CloudCollectionSyncService';

const input=(quantity=1):CollectionEntryInput=>({speciesId:'species-25',formId:'form-25',gameId:'sv',originGameId:'home',shiny:false,alpha:false,ownOT:true,quantity});
const stored=(value:CollectionEntryInput,id='entry-1'):CollectionEntry=>({...value,id,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z',alpha:value.alpha??false});
const cloudEntry=(value:CollectionEntryInput)=>({species_id:value.speciesId,form_id:value.formId,game_id:value.gameId,origin_game_id:value.originGameId??value.gameId,shiny:value.shiny,alpha:value.alpha??false,own_ot:value.ownOT,quantity:value.quantity});

function setup(local:CollectionEntryInput[],remote:CollectionEntryInput[],revision=remote.length?1:0){
  let localEntries=local.map((entry,index)=>stored(entry,`local-${index}`));
  let cloudEntries=remote.map(cloudEntry);
  let cloudRevision=revision;
  const repository={
    getEntries:vi.fn(async()=>localEntries),
    getEntriesBySpecies:vi.fn(),addEntry:vi.fn(),updateEntry:vi.fn(),removeEntry:vi.fn(),applyBatch:vi.fn(),
    replaceEntries:vi.fn(async(entries:CollectionEntryInput[])=>{localEntries=entries.map((entry,index)=>stored(entry,`restored-${index}`))}),
  } satisfies CollectionRepository;
  const rpc=vi.fn(async(name:string,args?:Record<string,unknown>)=>{
    if(name==='get_collection_sync_snapshot')return {data:{revision:cloudRevision,entries:cloudEntries},error:null};
    if(name==='replace_cloud_collection'){
      if(args?.p_expected_revision!==cloudRevision)return {data:null,error:{code:'40001'}};
      cloudEntries=(args?.p_entries as typeof cloudEntries)??[];
      cloudRevision+=1;
      return {data:cloudRevision,error:null};
    }
    return {data:null,error:null};
  });
  const values=new Map<string,string>();
  const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)},removeItem:(key:string)=>{values.delete(key)}};
  const service=new CloudCollectionSyncService(repository,{rpc} as unknown as SupabaseClient,storage);
  return {service,repository,rpc,getLocal:()=>localEntries,getRemote:()=>cloudEntries,setLocal:(entries:CollectionEntryInput[])=>{localEntries=entries.map((entry,index)=>stored(entry,`changed-${index}`))},setRemote:(entries:CollectionEntryInput[])=>{cloudEntries=entries.map(cloudEntry);cloudRevision+=1}};
}

describe('CloudCollectionSyncService',()=>{
  it('waits for confirmation before the first upload to an empty cloud',async()=>{
    const context=setup([input(2)],[]);
    await expect(context.service.synchronize('user-1')).resolves.toEqual({status:'setup'});
    expect(context.getRemote()).toEqual([]);

    await expect(context.service.keepDeviceCollection('user-1')).resolves.toMatchObject({status:'synced',direction:'cloud'});
    expect(context.getRemote()).toEqual([cloudEntry(input(2))]);
    expect(context.repository.replaceEntries).not.toHaveBeenCalled();
  });

  it('restores a cloud collection when the device is empty',async()=>{
    const context=setup([],[input(3)]);
    await expect(context.service.synchronize('user-1')).resolves.toMatchObject({status:'synced',direction:'device'});
    expect(context.getLocal()[0]!.quantity).toBe(3);
  });

  it('uploads later device-only changes',async()=>{
    const context=setup([input()],[input()]);
    await context.service.synchronize('user-1');
    context.setLocal([input(4)]);
    await expect(context.service.synchronize('user-1')).resolves.toMatchObject({status:'synced',direction:'cloud'});
    expect(context.getRemote()).toEqual([cloudEntry(input(4))]);
  });

  it('downloads later cloud-only changes',async()=>{
    const context=setup([input()],[input()]);
    await context.service.synchronize('user-1');
    context.setRemote([input(5)]);
    await expect(context.service.synchronize('user-1')).resolves.toMatchObject({status:'synced',direction:'device'});
    expect(context.getLocal()[0]!.quantity).toBe(5);
  });

  it('does not overwrite either side when both changed',async()=>{
    const context=setup([input()],[input()]);
    await context.service.synchronize('user-1');
    context.setLocal([input(2)]);
    context.setRemote([input(3)]);
    await expect(context.service.synchronize('user-1')).resolves.toEqual({status:'conflict'});
    expect(context.getLocal()[0]!.quantity).toBe(2);
    expect(context.getRemote()).toEqual([cloudEntry(input(3))]);
  });
});
