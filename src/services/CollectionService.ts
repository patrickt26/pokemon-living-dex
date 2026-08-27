import type { CollectionEntryInput } from '../domain/models';
import type { CollectionRepository } from '../repositories/CollectionRepository';
export class CollectionService {
  constructor(private readonly repository:CollectionRepository){}
  list(){return this.repository.getEntries();}
  listSpecies(speciesId:string){return this.repository.getEntriesBySpecies(speciesId);}
  add(input:CollectionEntryInput){if(input.quantity<1) throw new Error('Quantity must be at least 1'); return this.repository.addEntry({...input,originGameId:input.originGameId??input.gameId,alpha:input.alpha??false});}
  update(id:string,changes:Partial<CollectionEntryInput>){return this.repository.updateEntry(id,changes);}
  async changeOne(id:string,changes:Partial<CollectionEntryInput>){
    const entries=await this.repository.getEntries(); const source=entries.find(entry=>entry.id===id); if(!source)throw new Error('Collection entry not found');
    const changed={...source,...changes,alpha:changes.alpha??source.alpha??false}; if(changed.ownOT===source.ownOT&&changed.shiny===source.shiny&&changed.alpha===(source.alpha??false)&&changed.gameId===source.gameId&&changed.originGameId===source.originGameId&&changed.formId===source.formId)return;
    const target=entries.find(entry=>entry.id!==source.id&&entry.speciesId===changed.speciesId&&entry.formId===changed.formId&&entry.gameId===changed.gameId&&entry.originGameId===changed.originGameId&&entry.shiny===changed.shiny&&(entry.alpha??false)===changed.alpha&&entry.ownOT===changed.ownOT);
    if(source.quantity===1){if(target){await this.repository.updateEntry(target.id,{quantity:target.quantity+1});await this.repository.removeEntry(source.id)}else await this.repository.updateEntry(source.id,changes);return}
    await this.repository.updateEntry(source.id,{quantity:source.quantity-1}); if(target)await this.repository.updateEntry(target.id,{quantity:target.quantity+1});else await this.repository.addEntry({speciesId:changed.speciesId,formId:changed.formId,gameId:changed.gameId,originGameId:changed.originGameId,shiny:changed.shiny,alpha:changed.alpha,ownOT:changed.ownOT,quantity:1});
  }
  async addOrIncrementMany(inputs:CollectionEntryInput[]){const entries=await this.repository.getEntries();for(const raw of inputs){const input={...raw,originGameId:raw.originGameId??raw.gameId,alpha:raw.alpha??false};const existing=entries.find(entry=>entry.speciesId===input.speciesId&&entry.formId===input.formId&&entry.gameId===input.gameId&&(entry.originGameId??entry.gameId)===input.originGameId&&entry.shiny===input.shiny&&(entry.alpha??false)===input.alpha&&entry.ownOT===input.ownOT);if(existing){existing.quantity+=input.quantity;await this.repository.updateEntry(existing.id,{quantity:existing.quantity})}else{const created=await this.repository.addEntry(input);entries.push(created)}}}
  changeQuantity(id:string, quantity:number){if(quantity<=0) return this.repository.removeEntry(id); return this.repository.updateEntry(id,{quantity});}
  async removeMany(ids:string[]){await Promise.all(ids.map(id=>this.repository.removeEntry(id)));}
  remove(id:string){return this.repository.removeEntry(id);}
}
