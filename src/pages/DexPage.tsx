import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { ConfirmButton } from '../components/ConfirmButton';
import { DexFilters } from '../components/DexFilters';
import { PokemonBox } from '../components/PokemonBox';
import { PokemonDetails } from '../components/PokemonDetails';
import { ProgressBar } from '../components/ProgressBar';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { hasMultipleOrigins, isFormOwned } from '../domain/collection';
import { generationOptions, isInGenerations, toggleGenerationSelection } from '../domain/generations';
import type { GameDexSection, OwnershipFilter, Species } from '../domain/models';
import { paginateDexGroupList } from '../domain/dexView';
import { useCollection, useCollectionActions } from '../hooks/useCollection';
import { useUiStore } from '../store/uiStore';
import { useI18n } from '../i18n';

export function DexPage({ gameId }: { gameId?: string }) {
  const { t } = useI18n();
  const { data: entries = [] } = useCollection();
  const { add, addMany, changeQuantity, removeMany } = useCollectionActions();
  const { search, setSearch, otFilter, setOtFilter, selectedFormId, selectForm } = useUiStore();
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [shinyOnly, setShinyOnly] = useState(false);
  const [selectedSection, setSelectedSection] = useState(gameId === 'bdsp' ? 'sinnoh' : gameId === 'frlg' ? 'kanto' : 'all');
  const [selectedGenerations, setSelectedGenerations] = useState<string[]>([]);
  const toggleGeneration = (generation: string) => setSelectedGenerations(current => toggleGenerationSelection(current, generation));
  const allSpecies = pokemonDataSource.getSpecies();
  const forms = pokemonDataSource.getForms();
  const game = gameId ? pokemonDataSource.getGames().find(x => x.id === gameId) : undefined;
  const formFor = useCallback((species: Species, section?: GameDexSection) => forms.find(f => f.id === (section?.formOverrides?.[species.id] ?? species.defaultFormId))!, [forms]);
  const defaultGameId = gameId ?? 'home';
  const hasSectionToggle = (game?.dexSections?.length ?? 0) > 1;
  const sectionOptions = hasSectionToggle ? [...(game?.id === 'bdsp' || game?.id === 'frlg' ? [] : [{ id: 'all', label: 'All' }]), ...(game?.dexSections?.map(s => ({ id: s.id, label: s.name })) ?? [])] : undefined;
  const activeSections = selectedSection === 'all' ? game?.dexSections : game?.dexSections?.filter(s => s.id === selectedSection);
  const quickAdd = (form: (typeof forms)[number]) => {
    const relevant = entries.filter(e => e.formId === form.id && (!gameId || e.gameId === gameId) && (!shinyOnly || e.shiny) && (otFilter === 'all' || (otFilter === 'own' ? e.ownOT : !e.ownOT)));
    if (hasMultipleOrigins(relevant)) { selectForm(form.id); return; }
    const existing = relevant.find(e => e.gameId === defaultGameId && e.ownOT === (otFilter !== 'other') && e.shiny === shinyOnly) ?? relevant[0];
    if (existing) changeQuantity.mutate({ id: existing.id, quantity: existing.quantity - 1 });
    else add.mutate({ speciesId: form.speciesId, formId: form.id, gameId: defaultGameId, originGameId: defaultGameId, ownOT: otFilter !== 'other', shiny: shinyOnly, quantity: 1 });
  };
  const groups = useMemo(() => {
    const matches = (name: string, n: number) => name.toLowerCase().includes(search.toLowerCase()) || String(n).includes(search.replace('#', ''));
    if (game && selectedSection === 'all' && hasSectionToggle) {
      const items = game.dexSpeciesIds.map((id, index) => { const species = allSpecies.find(x => x.id === id); const section = game.dexSections?.find(x => x.dexSpeciesIds.includes(id)); return { species, dexNumber: (section?.dexSpeciesIds.indexOf(id) ?? index) + 1 }; }).filter((x): x is { species: Species; dexNumber: number } => !!x.species).filter(x => matches(x.species.name, x.species.nationalDexNumber)).map(x => ({ ...x, form: formFor(x.species, game.dexSections?.find(s => s.dexSpeciesIds.includes(x.species.id))) }));
      return [{ id: 'all', label: 'All', items }];
    }
    if (activeSections) return activeSections.map(section => ({ id: section.id, label: section.name, items: section.dexSpeciesIds.map((id, index) => ({ species: allSpecies.find(x => x.id === id), dexNumber: index + 1 })).filter((x): x is { species: Species; dexNumber: number } => !!x.species).filter(x => matches(x.species.name, x.species.nationalDexNumber)).map(x => ({ ...x, form: formFor(x.species, section) })) })).filter(x => x.items.length);
    return [{ id: 'national', label: null, items: allSpecies.filter(s => isInGenerations(s.nationalDexNumber, selectedGenerations)).filter(s => matches(s.name, s.nationalDexNumber)).map(species => ({ species, form: forms.find(f => f.id === species.defaultFormId)!, dexNumber: species.nationalDexNumber })) }];
  }, [allSpecies, forms, game, activeSections, hasSectionToggle, selectedSection, selectedGenerations, search, formFor]);
  const visibleGroups = groups.map(group => ({ ...group, items: group.items.filter(item => { const owned = isFormOwned(entries, item.form.id, { shinyOnly, ot: otFilter, gameId }); return ownershipFilter === 'all' || (ownershipFilter === 'owned' ? owned : !owned); }) })).filter(g => g.items.length);
  const boxes = paginateDexGroupList(visibleGroups, 30, game ? 'game-' : '');
  const addBox = (items: (typeof boxes)[number]['items']) => addMany.mutate(items.map(({ species, form }) => ({ speciesId: species.id, formId: form.id, gameId: defaultGameId, originGameId: defaultGameId, ownOT: true, shiny: shinyOnly, quantity: 1 })));
  const clearBox = (items: (typeof boxes)[number]['items']) => { const ids = new Set(items.map(x => x.species.id)); removeMany.mutate(entries.filter(e => ids.has(e.speciesId) && e.shiny === shinyOnly && (!gameId || e.gameId === gameId)).map(e => e.id)); };
  const selected = selectedFormId ? forms.find(f => f.id === selectedFormId) : undefined;
  const activeIds = selectedSection === 'all' ? game?.dexSpeciesIds : (activeSections?.[0]?.dexSpeciesIds ?? []);
  const dexSpecies = (activeIds ? activeIds.map(id => allSpecies.find(s => s.id === id)).filter((s): s is Species => !!s) : allSpecies).filter(s => !!game || isInGenerations(s.nationalDexNumber, selectedGenerations));
  const dexItems = dexSpecies.map(species => { const section = activeSections?.find(s => s.dexSpeciesIds.includes(species.id)); return { species, form: formFor(species, section), dexNumber: species.nationalDexNumber }; });
  const obtained = new Set(entries.filter(e => (!gameId || e.gameId === gameId) && e.shiny === shinyOnly && dexItems.some(x => x.species.id === e.speciesId && x.form.id === e.formId)).map(e => e.speciesId)).size;
  const progress = { obtained, total: dexItems.length, percentage: dexItems.length ? Math.round(obtained / dexItems.length * 1000) / 10 : 0 };
  return <><div className="page-head dex-page-head"><div><span className="eyebrow">{game ? t('gameCollection','GAME COLLECTION') : t('coreCollection','CORE COLLECTION')}</span><div className="dex-title-row">{game?.logo && <span className="game-logo"><img src={game.logo} alt={`${game.name} logo`} /></span>}<h1>{game?.name ?? t('nationalDex','National Dex')}</h1></div><p>{shinyOnly ? t('shinyDescription','Only shiny collection entries count toward this view.') : t('searchDescription','Thirty slots per box, derived directly from your collection.')}</p></div><div className="page-head-side"><div className="dex-progress-summary"><div><span>{t('dexCompletion','Dex completion')}</span><strong>{progress.obtained} / {progress.total}</strong></div><ProgressBar value={progress.percentage} /><small>{progress.percentage}% {t('completePercent','complete')}</small></div><div className="dex-actions"><button onClick={() => addBox(dexItems)}><Plus size={16} /> {t('complete','Complete Dex')}</button><ConfirmButton className="danger" title={t('clearEntireDex','Clear the entire Dex?')} description={t('clearEntireDexDescription','Every collection entry that contributes to this Dex will be removed, regardless of the active search or filter. This cannot be undone.')} confirmLabel={t('clear','Clear Dex')} onConfirm={() => clearBox(dexItems)}><Trash2 size={16} /> {t('clear','Clear Dex')}</ConfirmButton></div></div></div><DexFilters search={search} onSearch={setSearch} ot={otFilter} onOt={setOtFilter} ownership={ownershipFilter} onOwnership={setOwnershipFilter} shinyOnly={shinyOnly} onShiny={setShinyOnly} sections={sectionOptions} selectedSection={selectedSection} onSection={setSelectedSection} generations={!game ? generationOptions : undefined} selectedGenerations={selectedGenerations} onGeneration={toggleGeneration} />{boxes.length ? boxes.map(box => <PokemonBox key={box.key} title={box.title} items={box.items} entries={entries} shinyOnly={shinyOnly} ot={otFilter} gameId={gameId} onSelect={f => selectForm(f.id)} onQuickAdd={quickAdd} onAddAll={() => addBox(box.items)} onRemoveAll={() => clearBox(box.items)} />) : <div className="empty">{t('searchEmpty','No Pokémon match this search.')}</div>}{selected && <PokemonDetails form={selected} entries={entries} game={game} onClose={() => selectForm(null)} />}</>;
}
