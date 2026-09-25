import type { FormGroup, Game, GameId, PokemonForm, PokemonType, Species } from '../domain/models';
import { isStandardVariantAlias } from '../domain/variantForms';
import { generatedSpecies } from './generatedSpecies';
import { generatedGameDexes } from './generatedGameDexes';
import { generatedPokemonTypes } from './generatedPokemonTypes';

// jsDelivr serves the same public PokeAPI sprite repository through a CDN.
const sprite = (id: number, shiny = false) => `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/${shiny ? 'shiny/' : ''}${id}.png`;
const formSprite = (id: number, slug: string, shiny = false) => `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/${shiny ? 'shiny/' : ''}${id}-${slug}.png`;
const unownSprite = (slug: string, shiny = false) => {
  const symbol = slug === 'exclamation' ? 'exclamation' : slug === 'question' ? 'question' : undefined;
  if (symbol) return `https://play.pokemonshowdown.com/sprites/gen4${shiny ? '-shiny' : ''}/unown-${symbol}.png`;
  return `https://img.pokemondb.net/sprites/black-white/${shiny ? 'shiny' : 'normal'}/unown-${slug}.png`;
};
const rawSpecies = generatedSpecies;
const baseFormNames:Partial<Record<number,string>>={201:'A',386:'Normal Forme',412:'Plant Cloak',413:'Plant Cloak',422:'West Sea',423:'West Sea',479:'Standard',492:'Land Forme',550:'Red-Striped',585:'Spring',586:'Spring',641:'Incarnate Forme',642:'Incarnate Forme',645:'Incarnate Forme',647:'Ordinary Form',666:'Meadow Pattern',669:'Red Flower',670:'Red Flower',671:'Red Flower',676:'Standard',678:'Male',710:'Average Size',711:'Average Size',718:'50% Forme',720:'Confined',741:'Baile Style',745:'Midday Form',774:'Red Core',801:'Regular Color',849:'Amped Form',854:'Phony Form',855:'Phony Form',869:'Vanilla Cream',876:'Male',892:'Single Strike Style',893:'Regular',901:'Regular Form',902:'Male',905:'Incarnate Forme',916:'Male',925:'Family of Four',931:'Green Plumage',978:'Curly Form',982:'Two-Segment Form',999:'Chest Form',1012:'Counterfeit Form',1013:'Unremarkable Form'};
const baseFormSpriteIds:Partial<Record<number,number>>={774:10136};
const baseFormGameIds:Partial<Record<number,readonly GameId[]>>={
  201:['go','bdsp','pla'],
  386:['go','bdsp'],
  412:['go','bdsp','pla'],413:['go','bdsp','pla'],
  422:['go','bdsp','swsh','pla','sv'],423:['go','bdsp','swsh','pla','sv'],
  479:['go','bdsp','swsh','pla','sv','za'],
  492:['go','bdsp','pla'],
  550:['go','swsh','sv'],
  585:['go','sv'],586:['go','sv'],
  641:['go','swsh','pla','sv'],642:['go','swsh','pla','sv'],645:['go','swsh','pla','sv'],647:['go','swsh','sv','za'],
  666:['go','sv','za'],
  669:['go','sv','za'],670:['go','sv','za'],671:['go','sv','za'],
  676:['go','za'],
  678:['go','swsh','sv','za'],
  710:['go','swsh','za'],711:['go','swsh','za'],
  718:['go','swsh','za'],720:['go','sv','za'],774:['sv'],801:['swsh','sv','za'],
  849:['go','swsh','sv','za'],854:['go','swsh','sv'],855:['go','swsh','sv'],869:['swsh','sv'],876:['go','swsh','sv','za'],
  741:['go','sv'],745:['go','swsh','sv'],892:['go','swsh','sv'],893:['go','swsh','sv'],
  901:['go','pla','sv'],
  902:['pla','sv'],
  905:['go','pla','sv'],916:['go','sv'],
  925:['go','sv'],931:['go','sv','za'],978:['go','sv','za'],982:['go','sv'],999:['go','sv','za'],
  1012:['go','sv'],1013:['go','sv'],
};
export const species: Species[] = rawSpecies.map(([number,name]) => ({ id: `species-${number}`, nationalDexNumber: number, name, defaultFormId: `form-${number}-default` }));
const baseForms: PokemonForm[] = rawSpecies.map(([number]) => ({ id: `form-${number}-default`, speciesId: `species-${number}`, name: baseFormNames[number]??'Standard', sprite: sprite(baseFormSpriteIds[number]??number), shinySprite: sprite(baseFormSpriteIds[number]??number, true), types:generatedPokemonTypes[number]??[], availableGameIds:baseFormGameIds[number] }));
const alt = (speciesNumber:number, slug:string, name:string, pokeApiId:number, extra:Partial<PokemonForm>={}): PokemonForm => ({ id:`form-${speciesNumber}-${slug}`, speciesId:`species-${speciesNumber}`, name, sprite:sprite(pokeApiId), shinySprite:sprite(pokeApiId,true), types:generatedPokemonTypes[pokeApiId]??generatedPokemonTypes[speciesNumber]??[], ...extra });
const alolaSwsh=[26,27,28,37,38,50,51,52,53,103,105];
const alolaPla=[37,38];
const alolaSv=[26,27,28,37,38,50,51,52,53,74,75,76,88,89,103];
const alolaZa=[26,52,53,105];
const galarSv=[52,79,80,110,144,145,146,199];
const galarZa=[52,79,80,83,122,199,562,618];
const hisuiZa=[211,705,706,713];
const regionalAvailability=(region:'alola'|'galar'|'hisui'|'paldea',number:number):readonly GameId[]=>{
  if(region==='alola')return ['go',...(alolaSwsh.includes(number)?['swsh']:[]),...(alolaPla.includes(number)?['pla']:[]),...(alolaSv.includes(number)?['sv']:[]),...(alolaZa.includes(number)?['za']:[])];
  if(region==='galar')return ['go','swsh',...(galarSv.includes(number)?['sv']:[]),...(galarZa.includes(number)?['za']:[])];
  if(region==='hisui')return [...(![705,706].includes(number)?['go']:[]),'pla','sv',...(hisuiZa.includes(number)?['za']:[])];
  return ['go','sv'];
};
const regional=(number:number,slug:string,name:string,pokeApiId:number,region:'alola'|'galar'|'hisui'|'paldea')=>alt(number,slug,name,pokeApiId,{region,availableGameIds:regionalAvailability(region,number)});
const regionalForms: PokemonForm[] = [
  ...([[19,10091],[20,10092],[26,10100],[27,10101],[28,10102],[37,10103],[38,10104],[50,10105],[51,10106],[52,10107],[53,10108],[74,10109],[75,10110],[76,10111],[88,10112],[89,10113],[103,10114],[105,10115]] as const).map(([number,id])=>regional(number,'alola','Alolan',id,'alola')),
  ...([[52,10161],[77,10162],[78,10163],[79,10164],[80,10165],[83,10166],[110,10167],[122,10168],[144,10169],[145,10170],[146,10171],[199,10172],[222,10173],[263,10174],[264,10175],[554,10176],[555,10177],[562,10179],[618,10180]] as const).map(([number,id])=>regional(number,'galar','Galarian',id,'galar')),
  ...([[58,10229],[59,10230],[100,10231],[101,10232],[157,10233],[211,10234],[215,10235],[503,10236],[549,10237],[570,10238],[571,10239],[628,10240],[705,10241],[706,10242],[713,10243],[724,10244]] as const).map(([number,id])=>regional(number,'hisui','Hisuian',id,'hisui')),
  regional(128,'paldea-combat','Paldean Combat Breed',10250,'paldea'),regional(128,'paldea-blaze','Paldean Blaze Breed',10251,'paldea'),regional(128,'paldea-aqua','Paldean Aqua Breed',10252,'paldea'),regional(194,'paldea','Paldean',10253,'paldea')
];
const unownNames = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ','!','?'];
const fileVariant=(number:number,slug:string,name:string,groupId:string,types:readonly PokemonType[],availableGameIds:readonly GameId[])=>alt(number,slug,name,number,{sprite:formSprite(number,slug),shinySprite:formSprite(number,slug,true),formGroupIds:[groupId],types,availableGameIds});
const idVariant=(number:number,slug:string,name:string,pokeApiId:number,groupId:string,types:readonly PokemonType[],availableGameIds?:readonly GameId[])=>alt(number,slug,name,pokeApiId,{formGroupIds:[groupId],types,availableGameIds});
const specialForms: PokemonForm[] = [
  ...unownNames.map((name)=>{const slug=name.toLowerCase().replace('!','exclamation').replace('?','question');return alt(201,slug,name,201,{sprite:unownSprite(slug),shinySprite:unownSprite(slug,true),formGroupIds:['unown'],availableGameIds:['go','bdsp','pla']})}),
  idVariant(386,'attack','Attack Forme',10001,'deoxys',['psychic'],['go','bdsp']),idVariant(386,'defense','Defense Forme',10002,'deoxys',['psychic'],['go','bdsp']),idVariant(386,'speed','Speed Forme',10003,'deoxys',['psychic'],['go','bdsp']),
  fileVariant(412,'sandy','Sandy Cloak','burmy-line',['bug'],['go','bdsp','pla']),fileVariant(412,'trash','Trash Cloak','burmy-line',['bug'],['go','bdsp','pla']),
  idVariant(413,'sandy','Sandy Cloak',10004,'burmy-line',['bug','ground'],['go','bdsp','pla']),idVariant(413,'trash','Trash Cloak',10005,'burmy-line',['bug','steel'],['go','bdsp','pla']),
  fileVariant(422,'east','East Sea','shellos-line',['water'],['go','bdsp','swsh','pla','sv']),fileVariant(423,'east','East Sea','shellos-line',['water','ground'],['go','bdsp','swsh','pla','sv']),
  ...['Normal','Heat','Wash','Frost','Fan','Mow'].map((name,index)=>alt(479,name.toLowerCase(),name,index === 0 ? 479 : 10007 + index,{formGroupIds:['rotom'],availableGameIds:['go','bdsp','swsh','pla','sv','za']})),
  idVariant(492,'sky','Sky Forme',10006,'shaymin',['grass','flying'],['go','bdsp','pla']),
  idVariant(550,'blue-striped','Blue-Striped',10016,'basculin',['water'],['go','swsh','sv']),idVariant(550,'white-striped','White-Striped',10247,'basculin',['water'],['go','pla','sv']),
  ...[585,586].flatMap((number)=>['Summer','Autumn','Winter'].map((name)=>fileVariant(number,name.toLowerCase(),name,'deerling-line',['normal','grass'],['go','sv']))),
  idVariant(641,'therian','Therian Forme',10019,'forces-of-nature',['flying'],['go','swsh','pla','sv']),idVariant(642,'therian','Therian Forme',10020,'forces-of-nature',['electric','flying'],['go','swsh','pla','sv']),idVariant(645,'therian','Therian Forme',10021,'forces-of-nature',['ground','flying'],['go','swsh','pla','sv']),idVariant(905,'therian','Therian Forme',10249,'forces-of-nature',['fairy','flying'],['go','pla','sv']),
  idVariant(647,'resolute','Resolute Form',10024,'keldeo',['water','fighting'],['go','swsh','sv','za']),
  ...['Icy Snow','Polar','Tundra','Continental','Garden','Elegant','Modern','Marine','Archipelago','High Plains','Sandstorm','River','Monsoon','Savanna','Sun','Ocean','Jungle'].map((name)=>{const slug=name.toLowerCase().replaceAll(' ','-');return fileVariant(666,slug,`${name} Pattern`,'vivillon',['bug','flying'],['go','sv','za'])}),
  fileVariant(666,'fancy','Fancy Pattern','vivillon',['bug','flying'],['sv','za']),fileVariant(666,'poke-ball','Poké Ball Pattern','vivillon',['bug','flying'],['sv','za']),
  ...['Natural','Heart','Star','Diamond','Debutante','Matron','Dandy','La Reine','Kabuki','Pharaoh'].map((name)=>{const slug=name.toLowerCase().replaceAll(' ','-');return alt(676,slug,name,676,{sprite:slug==='natural'?sprite(676):formSprite(676,slug),shinySprite:slug==='natural'?sprite(676,true):formSprite(676,slug,true),formGroupIds:['furfrou'],availableGameIds:['go','za']})}),
  idVariant(678,'female','Female',10025,'meowstic',['psychic'],['go','swsh','sv','za']),
  ...[710,711].flatMap((number)=>([['small','Small Size',number===710?10027:10030],['large','Large Size',number===710?10028:10031],['super','Super Size',number===710?10029:10032]] as const).map(([slug,name,id])=>idVariant(number,slug,name,id,'pumpkaboo-line',['ghost','grass'],['go','swsh','za']))),
  idVariant(741,'pom-pom','Pom-Pom Style',10123,'oricorio',['electric','flying'],['go','sv']),idVariant(741,'pau',"Pa'u Style",10124,'oricorio',['psychic','flying'],['go','sv']),idVariant(741,'sensu','Sensu Style',10125,'oricorio',['ghost','flying'],['go','sv']),
  idVariant(745,'midnight','Midnight Form',10126,'lycanroc',['rock'],['go','swsh','sv']),idVariant(745,'dusk','Dusk Form',10152,'lycanroc',['rock'],['go','swsh','sv']),
  idVariant(718,'10-percent','10% Forme',10181,'zygarde',['dragon','ground'],['go','swsh','za']),
  idVariant(720,'unbound','Unbound',10086,'hoopa',['psychic','dark'],['go','sv','za']),
  ...([['orange',10137],['yellow',10138],['green',10139],['blue',10140],['indigo',10141],['violet',10142]] as const).map(([name,id])=>idVariant(774,name,`${name.charAt(0).toUpperCase()}${name.slice(1)} Core`,id,'minior',['rock','flying'],['sv'])),
  idVariant(801,'original-color','Original Color',10147,'magearna',['steel','fairy'],['swsh','sv','za']),
  idVariant(849,'low-key','Low Key Form',10184,'toxtricity',['electric','poison'],['go','swsh','sv','za']),
  fileVariant(854,'antique','Antique Form','sinistea-line',['ghost'],['go','swsh','sv']),fileVariant(855,'antique','Antique Form','sinistea-line',['ghost'],['go','swsh','sv']),
  ...['Ruby Cream','Matcha Cream','Mint Cream','Lemon Cream','Salted Cream','Ruby Swirl','Caramel Swirl','Rainbow Swirl'].map((name)=>{const slug=name.toLowerCase().replaceAll(' ','-');return fileVariant(869,`${slug}-strawberry-sweet`,name,'alcremie',['fairy'],['swsh','sv'])}),
  idVariant(876,'female','Female',10186,'indeedee',['psychic','normal'],['go','swsh','sv','za']),
  idVariant(892,'rapid-strike','Rapid Strike Style',10191,'urshifu',['fighting','water'],['go','swsh','sv']),
  idVariant(893,'dada','Dada',10192,'zarude',['dark','grass'],['swsh','sv']),
  idVariant(901,'bloodmoon','Bloodmoon',10272,'ursaluna',['ground','normal'],['sv']),
  idVariant(902,'female','Female',10248,'basculegion',['water','ghost'],['pla','sv']),
  idVariant(916,'female','Female',10254,'oinkologne',['normal'],['go','sv']),
  idVariant(925,'family-of-three','Family of Three',10257,'maushold',['normal'],['go','sv']),
  idVariant(931,'blue-plumage','Blue Plumage',10260,'squawkabilly',['normal','flying'],['go','sv','za']),idVariant(931,'yellow-plumage','Yellow Plumage',10261,'squawkabilly',['normal','flying'],['go','sv','za']),idVariant(931,'white-plumage','White Plumage',10262,'squawkabilly',['normal','flying'],['go','sv','za']),
  idVariant(978,'droopy','Droopy Form',10258,'tatsugiri',['dragon','water'],['go','sv','za']),idVariant(978,'stretchy','Stretchy Form',10259,'tatsugiri',['dragon','water'],['go','sv','za']),
  idVariant(982,'three-segment','Three-Segment Form',10255,'dudunsparce',['normal'],['go','sv']),
  idVariant(999,'roaming','Roaming Form',10263,'gimmighoul',['ghost'],['go','sv','za']),
  fileVariant(1012,'artisan','Artisan Form','poltchageist-line',['grass','ghost'],['go','sv']),fileVariant(1013,'masterpiece','Masterpiece Form','poltchageist-line',['grass','ghost'],['go','sv']),
  ...[669,670].flatMap((number)=>['Red','Yellow','Orange','Blue','White'].map((name)=>{const slug=name.toLowerCase();return alt(number,slug,name,number,{sprite:formSprite(number,slug),shinySprite:formSprite(number,slug,true),formGroupIds:['flabebe-line'],availableGameIds:['go','sv','za']})})),
  alt(670,'eternal','Eternal',10061,{sprite:sprite(10061),shinySprite:sprite(10061,true),formGroupIds:['flabebe-line'],availableGameIds:['za']}),
  ...['Red','Yellow','Orange','Blue','White'].map((name)=>{const slug=name.toLowerCase();return alt(671,slug,name,671,{sprite:formSprite(671,slug),shinySprite:formSprite(671,slug,true),formGroupIds:['flabebe-line'],availableGameIds:['go','sv','za']})})
].filter(form=>!isStandardVariantAlias(form.id));
export const forms = [...baseForms, ...regionalForms, ...specialForms];
export const formGroups: FormGroup[] = [
  {id:'unown',name:'Unown Alphabet',description:'A–Z, ! and ?',formIds:specialForms.filter(f=>f.formGroupIds?.includes('unown')).map(f=>f.id)},
  {id:'deoxys',name:'Deoxys Formes',description:'Attack, Defense and Speed Formes',formIds:specialForms.filter(f=>f.formGroupIds?.includes('deoxys')).map(f=>f.id)},
  {id:'burmy-line',name:'Burmy and Wormadam Cloaks',description:'Sandy and Trash Cloaks',formIds:specialForms.filter(f=>f.formGroupIds?.includes('burmy-line')).map(f=>f.id)},
  {id:'shellos-line',name:'Shellos and Gastrodon Seas',description:'East Sea forms',formIds:specialForms.filter(f=>f.formGroupIds?.includes('shellos-line')).map(f=>f.id)},
  {id:'rotom',name:'Rotom Appliances',description:'All appliance forms',formIds:specialForms.filter(f=>f.formGroupIds?.includes('rotom')).map(f=>f.id)},
  {id:'shaymin',name:'Shaymin Formes',description:'Sky Forme',formIds:specialForms.filter(f=>f.formGroupIds?.includes('shaymin')).map(f=>f.id)},
  {id:'basculin',name:'Basculin Stripes',description:'Blue-Striped and White-Striped forms',formIds:specialForms.filter(f=>f.formGroupIds?.includes('basculin')).map(f=>f.id)},
  {id:'deerling-line',name:'Deerling and Sawsbuck Seasons',description:'Summer, Autumn and Winter forms',formIds:specialForms.filter(f=>f.formGroupIds?.includes('deerling-line')).map(f=>f.id)},
  {id:'forces-of-nature',name:'Forces of Nature Formes',description:'Therian Formes',formIds:specialForms.filter(f=>f.formGroupIds?.includes('forces-of-nature')).map(f=>f.id)},
  {id:'keldeo',name:'Keldeo Forms',description:'Resolute Form',formIds:specialForms.filter(f=>f.formGroupIds?.includes('keldeo')).map(f=>f.id)},
  {id:'vivillon',name:'Vivillon Patterns',description:'Patterns beyond Meadow',formIds:specialForms.filter(f=>f.formGroupIds?.includes('vivillon')).map(f=>f.id)},
  {id:'flabebe-line',name:'Flabébé Line Colors',description:'Flower color variations',formIds:specialForms.filter(f=>f.formGroupIds?.includes('flabebe-line')).map(f=>f.id)},
  {id:'furfrou',name:'Furfrou Trims',description:'Natural and styled trims',formIds:specialForms.filter(f=>f.formGroupIds?.includes('furfrou')).map(f=>f.id)},
  {id:'meowstic',name:'Meowstic Genders',description:'Female form',formIds:specialForms.filter(f=>f.formGroupIds?.includes('meowstic')).map(f=>f.id)},
  {id:'pumpkaboo-line',name:'Pumpkaboo and Gourgeist Sizes',description:'Small, Large and Super Sizes',formIds:specialForms.filter(f=>f.formGroupIds?.includes('pumpkaboo-line')).map(f=>f.id)},
  {id:'oricorio',name:'Oricorio Styles',description:'Pom-Pom, Pa\'u and Sensu Styles',formIds:specialForms.filter(f=>f.formGroupIds?.includes('oricorio')).map(f=>f.id)},
  {id:'lycanroc',name:'Lycanroc Forms',description:'Midnight and Dusk Forms',formIds:specialForms.filter(f=>f.formGroupIds?.includes('lycanroc')).map(f=>f.id)},
  {id:'zygarde',name:'Zygarde Formes',description:'10% Forme',formIds:specialForms.filter(f=>f.formGroupIds?.includes('zygarde')).map(f=>f.id)},
  {id:'hoopa',name:'Hoopa Formes',description:'Unbound',formIds:specialForms.filter(f=>f.formGroupIds?.includes('hoopa')).map(f=>f.id)},
  {id:'minior',name:'Minior Cores',description:'Core colors beyond Red',formIds:specialForms.filter(f=>f.formGroupIds?.includes('minior')).map(f=>f.id)},
  {id:'magearna',name:'Magearna Colors',description:'Original Color',formIds:specialForms.filter(f=>f.formGroupIds?.includes('magearna')).map(f=>f.id)},
  {id:'toxtricity',name:'Toxtricity Forms',description:'Low Key Form',formIds:specialForms.filter(f=>f.formGroupIds?.includes('toxtricity')).map(f=>f.id)},
  {id:'sinistea-line',name:'Sinistea and Polteageist Forms',description:'Antique Forms',formIds:specialForms.filter(f=>f.formGroupIds?.includes('sinistea-line')).map(f=>f.id)},
  {id:'alcremie',name:'Alcremie Creams',description:'Creams beyond Vanilla',formIds:specialForms.filter(f=>f.formGroupIds?.includes('alcremie')).map(f=>f.id)},
  {id:'indeedee',name:'Indeedee Genders',description:'Female form',formIds:specialForms.filter(f=>f.formGroupIds?.includes('indeedee')).map(f=>f.id)},
  {id:'urshifu',name:'Urshifu Styles',description:'Rapid Strike Style',formIds:specialForms.filter(f=>f.formGroupIds?.includes('urshifu')).map(f=>f.id)},
  {id:'zarude',name:'Zarude Forms',description:'Dada',formIds:specialForms.filter(f=>f.formGroupIds?.includes('zarude')).map(f=>f.id)},
  {id:'ursaluna',name:'Ursaluna Forms',description:'Bloodmoon',formIds:specialForms.filter(f=>f.formGroupIds?.includes('ursaluna')).map(f=>f.id)},
  {id:'basculegion',name:'Basculegion Genders',description:'Female form',formIds:specialForms.filter(f=>f.formGroupIds?.includes('basculegion')).map(f=>f.id)},
  {id:'oinkologne',name:'Oinkologne Genders',description:'Female form',formIds:specialForms.filter(f=>f.formGroupIds?.includes('oinkologne')).map(f=>f.id)},
  {id:'maushold',name:'Maushold Families',description:'Family of Three',formIds:specialForms.filter(f=>f.formGroupIds?.includes('maushold')).map(f=>f.id)},
  {id:'squawkabilly',name:'Squawkabilly Plumages',description:'Blue, Yellow and White Plumages',formIds:specialForms.filter(f=>f.formGroupIds?.includes('squawkabilly')).map(f=>f.id)},
  {id:'tatsugiri',name:'Tatsugiri Forms',description:'Droopy and Stretchy Forms',formIds:specialForms.filter(f=>f.formGroupIds?.includes('tatsugiri')).map(f=>f.id)},
  {id:'dudunsparce',name:'Dudunsparce Forms',description:'Three-Segment Form',formIds:specialForms.filter(f=>f.formGroupIds?.includes('dudunsparce')).map(f=>f.id)},
  {id:'gimmighoul',name:'Gimmighoul Forms',description:'Roaming Form',formIds:specialForms.filter(f=>f.formGroupIds?.includes('gimmighoul')).map(f=>f.id)},
  {id:'poltchageist-line',name:'Poltchageist and Sinistcha Forms',description:'Artisan and Masterpiece Forms',formIds:specialForms.filter(f=>f.formGroupIds?.includes('poltchageist-line')).map(f=>f.id)}
];
const allIds = species.map(s=>s.id);
const toSpeciesIds = (numbers: readonly number[]) => numbers.map(number => `species-${number}`);
const uniqueSpeciesIds = (...groups: readonly (readonly number[])[]) => toSpeciesIds([...new Set(groups.flat())]);
const bdspNationalNumbers = Array.from({length:493},(_,index)=>index+1);
const frlgNationalNumbers = Array.from({length:386},(_,index)=>index+1);
export const dynamaxAdventureNumbers = [144,145,146,150,243,244,245,249,250,380,381,382,383,384,480,481,482,483,484,485,487,488,641,642,643,644,645,646,716,717,718,785,786,787,788,791,792,800,793,794,795,796,797,798,799,805,806] as const;
export const noDexEntryNumbers = [486,647,789,790,803,804,252,253,254,255,256,257,258,259,260,722,723,724,725,726,727,728,729,730] as const;
export const svNoDexLegendaryNumbers = [144,145,146,243,244,245,249,250,380,381,382,383,384,638,639,640,643,644,646,648,791,792,800,891,892,896,897] as const;
const bdspIds = uniqueSpeciesIds(generatedGameDexes.bdspSinnoh, bdspNationalNumbers);
const swshIds = uniqueSpeciesIds(generatedGameDexes.galar, generatedGameDexes.isleOfArmor, generatedGameDexes.crownTundra, dynamaxAdventureNumbers, noDexEntryNumbers);
const svIds = uniqueSpeciesIds(generatedGameDexes.paldea, generatedGameDexes.kitakami, generatedGameDexes.blueberry,svNoDexLegendaryNumbers);
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
  {id:'sv',name:'Scarlet / Violet',shortName:'SV',color:'#e0623c',logo:'/game-logos/sv.png',dexSpeciesIds:svIds,dexSections:[{id:'paldea',name:'Paldea Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.paldea),formOverrides:paldeaFormOverrides},{id:'kitakami',name:'Kitakami Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.kitakami)},{id:'blueberry',name:'Blueberry Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.blueberry)},{id:'no-dex-entries',name:'No Dex Entries',dexSpeciesIds:toSpeciesIds(svNoDexLegendaryNumbers),showDexNumbers:false}]},
  {id:'za',name:'Pokémon Legends: Z-A',shortName:'Z-A',color:'#58a57b',logo:'/game-logos/za.png',dexSpeciesIds:zaIds,dexSections:[{id:'lumiose',name:'Lumiose Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.lumiose)},{id:'hyperspace',name:'Mega Dimension · Hyperspace Dex',dexSpeciesIds:toSpeciesIds(generatedGameDexes.hyperspace)}],supportsAlpha:true}
];
