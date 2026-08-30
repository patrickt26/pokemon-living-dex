import type { FormGroup, Game, PokemonForm, Species } from '../domain/models';
import { isStandardVariantAlias } from '../domain/variantForms';
import { generatedSpecies } from './generatedSpecies';
import { generatedGameDexes } from './generatedGameDexes';
import { generatedPokemonTypes } from './generatedPokemonTypes';

const sprite = (id: number, shiny = false) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? 'shiny/' : ''}${id}.png`;
const formSprite = (id: number, slug: string, shiny = false) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? 'shiny/' : ''}${id}-${slug}.png`;
const unownSprite = (slug: string, shiny = false) => {
  const symbol = slug === 'exclamation' ? 'exclamation' : slug === 'question' ? 'question' : undefined;
  if (symbol) return `https://play.pokemonshowdown.com/sprites/gen4${shiny ? '-shiny' : ''}/unown-${symbol}.png`;
  return `https://img.pokemondb.net/sprites/black-white/${shiny ? 'shiny' : 'normal'}/unown-${slug}.png`;
};
const rawSpecies = generatedSpecies;
export const species: Species[] = rawSpecies.map(([number,name]) => ({ id: `species-${number}`, nationalDexNumber: number, name, defaultFormId: `form-${number}-default` }));
const baseForms: PokemonForm[] = rawSpecies.map(([number]) => ({ id: `form-${number}-default`, speciesId: `species-${number}`, name: 'Standard', sprite: sprite(number), shinySprite: sprite(number, true), types:generatedPokemonTypes[number]??[] }));
const alt = (speciesNumber:number, slug:string, name:string, pokeApiId:number, extra:Partial<PokemonForm>={}): PokemonForm => ({ id:`form-${speciesNumber}-${slug}`, speciesId:`species-${speciesNumber}`, name, sprite:sprite(pokeApiId), shinySprite:sprite(pokeApiId,true), types:generatedPokemonTypes[pokeApiId]??generatedPokemonTypes[speciesNumber]??[], ...extra });
const regionalForms: PokemonForm[] = [
  ...([[19,10091],[20,10092],[26,10100],[27,10101],[28,10102],[37,10103],[38,10104],[50,10105],[51,10106],[52,10107],[53,10108],[74,10109],[75,10110],[76,10111],[88,10112],[89,10113],[103,10114],[105,10115]] as const).map(([number,id])=>alt(number,'alola','Alolan',id,{region:'alola'})),
  ...([[52,10161],[77,10162],[78,10163],[79,10164],[80,10165],[83,10166],[110,10167],[122,10168],[144,10169],[145,10170],[146,10171],[199,10172],[222,10173],[263,10174],[264,10175],[554,10176],[555,10177],[562,10179],[618,10180]] as const).map(([number,id])=>alt(number,'galar','Galarian',id,{region:'galar'})),
  ...([[58,10229],[59,10230],[100,10231],[101,10232],[157,10233],[211,10234],[215,10235],[503,10236],[549,10237],[570,10238],[571,10239],[628,10240],[705,10241],[706,10242],[713,10243],[724,10244]] as const).map(([number,id])=>alt(number,'hisui','Hisuian',id,{region:'hisui'})),
  alt(128,'paldea-combat','Paldean Combat Breed',10250,{region:'paldea'}),alt(128,'paldea-blaze','Paldean Blaze Breed',10251,{region:'paldea'}),alt(128,'paldea-aqua','Paldean Aqua Breed',10252,{region:'paldea'}),alt(194,'paldea','Paldean',10253,{region:'paldea'})
];
const unownNames = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ','!','?'];
const specialForms: PokemonForm[] = [
  ...unownNames.map((name)=>{const slug=name.toLowerCase().replace('!','exclamation').replace('?','question');return alt(201,slug,name,201,{sprite:unownSprite(slug),shinySprite:unownSprite(slug,true),formGroupIds:['unown']})}),
  ...['Normal','Heat','Wash','Frost','Fan','Mow'].map((name,index)=>alt(479,name.toLowerCase(),name,index === 0 ? 479 : 10007 + index,{formGroupIds:['rotom']})),
  ...['Natural','Heart','Star','Diamond','Debutante','Matron','Dandy','La Reine','Kabuki','Pharaoh'].map((name)=>alt(676,name.toLowerCase().replaceAll(' ','-'),name,676,{formGroupIds:['furfrou']})),
  ...[669,670].flatMap((number)=>['Red','Yellow','Orange','Blue','White'].map((name)=>{const slug=name.toLowerCase();return alt(number,slug,name,number,{sprite:formSprite(number,slug),shinySprite:formSprite(number,slug,true),formGroupIds:['flabebe-line']})})),
  alt(670,'eternal','Eternal',10061,{sprite:sprite(10061),shinySprite:sprite(10061,true),formGroupIds:['flabebe-line']}),
  ...['Red','Yellow','Orange','Blue','White'].map((name)=>{const slug=name.toLowerCase();return alt(671,slug,name,671,{sprite:formSprite(671,slug),shinySprite:formSprite(671,slug,true),formGroupIds:['flabebe-line']})})
].filter(form=>!isStandardVariantAlias(form.id));
export const forms = [...baseForms, ...regionalForms, ...specialForms];
export const formGroups: FormGroup[] = [
  {id:'unown',name:'Unown Alphabet',description:'A–Z, ! and ?',formIds:specialForms.filter(f=>f.formGroupIds?.includes('unown')).map(f=>f.id)},
  {id:'rotom',name:'Rotom Appliances',description:'All appliance forms',formIds:specialForms.filter(f=>f.formGroupIds?.includes('rotom')).map(f=>f.id)},
  {id:'furfrou',name:'Furfrou Trims',description:'Natural and styled trims',formIds:specialForms.filter(f=>f.formGroupIds?.includes('furfrou')).map(f=>f.id)},
  {id:'flabebe-line',name:'Flabébé Line Colors',description:'Flower color variations',formIds:specialForms.filter(f=>f.formGroupIds?.includes('flabebe-line')).map(f=>f.id)}
];
const allIds = species.map(s=>s.id);
const toSpeciesIds = (numbers: readonly number[]) => numbers.map(number => `species-${number}`);
const uniqueSpeciesIds = (...groups: readonly (readonly number[])[]) => toSpeciesIds([...new Set(groups.flat())]);
const bdspNationalNumbers = Array.from({length:493},(_,index)=>index+1);
const frlgNationalNumbers = Array.from({length:386},(_,index)=>index+1);
export const dynamaxAdventureNumbers = [144,145,146,150,243,244,245,249,250,380,381,382,383,384,480,481,482,483,484,485,487,488,641,642,643,644,645,646,716,717,718,785,786,787,788,791,792,800,793,794,795,796,797,798,799,805,806] as const;
export const noDexEntryNumbers = [486,647,789,790,803,804,252,253,254,255,256,257,258,259,260,722,723,724,725,726,727,728,729,730] as const;
const bdspIds = uniqueSpeciesIds(generatedGameDexes.bdspSinnoh, bdspNationalNumbers);
const swshIds = uniqueSpeciesIds(generatedGameDexes.galar, generatedGameDexes.isleOfArmor, generatedGameDexes.crownTundra, dynamaxAdventureNumbers, noDexEntryNumbers);
const svIds = uniqueSpeciesIds(generatedGameDexes.paldea, generatedGameDexes.kitakami, generatedGameDexes.blueberry);
const zaIds = uniqueSpeciesIds(generatedGameDexes.lumiose,generatedGameDexes.hyperspace);
const regionalOverrides=(region:'galar'|'hisui')=>Object.fromEntries(regionalForms.filter(form=>form.region===region).map(form=>[form.speciesId,form.id]));
const galarFormOverrides:Record<string,string>=regionalOverrides('galar');
const kantoBirdFormOverrides:Record<string,string>={'species-144':'form-144-default','species-145':'form-145-default','species-146':'form-146-default'};
const hisuiFormOverrides:Record<string,string>=regionalOverrides('hisui');
const paldeaFormOverrides:Record<string,string>={'species-128':'form-128-paldea-combat','species-194':'form-194-paldea'};
export const games: Game[] = [
  {id:'home',name:'Pokémon HOME / National',shortName:'HOME',color:'#6d5dfc',dexSpeciesIds:allIds},
  {id:'go',name:'Pokémon GO',shortName:'GO',color:'#4b9bd8',dexSpeciesIds:allIds,hasDex:false},
  {id:'frlg',name:'FireRed / LeafGreen',shortName:'FRLG',color:'#d96442',logo:'/game-logos/frlg.png',dexSpeciesIds:toSpeciesIds(frlgNationalNumbers),dexSections:[{id:'kanto',name:'Kanto Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.frlgKanto)},{id:'national',name:'FRLG National Dex',dexSpeciesIds:toSpeciesIds(frlgNationalNumbers)}]},
  {id:'bdsp',name:'Brilliant Diamond / Shining Pearl',shortName:'BDSP',color:'#368dc5',logo:'/game-logos/bdsp.png',dexSpeciesIds:bdspIds,dexSections:[{id:'sinnoh',name:'Sinnoh Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.bdspSinnoh)},{id:'national',name:'BDSP National Dex',dexSpeciesIds:toSpeciesIds(bdspNationalNumbers)}]},
  {id:'swsh',name:'Sword / Shield',shortName:'SWSH',color:'#d94c85',logo:'/game-logos/swsh.png',dexSpeciesIds:swshIds,dexSections:[{id:'galar',name:'Galar Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.galar),formOverrides:galarFormOverrides},{id:'isle-of-armor',name:'Isle of Armor',dexSpeciesIds:toSpeciesIds(generatedGameDexes.isleOfArmor),formOverrides:galarFormOverrides},{id:'crown-tundra',name:'Crown Tundra',dexSpeciesIds:toSpeciesIds(generatedGameDexes.crownTundra),formOverrides:galarFormOverrides},{id:'dynamax-adventures',name:'Dynamax Adventures',dexSpeciesIds:toSpeciesIds(dynamaxAdventureNumbers),formOverrides:kantoBirdFormOverrides,showDexNumbers:false},{id:'no-dex-entries',name:'No Dex Entries',dexSpeciesIds:toSpeciesIds(noDexEntryNumbers),showDexNumbers:false}]},
  {id:'pla',name:'Pokémon Legends: Arceus',shortName:'PLA',color:'#376d69',logo:'/game-logos/pla.png',dexSpeciesIds:toSpeciesIds(generatedGameDexes.hisui),dexSections:[{id:'hisui',name:'Hisui Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.hisui),formOverrides:hisuiFormOverrides}],supportsAlpha:true},
  {id:'sv',name:'Scarlet / Violet',shortName:'SV',color:'#e0623c',logo:'/game-logos/sv.png',dexSpeciesIds:svIds,dexSections:[{id:'paldea',name:'Paldea Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.paldea),formOverrides:paldeaFormOverrides},{id:'kitakami',name:'Kitakami Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.kitakami)},{id:'blueberry',name:'Blueberry Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.blueberry)}]},
  {id:'za',name:'Pokémon Legends: Z-A',shortName:'Z-A',color:'#58a57b',logo:'/game-logos/za.png',dexSpeciesIds:zaIds,dexSections:[{id:'lumiose',name:'Lumiose Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.lumiose)},{id:'hyperspace',name:'Mega Dimension · Hyperspace Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.hyperspace)}],supportsAlpha:true}
];
