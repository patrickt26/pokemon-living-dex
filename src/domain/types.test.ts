import { describe,expect,it } from 'vitest';
import { isInTypes,toggleTypeSelection } from './types';

describe('type filtering',()=>{
  it('keeps All exclusive, limits selection to two and removes the oldest type',()=>{
    expect(toggleTypeSelection([], 'fire')).toEqual(['fire']);
    expect(toggleTypeSelection(['fire'], 'water')).toEqual(['fire','water']);
    expect(toggleTypeSelection(['fire','water'], 'flying')).toEqual(['water','flying']);
    expect(toggleTypeSelection(['fire','water'], 'fire')).toEqual(['water']);
    expect(toggleTypeSelection(['water'], 'water')).toEqual([]);
    expect(toggleTypeSelection(['fire'], 'all')).toEqual([]);
  });

  it('requires both selected types on dual-type Pokemon',()=>{
    expect(isInTypes(['fire','flying'],['fire','flying'])).toBe(true);
    expect(isInTypes(['fire','flying'],['fire'])).toBe(true);
    expect(isInTypes(['fire','flying'],['water','flying'])).toBe(false);
    expect(isInTypes(['fire'],['fire','flying'])).toBe(false);
    expect(isInTypes(['fire'],[])).toBe(true);
  });
});
