import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton } from '../components/ConfirmButton';
import { DexFilters } from '../components/DexFilters';
import { PokemonBox } from '../components/PokemonBox';
import { PokemonDetails } from '../components/PokemonDetails';
import { ProgressBar } from '../components/ProgressBar';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { isAlphaEligibleSpecies } from '../domain/alpha';
import { filterEntries, isFormOwned } from '../domain/collection';
import type { AlphaFilter, OtFilter, OwnershipFilter, PokemonForm, Region, ShinyFilter } from '../domain/models';
import { shouldOpenEntryPicker } from '../domain/quickCollection';
import { useCollection, useCollectionActions } from '../hooks/useCollection';
import { useI18n } from '../i18n';
import { useUiStore } from '../store/uiStore';

const labels:Record<Region,string>={alola:'Alola',galar:'Galar',hisui:'Hisui',paldea:'Paldea'};

export function RegionalPage(){
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
  const alphaValue=alpha==='alpha';
  const shinyValue=shiny==='shiny';
  const eligible=(form:PokemonForm)=>isAlphaEligibleSpecies(games,form.speciesId);
  const quickAdd=(form:PokemonForm)=>{
    const relevant=filterEntries(entries,{shiny,alpha,ot}).filter(entry=>entry.formId===form.id);
    if(shouldOpenEntryPicker(relevant)){selectForm(form.id);return}
    const existing=relevant.find(entry=>entry.gameId==='home'&&entry.ownOT===(ot!=='other')&&entry.shiny===shinyValue&&entry.alpha===alphaValue)??relevant[0];
    if(existing)changeQuantity.mutate({id:existing.id,quantity:existing.quantity-1});
    else add.mutate({speciesId:form.speciesId,formId:form.id,gameId:'home',originGameId:'home',ownOT:ot!=='other',shiny:shinyValue,alpha:alphaValue,quantity:1});
  };
  const addBox=(items:{form:PokemonForm}[])=>addMany.mutate(items.filter(item=>alpha!=='alpha'||eligible(item.form)).map(({form})=>({speciesId:form.speciesId,formId:form.id,gameId:'home',originGameId:'home',ownOT:true,shiny:shinyValue,alpha:alphaValue,quantity:1})));
  const clearBox=(items:{form:PokemonForm}[])=>{const ids=new Set(items.map(item=>item.form.id));removeMany.mutate(entries.filter(entry=>ids.has(entry.formId)&&(shiny==='all'||entry.shiny===shinyValue)&&(alpha==='all'||entry.alpha===alphaValue)).map(entry=>entry.id))};
  const allRegional=forms.filter(form=>form.region&&(alpha!=='alpha'||eligible(form)));
  const regionalItems=allRegional.map(form=>({form}));
  const speciesIds=[...new Set(regionalItems.map(item=>item.form.speciesId))];
  const formIds=new Set(allRegional.map(form=>form.id));
  const obtained=new Set(entries.filter(entry=>entry.quantity>0&&formIds.has(entry.formId)&&(shiny==='all'||entry.shiny===shinyValue)&&(alpha==='all'||entry.alpha===alphaValue)).map(entry=>entry.speciesId)).size;
  const percentage=speciesIds.length?Math.round(obtained/speciesIds.length*1000)/10:0;
  const matches=(form:PokemonForm)=>{const item=species.find(candidate=>candidate.id===form.speciesId);return !!item&&(item.name.toLowerCase().includes(search.toLowerCase())||String(item.nationalDexNumber).includes(search.replace('#','')))};
  const visible=(form:PokemonForm)=>matches(form)&&(ownership==='all'||(ownership==='owned'?isFormOwned(entries,form.id,{shiny,alpha,ot}):!isFormOwned(entries,form.id,{shiny,alpha,ot})));
  const selected=forms.find(form=>form.id===selectedFormId);
  return <><div className="page-head dex-page-head"><div><span className="eyebrow">ALTERNATE HABITATS</span><h1>{t('regionalForms','Regional Forms')}</h1><p>{shiny==='shiny'?t('regionalShinyDescription','Only shiny regional entries count toward this view.'):t('regionalDescription','Regional forms remain connected to their National Dex species.')}</p></div><div className="page-head-side"><div className="dex-progress-summary"><div><span>{t('dexCompletion','Dex completion')}</span><strong>{obtained} / {speciesIds.length}</strong></div><ProgressBar value={percentage}/><small>{percentage}% complete</small></div><div className="dex-actions"><button onClick={()=>addBox(regionalItems)}><Plus size={16}/> {t('complete','Complete Dex')}</button><ConfirmButton className="danger" title={t('clearRegional','Clear all regional forms?')} description={t('clearRegionalDescription','Every regional form entry will be removed from your collection. This cannot be undone.')} confirmLabel={t('clear','Clear Dex')} onConfirm={()=>clearBox(regionalItems)}><Trash2 size={16}/> {t('clear','Clear Dex')}</ConfirmButton></div></div></div><DexFilters search={search} onSearch={setSearch} shiny={shiny} onShiny={setShiny} alpha={alpha} onAlpha={setAlpha} ownership={ownership} onOwnership={setOwnership} ot={ot} onOt={setOt}/>{(Object.keys(labels) as Region[]).map(region=>{const items=allRegional.filter(form=>form.region===region&&visible(form)).map(form=>({form,species:species.find(item=>item.id===form.speciesId)!}));return items.length?<PokemonBox key={region} title={labels[region]} items={items} entries={entries} shiny={shiny} alpha={alpha} ot={ot} onSelect={form=>selectForm(form.id)} onQuickAdd={quickAdd} onAddAll={()=>addBox(items)} onRemoveAll={()=>clearBox(items)}/>:null})}{selected&&<PokemonDetails form={selected} entries={entries} onClose={()=>selectForm(null)}/>}</>;
}
