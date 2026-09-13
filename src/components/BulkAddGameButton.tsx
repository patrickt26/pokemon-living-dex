import { Gamepad2, X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { isFormAvailableInGame } from '../domain/gameAvailability';
import type { PokemonForm } from '../domain/models';
import { useI18n } from '../i18n';

interface Props {
  children: ReactNode;
  forms: PokemonForm[];
  onAdd: (gameId: string, forms: PokemonForm[]) => void;
  buttonTitle?: string;
  className?: string;
  requiresAlpha?: boolean;
}

export function BulkAddGameButton({children,forms,onAdd,buttonTitle,className,requiresAlpha=false}:Props){
  const {t}=useI18n();
  const [open,setOpen]=useState(false);
  const [gameId,setGameId]=useState('home');
  const triggerRef=useRef<HTMLButtonElement>(null);
  const selectRef=useRef<HTMLSelectElement>(null);
  const titleId=useId();
  const descriptionId=useId();
  const options=useMemo(()=>pokemonDataSource.getGames().map(game=>({
    game,
    forms:forms.filter(form=>isFormAvailableInGame(form,game)),
  })).filter(option=>option.forms.length>0&&(!requiresAlpha||option.game.id==='home'||option.game.supportsAlpha===true)),[forms,requiresAlpha]);
  const selected=options.find(option=>option.game.id===gameId)??options[0];
  const close=()=>{setOpen(false);requestAnimationFrame(()=>triggerRef.current?.focus())};
  const show=()=>{setGameId('home');setOpen(true)};
  useEffect(()=>{if(!open)return;selectRef.current?.focus();const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close()}};window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown)},[open]);
  const confirm=()=>{if(!selected)return;onAdd(selected.game.id,selected.forms);close()};
  const dialog=open?<div className="confirm-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}><section className="confirm-dialog bulk-add-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
    <button className="confirm-close" onClick={close} aria-label={t('closeBulkAdd','Close game selection')}><X size={18}/></button>
    <div className="bulk-add-icon"><Gamepad2 size={22}/></div>
    <div className="confirm-copy"><span>{t('bulkAdd','Bulk add')}</span><h2 id={titleId}>{t('chooseBulkGame','Choose a game')}</h2><p id={descriptionId}>{t('chooseBulkGameDescription','Choose where these Pokémon should be recorded. Only compatible Pokémon will be added.')}</p></div>
    <label className="bulk-add-game">{t('game','Game')}<select ref={selectRef} value={selected?.game.id??''} onChange={event=>setGameId(event.target.value)}>{options.map(option=><option value={option.game.id} key={option.game.id}>{option.game.name} — {option.forms.length}/{forms.length}</option>)}</select></label>
    {selected&&<p className="bulk-add-summary"><strong>{selected.forms.length}</strong> {t('bulkCompatibleCount','compatible Pokémon')} · {selected.game.shortName}</p>}
    <div className="confirm-actions"><button onClick={close}>{t('cancel','Cancel')}</button><button className="bulk-add-confirm" onClick={confirm}>{t('addToGame','Add to game')}</button></div>
  </section></div>:null;
  const portalRoot=document.querySelector('.app')??document.body;
  return <><button ref={triggerRef} className={className} title={buttonTitle} disabled={!forms.length} onClick={show}>{children}</button>{dialog&&createPortal(dialog,portalRoot)}</>;
}
