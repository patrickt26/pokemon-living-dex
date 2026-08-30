import type { PokemonType } from './models';

export const pokemonTypes: readonly PokemonType[] = [
  'normal','fire','water','electric','grass','ice','fighting','poison','ground',
  'flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy',
];

export function toggleTypeSelection(selected:readonly PokemonType[],type:PokemonType|'all'):PokemonType[]{
  if(type==='all')return [];
  if(selected.includes(type))return selected.filter(candidate=>candidate!==type);
  return [...selected,type].slice(-2);
}

export function isInTypes(types:readonly PokemonType[],selected:readonly PokemonType[]):boolean{
  return selected.every(type=>types.includes(type));
}
