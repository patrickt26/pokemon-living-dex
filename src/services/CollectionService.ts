import type { CollectionEntry, CollectionEntryInput } from '../domain/models';
import { normalizeVariantFormId } from '../domain/variantForms';
import type { CollectionRepository } from '../repositories/CollectionRepository';
const normalizeInput=(input:CollectionEntryInput):CollectionEntryInput=>({...input,formId:normalizeVariantFormId(input.formId),originGameId:input.originGameId??input.gameId,alpha:input.alpha??false});
const entryKey=(entry:CollectionEntryInput)=>[entry.speciesId,entry.formId,entry.gameId,entry.originGameId??entry.gameId,String(entry.shiny),String(entry.alpha??false),String(entry.ownOT)].join('|');
export class CollectionService {
  constructor(private readonly repository:CollectionRepository){}
  list(){return this.repository.getEntries();}
  listSpecies(speciesId:string){return this.repository.getEntriesBySpecies(speciesId);}
  add(input:CollectionEntryInput){if(input.quantity<1) throw new Error('Quantity must be at least 1'); return this.repository.addEntry(normalizeInput(input));}
  update(id:string,changes:Partial<CollectionEntryInput>){return this.repository.updateEntry(id,{...changes,...(changes.formId?{formId:normalizeVariantFormId(changes.formId)}:{})});}
  async changeOne(id:string,changes:Partial<CollectionEntryInput>){
    const entries=await this.repository.getEntries(); const source=entries.find(entry=>entry.id===id); if(!source)throw new Error('Collection entry not found');
    const normalizedChanges={...changes,...(changes.formId?{formId:normalizeVariantFormId(changes.formId)}:{})};const changed={...source,...normalizedChanges,alpha:changes.alpha??source.alpha??false}; if(changed.ownOT===source.ownOT&&changed.shiny===source.shiny&&changed.alpha===(source.alpha??false)&&changed.gameId===source.gameId&&changed.originGameId===source.originGameId&&changed.formId===source.formId)return;
    const target=entries.find(entry=>entry.id!==source.id&&entry.speciesId===changed.speciesId&&entry.formId===changed.formId&&entry.gameId===changed.gameId&&entry.originGameId===changed.originGameId&&entry.shiny===changed.shiny&&(entry.alpha??false)===changed.alpha&&entry.ownOT===changed.ownOT);
    if(source.quantity===1){if(target)await this.repository.applyBatch({additions:[],updates:[{...target,quantity:target.quantity+1}],removals:[source.id]});else await this.repository.updateEntry(source.id,normalizedChanges);return}
    const sourceUpdate:CollectionEntry={...source,quantity:source.quantity-1};if(target)await this.repository.applyBatch({additions:[],updates:[sourceUpdate,{...target,quantity:target.quantity+1}],removals:[]});else await this.repository.applyBatch({additions:[{speciesId:changed.speciesId,formId:changed.formId,gameId:changed.gameId,originGameId:changed.originGameId,shiny:changed.shiny,alpha:changed.alpha,ownOT:changed.ownOT,quantity:1}],updates:[sourceUpdate],removals:[]});
  }
  async addOrIncrementMany(inputs:CollectionEntryInput[]){
    if(inputs.some(input=>input.quantity<1))throw new Error('Quantity must be at least 1');
    const entries=await this.repository.getEntries();const existingByKey=new Map(entries.map(entry=>[entryKey(entry),entry]));const updates=new Map<string,CollectionEntry>();const additions=new Map<string,CollectionEntryInput>();
    for(const raw of inputs){const input=normalizeInput(raw);const key=entryKey(input);const existing=existingByKey.get(key);if(existing){const current=updates.get(existing.id)??existing;updates.set(existing.id,{...current,quantity:current.quantity+input.quantity});continue}const pending=additions.get(key);additions.set(key,pending?{...pending,quantity:pending.quantity+input.quantity}:input)}
    await this.repository.applyBatch({additions:[...additions.values()],updates:[...updates.values()],removals:[]});
  }
  changeQuantity(id:string, quantity:number){if(quantity<=0) return this.repository.removeEntry(id); return this.repository.updateEntry(id,{quantity});}
  removeMany(ids:string[]){return this.repository.applyBatch({additions:[],updates:[],removals:[...new Set(ids)]});}
  remove(id:string){return this.repository.removeEntry(id);}
}
