import type { AlphaFilter, CollectionEntry, EntrySummary, FormId, Game, OtFilter, Progress, ShinyFilter, SpeciesId } from './models';

interface EntryFilters { shiny?: ShinyFilter; shinyOnly?: boolean; alpha?: AlphaFilter; ot?: OtFilter; gameId?: string }
export function filterEntries(entries: CollectionEntry[], options: EntryFilters = {}) {
  return entries.filter((entry) => (options.shiny === undefined ? !options.shinyOnly || entry.shiny : options.shiny === 'all' || (options.shiny === 'shiny' ? entry.shiny : !entry.shiny)) && (options.alpha === undefined || options.alpha === 'all' || (options.alpha === 'alpha' ? entry.alpha : !entry.alpha)) && (!options.gameId || entry.gameId === options.gameId) && (options.ot === undefined || options.ot === 'all' || (options.ot === 'own' ? entry.ownOT : !entry.ownOT)));
}
export function isSpeciesOwned(entries: CollectionEntry[], speciesId: SpeciesId, options: EntryFilters = {}) {
  return filterEntries(entries, options).some((entry) => entry.speciesId === speciesId && entry.quantity > 0);
}
export function isFormOwned(entries: CollectionEntry[], formId: FormId, options: EntryFilters = {}) {
  return filterEntries(entries, options).some((entry) => entry.formId === formId && entry.quantity > 0);
}
export function selectDisplayEntry(entries: CollectionEntry[]) {
  return entries.reduce<CollectionEntry | undefined>((selected, entry) => {
    if (entry.quantity <= 0) return selected;
    const priority = Number(entry.alpha) + Number(entry.shiny) * 2;
    const selectedPriority = selected ? Number(selected.alpha) + Number(selected.shiny) * 2 : -1;
    return priority > selectedPriority ? entry : selected;
  }, undefined);
}
export function hasMultipleOrigins(entries: CollectionEntry[]) {
  const total = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const origins = new Set(entries.map((entry) => entry.originGameId ?? entry.gameId));
  return total > 1 && origins.size > 1;
}
export function summarizeEntries(entries: CollectionEntry[]): EntrySummary {
  return entries.reduce<EntrySummary>((summary, entry) => {
    summary.total += entry.quantity;
    summary[entry.ownOT ? 'ownOT' : 'otherOT'] += entry.quantity;
    if (entry.shiny) summary.shiny += entry.quantity;
    summary.byGame[entry.gameId] = (summary.byGame[entry.gameId] ?? 0) + entry.quantity;
    return summary;
  }, { total: 0, ownOT: 0, otherOT: 0, shiny: 0, byGame: {} });
}
export function calculateProgress(speciesIds: SpeciesId[], entries: CollectionEntry[], options: EntryFilters = {}): Progress {
  const obtained = new Set(filterEntries(entries, options).filter((entry) => entry.quantity > 0 && speciesIds.includes(entry.speciesId)).map((entry) => entry.speciesId)).size;
  const total = speciesIds.length;
  return { obtained, total, percentage: total ? Math.round((obtained / total) * 1000) / 10 : 0 };
}
export function calculateGameProgress(game:Game,entries:CollectionEntry[]):Progress {const obtained=new Set(entries.filter(entry=>entry.gameId===game.id&&entry.quantity>0&&game.dexSpeciesIds.includes(entry.speciesId)).filter(entry=>{const sections=game.dexSections?.filter(section=>section.dexSpeciesIds.includes(entry.speciesId))??[];return sections.some(section=>!section.formOverrides?.[entry.speciesId]||section.formOverrides[entry.speciesId]===entry.formId)}).map(entry=>entry.speciesId)).size;const total=game.dexSpeciesIds.length;return {obtained,total,percentage:total?Math.round(obtained/total*1000)/10:0}}
