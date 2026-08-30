import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDexFilters } from './useDexFilters';

describe('useDexFilters',()=>{
  it('owns the shared Dex filter state and type selection behavior',()=>{
    const {result}=renderHook(()=>useDexFilters());
    act(()=>{result.current.setShiny('shiny');result.current.setAlpha('alpha');result.current.setOwnership('owned');result.current.toggleType('fire');result.current.toggleType('flying')});
    expect(result.current).toMatchObject({shiny:'shiny',alpha:'alpha',ownership:'owned',shinyValue:true,alphaValue:true,selectedTypes:['fire','flying']});
    act(()=>result.current.toggleType('water'));
    expect(result.current.selectedTypes).toEqual(['flying','water']);
  });
});
