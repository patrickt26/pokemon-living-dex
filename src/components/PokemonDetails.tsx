import { Minus, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { summarizeEntries } from '../domain/collection';
import type { CollectionEntry, Game, PokemonForm } from '../domain/models';
import { useCollectionActions } from '../hooks/useCollection';
import { GameBadge } from './GameBadge';
import { PokemonSprite } from './PokemonSprite';

export function PokemonDetails({ form, entries, game, onClose }: { form:PokemonForm; entries:CollectionEntry[]; game?:Game; onClose:()=>void }) {
  const panelRef=useRef<HTMLElement>(null);
  useEffect(()=>{panelRef.current?.focus();const close=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close)},[onClose]);
  const species = pokemonDataSource.getSpecies().find(candidate => candidate.id === form.speciesId)!;
  const games = pokemonDataSource.getGames();
  const availableGames = games.filter(candidate => candidate.id === 'home' || candidate.dexSpeciesIds.includes(species.id));
  const forms = pokemonDataSource.getForms().filter(candidate => candidate.speciesId === species.id);
  const relevant = entries.filter(entry => entry.speciesId === species.id);
  const summary = summarizeEntries(relevant);
  const localDexNumbers = (game?.dexSections ?? []).flatMap(section => {
    const index = section.dexSpeciesIds.indexOf(species.id);
    return index < 0 ? [] : [`${section.name} #${String(index + 1).padStart(3, '0')}`];
  });
  const { add, changeOne, changeQuantity } = useCollectionActions();
  const [gameId, setGameId] = useState(game?.id ?? availableGames[0]?.id ?? 'home');
  const [ownOT, setOwnOT] = useState(true);
  const [shiny, setShiny] = useState(false);
  const [selectedForm, setSelectedForm] = useState(form.id);
  const addOne = () => add.mutate({ speciesId:species.id, formId:selectedForm, gameId, ownOT, shiny, quantity:1 });

  return <div className="drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><aside ref={panelRef} className="details" role="dialog" aria-modal="true" aria-labelledby="pokemon-details-title" tabIndex={-1}>
    <button className="close" onClick={onClose} aria-label="Close Pokémon details"><X/></button>
    <div className="details-hero"><PokemonSprite src={shiny ? (form.shinySprite ?? form.sprite) : form.sprite} name={species.name}/><div className="details-heading"><div className="dex-labels"><span className="dex-label-current">National Dex #{String(species.nationalDexNumber).padStart(4, '0')}</span>{localDexNumbers.map(label => <span className="dex-label-national" key={label}>{label}</span>)}</div><h2 id="pokemon-details-title">{species.name}</h2><p>{form.name} form</p></div></div>
    <div className="stat-row"><div><strong>{summary.total}</strong><span>Total</span></div><div><strong>{summary.ownOT}</strong><span>Own OT</span></div><div><strong>{summary.otherOT}</strong><span>Other OT</span></div><div><strong>{summary.shiny}</strong><span>Shiny</span></div></div>
    <section><h3>By game</h3><div className="badges">{availableGames.map(candidate => <GameBadge key={candidate.id} game={candidate} count={summary.byGame[candidate.id] ?? 0}/>)}</div></section>
    <section><h3>Quick add</h3><label>Form<select value={selectedForm} onChange={event => setSelectedForm(event.target.value)}>{forms.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label><label>Game<select value={gameId} onChange={event => setGameId(event.target.value)} disabled={!availableGames.length}>{!availableGames.length && <option value="home">No compatible game</option>}{availableGames.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label><div className="toggle-row"><button className={ownOT ? 'active' : ''} onClick={() => setOwnOT(value => !value)}>Own OT</button><button className={shiny ? 'active' : ''} onClick={() => setShiny(value => !value)}>✨ Shiny</button></div><button className="primary" onClick={addOne} disabled={!availableGames.length}><Plus size={18}/> Add one</button></section>
    {relevant.length > 0 && <section><h3>Entries</h3><div className="entry-list">{relevant.map(entry => {
      const entryGame = games.find(candidate => candidate.id === entry.gameId)!;
      const origin = games.find(candidate => candidate.id === (entry.originGameId ?? entry.gameId));
      return <div className="entry" key={entry.id}><div className="entry-meta"><div className="entry-game"><GameBadge game={entryGame}/>{origin && origin.id !== entryGame.id && <small>Origin: {origin.shortName}</small>}</div><div className="entry-toggles"><label className="entry-form">Form<select value={entry.formId} onChange={event => changeOne.mutate({ id:entry.id, changes:{ formId:event.target.value } })} title="Change the form of one copy">{forms.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label><label className="entry-form entry-origin">Game<select value={entry.originGameId ?? entry.gameId} onChange={event => changeOne.mutate({ id:entry.id, changes:{ gameId:event.target.value, originGameId:event.target.value } })} title="Change the game of one copy">{availableGames.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.shortName}</option>)}</select></label><button className={entry.ownOT ? 'active' : ''} onClick={() => changeOne.mutate({ id:entry.id, changes:{ ownOT:!entry.ownOT } })} title="Change the OT of one copy">{entry.ownOT ? 'Own OT' : 'Other OT'}</button><button className={entry.shiny ? 'active shiny' : ''} onClick={() => changeOne.mutate({ id:entry.id, changes:{ shiny:!entry.shiny } })} title="Change the shiny status of one copy">{entry.shiny ? '✨ Shiny' : 'Regular'}</button></div></div><div><button aria-label={`Remove one ${species.name}`} onClick={() => changeQuantity.mutate({ id:entry.id, quantity:entry.quantity - 1 })}><Minus size={14}/></button><strong aria-live="polite">{entry.quantity}</strong><button aria-label={`Add one ${species.name}`} onClick={() => changeQuantity.mutate({ id:entry.id, quantity:entry.quantity + 1 })}><Plus size={14}/></button></div></div>;
    })}</div></section>}
  </aside></div>;
}
