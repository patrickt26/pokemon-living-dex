import type { PokemonForm,Species } from './models';
export interface DexItem { species:Species; form:PokemonForm; dexNumber:number; showDexNumber?:boolean; collectBySpecies?:boolean }
export interface DexGroup { id:string; label:string|null; items:DexItem[] }
export interface DexBox { key:string; title:string; items:DexItem[] }
export function paginateDexGroups(groups:DexGroup,boxSize=30,prefix=''){return Array.from({length:Math.ceil(groups.items.length/boxSize)},(_,index):DexBox=>({key:`${prefix}${groups.id}-${index}`,title:`${groups.label?`${groups.label} · `:''}BOX ${String(index+1).padStart(2,'0')}`,items:groups.items.slice(index*boxSize,(index+1)*boxSize)}))}
export function paginateDexGroupList(groups:DexGroup[],boxSize=30,prefix=''){return groups.flatMap(group=>paginateDexGroups(group,boxSize,prefix))}
export function matchesPokemonSearch(item:Pick<DexItem,'species'>,search:string){const query=search.trim().toLowerCase();return !query||item.species.name.toLowerCase().includes(query)||String(item.species.nationalDexNumber).includes(query.replace('#',''))}
export function filterDexBoxesBySearch(boxes:DexBox[],search:string){return search.trim()?boxes.filter(box=>box.items.some(item=>matchesPokemonSearch(item,search))):boxes}
