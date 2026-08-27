import type { Game, SpeciesId } from './models';

export function isAlphaEligibleSpecies(games:readonly Game[],speciesId:SpeciesId){
  return games.some(game=>game.supportsAlpha===true&&game.dexSpeciesIds.includes(speciesId));
}
