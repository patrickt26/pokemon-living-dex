import { describe, expect, it } from 'vitest';
import { formatEvolutionMethod, getEvolutionChain } from './evolution';

describe('evolution catalog',()=>{
  it('contains the complete Bulbasaur level progression',()=>{
    const chain=getEvolutionChain('species-1')!;
    expect(chain.species).toEqual([1,2,3]);
    expect(chain.links.find(link=>link.to===2)?.methods).toContainEqual(expect.objectContaining({trigger:'level-up',minLevel:16}));
    expect(chain.links.find(link=>link.to===3)?.methods).toContainEqual(expect.objectContaining({trigger:'level-up',minLevel:32}));
  });

  it('keeps every branch and alternative method in the Eevee family',()=>{
    const chain=getEvolutionChain('species-133')!;
    expect(chain.links.filter(link=>link.from===133).map(link=>link.to)).toEqual(expect.arrayContaining([134,135,136,196,197,470,471,700]));
    const vaporeon=chain.links.find(link=>link.to===134)!;
    expect(vaporeon.methods).toContainEqual(expect.objectContaining({trigger:'use-item',item:'water-stone'}));
  });

  it('includes evolution conditions introduced in recent games',()=>{
    const pawmot=getEvolutionChain('species-922')!.links.find(link=>link.to===923)!;
    expect(pawmot.methods).toContainEqual(expect.objectContaining({minSteps:1000}));
    const annihilape=getEvolutionChain('species-979')!.links.find(link=>link.to===979)!;
    expect(annihilape.methods).toContainEqual(expect.objectContaining({usedMove:'rage-fist',minMoveCount:20}));
  });

  it('formats conditions in both supported languages',()=>{
    const method={trigger:'use-item',item:'water-stone',timeOfDay:'night'};
    expect(formatEvolutionMethod(method,'en')).toBe('Use item · with Water Stone · during the night');
    expect(formatEvolutionMethod(method,'pt-BR')).toBe('Usar item · com Water Stone · durante a noite');
  });
});
