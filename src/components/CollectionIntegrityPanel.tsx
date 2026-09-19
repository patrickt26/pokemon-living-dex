import { AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { findCollectionCompatibilityIssues } from '../domain/collectionCompatibility';
import type { CollectionEntry } from '../domain/models';
import { useCollectionActions } from '../hooks/useCollection';
import { useI18n } from '../i18n';
import { PokemonSprite } from './PokemonSprite';

export function CollectionIntegrityPanel({entries,loading=false}:{entries:CollectionEntry[];loading?:boolean}){
  const {t}=useI18n();
  const games=pokemonDataSource.getGames();
  const speciesById=pokemonDataSource.getSpeciesById();
  const gamesById=useMemo(()=>new Map(games.map(game=>[game.id,game])),[games]);
  const issues=useMemo(()=>findCollectionCompatibilityIssues(entries,pokemonDataSource.getFormsById(),games),[entries,games]);
  const [selections,setSelections]=useState<Record<string,string>>({});
  const {changeAll}=useCollectionActions();

  if(loading)return <section className="panel integrity-panel" aria-live="polite"><p>{t('checkingCollectionIntegrity')}</p></section>;
  if(!issues.length)return <section className="panel integrity-panel integrity-ok"><CheckCircle2/><div><span className="eyebrow">{t('dataIntegrity')}</span><h2>{t('collectionIntegrityOk')}</h2><p>{t('collectionIntegrityOkDescription')}</p></div></section>;

  return <section className="panel integrity-panel" aria-labelledby="collection-integrity-title">
    <div className="integrity-head"><div className="integrity-warning"><AlertTriangle/></div><div><span className="eyebrow">{t('dataIntegrity')}</span><h2 id="collection-integrity-title">{t('incompatibleEntriesFound')}</h2><p>{t('incompatibleEntriesDescription')}</p></div><strong>{issues.length}</strong></div>
    <div className="integrity-list">{issues.map(({entry,form,invalidGameIds,compatibleGames})=>{
      const species=speciesById.get(entry.speciesId);
      const targetGameId=selections[entry.id]??'home';
      const invalidNames=invalidGameIds.map(id=>gamesById.get(id)?.shortName??id).join(', ');
      return <div className="integrity-entry" key={entry.id}>
        <PokemonSprite src={entry.shiny?(form.shinySprite??form.sprite):form.sprite} name={species?.name??entry.speciesId}/>
        <div className="integrity-entry-copy"><strong>{species?.name??entry.speciesId}</strong><span>{form.name} · ×{entry.quantity}</span><small>{t('incompatibleWith')}: {invalidNames}</small></div>
        <label>{t('correctToGame')}<select value={targetGameId} onChange={event=>setSelections(current=>({...current,[entry.id]:event.target.value}))}>{compatibleGames.map(game=><option value={game.id} key={game.id}>{game.name}</option>)}</select></label>
        <button className="secondary-action" disabled={changeAll.isPending} onClick={()=>changeAll.mutate({id:entry.id,changes:{gameId:targetGameId,originGameId:targetGameId}})}><Wrench size={16}/>{t('fixEntry')}</button>
      </div>;
    })}</div>
    <p className="integrity-footnote">{t('compatibilityRepairPreservesData')}</p>
  </section>;
}
