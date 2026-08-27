import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton } from '../components/ConfirmButton';
import { DexFilters } from '../components/DexFilters';
import { PokemonBox } from '../components/PokemonBox';
import { PokemonDetails } from '../components/PokemonDetails';
import { ProgressBar } from '../components/ProgressBar';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { isAlphaEligibleSpecies } from '../domain/alpha';
import { filterEntries, hasMultipleOrigins, isFormOwned } from '../domain/collection';
import type { AlphaFilter, OtFilter, OwnershipFilter, PokemonForm, ShinyFilter } from '../domain/models';
import { useCollection, useCollectionActions } from '../hooks/useCollection';
import { useI18n } from '../i18n';
import { useUiStore } from '../store/uiStore';

export function SpecialFormsPage(){
  const {data:entries=[]}=useCollection();
  const {add,addMany,changeQuantity,removeMany}=useCollectionActions();
  const {selectedFormId,selectForm,search,setSearch}=useUiStore();
  const {t}=useI18n();
  const [shiny,setShiny]=useState<ShinyFilter>('all');
  const [alpha,setAlpha]=useState<AlphaFilter>('all');
  const [ot,setOt]=useState<OtFilter>('all');
  const [ownership,setOwnership]=useState<OwnershipFilter>('all');
  const species=pokemonDataSource.getSpecies();
  const forms=pokemonDataSource.getForms();
  const games=pokemonDataSource.getGames();
  const groups=pokemonDataSource.getFormGroups();
  const alphaValue=alpha==='alpha';
  const shinyValue=shiny==='shiny';
  const eligible=(form:PokemonForm)=>isAlphaEligibleSpecies(games,form.speciesId);
  const activeGroups=groups.map(group=>({...group,formIds:group.formIds.filter(id=>{const form=forms.find(candidate=>candidate.id===id);return !!form&&(alpha!=='alpha'||eligible(form))})}));
  const groupFormIds=new Set(activeGroups.flatMap(group=>group.formIds));
  const obtained=new Set(entries.filter(entry=>entry.quantity>0&&groupFormIds.has(entry.formId)&&(shiny==='all'||entry.shiny===shinyValue)&&(alpha==='all'||entry.alpha===alphaValue)).map(entry=>entry.formId)).size;
  const total=groupFormIds.size;
  const percentage=total?Math.round(obtained/total*1000)/10:0;
  const matches=(form:PokemonForm)=>{const item=species.find(candidate=>candidate.id===form.speciesId);return !!item&&(item.name.toLowerCase().includes(search.toLowerCase())||String(item.nationalDexNumber).includes(search.replace('#','')))};
  const visible=(form:PokemonForm)=>matches(form)&&(ownership==='all'||(ownership==='owned'?isFormOwned(entries,form.id,{shiny,alpha,ot}):!isFormOwned(entries,form.id,{shiny,alpha,ot})));
  const quickEdit=(form:PokemonForm)=>{
    const relevant=filterEntries(entries,{shiny,alpha,ot}).filter(entry=>entry.formId===form.id);
    if(hasMultipleOrigins(relevant)){selectForm(form.id);return}
    const existing=relevant.find(entry=>entry.gameId==='home'&&entry.ownOT===(ot!=='other')&&entry.shiny===shinyValue&&entry.alpha===alphaValue)??relevant[0];
    if(existing)changeQuantity.mutate({id:existing.id,quantity:existing.quantity-1});
    else add.mutate({speciesId:form.speciesId,formId:form.id,gameId:'home',originGameId:'home',ownOT:ot!=='other',shiny:shinyValue,alpha:alphaValue,quantity:1});
  };
  const addForms=(items:{form:PokemonForm}[])=>addMany.mutate(items.filter(item=>alpha!=='alpha'||eligible(item.form)).map(({form})=>({speciesId:form.speciesId,formId:form.id,gameId:'home',originGameId:'home',ownOT:true,shiny:shinyValue,alpha:alphaValue,quantity:1})));
  const clearForms=(items:{form:PokemonForm}[])=>{const ids=new Set(items.map(item=>item.form.id));removeMany.mutate(entries.filter(entry=>ids.has(entry.formId)&&(shiny==='all'||entry.shiny===shinyValue)&&(alpha==='all'||entry.alpha===alphaValue)).map(entry=>entry.id))};
  const allItems=activeGroups.flatMap(group=>group.formIds.map(id=>forms.find(form=>form.id===id)).filter((form):form is PokemonForm=>!!form).map(form=>({form})));
  const selected=forms.find(form=>form.id===selectedFormId);
  return <><div className="page-head dex-page-head"><div><span className="eyebrow">FORM COLLECTIONS</span><h1>{t('specialForms','Special Forms')}</h1><p>{shiny==='shiny'?t('specialShinyDescription','Only shiny form entries count toward this view.'):t('specialDescription','Generic checklists for species with multiple alternate forms.')}</p></div><div className="page-head-side"><div className="dex-progress-summary"><div><span>{t('formsCompletion','Forms completion')}</span><strong>{obtained} / {total}</strong></div><ProgressBar value={percentage}/><small>{percentage}% complete</small></div><div className="dex-actions"><button onClick={()=>addForms(allItems)}><Plus size={16}/> {t('completeForms','Complete forms')}</button><ConfirmButton className="danger" title={t('clearSpecial','Clear all special forms?')} description={t('clearSpecialDescription','Every entry represented in these form groups will be removed.')} confirmLabel={t('clearForms','Clear forms')} onConfirm={()=>clearForms(allItems)}><Trash2 size={16}/> {t('clearForms','Clear forms')}</ConfirmButton></div></div></div><DexFilters search={search} onSearch={setSearch} shiny={shiny} onShiny={setShiny} alpha={alpha} onAlpha={setAlpha} ownership={ownership} onOwnership={setOwnership} ot={ot} onOt={setOt}/>{activeGroups.map(group=>{const items=group.formIds.map(id=>forms.find(form=>form.id===id)).filter((form):form is PokemonForm=>!!form&&visible(form)).map(form=>({form,species:species.find(item=>item.id===form.speciesId)!}));return items.length?<PokemonBox key={group.id} title={`${group.name} · ${group.description}`} items={items} entries={entries} shiny={shiny} alpha={alpha} ot={ot} onSelect={form=>selectForm(form.id)} onQuickAdd={quickEdit} onAddAll={()=>addForms(items)} onRemoveAll={()=>clearForms(items)}/>:null})}{selected&&<PokemonDetails form={selected} entries={entries} onClose={()=>selectForm(null)}/>}</>;
}
