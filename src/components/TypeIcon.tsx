import type { PokemonType } from '../domain/models';
import normalIcon from '../assets/icons/types/1.png?no-inline';
import fightingIcon from '../assets/icons/types/2.png?no-inline';
import flyingIcon from '../assets/icons/types/3.png?no-inline';
import poisonIcon from '../assets/icons/types/4.png?no-inline';
import groundIcon from '../assets/icons/types/5.png?no-inline';
import rockIcon from '../assets/icons/types/6.png?no-inline';
import bugIcon from '../assets/icons/types/7.png?no-inline';
import ghostIcon from '../assets/icons/types/8.png?no-inline';
import steelIcon from '../assets/icons/types/9.png?no-inline';
import fireIcon from '../assets/icons/types/10.png?no-inline';
import waterIcon from '../assets/icons/types/11.png?no-inline';
import grassIcon from '../assets/icons/types/12.png?no-inline';
import electricIcon from '../assets/icons/types/13.png?no-inline';
import psychicIcon from '../assets/icons/types/14.png?no-inline';
import iceIcon from '../assets/icons/types/15.png?no-inline';
import dragonIcon from '../assets/icons/types/16.png?no-inline';
import darkIcon from '../assets/icons/types/17.png?no-inline';
import fairyIcon from '../assets/icons/types/18.png?no-inline';

const icons:Record<PokemonType,string>={normal:normalIcon,fighting:fightingIcon,flying:flyingIcon,poison:poisonIcon,ground:groundIcon,rock:rockIcon,bug:bugIcon,ghost:ghostIcon,steel:steelIcon,fire:fireIcon,water:waterIcon,grass:grassIcon,electric:electricIcon,psychic:psychicIcon,ice:iceIcon,dragon:dragonIcon,dark:darkIcon,fairy:fairyIcon};

export function TypeIcon({type}: {type:PokemonType}){
  return <img className="type-icon" src={icons[type]} alt="" aria-hidden="true"/>;
}
