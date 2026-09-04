import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { ConfirmButton } from '../components/ConfirmButton';
import { DexFilters } from '../components/DexFilters';
import { PokemonBox } from '../components/PokemonBox';
import { PokemonDetails } from '../components/PokemonDetails';
import { ProgressBar } from '../components/ProgressBar';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { getIndexedEntries, indexCollectionEntries } from '../domain/collection';
import { generationOptions, isInGenerations, toggleGenerationSelection } from '../domain/generations';
import type { AlphaFilter, GameDexSection, PokemonForm, Species } from '../domain/models';
import { createDexSearchSuggestions, paginateDexGroupList, uniqueDexItemsBySpecies } from '../domain/dexView';
import { isInTypes } from '../domain/types';
import { useCollection } from '../hooks/useCollection';
import { useDexCollectionActions } from '../hooks/useDexCollectionActions';
import { useDexFilters } from '../hooks/useDexFilters';
import { useUiStore } from '../store/uiStore';
import { useI18n } from '../i18n';
import { useProvideSearchSuggestions } from '../store/searchSuggestionsStore';

const collectsBySpecies = (species:Species, section?:GameDexSection) => !section || (section.showDexNumbers !== false && !section.formOverrides?.[species.id]);

export function DexPage({ gameId }: { gameId?: string }) {
  const { t } = useI18n();
  const { data: entries = [] } = useCollection();
  const { search, searchTargetSpeciesId, setSearch, otFilter, setOtFilter, selectedFormId, selectForm } = useUiStore();
  const {ownership:ownershipFilter,setOwnership:setOwnershipFilter,shiny,setShiny,alpha:selectedAlpha,setAlpha:setSelectedAlpha,selectedTypes,toggleType,shinyValue}=useDexFilters();
  const [selectedSection, setSelectedSection] = useState(gameId === 'bdsp' ? 'sinnoh' : gameId === 'frlg' ? 'kanto' : 'all');
  const [selectedGenerations, setSelectedGenerations] = useState<string[]>([]);
  const toggleGeneration = (generation: string) => setSelectedGenerations(current => toggleGenerationSelection(current, generation));
  const allSpecies = pokemonDataSource.getSpecies();
  const speciesById = pokemonDataSource.getSpeciesById();
  const formsById = pokemonDataSource.getFormsById();
  const game = gameId ? pokemonDataSource.getGames().find(x => x.id === gameId) : undefined;
  const supportsAlpha = !game || game.supportsAlpha === true;
  const alphaFilter:AlphaFilter = supportsAlpha ? selectedAlpha : 'all';
  const alphaValue = alphaFilter === 'alpha';
  const formFor = useCallback((species: Species, section?: GameDexSection) => formsById.get(section?.formOverrides?.[species.id] ?? species.defaultFormId)!, [formsById]);
  const entryIndex=useMemo(()=>indexCollectionEntries(entries,{gameId,shiny,alpha:alphaFilter,ot:otFilter}),[entries,gameId,shiny,alphaFilter,otFilter]);
  const defaultGameId = gameId ?? 'home';
  const {quickToggle:quickAdd,addMany,removeMany}=useDexCollectionActions({entries,entryIndex,gameId:defaultGameId,ot:otFilter,shiny,alpha:alphaFilter,onSelect:selectForm});
  const hasSectionToggle = (game?.dexSections?.length ?? 0) > 1;
  const sectionOptions = hasSectionToggle ? [...(game?.id === 'bdsp' || game?.id === 'frlg' ? [] : [{ id: 'all', label: t('all') }]), ...(game?.dexSections?.map(s => ({ id: s.id, label: s.name })) ?? [])] : undefined;
  const activeSections = selectedSection === 'all' ? game?.dexSections : game?.dexSections?.filter(s => s.id === selectedSection);
  const groups = useMemo(() => {
    const matchesType = (form:PokemonForm)=>isInTypes(form.types,selectedTypes);
    if (game && selectedSection === 'all' && hasSectionToggle) {
      const sectionItems = (sections:GameDexSection[])=>sections.flatMap(section=>section.dexSpeciesIds.map((id,index)=>{const species=speciesById.get(id);return species?{species,form:formFor(species,section),dexNumber:index+1,showDexNumber:section.showDexNumbers!==false,collectBySpecies:collectsBySpecies(species,section)}:null})).filter((item):item is NonNullable<typeof item>=>item!==null);
      const numberedItems=uniqueDexItemsBySpecies(sectionItems((game.dexSections??[]).filter(section=>section.showDexNumbers!==false))).filter(item=>matchesType(item.form));
      const unnumberedGroups=(game.dexSections??[]).filter(section=>section.showDexNumbers===false).map(section=>({id:section.id,label:section.name,items:sectionItems([section]).filter(item=>matchesType(item.form))}));
      return [{id:'all',label:t('all'),items:numberedItems},...unnumberedGroups].filter(group=>group.items.length);
    }
    if (activeSections) return activeSections.map(section => ({ id: section.id, label: section.name, items: section.dexSpeciesIds.map((id, index) => ({ species: speciesById.get(id), dexNumber: index + 1, showDexNumber:section.showDexNumbers!==false })).filter((x): x is { species: Species; dexNumber: number; showDexNumber:boolean } => !!x.species).map(x => ({ ...x, form: formFor(x.species, section), collectBySpecies:collectsBySpecies(x.species,section) })).filter(item=>matchesType(item.form)) })).filter(x => x.items.length);
    return [{ id: 'national', label: null, items: allSpecies.filter(s => isInGenerations(s.nationalDexNumber, selectedGenerations)).map(species => ({ species, form: formsById.get(species.defaultFormId)!, dexNumber: species.nationalDexNumber, collectBySpecies:true })).filter(item=>matchesType(item.form)) }];
  }, [allSpecies, speciesById, formsById, game, activeSections, hasSectionToggle, selectedSection, selectedGenerations, selectedTypes, formFor, t]);
  const visibleGroups = useMemo(()=>groups.map(group => ({ ...group, items: group.items.filter(item => { const owned=getIndexedEntries(entryIndex,item.species.id,item.form.id,item.collectBySpecies).some(entry=>entry.quantity>0);return ownershipFilter === 'all' || (ownershipFilter === 'owned' ? owned : !owned); }) })).filter(g => g.items.length),[groups,entryIndex,ownershipFilter]);
  const searchSuggestions=useMemo(()=>createDexSearchSuggestions(visibleGroups.flatMap(group=>group.items)),[visibleGroups]);
  useProvideSearchSuggestions(searchSuggestions);
  const allBoxes = paginateDexGroupList(visibleGroups, 30, game ? 'game-' : '');
  const searchTargetBox=searchTargetSpeciesId?allBoxes.find(box=>box.items.some(item=>item.species.id===searchTargetSpeciesId)):undefined;
  const boxes = searchTargetSpeciesId?(searchTargetBox?[searchTargetBox]:[]):allBoxes;
  const addBox = (items: (typeof boxes)[number]['items']) => addMany.mutate(items.map(({ species, form }) => ({ speciesId: species.id, formId: form.id, gameId: defaultGameId, originGameId: defaultGameId, ownOT: true, shiny: shinyValue, alpha:alphaValue, quantity: 1 })));
  const clearBox = (items: (typeof boxes)[number]['items']) => { removeMany.mutate(entries.filter(entry => items.some(item=>item.collectBySpecies?entry.speciesId===item.species.id:entry.formId===item.form.id) && (shiny==='all'||entry.shiny===shinyValue) && (alphaFilter==='all'||entry.alpha===alphaValue) && (!gameId || entry.gameId === gameId)).map(entry => entry.id)); };
  const selected = selectedFormId ? formsById.get(selectedFormId) : undefined;
  const gameDexItems = activeSections?.flatMap(section=>section.dexSpeciesIds.map(id=>{const species=speciesById.get(id);return species?{species,form:formFor(species,section),dexNumber:species.nationalDexNumber,collectBySpecies:collectsBySpecies(species,section)}:null})).filter((item):item is NonNullable<typeof item>=>item!==null).filter(item=>isInTypes(item.form.types,selectedTypes));
  const dexItems = gameDexItems ? [...new Map(gameDexItems.map(item=>[item.form.id,item])).values()] : allSpecies.filter(species=>isInGenerations(species.nationalDexNumber,selectedGenerations)).map(species=>({species,form:formFor(species),dexNumber:species.nationalDexNumber,collectBySpecies:true})).filter(item=>isInTypes(item.form.types,selectedTypes));
  const progressIndex=useMemo(()=>indexCollectionEntries(entries,{gameId,shiny,alpha:alphaFilter}),[entries,gameId,shiny,alphaFilter]);
  const obtained = dexItems.filter(item=>getIndexedEntries(progressIndex,item.species.id,item.form.id,item.collectBySpecies).some(entry=>entry.quantity>0)).length;
  const progress = { obtained, total: dexItems.length, percentage: dexItems.length ? Math.round(obtained / dexItems.length * 1000) / 10 : 0 };
  return <><div className="page-head dex-page-head"><div><span className="eyebrow">{game ? t('gameCollection','GAME COLLECTION') : t('coreCollection','CORE COLLECTION')}</span><div className="dex-title-row">{game?.logo && <span className="game-logo"><img src={game.logo} alt={`${game.name} logo`} /></span>}<h1>{game?.name ?? t('nationalDex','National Dex')}</h1></div><p>{shiny==='shiny' ? t('shinyDescription','Only shiny collection entries count toward this view.') : t('searchDescription','Thirty slots per box, derived directly from your collection.')}</p></div><div className="page-head-side"><div className="dex-progress-summary"><div><span>{t('dexCompletion','Dex completion')}</span><strong>{progress.obtained} / {progress.total}</strong></div><ProgressBar value={progress.percentage} /><small>{progress.percentage}% {t('completePercent','complete')}</small></div><div className="dex-actions"><button onClick={() => addBox(dexItems)}><Plus size={16} /> {t('complete','Complete Dex')}</button><ConfirmButton className="danger" title={t('clearEntireDex','Clear the entire Dex?')} description={t('clearEntireDexDescription','Every collection entry that contributes to this Dex will be removed, regardless of the active search or filter. This cannot be undone.')} confirmLabel={t('clear','Clear Dex')} onConfirm={() => clearBox(dexItems)}><Trash2 size={16} /> {t('clear','Clear Dex')}</ConfirmButton></div></div></div><DexFilters search={search} onSearch={setSearch} ot={otFilter} onOt={setOtFilter} ownership={ownershipFilter} onOwnership={setOwnershipFilter} shiny={shiny} onShiny={setShiny} alpha={supportsAlpha?alphaFilter:undefined} onAlpha={setSelectedAlpha} sections={sectionOptions} selectedSection={selectedSection} onSection={setSelectedSection} generations={!game ? generationOptions : undefined} selectedGenerations={selectedGenerations} onGeneration={toggleGeneration} selectedTypes={selectedTypes} onType={toggleType} />{boxes.length ? boxes.map(box => <PokemonBox key={box.key} title={box.title} items={box.items} entryIndex={entryIndex} formsById={formsById} shiny={shiny==='shiny'} searchTargetSpeciesId={searchTargetSpeciesId} onSelect={f => selectForm(f.id)} onQuickAdd={quickAdd} onAddAll={() => addBox(box.items)} onRemoveAll={() => clearBox(box.items)} />) : <div className="empty">{t('searchEmpty','No Pokémon match this search.')}</div>}{selected && <PokemonDetails form={selected} entries={entries} game={game} onClose={() => selectForm(null)} />}</>;
}
