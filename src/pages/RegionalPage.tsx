import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmButton } from '../components/ConfirmButton';
import { DexFilters } from '../components/DexFilters';
import { PokemonBox } from '../components/PokemonBox';
import { PokemonDetails } from '../components/PokemonDetails';
import { ProgressBar } from '../components/ProgressBar';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { isAlphaEligibleSpecies } from '../domain/alpha';
import { indexCollectionEntries } from '../domain/collection';
import type { OtFilter, PokemonForm, Region } from '../domain/models';
import { matchesPokemonSearch } from '../domain/dexView';
import { isInTypes } from '../domain/types';
import { useCollection } from '../hooks/useCollection';
import { useDexCollectionActions } from '../hooks/useDexCollectionActions';
import { useDexFilters } from '../hooks/useDexFilters';
import { useI18n } from '../i18n';
import { useUiStore } from '../store/uiStore';

const labels:Record<Region,string>={alola:'Alola',galar:'Galar',hisui:'Hisui',paldea:'Paldea'};

export function RegionalPage(){
  const {data:entries=[]}=useCollection();
  const {selectedFormId,selectForm,search,setSearch}=useUiStore();
  const {t}=useI18n();
  const {shiny,setShiny,alpha,setAlpha,ownership,setOwnership,selectedTypes,toggleType,shinyValue}=useDexFilters();
  const [ot,setOt]=useState<OtFilter>('all');
  const forms=pokemonDataSource.getForms();
  const speciesById=pokemonDataSource.getSpeciesById();
  const formsById=pokemonDataSource.getFormsById();
  const games=pokemonDataSource.getGames();
  const entryIndex=useMemo(()=>indexCollectionEntries(entries,{shiny,alpha,ot}),[entries,shiny,alpha,ot]);
  const {quickToggle,addForms,clearForms}=useDexCollectionActions({entries,entryIndex,gameId:'home',ot,shiny,alpha,onSelect:selectForm});
  const eligible=(form:PokemonForm)=>isAlphaEligibleSpecies(games,form.speciesId);
  const addBox=(items:{form:PokemonForm}[])=>addForms(items.map(item=>item.form),form=>alpha!=='alpha'||eligible(form));
  const clearBox=(items:{form:PokemonForm}[])=>clearForms(items.map(item=>item.form));
  const allRegional=forms.filter(form=>form.region&&(alpha!=='alpha'||eligible(form))&&isInTypes(form.types,selectedTypes));
  const regionalItems=allRegional.map(form=>({form}));
  const speciesIds=[...new Set(regionalItems.map(item=>item.form.speciesId))];
  const formIds=new Set(allRegional.map(form=>form.id));
  const obtained=new Set(entryIndex.entries.filter(entry=>entry.quantity>0&&formIds.has(entry.formId)).map(entry=>entry.speciesId)).size;
  const percentage=speciesIds.length?Math.round(obtained/speciesIds.length*1000)/10:0;
  const visible=(form:PokemonForm)=>{const owned=(entryIndex.byFormId.get(form.id)??[]).some(entry=>entry.quantity>0);return ownership==='all'||(ownership==='owned'?owned:!owned)};
  const selected=selectedFormId?formsById.get(selectedFormId):undefined;
  return <><div className="page-head dex-page-head"><div><span className="eyebrow">{t('regionalCollection')}</span><h1>{t('regionalForms','Regional Forms')}</h1><p>{shiny==='shiny'?t('regionalShinyDescription','Only shiny regional entries count toward this view.'):t('regionalDescription','Regional forms remain connected to their National Dex species.')}</p></div><div className="page-head-side"><div className="dex-progress-summary"><div><span>{t('dexCompletion','Dex completion')}</span><strong>{obtained} / {speciesIds.length}</strong></div><ProgressBar value={percentage}/><small>{percentage}% {t('completePercent')}</small></div><div className="dex-actions"><button onClick={()=>addBox(regionalItems)}><Plus size={16}/> {t('complete','Complete Dex')}</button><ConfirmButton className="danger" title={t('clearRegional','Clear all regional forms?')} description={t('clearRegionalDescription','Every regional form entry will be removed from your collection. This cannot be undone.')} confirmLabel={t('clear','Clear Dex')} onConfirm={()=>clearBox(regionalItems)}><Trash2 size={16}/> {t('clear','Clear Dex')}</ConfirmButton></div></div></div><DexFilters search={search} onSearch={setSearch} shiny={shiny} onShiny={setShiny} alpha={alpha} onAlpha={setAlpha} ownership={ownership} onOwnership={setOwnership} ot={ot} onOt={setOt} selectedTypes={selectedTypes} onType={toggleType}/>{(Object.keys(labels) as Region[]).map(region=>{const items=allRegional.filter(form=>form.region===region&&visible(form)).map(form=>({form,species:speciesById.get(form.speciesId)!}));const matchesSearch=items.some(item=>matchesPokemonSearch(item,search));return items.length&&matchesSearch?<PokemonBox key={region} title={labels[region]} items={items} entryIndex={entryIndex} formsById={formsById} shiny={shinyValue} onSelect={form=>selectForm(form.id)} onQuickAdd={quickToggle} onAddAll={()=>addBox(items)} onRemoveAll={()=>clearBox(items)}/>:null})}{selected&&<PokemonDetails form={selected} entries={entries} onClose={()=>selectForm(null)}/>}</>;
}
