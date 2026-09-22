import type { CollectionEntry, SpeciesId } from './models';

export type HomePlanStatus='transfer'|'covered'|'missing';

export function getHomePlanStatus(speciesId:SpeciesId,currentGameId:string,entries:readonly CollectionEntry[]):HomePlanStatus{
  const relevant=entries.filter(entry=>entry.speciesId===speciesId&&entry.quantity>0);
  if(relevant.some(entry=>entry.gameId!==currentGameId))return 'covered';
  if(relevant.some(entry=>entry.gameId===currentGameId))return 'transfer';
  return 'missing';
}
