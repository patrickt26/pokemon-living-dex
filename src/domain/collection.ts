import type { CollectionEntry, EntrySummary, FormId, Game, OtFilter, Progress, SpeciesId } from './models';

export function filterEntries(entries: CollectionEntry[], options: { shinyOnly?: boolean; ot?: OtFilter; gameId?: string } = {}) {
  return entries.filter((entry) => (!options.shinyOnly || entry.shiny) && (!options.gameId || entry.gameId === options.gameId) && (options.ot === undefined || options.ot === 'all' || (options.ot === 'own' ? entry.ownOT : !entry.ownOT)));
}
export function isSpeciesOwned(entries: CollectionEntry[], speciesId: SpeciesId, options: { shinyOnly?: boolean; ot?: OtFilter; gameId?: string } = {}) {
  return filterEntries(entries, options).some((entry) => entry.speciesId === speciesId && entry.quantity > 0);
}
export function isFormOwned(entries: CollectionEntry[], formId: FormId, options: { shinyOnly?: boolean; ot?: OtFilter; gameId?: string } = {}) {
  return filterEntries(entries, options).some((entry) => entry.formId === formId && entry.quantity > 0);
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
export function calculateProgress(speciesIds: SpeciesId[], entries: CollectionEntry[], options: { shinyOnly?: boolean; ot?: OtFilter; gameId?: string } = {}): Progress {
  const obtained = new Set(filterEntries(entries, options).filter((entry) => entry.quantity > 0 && speciesIds.includes(entry.speciesId)).map((entry) => entry.speciesId)).size;
  const total = speciesIds.length;
  return { obtained, total, percentage: total ? Math.round((obtained / total) * 1000) / 10 : 0 };
}
export function calculateGameProgress(game:Game,entries:CollectionEntry[]):Progress {const obtained=new Set(entries.filter(entry=>entry.gameId===game.id&&entry.quantity>0&&game.dexSpeciesIds.includes(entry.speciesId)).filter(entry=>{const sections=game.dexSections?.filter(section=>section.dexSpeciesIds.includes(entry.speciesId))??[];return sections.some(section=>!section.formOverrides?.[entry.speciesId]||section.formOverrides[entry.speciesId]===entry.formId)}).map(entry=>entry.speciesId)).size;const total=game.dexSpeciesIds.length;return {obtained,total,percentage:total?Math.round(obtained/total*1000)/10:0}}
