import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CollectionEntry, CollectionEntryInput } from '../domain/models';
import { collectionService } from '../app/dependencies';
import { useToastStore } from '../store/toastStore';
const key=['collection'] as const;
export function useCollection(){return useQuery({queryKey:key,queryFn:()=>collectionService.list()});}
export function useCollectionActions(){
 const client=useQueryClient();const show=useToastStore(state=>state.show);const success=(message:string)=>async()=>{await client.invalidateQueries({queryKey:key});show(message)};const error=(reason:Error)=>show(reason.message||'The collection could not be updated.','error');
 const add=useMutation({mutationFn:(input:CollectionEntryInput)=>collectionService.add(input),onSuccess:success('Pokémon added.'),onError:error});
 const addMany=useMutation({mutationFn:(inputs:CollectionEntryInput[])=>collectionService.addOrIncrementMany(inputs),onSuccess:success('Collection updated.'),onError:error});
 const update=useMutation({mutationFn:({id,changes}:{id:string;changes:Partial<CollectionEntryInput>})=>collectionService.update(id,changes),onSuccess:success('Entry updated.'),onError:error});
 const changeOne=useMutation({mutationFn:({id,changes}:{id:string;changes:Partial<CollectionEntryInput>})=>collectionService.changeOne(id,changes),onSuccess:success('One copy updated.'),onError:error});
 const changeQuantity=useMutation<{removed?:CollectionEntry},Error,{id:string;quantity:number}>({mutationFn:async({id,quantity})=>{const entry=client.getQueryData<CollectionEntry[]>(key)?.find(candidate=>candidate.id===id);await collectionService.changeQuantity(id,quantity);return {removed:quantity<=0?entry:undefined}},onSuccess:async(data)=>{await client.invalidateQueries({queryKey:key});if(data.removed){const entry=data.removed;show('Entry removed.','success',{label:'Undo',onClick:async()=>{const input:CollectionEntryInput={speciesId:entry.speciesId,formId:entry.formId,shiny:entry.shiny,gameId:entry.gameId,ownOT:entry.ownOT,quantity:entry.quantity,originGameId:entry.originGameId};await collectionService.add(input);await client.invalidateQueries({queryKey:key});show('Entry restored.')}})}else show('Quantity updated.')},onError:error});
 const remove=useMutation({mutationFn:(id:string)=>collectionService.remove(id),onSuccess:success('Entry removed.'),onError:error});
 const removeMany=useMutation<CollectionEntry[],Error,string[]>({mutationFn:async(ids)=>{const entries=client.getQueryData<CollectionEntry[]>(key)??[];const removed=entries.filter(entry=>ids.includes(entry.id));await collectionService.removeMany(ids);return removed},onSuccess:async(removed)=>{await client.invalidateQueries({queryKey:key});if(!removed.length){show('No entries removed.');return}show(`${removed.length} entr${removed.length===1?'y':'ies'} removed.`,'success',{label:'Undo',onClick:async()=>{await Promise.all(removed.map(entry=>collectionService.add({speciesId:entry.speciesId,formId:entry.formId,gameId:entry.gameId,originGameId:entry.originGameId,shiny:entry.shiny,ownOT:entry.ownOT,quantity:entry.quantity})));await client.invalidateQueries({queryKey:key});show('Entries restored.')}})},onError:error});
 return {add,addMany,update,changeOne,changeQuantity,remove,removeMany};
}
