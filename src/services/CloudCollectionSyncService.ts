import type { SupabaseClient } from '@supabase/supabase-js';
import type { CollectionEntryInput } from '../domain/models';
import type { CollectionRepository } from '../repositories/CollectionRepository';
import { CloudCollectionService, collectionFingerprint, type CloudCollectionSnapshot } from './CloudCollectionService';

interface StoredBaseline { revision:number; fingerprint:string }
interface SyncStorage { getItem(key:string):string|null; setItem(key:string,value:string):void; removeItem(key:string):void }
export type CloudSyncResult={status:'synced';direction:'none'|'cloud'|'device';revision:number}|{status:'setup'|'conflict'};

const baselineKey=(userId:string)=>`living-dex:cloud-sync:${userId}`;

export class CloudCollectionSyncService {
  private readonly cloud:CloudCollectionService;

  constructor(private readonly repository:CollectionRepository,client:SupabaseClient,private readonly storage:SyncStorage=window.localStorage){
    this.cloud=new CloudCollectionService(repository,client);
  }

  private getBaseline(userId:string):StoredBaseline|null{
    try{
      const value=this.storage.getItem(baselineKey(userId));
      if(!value)return null;
      const parsed=JSON.parse(value) as Partial<StoredBaseline>;
      return typeof parsed.revision==='number'&&typeof parsed.fingerprint==='string'?{revision:parsed.revision,fingerprint:parsed.fingerprint}:null;
    }catch{return null}
  }

  private saveBaseline(userId:string,revision:number,entries:CollectionEntryInput[]){
    this.storage.setItem(baselineKey(userId),JSON.stringify({revision,fingerprint:collectionFingerprint(entries)} satisfies StoredBaseline));
  }

  clearBaseline(userId:string){this.storage.removeItem(baselineKey(userId))}

  private async pull(userId:string,snapshot:CloudCollectionSnapshot):Promise<CloudSyncResult>{
    await this.repository.replaceEntries(snapshot.entries);
    this.saveBaseline(userId,snapshot.revision,snapshot.entries);
    return {status:'synced',direction:'device',revision:snapshot.revision};
  }

  private async push(userId:string,snapshot:CloudCollectionSnapshot,entries:CollectionEntryInput[]):Promise<CloudSyncResult>{
    try{
      const revision=await this.cloud.replaceCloudCollection(snapshot.revision,entries);
      this.saveBaseline(userId,revision,entries);
      return {status:'synced',direction:'cloud',revision};
    }catch(error){
      if(typeof error==='object'&&error&&'code'in error&&(error as {code?:string}).code==='40001')return {status:'conflict'};
      throw error;
    }
  }

  async synchronize(userId:string):Promise<CloudSyncResult>{
    const [localEntries,cloudSnapshot]=await Promise.all([this.repository.getEntries(),this.cloud.getCloudSnapshot()]);
    const localInputs:CollectionEntryInput[]=localEntries.map(({speciesId,formId,gameId,originGameId,shiny,alpha,ownOT,quantity})=>({speciesId,formId,gameId,originGameId,shiny,alpha,ownOT,quantity}));
    const localFingerprint=collectionFingerprint(localInputs);
    const cloudFingerprint=collectionFingerprint(cloudSnapshot.entries);
    const baseline=this.getBaseline(userId);

    if(!baseline){
      if(localInputs.length===0&&cloudSnapshot.entries.length>0)return this.pull(userId,cloudSnapshot);
      if(localInputs.length>0&&cloudSnapshot.entries.length===0)return {status:'setup'};
      if(localFingerprint!==cloudFingerprint)return {status:'conflict'};
      this.saveBaseline(userId,cloudSnapshot.revision,localInputs);
      return {status:'synced',direction:'none',revision:cloudSnapshot.revision};
    }

    const localChanged=localFingerprint!==baseline.fingerprint;
    const cloudChanged=cloudSnapshot.revision!==baseline.revision;
    if(localFingerprint===cloudFingerprint){
      this.saveBaseline(userId,cloudSnapshot.revision,localInputs);
      return {status:'synced',direction:'none',revision:cloudSnapshot.revision};
    }
    if(localChanged&&cloudChanged)return {status:'conflict'};
    if(localChanged)return this.push(userId,cloudSnapshot,localInputs);
    if(cloudChanged)return this.pull(userId,cloudSnapshot);

    return {status:'conflict'};
  }

  async keepDeviceCollection(userId:string):Promise<CloudSyncResult>{
    const [entries,snapshot]=await Promise.all([this.repository.getEntries(),this.cloud.getCloudSnapshot()]);
    const inputs:CollectionEntryInput[]=entries.map(({speciesId,formId,gameId,originGameId,shiny,alpha,ownOT,quantity})=>({speciesId,formId,gameId,originGameId,shiny,alpha,ownOT,quantity}));
    return this.push(userId,snapshot,inputs);
  }

  async keepCloudCollection(userId:string):Promise<CloudSyncResult>{
    return this.pull(userId,await this.cloud.getCloudSnapshot());
  }
}
