import Dexie, { type EntityTable } from 'dexie';
import type { CollectionEntry, CollectionEntryInput } from '../domain/models';
import type { CollectionRepository } from './CollectionRepository';

class LivingDexDatabase extends Dexie {
  entries!: EntityTable<CollectionEntry, 'id'>;
  constructor() { super('living-dex'); this.version(1).stores({ entries: 'id, speciesId, formId, gameId, shiny, ownOT, [speciesId+formId]' }); this.version(2).stores({ entries: 'id, speciesId, formId, gameId, originGameId, shiny, ownOT, [speciesId+formId]' }).upgrade(transaction=>transaction.table('entries').toCollection().modify(entry=>{entry.originGameId??=entry.gameId})); }
}
export class DexieCollectionRepository implements CollectionRepository {
  constructor(private readonly database = new LivingDexDatabase()) {}
  getEntries(){ return this.database.entries.toArray(); }
  getEntriesBySpecies(speciesId:string){ return this.database.entries.where('speciesId').equals(speciesId).toArray(); }
  async addEntry(input:CollectionEntryInput){ const now=new Date().toISOString(); const entry:CollectionEntry={...input,id:crypto.randomUUID(),createdAt:now,updatedAt:now}; await this.database.entries.add(entry); return entry; }
  async updateEntry(id:string, changes:Partial<CollectionEntryInput>){ const existing=await this.database.entries.get(id); if(!existing) throw new Error('Collection entry not found'); const entry={...existing,...changes,id,updatedAt:new Date().toISOString()}; await this.database.entries.put(entry); return entry; }
  async removeEntry(id:string){ await this.database.entries.delete(id); }
  async replaceEntries(inputs:CollectionEntryInput[]){
    const now=new Date().toISOString();
    const entries=inputs.map(input=>({...input,id:crypto.randomUUID(),createdAt:now,updatedAt:now}));
    await this.database.transaction('rw',this.database.entries,async()=>{await this.database.entries.clear();await this.database.entries.bulkAdd(entries)});
  }
}
export const collectionRepository: CollectionRepository = new DexieCollectionRepository();
