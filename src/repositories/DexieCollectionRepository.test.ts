import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CollectionEntryInput } from '../domain/models';
import { DexieCollectionRepository } from './DexieCollectionRepository';

const input=(speciesId:string):CollectionEntryInput=>({speciesId,formId:`form-${speciesId.split('-')[1]}-default`,gameId:'home',originGameId:'home',shiny:false,alpha:false,ownOT:true,quantity:1});
const repository=new DexieCollectionRepository();

beforeEach(()=>repository.replaceEntries([]));
afterEach(()=>repository.replaceEntries([]));

describe('DexieCollectionRepository.applyBatch',()=>{
  it('adds, updates and removes entries atomically',async()=>{
    const updated=await repository.addEntry(input('species-25'));
    const removed=await repository.addEntry(input('species-26'));

    await repository.applyBatch({additions:[{...input('species-27'),quantity:3}],updates:[{...updated,quantity:5}],removals:[removed.id]});

    const entries=await repository.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries.find(entry=>entry.speciesId==='species-25')?.quantity).toBe(5);
    expect(entries.find(entry=>entry.speciesId==='species-26')).toBeUndefined();
    expect(entries.find(entry=>entry.speciesId==='species-27')?.quantity).toBe(3);
  });
});
