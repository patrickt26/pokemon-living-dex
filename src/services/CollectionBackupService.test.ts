import { describe,expect,it } from 'vitest';
import type { CollectionEntry,CollectionEntryInput } from '../domain/models';
import type { CollectionRepository } from '../repositories/CollectionRepository';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { CollectionBackupService } from './CollectionBackupService';

class MemoryRepository implements CollectionRepository{
  constructor(public entries:CollectionEntry[]=[]){ }
  async getEntries(){return this.entries}
  async getEntriesBySpecies(speciesId:string){return this.entries.filter(entry=>entry.speciesId===speciesId)}
  async addEntry(input:CollectionEntryInput){const entry:CollectionEntry={...input,alpha:input.alpha??false,id:String(this.entries.length),createdAt:'x',updatedAt:'x'};this.entries.push(entry);return entry}
  async updateEntry(id:string,changes:Partial<CollectionEntryInput>){const entry=this.entries.find(candidate=>candidate.id===id)!;Object.assign(entry,changes);return entry}
  async removeEntry(id:string){this.entries=this.entries.filter(entry=>entry.id!==id)}
  async replaceEntries(inputs:CollectionEntryInput[]){this.entries=inputs.map((input,index)=>({...input,alpha:input.alpha??false,id:String(index),createdAt:'x',updatedAt:'x'}))}
}
const input:CollectionEntryInput={speciesId:'species-25',formId:'form-25-default',gameId:'home',originGameId:'home',shiny:false,alpha:false,ownOT:true,quantity:2};
const storedInput:CollectionEntry={...input,alpha:false,id:'old',createdAt:'x',updatedAt:'x'};
describe('CollectionBackupService',()=>{
  it('validates and previews a versioned backup',()=>{const service=new CollectionBackupService(new MemoryRepository(),pokemonDataSource);expect(service.parse(JSON.stringify({version:1,exportedAt:'2026-01-01',entries:[input]}))).toMatchObject({entries:1,totalQuantity:2,species:1})});
  it('defaults Alpha to false when parsing an older backup',()=>{const service=new CollectionBackupService(new MemoryRepository(),pokemonDataSource);const legacyInput={...input};delete legacyInput.alpha;const preview=service.parse(JSON.stringify({version:1,exportedAt:'2026-01-01',entries:[legacyInput]}));expect(preview.backup.entries[0]?.alpha).toBe(false)});
  it('reports duplicate records in the preview without losing them',()=>{const service=new CollectionBackupService(new MemoryRepository(),pokemonDataSource);const preview=service.parse(JSON.stringify({version:1,exportedAt:'2026-01-01',entries:[input,{...input,quantity:1}]}));expect(preview.duplicates).toBe(1);expect(preview.entries).toBe(2)});
  it('exports collection entries as escaped CSV',async()=>{const service=new CollectionBackupService(new MemoryRepository([{...storedInput,id:'1'}]),pokemonDataSource);const csv=await service.exportCsv();expect(csv).toContain('"National Dex","Pokémon","Form"');expect(csv).toContain('"25","Pikachu"');expect(csv.split('\n')).toHaveLength(2)});
  it('reports invalid local collection entries',async()=>{const invalid:CollectionEntry={...storedInput,id:'bad',formId:'form-26-default',quantity:0};const service=new CollectionBackupService(new MemoryRepository([invalid]),pokemonDataSource);const issues=await service.validateCollection();expect(issues.map(issue=>issue.message)).toEqual(expect.arrayContaining(['Form does not belong to the species.','Quantity must be a positive integer.']))});
  it('rejects catalog ids that do not exist',()=>{const service=new CollectionBackupService(new MemoryRepository(),pokemonDataSource);expect(()=>service.parse(JSON.stringify({version:1,exportedAt:'2026-01-01',entries:[{...input,speciesId:'missing'}]}))).toThrow('unknown species')});
  it('merges matching entries by summing their quantities',async()=>{const repository=new MemoryRepository([{...storedInput}]);const service=new CollectionBackupService(repository,pokemonDataSource);await service.importCollection({version:1,exportedAt:'2026-01-01',entries:[{...input,quantity:3}]},'merge');expect(repository.entries).toHaveLength(1);expect(repository.entries[0]?.quantity).toBe(5)});
  it('keeps Alpha and regular entries separate when merging',async()=>{const repository=new MemoryRepository([{...storedInput}]);const service=new CollectionBackupService(repository,pokemonDataSource);await service.importCollection({version:1,exportedAt:'2026-01-01',entries:[{...input,alpha:true}]},'merge');expect(repository.entries).toHaveLength(2);expect(repository.entries.map(entry=>entry.alpha)).toEqual([false,true])});
  it('replaces the existing collection',async()=>{const repository=new MemoryRepository([{...storedInput}]);const service=new CollectionBackupService(repository,pokemonDataSource);await service.importCollection({version:1,exportedAt:'2026-01-01',entries:[{...input,speciesId:'species-26',formId:'form-26-default'}]},'replace');expect(repository.entries).toHaveLength(1);expect(repository.entries[0]?.speciesId).toBe('species-26')});
});
