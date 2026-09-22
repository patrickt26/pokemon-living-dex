import { generatedEvolutionChains, type GeneratedEvolutionChain, type GeneratedEvolutionMethod } from '../data/generatedEvolutionChains';
import type { Language } from '../i18n';

const chainBySpeciesId:Map<string,GeneratedEvolutionChain>=new Map(generatedEvolutionChains.flatMap(chain=>chain.species.map(speciesId=>[`species-${speciesId}`,chain] as const)));

export function getEvolutionChain(speciesId:string):GeneratedEvolutionChain|undefined{
  return chainBySpeciesId.get(speciesId);
}

const names:Record<string,string>={
  'farfetchd':"Farfetch'd",'sirfetchd':"Sirfetch'd",'mr-mime':'Mr. Mime','mime-jr':'Mime Jr.','mr-rime':'Mr. Rime',
  'type-null':'Type: Null','jangmo-o':'Jangmo-o','hakamo-o':'Hakamo-o','kommo-o':'Kommo-o','porygon-z':'Porygon-Z',
};

export function humanizeEvolutionValue(value:string){
  return names[value]??value.split('-').map(part=>part?`${part.charAt(0).toUpperCase()}${part.slice(1)}`:'').join(' ');
}

const triggerLabels:Record<string,[string,string]>={
  'level-up':['Level up','Subir de nível'],trade:['Trade','Troca'],'use-item':['Use item','Usar item'],shed:['Special evolution','Evolução especial'],
  spin:['Spin','Girar'],'tower-of-darkness':['Tower of Darkness','Torre das Sombras'],'tower-of-waters':['Tower of Waters','Torre das Águas'],
  'three-critical-hits':['Land 3 critical hits in one battle','Acertar 3 golpes críticos em uma batalha'],
  'take-damage':['Take damage without fainting','Sofrer dano sem desmaiar'],'in-battle-level-up':['Level up in battle','Subir de nível em batalha'],
  'agile-style-move':['Use an agile-style move','Usar um golpe no estilo ágil'],'strong-style-move':['Use a strong-style move','Usar um golpe no estilo forte'],
  'recoil-damage':['Take recoil damage','Sofrer dano de recuo'],'use-move':['Use a specific move','Usar um golpe específico'],
  'three-defeated-bisharp':['Defeat 3 Bisharp leading Pawniard groups','Derrotar 3 Bisharp líderes de grupos de Pawniard'],
  'gimmighoul-coins':['Collect 999 Gimmighoul Coins','Coletar 999 Moedas de Gimmighoul'],
  'meltan-candies':['Use 400 Meltan Candy in Pokémon GO','Usar 400 Doces Meltan no Pokémon GO'],unclassified:['Special condition','Condição especial'],
};

export function formatEvolutionMethod(method:GeneratedEvolutionMethod,language:Language):string{
  const pt=language==='pt-BR';
  const pieces:string[]=[];
  const label=triggerLabels[method.trigger];
  pieces.push(label?.[pt?1:0]??humanizeEvolutionValue(method.trigger));
  if(method.item)pieces.push(pt?`com ${humanizeEvolutionValue(method.item)}`:`with ${humanizeEvolutionValue(method.item)}`);
  if(method.minLevel!==undefined)pieces.push(pt?`nível ${method.minLevel}`:`level ${method.minLevel}`);
  if(method.gender)pieces.push(method.gender===1?(pt?'fêmea':'female'):(pt?'macho':'male'));
  if(method.location)pieces.push(pt?`em ${humanizeEvolutionValue(method.location)}`:`at ${humanizeEvolutionValue(method.location)}`);
  if(method.heldItem)pieces.push(pt?`segurando ${humanizeEvolutionValue(method.heldItem)}`:`holding ${humanizeEvolutionValue(method.heldItem)}`);
  if(method.timeOfDay)pieces.push(pt?`durante ${method.timeOfDay==='day'?'o dia':'a noite'}`:`during the ${method.timeOfDay}`);
  if(method.knownMove)pieces.push(pt?`sabendo ${humanizeEvolutionValue(method.knownMove)}`:`knowing ${humanizeEvolutionValue(method.knownMove)}`);
  if(method.knownMoveType)pieces.push(pt?`sabendo um golpe ${humanizeEvolutionValue(method.knownMoveType)}`:`knowing a ${humanizeEvolutionValue(method.knownMoveType)}-type move`);
  if(method.minHappiness!==undefined)pieces.push(pt?`amizade ${method.minHappiness}+`:`friendship ${method.minHappiness}+`);
  if(method.minBeauty!==undefined)pieces.push(pt?`beleza ${method.minBeauty}+`:`beauty ${method.minBeauty}+`);
  if(method.minAffection!==undefined)pieces.push(pt?`afeição ${method.minAffection}+`:`affection ${method.minAffection}+`);
  if(method.relativeStats!==undefined)pieces.push(method.relativeStats<0?(pt?'Ataque < Defesa':'Attack < Defense'):method.relativeStats>0?(pt?'Ataque > Defesa':'Attack > Defense'):(pt?'Ataque = Defesa':'Attack = Defense'));
  if(method.partySpecies)pieces.push(pt?`com ${humanizeEvolutionValue(method.partySpecies)} na equipe`:`with ${humanizeEvolutionValue(method.partySpecies)} in the party`);
  if(method.partyType)pieces.push(pt?`com um Pokémon ${humanizeEvolutionValue(method.partyType)} na equipe`:`with a ${humanizeEvolutionValue(method.partyType)}-type Pokémon in the party`);
  if(method.tradeSpecies)pieces.push(pt?`por ${humanizeEvolutionValue(method.tradeSpecies)}`:`for ${humanizeEvolutionValue(method.tradeSpecies)}`);
  if(method.rain)pieces.push(pt?'chovendo':'while raining');
  if(method.upsideDown)pieces.push(pt?'com o console de cabeça para baixo':'with the console upside down');
  if(method.multiplayer)pieces.push(pt?'no modo multiplayer':'in multiplayer mode');
  if(method.nearSpecialRock)pieces.push(pt?'perto da rocha especial':'near the special rock');
  if(method.region)pieces.push(pt?`na região de ${humanizeEvolutionValue(method.region)}`:`in the ${humanizeEvolutionValue(method.region)} region`);
  if(method.requiredForm)pieces.push(pt?`na forma ${humanizeEvolutionValue(method.requiredForm)}`:`as ${humanizeEvolutionValue(method.requiredForm)}`);
  if(method.usedMove)pieces.push(pt?`usar ${humanizeEvolutionValue(method.usedMove)}${method.minMoveCount?` ${method.minMoveCount} vezes`:''}`:`use ${humanizeEvolutionValue(method.usedMove)}${method.minMoveCount?` ${method.minMoveCount} times`:''}`);
  if(method.minSteps!==undefined)pieces.push(pt?`caminhar ${method.minSteps} passos no Let's Go`:`walk ${method.minSteps} steps in Let's Go mode`);
  if(method.minDamage!==undefined)pieces.push(pt?`acumular ${method.minDamage}+ de dano sem desmaiar`:`take ${method.minDamage}+ total damage without fainting`);
  if(method.natureCondition)pieces.push(pt?'nature específica':'specific nature');
  if(method.specialCondition)pieces.push(pt?'condição interna especial':'special internal condition');
  if(method.chance!==undefined)pieces.push(`${method.chance}%`);
  return pieces.join(' · ');
}
