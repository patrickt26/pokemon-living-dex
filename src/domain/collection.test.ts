import { describe, expect, it } from 'vitest'; import type { CollectionEntry } from './models'; import { calculateProgress, filterEntries, hasMultipleOrigins, isFormOwned, isSpeciesOwned, summarizeEntries } from './collection';
const entry=(changes:Partial<CollectionEntry>={}):CollectionEntry=>({id:'1',speciesId:'species-25',formId:'form-25-default',gameId:'bdsp',shiny:false,ownOT:true,quantity:1,createdAt:'2026-01-01',updatedAt:'2026-01-01',...changes});
describe('collection projections',()=>{
 it('an entry in a game is also owned in National Dex',()=>expect(isSpeciesOwned([entry()],'species-25')).toBe(true));
 it('Shiny Dex only considers shiny entries',()=>{expect(isSpeciesOwned([entry()],'species-25',{shinyOnly:true})).toBe(false);expect(isSpeciesOwned([entry({shiny:true})],'species-25',{shinyOnly:true})).toBe(true)});
 it('calculates progress from unique species',()=>expect(calculateProgress(['species-25','species-26'],[entry(),entry({id:'2',quantity:4})])).toEqual({obtained:1,total:2,percentage:50}));
 it('calculates Own and Other OT quantities',()=>expect(summarizeEntries([entry({quantity:2}),entry({id:'2',ownOT:false,quantity:1})])).toMatchObject({total:3,ownOT:2,otherOT:1}));
 it('sums multiple copies',()=>expect(summarizeEntries([entry({quantity:2}),entry({id:'2',quantity:3})]).total).toBe(5));
 it('different forms still belong to one Species',()=>{const entries=[entry(),entry({id:'2',formId:'form-25-special'})];expect(calculateProgress(['species-25'],entries).obtained).toBe(1);expect(isFormOwned(entries,'form-25-special')).toBe(true)});
 it('filters OT, game and shiny',()=>{const entries=[entry(),entry({id:'2',ownOT:false,shiny:true,gameId:'sv'})];expect(filterEntries(entries,{ot:'other',shinyOnly:true,gameId:'sv'})).toHaveLength(1);expect(filterEntries(entries,{ot:'own'})).toHaveLength(1)});
 it('only counts ownership from the selected game in a Game Dex',()=>{const entries=[entry({gameId:'bdsp',quantity:2})];expect(isSpeciesOwned(entries,'species-25',{gameId:'bdsp'})).toBe(true);expect(isSpeciesOwned(entries,'species-25',{gameId:'sv'})).toBe(false);expect(summarizeEntries(filterEntries(entries,{gameId:'bdsp'})).total).toBe(2);expect(summarizeEntries(filterEntries(entries,{gameId:'sv'})).total).toBe(0)});
 it('requires choosing an entry when multiple copies have different origins',()=>{expect(hasMultipleOrigins([entry({quantity:2,originGameId:'bdsp'}),entry({id:'2',gameId:'home',originGameId:'go'})])).toBe(true);expect(hasMultipleOrigins([entry({quantity:2,originGameId:'bdsp'})])).toBe(false)});
});
