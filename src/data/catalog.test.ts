import { describe, expect, it } from 'vitest';
import { calculateGameProgress } from '../domain/collection';
import type { CollectionEntry } from '../domain/models';
import { generatedGameDexes } from './generatedGameDexes';
import { dynamaxAdventureNumbers, forms, games } from './catalog';

describe('generated game dex membership', () => {
  it.each([
    ['bdspSinnoh', 151], ['galar', 400], ['isleOfArmor', 211], ['crownTundra', 210],
    ['hisui', 242], ['paldea', 400], ['kitakami', 200], ['blueberry', 243],
    ['frlgKanto',151], ['lumiose',232], ['hyperspace',132],
  ] as const)('%s has the expected PokéAPI entry count', (dex, count) => {
    expect(generatedGameDexes[dex]).toHaveLength(count);
  });

  it('uses the exact Sinnoh Dex for BDSP', () => {
    const bdsp = games.find(game => game.id === 'bdsp')!;
    expect(bdsp.dexSections?.find(section => section.id === 'sinnoh')?.dexSpeciesIds).toHaveLength(151);
    expect(bdsp.dexSpeciesIds).toHaveLength(493);
    expect(bdsp.dexSpeciesIds).toContain('species-387');
    expect(bdsp.dexSpeciesIds).toContain('species-1');
    expect(bdsp.dexSpeciesIds).toContain('species-493');
    expect(bdsp.dexSpeciesIds).not.toContain('species-495');
  });

  it('combines DLC dexes without duplicating species', () => {
    for (const id of ['swsh', 'sv']) {
      const game = games.find(candidate => candidate.id === id)!;
      expect(new Set(game.dexSpeciesIds).size).toBe(game.dexSpeciesIds.length);
    }
  });

  it('preserves each regional Pokédex order in the game view', () => {
    const bdsp = games.find(game => game.id === 'bdsp')!;
    const swsh = games.find(game => game.id === 'swsh')!;
    const sv = games.find(game => game.id === 'sv')!;
    expect(bdsp.dexSpeciesIds[0]).toBe(`species-${generatedGameDexes.bdspSinnoh[0]}`);
    expect(swsh.dexSpeciesIds.slice(0, generatedGameDexes.galar.length)).toEqual(generatedGameDexes.galar.map(number => `species-${number}`));
    expect(sv.dexSpeciesIds.slice(0, generatedGameDexes.paldea.length)).toEqual(generatedGameDexes.paldea.map(number => `species-${number}`));
  });

  it('includes the 47 Dynamax Adventures bosses without gift-only Ultra Beasts', () => {
    expect(dynamaxAdventureNumbers).toHaveLength(47);
    expect(dynamaxAdventureNumbers).toContain(150);
    expect(dynamaxAdventureNumbers).toContain(806);
    expect(dynamaxAdventureNumbers).not.toContain(803);
    expect(dynamaxAdventureNumbers).not.toContain(804);
  });

  it('requires Hisuian regional forms for the Hisui Dex', () => {
    const pla=games.find(game=>game.id==='pla')!;const hisui=pla.dexSections?.[0];if(!hisui)throw new Error('Hisui Dex section not found');
    expect(hisui.formOverrides?.['species-59']).toBe('form-59-hisui');
    const arcanine=(formId:string):CollectionEntry=>({id:formId,speciesId:'species-59',formId,gameId:'pla',shiny:false,ownOT:true,quantity:1,createdAt:'2026-01-01',updatedAt:'2026-01-01'});
    expect(calculateGameProgress(pla,[arcanine('form-59-default')]).obtained).toBe(0);
    expect(calculateGameProgress(pla,[arcanine('form-59-hisui')]).obtained).toBe(1);
  });

  it('contains every regional Living Dex form from the PokéAPI audit', () => {
    expect(forms.filter(form=>form.region==='alola')).toHaveLength(18);
    expect(forms.filter(form=>form.region==='galar')).toHaveLength(19);
    expect(forms.filter(form=>form.region==='hisui')).toHaveLength(16);
    expect(forms.filter(form=>form.region==='paldea')).toHaveLength(4);
    expect(forms.some(form=>form.id==='form-128-paldea-blaze')).toBe(true);
    expect(forms.some(form=>form.id==='form-128-paldea-aqua')).toBe(true);
  });

  it('uses native regional forms in Galar and Paldea sections', () => {
    const swsh=games.find(game=>game.id==='swsh')!;const sv=games.find(game=>game.id==='sv')!;
    expect(swsh.dexSections?.find(section=>section.id==='galar')?.formOverrides?.['species-77']).toBe('form-77-galar');
    expect(sv.dexSections?.find(section=>section.id==='paldea')?.formOverrides?.['species-194']).toBe('form-194-paldea');
  });

  it('keeps special form groups complete and uses distinct sprites', () => {
    const unown = forms.filter(form => form.formGroupIds?.includes('unown'));
    expect(unown).toHaveLength(28);
    expect(new Set(unown.map(form => form.sprite)).size).toBe(28);
    expect(unown.find(form => form.name === '!')?.sprite).toContain('exclamation');
    expect(unown.find(form => form.name === '?')?.sprite).toContain('question');

    const flabebeLine = forms.filter(form => form.formGroupIds?.includes('flabebe-line'));
    expect(flabebeLine.filter(form => ['Red', 'Yellow', 'Orange', 'Blue', 'White'].includes(form.name))).toHaveLength(15);
    expect(flabebeLine.some(form => form.speciesId === 'species-670' && form.name === 'Eternal')).toBe(true);
  });

  it('configures FRLG and Legends Z-A with their distinct Dex sections',()=>{
    const frlg=games.find(game=>game.id==='frlg')!;const za=games.find(game=>game.id==='za')!;
    expect(frlg.dexSections?.map(section=>section.dexSpeciesIds.length)).toEqual([151,386]);
    expect(frlg.dexSpeciesIds).toHaveLength(386);
    expect(za.dexSections?.map(section=>section.dexSpeciesIds.length)).toEqual([232,132]);
    expect(new Set(za.dexSpeciesIds).size).toBe(za.dexSpeciesIds.length);
  });

  it('offers Pokémon GO as a collection game without creating a Game Dex',()=>{
    const go=games.find(game=>game.id==='go');expect(go).toMatchObject({name:'Pokémon GO',shortName:'GO',hasDex:false});expect(go?.dexSpeciesIds).toHaveLength(1025);
  });
});
