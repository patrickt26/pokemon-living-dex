import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const sourceDirectory=process.argv[2]??'/tmp';

function parseCsv(filename){
  const text=readFileSync(join(sourceDirectory,filename),'utf8').trim();
  const rows=[];
  let row=[];
  let value='';
  let quoted=false;
  for(let index=0;index<text.length;index+=1){
    const character=text[index];
    if(character==='"'){
      if(quoted&&text[index+1]==='"'){value+='"';index+=1}else quoted=!quoted;
    }else if(character===','&&!quoted){row.push(value);value=''}
    else if((character==='\n'||character==='\r')&&!quoted){
      if(character==='\r'&&text[index+1]==='\n')index+=1;
      row.push(value);rows.push(row);row=[];value='';
    }else value+=character;
  }
  row.push(value);rows.push(row);
  const [headers,...records]=rows;
  return records.filter(record=>record.some(Boolean)).map(record=>Object.fromEntries(headers.map((header,index)=>[header,record[index]??''])));
}

const indexById=(rows,value='identifier')=>new Map(rows.map(row=>[Number(row.id),row[value]]));
const number=value=>value===''?undefined:Number(value);
const truthy=value=>value==='1'||undefined;

const speciesRows=parseCsv('pokemon_species.csv').filter(row=>Number(row.id)<=1025);
const evolutions=parseCsv('pokemon-evolution.csv');
const triggers=indexById(parseCsv('evolution-triggers.csv'));
const items=indexById(parseCsv('items.csv'));
const moves=indexById(parseCsv('moves.csv'));
const locations=indexById(parseCsv('locations.csv'));
const types=indexById(parseCsv('types.csv'));
const forms=new Map(parseCsv('pokemon_forms.csv').map(row=>[Number(row.id),row.form_identifier||undefined]));
const regions=indexById(parseCsv('regions.csv'));
const speciesNames=indexById(speciesRows);

const resolve=(index,value)=>value===''?undefined:index.get(Number(value));
const methodFrom=row=>{
  const method={
    trigger:resolve(triggers,row.evolution_trigger_id),
    legacy:row.is_default==='1'?undefined:true,
    item:resolve(items,row.trigger_item_id),
    minLevel:number(row.minimum_level),
    gender:number(row.gender_id),
    location:resolve(locations,row.location_id),
    heldItem:resolve(items,row.held_item_id),
    timeOfDay:row.time_of_day||undefined,
    knownMove:resolve(moves,row.known_move_id),
    knownMoveType:resolve(types,row.known_move_type_id),
    minHappiness:number(row.minimum_happiness),
    minBeauty:number(row.minimum_beauty),
    minAffection:number(row.minimum_affection),
    relativeStats:number(row.relative_physical_stats),
    partySpecies:resolve(speciesNames,row.party_species_id),
    partyType:resolve(types,row.party_type_id),
    tradeSpecies:resolve(speciesNames,row.trade_species_id),
    rain:truthy(row.needs_overworld_rain),
    upsideDown:truthy(row.turn_upside_down),
    multiplayer:truthy(row.needs_multiplayer),
    nearSpecialRock:truthy(row.near_special_rock),
    region:resolve(regions,row.region_id),
    requiredForm:resolve(forms,row.required_pokemon_form_id),
    evolvedForm:resolve(forms,row.evolved_pokemon_form_id),
    usedMove:resolve(moves,row.used_move_id),
    minMoveCount:number(row.minimum_move_count),
    minSteps:number(row.minimum_steps),
    minDamage:number(row.minimum_damage_taken),
    natureCondition:row.nature_bitmask?true:undefined,
    specialCondition:row.condition_expression||undefined,
    chance:number(row.percentage_chance),
  };
  return Object.fromEntries(Object.entries(method).filter(([,value])=>value!==undefined));
};

const evolutionRowsBySpecies=new Map();
for(const row of evolutions){
  const speciesId=Number(row.evolved_species_id);
  if(speciesId>1025)continue;
  const methods=evolutionRowsBySpecies.get(speciesId)??[];
  const method=methodFrom(row);
  const signature=JSON.stringify(method);
  if(!methods.some(candidate=>JSON.stringify(candidate)===signature))methods.push(method);
  evolutionRowsBySpecies.set(speciesId,methods);
}

const chains=new Map();
for(const row of speciesRows){
  const chainId=Number(row.evolution_chain_id);
  const chain=chains.get(chainId)??{id:chainId,species:[],links:[]};
  const speciesId=Number(row.id);
  chain.species.push(speciesId);
  const parentId=number(row.evolves_from_species_id);
  if(parentId)chain.links.push({from:parentId,to:speciesId,methods:evolutionRowsBySpecies.get(speciesId)??[]});
  chains.set(chainId,chain);
}

const result=[...chains.values()].sort((left,right)=>left.species[0]-right.species[0]);
const output=`// Generated from PokéAPI CSV data. Do not edit manually.\nexport interface GeneratedEvolutionMethod { trigger:string; legacy?:boolean; item?:string; minLevel?:number; gender?:number; location?:string; heldItem?:string; timeOfDay?:string; knownMove?:string; knownMoveType?:string; minHappiness?:number; minBeauty?:number; minAffection?:number; relativeStats?:number; partySpecies?:string; partyType?:string; tradeSpecies?:string; rain?:boolean; upsideDown?:boolean; multiplayer?:boolean; nearSpecialRock?:boolean; region?:string; requiredForm?:string; evolvedForm?:string; usedMove?:string; minMoveCount?:number; minSteps?:number; minDamage?:number; natureCondition?:boolean; specialCondition?:string; chance?:number; }\nexport interface GeneratedEvolutionLink { from:number; to:number; methods:GeneratedEvolutionMethod[]; }\nexport interface GeneratedEvolutionChain { id:number; species:number[]; links:GeneratedEvolutionLink[]; }\nexport const generatedEvolutionChains:GeneratedEvolutionChain[]=${JSON.stringify(result)};\n`;
writeFileSync('src/data/generatedEvolutionChains.ts',output);
console.log(`Generated ${result.length} evolution chains.`);
