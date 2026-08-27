import alphaPokemonIcon from '../assets/icons/alpha-pokemon.png';

export function AlphaIcon({ size = 16 }: { size?: number }) {
  return <img className="alpha-icon" src={alphaPokemonIcon} width={size} height={size} alt="" aria-hidden="true" />;
}
