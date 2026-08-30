import { memo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { PokemonForm, Species } from '../domain/models';
import { AlphaIcon } from './AlphaIcon';
import { PokemonSprite } from './PokemonSprite';
import { TypeIcon } from './TypeIcon';
interface Props { species: Species; form: PokemonForm; owned: boolean; quantity: number; alpha?: boolean; shiny?: boolean; dexNumber?: number; showDexNumber?: boolean; onClick: () => void; onQuickAdd?: () => void }
export const PokemonSlot = memo(function PokemonSlot({ species, form, owned, quantity, alpha=false, shiny=false, dexNumber = species.nationalDexNumber, showDexNumber=true, onClick, onQuickAdd }: Props) {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleClick = () => { if (clickTimer.current) return; clickTimer.current = setTimeout(() => { clickTimer.current = null; onClick(); }, 220); };
  const handleDoubleClick = () => { if (clickTimer.current) clearTimeout(clickTimer.current); clickTimer.current = null; onQuickAdd?.(); };
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => { if (event.key === 'Enter') { event.preventDefault(); onClick(); } if (event.key === ' ') { event.preventDefault(); onQuickAdd?.(); } };
  return <button className={`pokemon-slot ${owned ? 'owned' : 'missing'}`} onClick={handleClick} onDoubleClick={handleDoubleClick} onKeyDown={handleKeyDown} aria-label={`${species.name}, ${showDexNumber?`National Dex #${dexNumber}, `:''}${quantity > 0 ? `${quantity} owned` : 'missing'}`} title="Click for details · Double-click or Space to add or remove one">{showDexNumber&&<span className="dex-number">#{String(dexNumber).padStart(3, '0')}</span>}{shiny&&<span className="shiny-tag" aria-label="Shiny" title="Shiny">✨</span>}{alpha&&<span className={`alpha-tag ${shiny?'below-shiny':''}`} aria-label="Alpha" title="Alpha"><AlphaIcon size={17}/></span>}{quantity > 0 && <span className="quantity">×{quantity}</span>}<PokemonSprite src={form.sprite} name={species.name} dim={!owned} /><strong>{species.name}</strong><span className="pokemon-slot-types" aria-hidden="true">{form.types.map(type=><TypeIcon type={type} key={type}/>)}</span>{form.name !== 'Standard' && <small>{form.name}</small>}</button>;
});
