import { describe, expect, it } from 'vitest';
import type { CollectionEntry, CollectionEntryInput } from '../domain/models';
import type { CollectionRepository } from '../repositories/CollectionRepository';
import { CollectionService } from './CollectionService';

class MemoryCollectionRepository implements CollectionRepository {
  constructor(public entries:CollectionEntry[]){}
  async getEntries(){return this.entries.map(entry=>({...entry}));}
  async getEntriesBySpecies(speciesId:string){return this.entries.filter(entry=>entry.speciesId===speciesId);}
  async addEntry(input:CollectionEntryInput){const entry:CollectionEntry={...input,alpha:input.alpha??false,id:`entry-${this.entries.length+1}`,createdAt:'2026-01-01',updatedAt:'2026-01-01'};this.entries.push(entry);return entry;}
  async updateEntry(id:string,changes:Partial<CollectionEntryInput>){const index=this.entries.findIndex(entry=>entry.id===id);if(index<0)throw new Error('Not found');const updated={...this.entries[index]!,...changes,updatedAt:'2026-01-02'};this.entries[index]=updated;return updated;}
  async removeEntry(id:string){this.entries=this.entries.filter(entry=>entry.id!==id);}
  async replaceEntries(inputs:CollectionEntryInput[]){this.entries=inputs.map((input,index)=>({...input,alpha:input.alpha??false,id:`replacement-${index}`,createdAt:'2026-01-01',updatedAt:'2026-01-01'}));}
}

const pikachu:CollectionEntry={id:'own',speciesId:'species-25',formId:'form-25-default',gameId:'home',originGameId:'home',shiny:false,alpha:false,ownOT:true,quantity:4,createdAt:'2026-01-01',updatedAt:'2026-01-01'};

describe('CollectionService.changeOne',()=>{
  it('normalizes a missing origin game when adding',async()=>{const repository=new MemoryCollectionRepository([]);const service=new CollectionService(repository);await service.add({...pikachu,originGameId:undefined});expect(repository.entries[0]?.originGameId).toBe('home')});
  it('defaults Alpha to false when adding older input',async()=>{const repository=new MemoryCollectionRepository([]);const service=new CollectionService(repository);const legacyInput:CollectionEntryInput={...pikachu};delete legacyInput.alpha;await service.add(legacyInput);expect(repository.entries[0]?.alpha).toBe(false)});
  it('normalizes a former standard variant when adding it',async()=>{const repository=new MemoryCollectionRepository([]);const service=new CollectionService(repository);await service.add({...pikachu,speciesId:'species-201',formId:'form-201-a'});expect(repository.entries[0]?.formId).toBe('form-201-default')});
  it('splits one copy when editing an aggregated entry',async()=>{const repository=new MemoryCollectionRepository([{...pikachu}]);const service=new CollectionService(repository);await service.changeOne('own',{ownOT:false});expect(repository.entries).toHaveLength(2);expect(repository.entries.find(entry=>entry.ownOT)?.quantity).toBe(3);expect(repository.entries.find(entry=>!entry.ownOT)?.quantity).toBe(1)});
  it('merges the edited copy into an existing matching entry',async()=>{const repository=new MemoryCollectionRepository([{...pikachu,quantity:3},{...pikachu,id:'other',ownOT:false,quantity:1}]);const service=new CollectionService(repository);await service.changeOne('other',{ownOT:true});expect(repository.entries).toHaveLength(1);expect(repository.entries[0]).toMatchObject({ownOT:true,quantity:4})});
  it('changes the form of only one copy from an aggregated entry',async()=>{const repository=new MemoryCollectionRepository([{...pikachu,quantity:3}]);const service=new CollectionService(repository);await service.changeOne('own',{formId:'form-25-alternate'});expect(repository.entries).toHaveLength(2);expect(repository.entries.find(entry=>entry.formId==='form-25-default')?.quantity).toBe(2);expect(repository.entries.find(entry=>entry.formId==='form-25-alternate')?.quantity).toBe(1)});
  it('changes the game and origin of only one copy from an aggregated entry',async()=>{const repository=new MemoryCollectionRepository([{...pikachu,quantity:3}]);const service=new CollectionService(repository);await service.changeOne('own',{gameId:'go',originGameId:'go'});expect(repository.entries).toHaveLength(2);expect(repository.entries.find(entry=>entry.gameId==='home')?.quantity).toBe(2);expect(repository.entries.find(entry=>entry.gameId==='go')).toMatchObject({originGameId:'go',quantity:1})});
  it('splits one Alpha copy from a regular aggregated entry',async()=>{const repository=new MemoryCollectionRepository([{...pikachu,quantity:3}]);const service=new CollectionService(repository);await service.changeOne('own',{alpha:true});expect(repository.entries).toHaveLength(2);expect(repository.entries.find(entry=>!entry.alpha)?.quantity).toBe(2);expect(repository.entries.find(entry=>entry.alpha)?.quantity).toBe(1)});
});
