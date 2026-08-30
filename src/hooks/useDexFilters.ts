import { useState } from 'react';
import type { AlphaFilter, OwnershipFilter, PokemonType, ShinyFilter } from '../domain/models';
import { toggleTypeSelection } from '../domain/types';

export function useDexFilters(){
  const [ownership,setOwnership]=useState<OwnershipFilter>('all');
  const [shiny,setShiny]=useState<ShinyFilter>('all');
  const [alpha,setAlpha]=useState<AlphaFilter>('all');
  const [selectedTypes,setSelectedTypes]=useState<PokemonType[]>([]);
  const toggleType=(type:PokemonType|'all')=>setSelectedTypes(current=>toggleTypeSelection(current,type));
  return {ownership,setOwnership,shiny,setShiny,alpha,setAlpha,selectedTypes,toggleType,shinyValue:shiny==='shiny',alphaValue:alpha==='alpha'};
}
