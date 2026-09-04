import type { PokemonForm,Species } from './models';
export interface DexItem { species:Species; form:PokemonForm; dexNumber:number; showDexNumber?:boolean; collectBySpecies?:boolean }
export interface DexGroup { id:string; label:string|null; items:DexItem[] }
export interface DexBox { key:string; title:string; items:DexItem[] }
export interface DexSearchSuggestion { id:string; name:string; dexNumber?:number }
type SearchableDexItem={species:Species;dexNumber?:number;showDexNumber?:boolean};
export function paginateDexGroups(groups:DexGroup,boxSize=30,prefix=''){return Array.from({length:Math.ceil(groups.items.length/boxSize)},(_,index):DexBox=>({key:`${prefix}${groups.id}-${index}`,title:`${groups.label?`${groups.label} · `:''}BOX ${String(index+1).padStart(2,'0')}`,items:groups.items.slice(index*boxSize,(index+1)*boxSize)}))}
export function paginateDexGroupList(groups:DexGroup[],boxSize=30,prefix=''){return groups.flatMap(group=>paginateDexGroups(group,boxSize,prefix))}
export function combineDexItemsBySpecies(items:DexItem[]){const unique=new Map<string,DexItem>();for(const item of items)if(!unique.has(item.species.id))unique.set(item.species.id,item);return [...unique.values()].map((item,index)=>({...item,dexNumber:index+1}))}
export function createDexSearchSuggestions(items:SearchableDexItem[]){const suggestions=new Map<string,DexSearchSuggestion>();for(const item of items)if(!suggestions.has(item.species.id))suggestions.set(item.species.id,{id:item.species.id,name:item.species.name,dexNumber:item.showDexNumber===false?undefined:item.dexNumber??item.species.nationalDexNumber});return [...suggestions.values()]}
