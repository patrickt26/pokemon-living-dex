import { describe,expect,it } from 'vitest';import { isInGeneration } from './generations';
describe('Pokémon generations',()=>{it('maps National Dex boundaries',()=>{expect(isInGeneration(151,'1')).toBe(true);expect(isInGeneration(152,'1')).toBe(false);expect(isInGeneration(152,'2')).toBe(true);expect(isInGeneration(1025,'9')).toBe(true)})});
