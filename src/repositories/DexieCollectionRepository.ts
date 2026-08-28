import Dexie, { type EntityTable } from 'dexie';
import type { CollectionEntry, CollectionEntryInput } from '../domain/models';
import { normalizeVariantFormId } from '../domain/variantForms';
import type { CollectionRepository } from './CollectionRepository';

class LivingDexDatabase extends Dexie {
  entries!: EntityTable<CollectionEntry, 'id'>;
  constructor() { super('living-dex'); this.version(1).stores({ entries: 'id, speciesId, formId, gameId, shiny, ownOT, [speciesId+formId]' }); this.version(2).stores({ entries: 'id, speciesId, formId, gameId, originGameId, shiny, ownOT, [speciesId+formId]' }).upgrade(transaction=>transaction.table('entries').toCollection().modify(entry=>{entry.originGameId??=entry.gameId})); this.version(3).stores({ entries: 'id, speciesId, formId, gameId, originGameId, shiny, alpha, ownOT, [speciesId+formId]' }).upgrade(transaction=>transaction.table('entries').toCollection().modify(entry=>{entry.alpha??=false})); this.version(4).stores({ entries: 'id, speciesId, formId, gameId, originGameId, shiny, alpha, ownOT, [speciesId+formId]' }).upgrade(async transaction=>{const table=transaction.table<CollectionEntry>('entries');const entries=await table.toArray();const grouped=new Map<string,CollectionEntry>();for(const entry of entries){const normalized={...entry,formId:normalizeVariantFormId(entry.formId)};const key=[normalized.speciesId,normalized.formId,normalized.gameId,normalized.originGameId??normalized.gameId,String(normalized.shiny),String(normalized.alpha??false),String(normalized.ownOT)].join('|');const existing=grouped.get(key);if(existing){existing.quantity+=normalized.quantity;await table.delete(normalized.id)}else{grouped.set(key,normalized);if(normalized.formId!==entry.formId)await table.put(normalized)}}for(const entry of grouped.values())await table.put(entry)}); }
}
export class DexieCollectionRepository implements CollectionRepository {
  constructor(private readonly database = new LivingDexDatabase()) {}
  getEntries(){ return this.database.entries.toArray(); }
  getEntriesBySpecies(speciesId:string){ return this.database.entries.where('speciesId').equals(speciesId).toArray(); }
  async addEntry(input:CollectionEntryInput){ const now=new Date().toISOString(); const entry:CollectionEntry={...input,formId:normalizeVariantFormId(input.formId),alpha:input.alpha??false,id:crypto.randomUUID(),createdAt:now,updatedAt:now}; await this.database.entries.add(entry); return entry; }
  async updateEntry(id:string, changes:Partial<CollectionEntryInput>){ const existing=await this.database.entries.get(id); if(!existing) throw new Error('Collection entry not found'); const entry={...existing,...changes,...(changes.formId?{formId:normalizeVariantFormId(changes.formId)}:{}),id,updatedAt:new Date().toISOString()}; await this.database.entries.put(entry); return entry; }
  async removeEntry(id:string){ await this.database.entries.delete(id); }
  async replaceEntries(inputs:CollectionEntryInput[]){
    const now=new Date().toISOString();
    const entries=inputs.map(input=>({...input,formId:normalizeVariantFormId(input.formId),alpha:input.alpha??false,id:crypto.randomUUID(),createdAt:now,updatedAt:now}));
    await this.database.transaction('rw',this.database.entries,async()=>{await this.database.entries.clear();await this.database.entries.bulkAdd(entries)});
  }
}
export const collectionRepository: CollectionRepository = new DexieCollectionRepository();
