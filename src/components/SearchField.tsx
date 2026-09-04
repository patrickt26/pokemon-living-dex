import { Search, X } from 'lucide-react';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../i18n';
import { useSearchSuggestionsStore } from '../store/searchSuggestionsStore';
import { useUiStore } from '../store/uiStore';

interface Props {
  value:string;
  onChange:(value:string)=>void;
}

export function SearchField({value,onChange}:Props){
  const {t}=useI18n();
  const label=t('search','Search Pokémon or # number');
  const inputRef=useRef<HTMLInputElement>(null);
  const suggestionState=useSearchSuggestionsStore();
  const setSearchTargetSpeciesId=useUiStore(state=>state.setSearchTargetSpeciesId);
  const availableSuggestions=suggestionState.suggestions;
  const listId=useId();
  const [open,setOpen]=useState(false);
  const [activeIndex,setActiveIndex]=useState(-1);
  const suggestions=useMemo(()=>{
    const query=value.trim().toLowerCase();
    if(!query)return [];
    const numberQuery=query.replace(/^#/,'');
    return availableSuggestions
      .filter(suggestion=>suggestion.name.toLowerCase().includes(query)||(!!numberQuery&&suggestion.dexNumber!==undefined&&String(suggestion.dexNumber).includes(numberQuery)))
      .sort((left,right)=>Number(!left.name.toLowerCase().startsWith(query))-Number(!right.name.toLowerCase().startsWith(query)))
      .slice(0,8);
  },[availableSuggestions,value]);
  const showSuggestions=open&&suggestions.length>0;
  const selectSuggestion=(suggestion:(typeof suggestions)[number])=>{onChange(suggestion.name);setSearchTargetSpeciesId(suggestion.id);setOpen(false);setActiveIndex(-1);inputRef.current?.focus()};
  const handleKeyDown=(event:KeyboardEvent<HTMLInputElement>)=>{
    if(event.key==='ArrowDown'&&suggestions.length){event.preventDefault();setOpen(true);setActiveIndex(current=>(current+1)%suggestions.length)}
    else if(event.key==='ArrowUp'&&suggestions.length){event.preventDefault();setOpen(true);setActiveIndex(current=>current<=0?suggestions.length-1:current-1)}
    else if(event.key==='Enter'){if(activeIndex>=0&&suggestions[activeIndex]){event.preventDefault();selectSuggestion(suggestions[activeIndex])}else setOpen(false)}
    else if(event.key==='Escape'){setOpen(false);setActiveIndex(-1)}
  };
  const clear=()=>{onChange('');setSearchTargetSpeciesId(null);setOpen(false);setActiveIndex(-1);inputRef.current?.focus()};
  return <div className="search">
    <Search size={18}/>
    <input ref={inputRef} value={value} onChange={event=>{onChange(event.target.value);setSearchTargetSpeciesId(null);setOpen(true);setActiveIndex(-1)}} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} onKeyDown={handleKeyDown} placeholder={label} aria-label={label} role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls={showSuggestions?listId:undefined} aria-activedescendant={activeIndex>=0?`${listId}-${activeIndex}`:undefined} autoComplete="off" spellCheck={false}/>
    <button className="search-clear" type="button" onClick={clear} disabled={!value} aria-label={t('clearSearch')} title={t('clearSearch')}><X size={16}/></button>
    {showSuggestions&&<div className="search-suggestions" id={listId} role="listbox" aria-label={t('searchSuggestions')}>
      {suggestions.map((species,index)=><button id={`${listId}-${index}`} type="button" role="option" aria-selected={index===activeIndex} className={index===activeIndex?'active':''} onMouseDown={event=>event.preventDefault()} onClick={()=>selectSuggestion(species)} key={species.id}><span>{species.dexNumber===undefined?'—':`#${String(species.dexNumber).padStart(3,'0')}`}</span><strong>{species.name}</strong></button>)}
    </div>}
  </div>;
}
