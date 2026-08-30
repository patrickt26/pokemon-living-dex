import { describe, expect, it } from 'vitest';
import { calculateGameProgress } from '../domain/collection';
import type { CollectionEntry } from '../domain/models';
import { generatedGameDexes } from './generatedGameDexes';
import { dynamaxAdventureNumbers, formGroups, forms, games, noDexEntryNumbers } from './catalog';

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

  it('separates Dynamax Adventure bosses from the other unnumbered entries', () => {
    const swsh = games.find(game => game.id === 'swsh')!;
    const dynamax = swsh.dexSections?.find(candidate => candidate.id === 'dynamax-adventures');
    const noDex = swsh.dexSections?.find(candidate => candidate.id === 'no-dex-entries');
    expect(dynamaxAdventureNumbers).toHaveLength(47);
    expect(dynamax).toMatchObject({name:'Dynamax Adventures',showDexNumbers:false});
    expect(dynamax?.formOverrides).toMatchObject({'species-144':'form-144-default','species-145':'form-145-default','species-146':'form-146-default'});
    expect(noDexEntryNumbers).toHaveLength(24);
    expect(noDex).toMatchObject({name:'No Dex Entries',showDexNumbers:false});
    expect(noDexEntryNumbers).toEqual(expect.arrayContaining([252,260,486,647,722,730,789,790,803,804]));
    expect([...dynamaxAdventureNumbers,...noDexEntryNumbers].filter(number=>[151,251,385,494,649,719,721,801,802,807,808,809].includes(number))).toEqual([]);
    expect(swsh.dexSections?.slice(-2).map(section=>section.id)).toEqual(['dynamax-adventures','no-dex-entries']);
  });

  it('requires Hisuian regional forms for the Hisui Dex', () => {
    const pla=games.find(game=>game.id==='pla')!;const hisui=pla.dexSections?.[0];if(!hisui)throw new Error('Hisui Dex section not found');
    expect(hisui.formOverrides?.['species-59']).toBe('form-59-hisui');
    const arcanine=(formId:string):CollectionEntry=>({id:formId,speciesId:'species-59',formId,gameId:'pla',shiny:false,alpha:false,ownOT:true,quantity:1,createdAt:'2026-01-01',updatedAt:'2026-01-01'});
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

  it('includes types for every supported form and preserves regional type changes',()=>{
    expect(forms.every(form=>form.types.length>0)).toBe(true);
    expect(forms.find(form=>form.id==='form-6-default')?.types).toEqual(['fire','flying']);
    expect(forms.find(form=>form.id==='form-26-default')?.types).toEqual(['electric']);
    expect(forms.find(form=>form.id==='form-26-alola')?.types).toEqual(['electric','psychic']);
    expect(forms.find(form=>form.id==='form-77-galar')?.types).toEqual(['psychic']);
    expect(forms.find(form=>form.id==='form-479-heat')?.types).toEqual(['electric','fire']);
  });

  it('uses native regional forms in Galar and Paldea sections', () => {
    const swsh=games.find(game=>game.id==='swsh')!;const sv=games.find(game=>game.id==='sv')!;
    expect(swsh.dexSections?.find(section=>section.id==='galar')?.formOverrides?.['species-77']).toBe('form-77-galar');
    expect(sv.dexSections?.find(section=>section.id==='paldea')?.formOverrides?.['species-194']).toBe('form-194-paldea');
  });

  it('keeps variant groups complete without duplicating their standard forms', () => {
    const unown = forms.filter(form => form.formGroupIds?.includes('unown'));
    expect(unown).toHaveLength(27);
    expect(new Set(unown.map(form => form.sprite)).size).toBe(27);
    expect(unown.some(form=>form.name==='A')).toBe(false);
    expect(unown.find(form => form.name === '!')?.sprite).toContain('exclamation');
    expect(unown.find(form => form.name === '?')?.sprite).toContain('question');

    const flabebeLine = forms.filter(form => form.formGroupIds?.includes('flabebe-line'));
    expect(flabebeLine.filter(form => ['Red', 'Yellow', 'Orange', 'Blue', 'White'].includes(form.name))).toHaveLength(12);
    expect(flabebeLine.some(form => form.speciesId === 'species-670' && form.name === 'Eternal')).toBe(true);
    const floetteVariants=formGroups.find(group=>group.id==='flabebe-line')!.formIds.filter(id=>id.startsWith('form-670-'));
    expect(floetteVariants).toEqual(['form-670-yellow','form-670-orange','form-670-blue','form-670-white','form-670-eternal']);
    expect(forms.filter(form=>['form-479-normal','form-676-natural','form-669-red','form-670-red','form-671-red'].includes(form.id))).toEqual([]);
    const standardAliases=['form-201-a','form-479-normal','form-676-natural','form-669-red','form-670-red','form-671-red'];
    expect(formGroups.flatMap(group=>group.formIds).filter(id=>standardAliases.includes(id))).toEqual([]);
  });

  it('configures FRLG and Legends Z-A with their distinct Dex sections',()=>{
    const frlg=games.find(game=>game.id==='frlg')!;const pla=games.find(game=>game.id==='pla')!;const za=games.find(game=>game.id==='za')!;
    expect(frlg.dexSections?.map(section=>section.dexSpeciesIds.length)).toEqual([151,386]);
    expect(frlg.dexSpeciesIds).toHaveLength(386);
    expect(za.dexSections?.map(section=>section.dexSpeciesIds.length)).toEqual([232,132]);
    expect(new Set(za.dexSpeciesIds).size).toBe(za.dexSpeciesIds.length);
    expect(games.filter(game=>game.supportsAlpha).map(game=>game.id)).toEqual([pla.id,za.id]);
  });

  it('offers Pokémon GO as a collection game without creating a Game Dex',()=>{
    const go=games.find(game=>game.id==='go');expect(go).toMatchObject({name:'Pokémon GO',shortName:'GO',hasDex:false});expect(go?.dexSpeciesIds).toHaveLength(1025);
  });
});
