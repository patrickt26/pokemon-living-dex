import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { create } from 'zustand';
import type { DexSearchSuggestion } from '../domain/dexView';
import { useUiStore } from './uiStore';

interface State {
  scope:string|null;
  suggestions:DexSearchSuggestion[];
  setSuggestions:(scope:string,suggestions:DexSearchSuggestion[])=>void;
  clearSuggestions:(scope:string)=>void;
}

const sameSuggestions=(left:DexSearchSuggestion[],right:DexSearchSuggestion[])=>left.length===right.length&&left.every((item,index)=>{const other=right[index];return item.id===other?.id&&item.name===other.name&&item.dexNumber===other.dexNumber});

export const useSearchSuggestionsStore=create<State>(set=>({
  scope:null,
  suggestions:[],
  setSuggestions:(scope,suggestions)=>set(state=>state.scope===scope&&sameSuggestions(state.suggestions,suggestions)?state:{scope,suggestions}),
  clearSuggestions:scope=>set(state=>state.scope===scope?{scope:null,suggestions:[]}:state),
}));

export function useProvideSearchSuggestions(suggestions:DexSearchSuggestion[]){
  const {pathname}=useLocation();
  useEffect(()=>{
    useSearchSuggestionsStore.getState().setSuggestions(pathname,suggestions);
    const {searchTargetSpeciesId,setSearchTargetSpeciesId}=useUiStore.getState();
    if(searchTargetSpeciesId&&!suggestions.some(suggestion=>suggestion.id===searchTargetSpeciesId))setSearchTargetSpeciesId(null);
  },[pathname,suggestions]);
  useEffect(()=>()=>useSearchSuggestionsStore.getState().clearSuggestions(pathname),[pathname]);
}
