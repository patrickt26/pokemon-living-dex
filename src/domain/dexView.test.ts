import { describe,expect,it } from 'vitest';import { filterDexBoxesBySearch,paginateDexGroups } from './dexView';
const species=(number:number)=>({id:`species-${number}`,nationalDexNumber:number,name:`Poke ${number}`,defaultFormId:`form-${number}`});const form=(number:number)=>({id:`form-${number}`,speciesId:`species-${number}`,name:'Standard',sprite:'sprite',types:['normal'] as const});
describe('Dex view pagination',()=>{
  const items=Array.from({length:31},(_,index)=>({species:species(index+1),form:form(index+1),dexNumber:index+1}));
  const boxes=paginateDexGroups({id:'national',label:null,items});

  it('creates 30-slot boxes without changing dex order',()=>{expect(boxes).toHaveLength(2);expect(boxes[0]?.items).toHaveLength(30);expect(boxes[1]?.items[0]?.dexNumber).toBe(31)});
  it('keeps the complete box containing a search result',()=>{const result=filterDexBoxesBySearch(boxes,'Poke 25');expect(result).toHaveLength(1);expect(result[0]?.items).toHaveLength(30);expect(result[0]?.items[24]?.species.name).toBe('Poke 25')});
  it('returns every box when the search is empty',()=>expect(filterDexBoxesBySearch(boxes,'  ')).toBe(boxes));
});
