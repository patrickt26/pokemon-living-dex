import { ChevronDown, House, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ConfirmButton } from '../components/ConfirmButton';
import { BulkAddGameButton } from '../components/BulkAddGameButton';
import { DexFilters } from '../components/DexFilters';
import { PokemonBox } from '../components/PokemonBox';
import { PokemonDetails } from '../components/PokemonDetails';
import { ProgressBar } from '../components/ProgressBar';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { filterEntries, getIndexedEntries, indexCollectionEntries } from '../domain/collection';
import { generationOptions, isInGenerations, toggleGenerationSelection } from '../domain/generations';
import { getCataloguedVariantFormsForGame } from '../domain/gameAvailability';
import { getHomePlanStatus, type HomePlanStatus } from '../domain/homePlan';
import type { AlphaFilter, GameDexSection, PokemonForm, Species } from '../domain/models';
import { combineDexItemsBySpecies, createDexSearchSuggestions, paginateDexGroupList } from '../domain/dexView';
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
  const [showGameVariants,setShowGameVariants]=useState(false);
  const [showHomePlan,setShowHomePlan]=useState(false);
  const [homePlanFilter,setHomePlanFilter]=useState<HomePlanStatus|'all'>('transfer');
  const gameVariantsToggleRef=useRef<HTMLButtonElement>(null);
  const toggleGeneration = (generation: string) => setSelectedGenerations(current => toggleGenerationSelection(current, generation));
  const allSpecies = pokemonDataSource.getSpecies();
  const speciesById = pokemonDataSource.getSpeciesById();
  const formsById = pokemonDataSource.getFormsById();
  const allForms = pokemonDataSource.getForms();
  const game = gameId ? pokemonDataSource.getGames().find(x => x.id === gameId) : undefined;
  const supportsAlpha = !game || game.supportsAlpha === true;
  const alphaFilter:AlphaFilter = supportsAlpha ? selectedAlpha : 'all';
  const alphaValue = alphaFilter === 'alpha';
  const formFor = useCallback((species: Species, section?: GameDexSection) => formsById.get(section?.formOverrides?.[species.id] ?? species.defaultFormId)!, [formsById]);
  const entryIndex=useMemo(()=>indexCollectionEntries(entries,{gameId,shiny,alpha:alphaFilter,ot:otFilter}),[entries,gameId,shiny,alphaFilter,otFilter]);
  const defaultGameId = gameId ?? 'home';
  const {quickToggle:quickAdd,addForms,removeMany}=useDexCollectionActions({entries,entryIndex,gameId:defaultGameId,ot:otFilter,shiny,alpha:alphaFilter,onSelect:selectForm});
  const hasSectionToggle = (game?.dexSections?.length ?? 0) > 1;
  const sectionOptions = hasSectionToggle ? [...(game?.id === 'bdsp' || game?.id === 'frlg' ? [] : [{ id: 'all', label: t('all') }]), ...(game?.dexSections?.map(s => ({ id: s.id, label: s.name })) ?? [])] : undefined;
  const activeSections = selectedSection === 'all' ? game?.dexSections : game?.dexSections?.filter(s => s.id === selectedSection);
  const groups = useMemo(() => {
    const matchesType = (form:PokemonForm)=>isInTypes(form.types,selectedTypes);
    if (game && selectedSection === 'all' && hasSectionToggle) {
      const sectionItems = (sections:GameDexSection[])=>sections.flatMap(section=>section.dexSpeciesIds.map((id,index)=>{const species=speciesById.get(id);return species?{species,form:formFor(species,section),dexNumber:index+1,showDexNumber:section.showDexNumbers!==false,collectBySpecies:collectsBySpecies(species,section)}:null})).filter((item):item is NonNullable<typeof item>=>item!==null);
      const numberedItems=combineDexItemsBySpecies(sectionItems((game.dexSections??[]).filter(section=>section.showDexNumbers!==false))).filter(item=>matchesType(item.form));
      const unnumberedGroups=(game.dexSections??[]).filter(section=>section.showDexNumbers===false).map(section=>({id:section.id,label:section.name,items:sectionItems([section]).filter(item=>matchesType(item.form))}));
      return [{id:'all',label:t('all'),items:numberedItems},...unnumberedGroups].filter(group=>group.items.length);
    }
    if (activeSections) return activeSections.map(section => ({ id: section.id, label: section.name, items: section.dexSpeciesIds.map((id, index) => ({ species: speciesById.get(id), dexNumber: index + 1, showDexNumber:section.showDexNumbers!==false })).filter((x): x is { species: Species; dexNumber: number; showDexNumber:boolean } => !!x.species).map(x => ({ ...x, form: formFor(x.species, section), collectBySpecies:collectsBySpecies(x.species,section) })).filter(item=>matchesType(item.form)) })).filter(x => x.items.length);
    return [{ id: 'national', label: null, items: allSpecies.filter(s => isInGenerations(s.nationalDexNumber, selectedGenerations)).map(species => ({ species, form: formsById.get(species.defaultFormId)!, dexNumber: species.nationalDexNumber, collectBySpecies:true })).filter(item=>matchesType(item.form)) }];
  }, [allSpecies, speciesById, formsById, game, activeSections, hasSectionToggle, selectedSection, selectedGenerations, selectedTypes, formFor, t]);
  const visibleGroups = useMemo(()=>groups.map(group => ({ ...group, items: group.items.filter(item => { const owned=getIndexedEntries(entryIndex,item.species.id,item.form.id,item.collectBySpecies).some(entry=>entry.quantity>0);return ownershipFilter === 'all' || (ownershipFilter === 'owned' ? owned : !owned); }) })).filter(g => g.items.length),[groups,entryIndex,ownershipFilter]);
  const homePlanEntries=useMemo(()=>filterEntries(entries,{shiny,alpha:alphaFilter,ot:otFilter}),[entries,shiny,alphaFilter,otFilter]);
  const homePlanEntryIndex=useMemo(()=>indexCollectionEntries(homePlanEntries),[homePlanEntries]);
  const homePlanItems=useMemo(()=>{
    if(!game)return [];
    const unique=new Map(groups.flatMap(group=>group.items).map(item=>[item.species.id,item]));
    return [...unique.values()].map(item=>({...item,collectBySpecies:true,homePlanStatus:getHomePlanStatus(item.species.id,game.id,homePlanEntries)}));
  },[game,groups,homePlanEntries]);
  const homePlanCounts=useMemo(()=>homePlanItems.reduce<Record<HomePlanStatus,number>>((counts,item)=>({...counts,[item.homePlanStatus]:counts[item.homePlanStatus]+1}),{transfer:0,covered:0,missing:0}),[homePlanItems]);
  const visibleHomePlanItems=useMemo(()=>homePlanItems.filter(item=>{
    if(homePlanFilter!=='all'&&item.homePlanStatus!==homePlanFilter)return false;
    const owned=item.homePlanStatus!=='missing';
    return ownershipFilter==='all'||(ownershipFilter==='owned'?owned:!owned);
  }),[homePlanItems,homePlanFilter,ownershipFilter]);
  const displayedHomePlanItems=searchTargetSpeciesId?visibleHomePlanItems.filter(item=>item.species.id===searchTargetSpeciesId):visibleHomePlanItems;
  const homePlanLabels:Record<HomePlanStatus,string>={transfer:t('homePlanTransfer','Send to HOME'),covered:t('homePlanCovered','Already covered'),missing:t('homePlanMissing','Still missing')};
  const homePlanGroups=(homePlanFilter==='all'?(['transfer','covered','missing'] as const):[homePlanFilter]).map(status=>({id:`home-${status}`,label:homePlanLabels[status],items:displayedHomePlanItems.filter(item=>item.homePlanStatus===status)})).filter(group=>group.items.length);
  const homePlanBoxes=paginateDexGroupList(homePlanGroups,30,'home-plan-');
  const gameVariantItems=useMemo(()=>game?getCataloguedVariantFormsForGame(allForms,game)
    .filter(form=>isInTypes(form.types,selectedTypes))
    .map(form=>({species:speciesById.get(form.speciesId)!,form,dexNumber:speciesById.get(form.speciesId)!.nationalDexNumber,showDexNumber:false,collectBySpecies:false}))
    .sort((a,b)=>a.dexNumber-b.dexNumber||a.form.name.localeCompare(b.form.name)):[],[allForms,game,selectedTypes,speciesById]);
  const visibleGameVariantItems=useMemo(()=>gameVariantItems.filter(item=>{const owned=(entryIndex.byFormId.get(item.form.id)??[]).some(entry=>entry.quantity>0);return ownershipFilter==='all'||(ownershipFilter==='owned'?owned:!owned)}),[gameVariantItems,entryIndex,ownershipFilter]);
  const displayedGameVariantItems=searchTargetSpeciesId?visibleGameVariantItems.filter(item=>item.species.id===searchTargetSpeciesId):visibleGameVariantItems;
  const searchSuggestions=useMemo(()=>createDexSearchSuggestions(showHomePlan?visibleHomePlanItems:[...visibleGroups.flatMap(group=>group.items),...visibleGameVariantItems]),[showHomePlan,visibleHomePlanItems,visibleGroups,visibleGameVariantItems]);
  useProvideSearchSuggestions(searchSuggestions);
  const allBoxes = paginateDexGroupList(visibleGroups, 30, game ? 'game-' : '');
  const searchTargetBox=searchTargetSpeciesId?allBoxes.find(box=>box.items.some(item=>item.species.id===searchTargetSpeciesId)):undefined;
  const boxes = searchTargetSpeciesId?(searchTargetBox?[searchTargetBox]:[]):allBoxes;
  const gameVariantBoxes=paginateDexGroupList([{id:'variants',label:null,items:displayedGameVariantItems}],30,'game-variants-');
  const variantsExpanded=showGameVariants||(searchTargetSpeciesId!==null&&displayedGameVariantItems.length>0);
  const addBox = (items: (typeof boxes)[number]['items'],targetGameId=defaultGameId) => addForms(items.map(item=>item.form),()=>true,targetGameId);
  const clearBox = (items: (typeof boxes)[number]['items']) => { removeMany.mutate(entries.filter(entry => items.some(item=>item.collectBySpecies?entry.speciesId===item.species.id:entry.formId===item.form.id) && (shiny==='all'||entry.shiny===shinyValue) && (alphaFilter==='all'||entry.alpha===alphaValue) && (!gameId || entry.gameId === gameId)).map(entry => entry.id)); };
  const selected = selectedFormId ? formsById.get(selectedFormId) : undefined;
  const gameDexItems = activeSections?.flatMap(section=>section.dexSpeciesIds.map(id=>{const species=speciesById.get(id);return species?{species,form:formFor(species,section),dexNumber:species.nationalDexNumber,collectBySpecies:collectsBySpecies(species,section)}:null})).filter((item):item is NonNullable<typeof item>=>item!==null).filter(item=>isInTypes(item.form.types,selectedTypes));
  const dexItems = gameDexItems ? [...new Map(gameDexItems.map(item=>[item.form.id,item])).values()] : allSpecies.filter(species=>isInGenerations(species.nationalDexNumber,selectedGenerations)).map(species=>({species,form:formFor(species),dexNumber:species.nationalDexNumber,collectBySpecies:true})).filter(item=>isInTypes(item.form.types,selectedTypes));
  const progressIndex=useMemo(()=>indexCollectionEntries(entries,{gameId,shiny,alpha:alphaFilter}),[entries,gameId,shiny,alphaFilter]);
  const obtained = dexItems.filter(item=>getIndexedEntries(progressIndex,item.species.id,item.form.id,item.collectBySpecies).some(entry=>entry.quantity>0)).length;
  const progress = { obtained, total: dexItems.length, percentage: dexItems.length ? Math.round(obtained / dexItems.length * 1000) / 10 : 0 };
  const obtainedVariants=gameVariantItems.filter(item=>(progressIndex.byFormId.get(item.form.id)??[]).some(entry=>entry.quantity>0)).length;
  const variantsProgress={obtained:obtainedVariants,total:gameVariantItems.length,percentage:gameVariantItems.length?Math.round(obtainedVariants/gameVariantItems.length*1000)/10:0};
  const goToGameVariants=()=>{setShowHomePlan(false);setShowGameVariants(true);requestAnimationFrame(()=>gameVariantsToggleRef.current?.scrollIntoView({behavior:'smooth',block:'center'}))};
  return <>
    <div className="page-head dex-page-head">
      <div><span className="eyebrow">{game ? t('gameCollection','GAME COLLECTION') : t('coreCollection','CORE COLLECTION')}</span><div className="dex-title-row">{game?.logo && <span className="game-logo"><img src={game.logo} alt={`${game.name} logo`} /></span>}<h1>{game?.name ?? t('nationalDex','National Dex')}</h1></div><p>{shiny==='shiny' ? t('shinyDescription','Only shiny collection entries count toward this view.') : t('searchDescription','Thirty slots per box, derived directly from your collection.')}</p></div>
      <div className="page-head-side"><div className="dex-progress-summary"><div><span>{t('dexCompletion','Dex completion')}</span><strong>{progress.obtained} / {progress.total}</strong></div><ProgressBar value={progress.percentage} /><small>{progress.percentage}% {t('completePercent','complete')}</small></div><div className="dex-actions">{game&&<button className={`home-plan-shortcut${showHomePlan?' active':''}`} onClick={()=>{setShowHomePlan(value=>!value);setShowGameVariants(false)}}><House size={16}/>{showHomePlan?t('hideHomePlan','Back to game Dex'):`${t('homePlan','HOME plan')} (${homePlanCounts.transfer})`}</button>}{game&&gameVariantItems.length>0&&<button className="game-variants-shortcut" onClick={goToGameVariants}><ChevronDown size={16}/>{t('showGameVariants','Show variants')} ({gameVariantItems.length})</button>}{game?<button onClick={() => addBox(dexItems)}><Plus size={16} /> {t('complete','Complete Dex')}</button>:<BulkAddGameButton forms={dexItems.map(item=>item.form)} requiresAlpha={alphaFilter==='alpha'} onAdd={(targetGameId,forms)=>addForms(forms,()=>true,targetGameId)}><Plus size={16} /> {t('complete','Complete Dex')}</BulkAddGameButton>}<ConfirmButton className="danger" title={t('clearEntireDex','Clear the entire Dex?')} description={t('clearEntireDexDescription','Every collection entry that contributes to this Dex will be removed, regardless of the active search or filter. This cannot be undone.')} confirmLabel={t('clear','Clear Dex')} onConfirm={() => clearBox(dexItems)}><Trash2 size={16} /> {t('clear','Clear Dex')}</ConfirmButton></div></div>
    </div>
    <DexFilters search={search} onSearch={setSearch} ot={otFilter} onOt={setOtFilter} ownership={ownershipFilter} onOwnership={setOwnershipFilter} shiny={shiny} onShiny={setShiny} alpha={supportsAlpha?alphaFilter:undefined} onAlpha={setSelectedAlpha} sections={sectionOptions} selectedSection={selectedSection} onSection={setSelectedSection} generations={!game ? generationOptions : undefined} selectedGenerations={selectedGenerations} onGeneration={toggleGeneration} selectedTypes={selectedTypes} onType={toggleType} />
    {showHomePlan&&<section className="home-plan-panel">
      <div className="home-plan-heading"><div><span className="eyebrow">{t('homePlan','HOME plan')}</span><h2>{t('homePlan','HOME plan')}</h2><p>{t('homePlanDescription','Compare this game or section with the rest of your collection to prepare your National Living Dex in HOME.')}</p></div><strong>{homePlanCounts.transfer} {t('homePlanTransfer','Send to HOME').toLowerCase()}</strong></div>
      <div className="home-plan-selector" role="group" aria-label={t('homePlan','HOME plan')}>{([['transfer','homePlanTransfer'],['covered','homePlanCovered'],['missing','homePlanMissing'],['all','homePlanAll']] as const).map(([status,key])=><button key={status} className={homePlanFilter===status?'active':''} onClick={()=>setHomePlanFilter(status)}><span>{status==='all'?homePlanItems.length:homePlanCounts[status]}</span>{t(key)}</button>)}</div>
    </section>}
    {showHomePlan?homePlanBoxes.map(box=><PokemonBox key={box.key} title={box.title} items={box.items} entryIndex={homePlanEntryIndex} formsById={formsById} shiny={shiny==='shiny'} searchTargetSpeciesId={searchTargetSpeciesId} onSelect={form=>selectForm(form.id)} hideActions/>):boxes.map(box => <PokemonBox key={box.key} title={box.title} items={box.items} entryIndex={entryIndex} formsById={formsById} shiny={shiny==='shiny'} searchTargetSpeciesId={searchTargetSpeciesId} onSelect={f => selectForm(f.id)} onQuickAdd={quickAdd} onAddAll={game?() => addBox(box.items):undefined} addAllButton={!game?<BulkAddGameButton forms={box.items.map(item=>item.form)} requiresAlpha={alphaFilter==='alpha'} buttonTitle={t('addAllDescription','Add one of each Pokémon in this box')} onAdd={(targetGameId,forms)=>addForms(forms,()=>true,targetGameId)}><Plus size={14}/> {t('addAll','Add all')}</BulkAddGameButton>:undefined} onRemoveAll={() => clearBox(box.items)} />)}
    {showHomePlan?!homePlanBoxes.length&&<div className="empty">{t('searchEmpty','No Pokémon match this search.')}</div>:!boxes.length&&!displayedGameVariantItems.length&&<div className="empty">{t('searchEmpty','No Pokémon match this search.')}</div>}
    {!showHomePlan&&game&&gameVariantItems.length>0&&<section className="game-variants-section">
      <button ref={gameVariantsToggleRef} type="button" className="game-variants-toggle" aria-expanded={variantsExpanded} onClick={()=>setShowGameVariants(value=>!value)}>
        <span className="game-variants-copy"><span className="eyebrow">{t('formsCompletion','Forms completion')}</span><strong>{t('gameVariants','Variants available in this game')}</strong><small>{t('gameVariantsDescription','Regional and special forms that can be obtained or transferred into this game. They do not change the official Dex completion.')}</small></span>
        <span className="game-variants-progress"><strong>{variantsProgress.obtained} / {variantsProgress.total}</strong><span>{variantsExpanded?t('hideGameVariants','Hide variants'):t('showGameVariants','Show variants')} <ChevronDown size={18}/></span></span>
      </button>
      {variantsExpanded&&<div className="game-variants-content"><ProgressBar value={variantsProgress.percentage}/>{gameVariantBoxes.length?gameVariantBoxes.map(box=><PokemonBox key={box.key} title={box.title} items={box.items} entryIndex={entryIndex} formsById={formsById} shiny={shiny==='shiny'} searchTargetSpeciesId={searchTargetSpeciesId} onSelect={form=>selectForm(form.id)} onQuickAdd={quickAdd} onAddAll={()=>addBox(box.items)} onRemoveAll={()=>clearBox(box.items)}/>):<div className="empty">{t('searchEmpty','No Pokémon match this search.')}</div>}</div>}
    </section>}
    {selected && <PokemonDetails form={selected} entries={entries} game={game} onClose={() => selectForm(null)} />}
  </>;
}
