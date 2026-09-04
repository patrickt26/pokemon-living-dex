import { describe,expect,it } from 'vitest';import { createDexSearchSuggestions,paginateDexGroups,uniqueDexItemsBySpecies } from './dexView';
const species=(number:number)=>({id:`species-${number}`,nationalDexNumber:number,name:`Poke ${number}`,defaultFormId:`form-${number}`});const form=(number:number)=>({id:`form-${number}`,speciesId:`species-${number}`,name:'Standard',sprite:'sprite',types:['normal'] as const});
describe('Dex view pagination',()=>{
  const items=Array.from({length:31},(_,index)=>({species:species(index+1),form:form(index+1),dexNumber:index+1}));
  const boxes=paginateDexGroups({id:'national',label:null,items});

  it('creates 30-slot boxes without changing dex order',()=>{expect(boxes).toHaveLength(2);expect(boxes[0]?.items).toHaveLength(30);expect(boxes[1]?.items[0]?.dexNumber).toBe(31)});
  it('keeps the main Dex number when a DLC repeats the species with another form',()=>{const main={species:species(194),form:form(194),dexNumber:53};const dlc={...main,form:{...form(194),id:'form-194-dlc'},dexNumber:159};expect(uniqueDexItemsBySpecies([main,dlc])).toEqual([main])});
  it('uses the current game Dex number in suggestions',()=>{const item={species:species(100),form:form(100),dexNumber:5};expect(createDexSearchSuggestions([item])).toEqual([{id:'species-100',name:'Poke 100',dexNumber:5}])});
});
