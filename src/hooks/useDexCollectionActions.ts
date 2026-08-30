import type { CollectionEntryIndex } from '../domain/collection';
import { hasMultipleOrigins } from '../domain/collection';
import type { AlphaFilter, CollectionEntry, OtFilter, PokemonForm, ShinyFilter } from '../domain/models';
import { useCollectionActions } from './useCollection';

interface Options {
  entries:CollectionEntry[];
  entryIndex:CollectionEntryIndex;
  gameId:string;
  ot:OtFilter;
  shiny:ShinyFilter;
  alpha:AlphaFilter;
  onSelect:(formId:string)=>void;
}

export function useDexCollectionActions({entries,entryIndex,gameId,ot,shiny,alpha,onSelect}:Options){
  const {add,addMany,changeQuantity,removeMany}=useCollectionActions();
  const shinyValue=shiny==='shiny';const alphaValue=alpha==='alpha';
  const quickToggle=(form:PokemonForm)=>{const relevant=entryIndex.byFormId.get(form.id)??[];if(hasMultipleOrigins(relevant)){onSelect(form.id);return}const existing=relevant.find(entry=>entry.gameId===gameId&&entry.ownOT===(ot!=='other')&&entry.shiny===shinyValue&&entry.alpha===alphaValue)??relevant[0];if(existing)changeQuantity.mutate({id:existing.id,quantity:existing.quantity-1});else add.mutate({speciesId:form.speciesId,formId:form.id,gameId,originGameId:gameId,ownOT:ot!=='other',shiny:shinyValue,alpha:alphaValue,quantity:1})};
  const addForms=(forms:PokemonForm[],eligible:(form:PokemonForm)=>boolean=()=>true)=>addMany.mutate(forms.filter(eligible).map(form=>({speciesId:form.speciesId,formId:form.id,gameId,originGameId:gameId,ownOT:true,shiny:shinyValue,alpha:alphaValue,quantity:1})));
  const clearForms=(forms:PokemonForm[])=>{const ids=new Set(forms.map(form=>form.id));removeMany.mutate(entries.filter(entry=>ids.has(entry.formId)&&(shiny==='all'||entry.shiny===shinyValue)&&(alpha==='all'||entry.alpha===alphaValue)).map(entry=>entry.id))};
  return {quickToggle,addForms,clearForms,addMany,removeMany};
}
