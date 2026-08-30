import { Minus, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { isAlphaEligibleSpecies } from '../domain/alpha';
import { summarizeEntries } from '../domain/collection';
import type { CollectionEntry, Game, PokemonForm } from '../domain/models';
import { useCollectionActions } from '../hooks/useCollection';
import { GameBadge } from './GameBadge';
import { PokemonSprite } from './PokemonSprite';
import { useI18n } from '../i18n';
import { AlphaIcon } from './AlphaIcon';
import { TypeIcon } from './TypeIcon';

export function PokemonDetails({ form, entries, game, onClose }: { form:PokemonForm; entries:CollectionEntry[]; game?:Game; onClose:()=>void }) {
  const { t } = useI18n();
  const panelRef=useRef<HTMLElement>(null);
  useEffect(()=>{panelRef.current?.focus();const close=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close)},[onClose]);
  const species = pokemonDataSource.getSpeciesById().get(form.speciesId)!;
  const games = pokemonDataSource.getGames();
  const availableGames = games.filter(candidate => candidate.id === 'home' || candidate.dexSpeciesIds.includes(species.id));
  const alphaEligible = isAlphaEligibleSpecies(games,species.id);
  const forms = pokemonDataSource.getFormsBySpeciesId().get(species.id)??[];
  const relevant = entries.filter(entry => entry.speciesId === species.id);
  const summary = summarizeEntries(relevant);
  const localDexNumbers = (game?.dexSections ?? []).flatMap(section => {
    if (section.showDexNumbers === false) return [];
    const index = section.dexSpeciesIds.indexOf(species.id);
    return index < 0 ? [] : [`${section.name} #${String(index + 1).padStart(3, '0')}`];
  });
  const { add, changeOne, changeQuantity } = useCollectionActions();
  const [gameId, setGameId] = useState(game?.id ?? availableGames[0]?.id ?? 'home');
  const [ownOT, setOwnOT] = useState(true);
  const [shiny, setShiny] = useState(false);
  const [alpha, setAlpha] = useState(false);
  const [selectedForm, setSelectedForm] = useState(form.id);
  useEffect(() => setSelectedForm(form.id), [form.id]);
  const activeForm = pokemonDataSource.getFormsById().get(selectedForm) ?? form;
  const showAlpha = alphaEligible && (!game || game.supportsAlpha === true);
  const addOne = () => add.mutate({ speciesId:species.id, formId:activeForm.id, gameId, ownOT, shiny, alpha:showAlpha&&alpha, quantity:1 });

  return <div className="drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><aside ref={panelRef} className="details" role="dialog" aria-modal="true" aria-labelledby="pokemon-details-title" tabIndex={-1}>
    <button className="close" onClick={onClose} aria-label={t('closePokemonDetails','Close Pokémon details')}><X/></button>
    <div className="details-hero"><div className="details-sprite-column"><PokemonSprite src={shiny ? (activeForm.shinySprite ?? activeForm.sprite) : activeForm.sprite} name={species.name}/><span className="details-type-icons" aria-hidden="true">{activeForm.types.map(type=><TypeIcon type={type} key={type}/>)}</span></div><div className="details-heading"><div className="dex-labels"><span className="dex-label-current">{t('nationalDex','National Dex')} #{String(species.nationalDexNumber).padStart(4, '0')}</span>{localDexNumbers.map(label => <span className="dex-label-national" key={label}>{label}</span>)}</div><h2 id="pokemon-details-title">{species.name}</h2><p>{activeForm.name} {t('formLower','form')}</p></div></div>
    <div className="stat-row"><div><strong>{summary.total}</strong><span>{t('total','Total')}</span></div><div><strong>{summary.ownOT}</strong><span>{t('ownOt','Own OT')}</span></div><div><strong>{summary.otherOT}</strong><span>{t('otherOtStat','Other OT')}</span></div><div><strong>{summary.shiny}</strong><span>{t('shinyMode','Shiny')}</span></div></div>
    <section><h3>{t('byGame','By game')}</h3><div className="badges">{availableGames.map(candidate => <GameBadge key={candidate.id} game={candidate} count={summary.byGame[candidate.id] ?? 0}/>)}</div></section>
    <section><h3>{t('quickAdd','Quick add')}</h3><label>{t('form','Form')}<select value={selectedForm} onChange={event => setSelectedForm(event.target.value)}>{forms.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label><label>{t('game','Game')}<select value={gameId} onChange={event => setGameId(event.target.value)} disabled={!availableGames.length}>{!availableGames.length && <option value="home">{t('noCompatibleGame','No compatible game')}</option>}{availableGames.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label><div className="toggle-row"><button className={ownOT ? 'active' : ''} onClick={() => setOwnOT(value => !value)}>{t('ownOt','Own OT')}</button><button className={shiny ? 'active' : ''} onClick={() => setShiny(value => !value)}>{t('shiny','✨ Shiny')}</button>{showAlpha&&<button className={alpha ? 'active' : ''} onClick={() => setAlpha(value => !value)}><AlphaIcon /> {t('alpha','Alpha')}</button>}</div><button className="primary" onClick={addOne} disabled={!availableGames.length}><Plus size={18}/> {t('addOne','Add one')}</button></section>
    {relevant.length > 0 && <section><h3>{t('entries','Entries')}</h3><div className="entry-list">{relevant.map(entry => {
      const entryGame = games.find(candidate => candidate.id === entry.gameId)!;
      const origin = games.find(candidate => candidate.id === (entry.originGameId ?? entry.gameId));
      return <div className="entry" key={entry.id}><div className="entry-meta"><div className="entry-game"><GameBadge game={entryGame}/>{origin && origin.id !== entryGame.id && <small>{t('origin','Origin')}: {origin.shortName}</small>}</div><div className="entry-toggles"><label className="entry-form">{t('form','Form')}<select value={entry.formId} onChange={event => changeOne.mutate({ id:entry.id, changes:{ formId:event.target.value } })} title={t('changeForm','Change the form of one copy')}>{forms.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label><label className="entry-form entry-origin">{t('game','Game')}<select value={entry.originGameId ?? entry.gameId} onChange={event => changeOne.mutate({ id:entry.id, changes:{ gameId:event.target.value, originGameId:event.target.value } })} title={t('changeGame','Change the game of one copy')}>{availableGames.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.shortName}</option>)}</select></label><button className={entry.ownOT ? 'active' : ''} onClick={() => changeOne.mutate({ id:entry.id, changes:{ ownOT:!entry.ownOT } })} title={t('changeOt','Change the OT of one copy')}>{entry.ownOT ? t('ownOt','Own OT') : t('otherOtStat','Other OT')}</button><button className={entry.shiny ? 'active shiny' : ''} onClick={() => changeOne.mutate({ id:entry.id, changes:{ shiny:!entry.shiny } })} title={t('changeShiny','Change the shiny status of one copy')}>{entry.shiny ? t('shiny','✨ Shiny') : t('regular','Regular')}</button>{showAlpha&&<button className={entry.alpha ? 'active' : ''} onClick={() => changeOne.mutate({ id:entry.id, changes:{ alpha:!entry.alpha } })} title={t('changeAlpha','Change the Alpha status of one copy')}><AlphaIcon size={13} /> {entry.alpha?t('alpha','Alpha'):t('notAlpha','Not Alpha')}</button>}</div></div><div><button aria-label={`${t('removeOne','Remove one')} ${species.name}`} onClick={() => changeQuantity.mutate({ id:entry.id, quantity:entry.quantity - 1 })}><Minus size={14}/></button><strong aria-live="polite">{entry.quantity}</strong><button aria-label={`${t('addOne','Add one')} ${species.name}`} onClick={() => changeQuantity.mutate({ id:entry.id, quantity:entry.quantity + 1 })}><Plus size={14}/></button></div></div>;
    })}</div></section>}
  </aside></div>;
}
