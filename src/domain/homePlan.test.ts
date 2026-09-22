import { describe,expect,it } from 'vitest';
import type { CollectionEntry } from './models';
import { getHomePlanStatus } from './homePlan';

const entry=(speciesId:string,gameId:string,originGameId=gameId):CollectionEntry=>({id:`${speciesId}-${gameId}`,speciesId,formId:`form-${speciesId.split('-')[1]}-default`,gameId,originGameId,shiny:false,alpha:false,ownOT:true,quantity:1,createdAt:'2026-01-01',updatedAt:'2026-01-01'});

describe('HOME plan',()=>{
  it('marks a species from another game as already covered',()=>{
    expect(getHomePlanStatus('species-877','sv',[entry('species-877','swsh')])).toBe('covered');
  });

  it('marks a species owned only in the current game for transfer',()=>{
    expect(getHomePlanStatus('species-1017','sv',[entry('species-1017','sv')])).toBe('transfer');
  });

  it('recognizes a copy already stored in HOME regardless of its origin',()=>{
    expect(getHomePlanStatus('species-1017','sv',[entry('species-1017','home','sv')])).toBe('covered');
  });

  it('marks an unowned species as missing',()=>{
    expect(getHomePlanStatus('species-1017','sv',[])).toBe('missing');
  });
});
