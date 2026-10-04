import { describe,expect,it } from 'vitest';
import type { CollectionEntry } from './models';
import { getHomePlanStatus } from './homePlan';

const entry=(speciesId:string,gameId:string,originGameId=gameId,formId=`form-${speciesId.split('-')[1]}-default`):CollectionEntry=>({id:`${speciesId}-${gameId}-${formId}`,speciesId,formId,gameId,originGameId,shiny:false,alpha:false,ownOT:true,quantity:1,createdAt:'2026-01-01',updatedAt:'2026-01-01'});

describe('HOME plan',()=>{
  it('marks a species from another game as already covered',()=>{
    expect(getHomePlanStatus('species-877','form-877-default','sv',[entry('species-877','swsh')])).toBe('covered');
  });

  it('marks a species owned only in the current game for transfer',()=>{
    expect(getHomePlanStatus('species-1017','form-1017-default','sv',[entry('species-1017','sv')])).toBe('transfer');
  });

  it('recognizes a copy already stored in HOME regardless of its origin',()=>{
    expect(getHomePlanStatus('species-1017','form-1017-default','sv',[entry('species-1017','home','sv')])).toBe('covered');
  });

  it('marks an unowned species as missing',()=>{
    expect(getHomePlanStatus('species-1017','form-1017-default','sv',[])).toBe('missing');
  });

  it('keeps regional and variant forms separate from the default form',()=>{
    expect(getHomePlanStatus('species-20','form-20-alolan','sv',[entry('species-20','home','sv','form-20-default')])).toBe('missing');
    expect(getHomePlanStatus('species-20','form-20-alolan','sv',[entry('species-20','swsh','swsh','form-20-alolan')])).toBe('covered');
  });
});
