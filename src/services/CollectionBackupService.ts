import type { PokemonDataSource } from '../data/PokemonDataSource';
import type { CollectionEntryInput } from '../domain/models';
import { normalizeVariantFormId } from '../domain/variantForms';
import type { CollectionRepository } from '../repositories/CollectionRepository';

export const COLLECTION_BACKUP_VERSION = 1;
export interface CollectionBackup { version:1; exportedAt:string; entries:CollectionEntryInput[] }
export interface BackupPreview { backup:CollectionBackup; entries:number; totalQuantity:number; species:number; duplicates:number }
export type ImportMode = 'merge'|'replace';
export interface IntegrityIssue { entryId:string; message:string }
const isRecord=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);

export class CollectionBackupService {
  constructor(private readonly repository:CollectionRepository,private readonly dataSource:PokemonDataSource){}
  async exportCollection():Promise<CollectionBackup>{
    const entries=await this.repository.getEntries();
    return {version:1,exportedAt:new Date().toISOString(),entries:entries.map(({speciesId,formId,shiny,alpha,gameId,ownOT,quantity,originGameId})=>({speciesId,formId,shiny,alpha:alpha??false,gameId,ownOT,quantity,originGameId}))};
  }
  async exportCsv():Promise<string>{const entries=await this.repository.getEntries();const species=new Map(this.dataSource.getSpecies().map(item=>[item.id,item]));const forms=new Map(this.dataSource.getForms().map(item=>[item.id,item]));const games=new Map(this.dataSource.getGames().map(item=>[item.id,item]));const escape=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`;const rows=[['National Dex','Pokémon','Form','Shiny','Alpha','Game','Origin game','Own OT','Quantity'],...entries.map(entry=>[species.get(entry.speciesId)?.nationalDexNumber??'',species.get(entry.speciesId)?.name??entry.speciesId,forms.get(entry.formId)?.name??entry.formId,entry.shiny?'Yes':'No',entry.alpha?'Yes':'No',games.get(entry.gameId)?.name??entry.gameId,games.get(entry.originGameId??entry.gameId)?.name??entry.originGameId??entry.gameId,entry.ownOT?'Yes':'No',entry.quantity])];return rows.map(row=>row.map(escape).join(',')).join('\n');}
  async validateCollection():Promise<IntegrityIssue[]>{const entries=await this.repository.getEntries();const speciesIds=new Set(this.dataSource.getSpecies().map(item=>item.id));const forms=new Map(this.dataSource.getForms().map(item=>[item.id,item]));const gameIds=new Set(this.dataSource.getGames().map(item=>item.id));const issues:IntegrityIssue[]=[];for(const entry of entries){if(!speciesIds.has(entry.speciesId))issues.push({entryId:entry.id,message:'Unknown species.'});else if(forms.get(entry.formId)?.speciesId!==entry.speciesId)issues.push({entryId:entry.id,message:'Form does not belong to the species.'});if(!gameIds.has(entry.gameId))issues.push({entryId:entry.id,message:'Unknown game.'});if(entry.originGameId!==undefined&&!gameIds.has(entry.originGameId))issues.push({entryId:entry.id,message:'Unknown origin game.'});if(!Number.isSafeInteger(entry.quantity)||entry.quantity<1)issues.push({entryId:entry.id,message:'Quantity must be a positive integer.'});}return issues;}
  parse(text:string):BackupPreview{
    let raw:unknown;try{raw=JSON.parse(text)}catch{throw new Error('The selected file is not valid JSON.')}
    if(!isRecord(raw)||raw.version!==COLLECTION_BACKUP_VERSION||typeof raw.exportedAt!=='string'||!Array.isArray(raw.entries))throw new Error('Unsupported or invalid Living Dex backup.');
    const speciesIds=new Set(this.dataSource.getSpecies().map(species=>species.id));const forms=new Map(this.dataSource.getForms().map(form=>[form.id,form]));const gameIds=new Set(this.dataSource.getGames().map(game=>game.id));
    const entries=raw.entries.map((value,index)=>{if(!isRecord(value))throw new Error(`Entry ${index+1} is invalid.`);const {speciesId,formId,gameId,originGameId,shiny,alpha,ownOT,quantity}=value;if(typeof speciesId!=='string'||!speciesIds.has(speciesId))throw new Error(`Entry ${index+1} has an unknown species.`);if(typeof formId!=='string')throw new Error(`Entry ${index+1} has an invalid form.`);const normalizedFormId=normalizeVariantFormId(formId);if(forms.get(normalizedFormId)?.speciesId!==speciesId)throw new Error(`Entry ${index+1} has an invalid form.`);if(typeof gameId!=='string'||!gameIds.has(gameId))throw new Error(`Entry ${index+1} has an unknown game.`);if(originGameId!==undefined&&(typeof originGameId!=='string'||!gameIds.has(originGameId)))throw new Error(`Entry ${index+1} has an unknown origin game.`);if(typeof shiny!=='boolean'||(alpha!==undefined&&typeof alpha!=='boolean')||typeof ownOT!=='boolean'||typeof quantity!=='number'||!Number.isSafeInteger(quantity)||quantity<1)throw new Error(`Entry ${index+1} has invalid collection values.`);return {speciesId,formId:normalizedFormId,gameId,originGameId:originGameId as string|undefined,shiny,alpha:alpha??false,ownOT,quantity}});
    const keys=entries.map(entry=>[entry.speciesId,entry.formId,entry.gameId,entry.originGameId??entry.gameId,String(entry.shiny),String(entry.alpha),String(entry.ownOT)].join('|'));const duplicates=keys.length-new Set(keys).size;const backup:CollectionBackup={version:1,exportedAt:raw.exportedAt,entries};return {backup,entries:entries.length,totalQuantity:entries.reduce((sum,entry)=>sum+entry.quantity,0),species:new Set(entries.map(entry=>entry.speciesId)).size,duplicates};
  }
  async importCollection(backup:CollectionBackup,mode:ImportMode){
    if(mode==='replace'){await this.repository.replaceEntries(this.consolidate(backup.entries));return}
    const current=await this.repository.getEntries();const inputs=current.map(({speciesId,formId,shiny,alpha,gameId,ownOT,quantity,originGameId})=>({speciesId,formId,shiny,alpha:alpha??false,gameId,ownOT,quantity,originGameId}));await this.repository.replaceEntries(this.consolidate([...inputs,...backup.entries]));
  }
  private consolidate(entries:CollectionEntryInput[]){const grouped=new Map<string,CollectionEntryInput>();for(const entry of entries){const normalized={...entry,formId:normalizeVariantFormId(entry.formId),originGameId:entry.originGameId??entry.gameId,alpha:entry.alpha??false};const key=[normalized.speciesId,normalized.formId,normalized.gameId,normalized.originGameId,String(normalized.shiny),String(normalized.alpha),String(normalized.ownOT)].join('|');const existing=grouped.get(key);if(existing)existing.quantity+=normalized.quantity;else grouped.set(key,normalized)}return [...grouped.values()]}
}
