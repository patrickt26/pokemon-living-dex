import { describe, expect, it } from 'vitest';
import { calculateGameProgress } from '../domain/collection';
import { isFormAvailableInGame } from '../domain/gameAvailability';
import type { CollectionEntry } from '../domain/models';
import { generatedGameDexes } from './generatedGameDexes';
import { dynamaxAdventureNumbers, formGroups, forms, games, noDexEntryNumbers } from './catalog';
import { pokemonDataSource } from './PokemonDataSource';

describe('generated game dex membership', () => {
  it('exposes stable catalog indexes for direct lookup',()=>{
    expect(pokemonDataSource.getSpeciesById().get('species-25')?.name).toBe('Pikachu');
    expect(pokemonDataSource.getFormsById().get('form-479-heat')?.name).toBe('Heat');
    expect(pokemonDataSource.getFormsBySpeciesId().get('species-479')?.map(form=>form.id)).toEqual(expect.arrayContaining(['form-479-default','form-479-heat']));
  });

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

    const furfrouTrims = forms.filter(form => form.formGroupIds?.includes('furfrou'));
    expect(furfrouTrims).toHaveLength(9);
    expect(new Set(furfrouTrims.map(form => form.sprite)).size).toBe(9);
    expect(new Set(furfrouTrims.map(form => form.shinySprite)).size).toBe(9);
    expect(furfrouTrims.find(form => form.name === 'La Reine')?.sprite).toContain('676-la-reine.png');

    const flabebeLine = forms.filter(form => form.formGroupIds?.includes('flabebe-line'));
    expect(flabebeLine.filter(form => ['Red', 'Yellow', 'Orange', 'Blue', 'White'].includes(form.name))).toHaveLength(12);
    expect(flabebeLine.some(form => form.speciesId === 'species-670' && form.name === 'Eternal')).toBe(true);
    const floetteVariants=formGroups.find(group=>group.id==='flabebe-line')!.formIds.filter(id=>id.startsWith('form-670-'));
    expect(floetteVariants).toEqual(['form-670-yellow','form-670-orange','form-670-blue','form-670-white','form-670-eternal']);
    expect(forms.filter(form=>['form-479-normal','form-676-natural','form-669-red','form-670-red','form-671-red'].includes(form.id))).toEqual([]);
    const standardAliases=['form-201-a','form-479-normal','form-676-natural','form-669-red','form-670-red','form-671-red'];
    expect(formGroups.flatMap(group=>group.formIds).filter(id=>standardAliases.includes(id))).toEqual([]);
  });

  it('includes the expanded cosmetic and permanent variant groups',()=>{
    const expectedCounts:Record<string,number>={deoxys:3,'burmy-line':4,'shellos-line':2,shaymin:1,basculin:2,'deerling-line':6,'forces-of-nature':4,keldeo:1,vivillon:19,meowstic:1,'pumpkaboo-line':6,oricorio:3,lycanroc:2,zygarde:1,hoopa:1,minior:6,magearna:1,toxtricity:1,'sinistea-line':2,alcremie:8,indeedee:1,urshifu:1,zarude:1,ursaluna:1,basculegion:1,oinkologne:1,maushold:1,squawkabilly:3,tatsugiri:2,dudunsparce:1,gimmighoul:1,'poltchageist-line':2};
    const variantIds=Object.entries(expectedCounts).flatMap(([groupId,count])=>{
      const group=formGroups.find(candidate=>candidate.id===groupId);
      expect(group?.formIds).toHaveLength(count);
      return group?.formIds??[];
    });
    const variants=variantIds.map(id=>forms.find(form=>form.id===id)!);
    expect(new Set(variants.map(form=>form.sprite)).size).toBe(variants.length);
    expect(new Set(variants.map(form=>form.shinySprite)).size).toBe(variants.length);
    expect(new Set(variants.map(form=>form.speciesId))).toEqual(new Set(['species-386','species-412','species-413','species-422','species-423','species-492','species-550','species-585','species-586','species-641','species-642','species-645','species-647','species-666','species-678','species-710','species-711','species-718','species-720','species-741','species-745','species-774','species-801','species-849','species-854','species-855','species-869','species-876','species-892','species-893','species-901','species-902','species-905','species-916','species-925','species-931','species-978','species-982','species-999','species-1012','species-1013']));
    expect(forms.find(form=>form.id==='form-413-sandy')?.types).toEqual(['bug','ground']);
    expect(forms.find(form=>form.id==='form-413-trash')?.types).toEqual(['bug','steel']);
    expect(forms.find(form=>form.id==='form-741-sensu')?.types).toEqual(['ghost','flying']);
    expect(forms.find(form=>form.id==='form-892-rapid-strike')?.types).toEqual(['fighting','water']);
  });

  it('uses meaningful names for default members of variant families',()=>{
    const expectedNames:Record<string,string>={'form-201-default':'A','form-386-default':'Normal Forme','form-412-default':'Plant Cloak','form-413-default':'Plant Cloak','form-422-default':'West Sea','form-423-default':'West Sea','form-492-default':'Land Forme','form-550-default':'Red-Striped','form-585-default':'Spring','form-586-default':'Spring','form-641-default':'Incarnate Forme','form-642-default':'Incarnate Forme','form-645-default':'Incarnate Forme','form-647-default':'Ordinary Form','form-666-default':'Meadow Pattern','form-669-default':'Red Flower','form-670-default':'Red Flower','form-671-default':'Red Flower','form-678-default':'Male','form-710-default':'Average Size','form-711-default':'Average Size','form-718-default':'50% Forme','form-720-default':'Confined','form-741-default':'Baile Style','form-745-default':'Midday Form','form-774-default':'Red Core','form-801-default':'Regular Color','form-849-default':'Amped Form','form-854-default':'Phony Form','form-855-default':'Phony Form','form-869-default':'Vanilla Cream','form-876-default':'Male','form-892-default':'Single Strike Style','form-893-default':'Regular','form-901-default':'Regular Form','form-902-default':'Male','form-905-default':'Incarnate Forme','form-916-default':'Male','form-925-default':'Family of Four','form-931-default':'Green Plumage','form-978-default':'Curly Form','form-982-default':'Two-Segment Form','form-999-default':'Chest Form','form-1012-default':'Counterfeit Form','form-1013-default':'Unremarkable Form'};
    for(const [formId,name] of Object.entries(expectedNames))expect(forms.find(form=>form.id===formId)?.name).toBe(name);
    expect(forms.find(form=>form.id==='form-479-default')?.name).toBe('Standard');
    expect(forms.find(form=>form.id==='form-676-default')?.name).toBe('Standard');
    expect(forms.find(form=>form.id==='form-774-default')?.sprite).toContain('/10136.png');
  });

  it('tracks game availability for form-specific Basculin and Flabebe variants',()=>{
    expect(forms.find(form=>form.id==='form-550-default')?.availableGameIds).toEqual(['go','swsh','sv']);
    expect(forms.find(form=>form.id==='form-550-blue-striped')?.availableGameIds).toEqual(['go','swsh','sv']);
    expect(forms.find(form=>form.id==='form-550-white-striped')?.availableGameIds).toEqual(['go','pla','sv']);
    expect(forms.find(form=>form.id==='form-669-blue')?.availableGameIds).toEqual(['go','sv','za']);
    expect(forms.find(form=>form.id==='form-670-eternal')?.availableGameIds).toEqual(['za']);
  });

  it('tracks complete regional-form compatibility instead of species Dex membership',()=>{
    const regional=forms.filter(form=>form.region);
    const compatibleCount=(gameId:string)=>{
      const game=games.find(candidate=>candidate.id===gameId)!;
      return regional.filter(form=>isFormAvailableInGame(form,game)).length;
    };
    expect(regional).toHaveLength(57);
    expect(Object.fromEntries(games.map(game=>[game.id,compatibleCount(game.id)]))).toEqual({home:57,go:55,frlg:0,bdsp:0,swsh:30,pla:18,sv:43,za:16});
    expect(forms.find(form=>form.id==='form-26-alola')?.availableGameIds).toEqual(['go','swsh','sv','za']);
    expect(forms.find(form=>form.id==='form-37-alola')?.availableGameIds).toEqual(['go','swsh','pla','sv']);
    expect(forms.find(form=>form.id==='form-83-galar')?.availableGameIds).toEqual(['go','swsh','za']);
    expect(forms.find(form=>form.id==='form-110-galar')?.availableGameIds).toEqual(['go','swsh','sv']);
    expect(forms.find(form=>form.id==='form-705-hisui')?.availableGameIds).toEqual(['pla','sv','za']);
  });

  it('defines explicit compatibility for every catalogued variant form',()=>{
    const variantSpecies=new Set([201,386,412,413,422,423,479,492,550,585,586,641,642,645,647,666,669,670,671,676,678,710,711,718,720,741,745,774,801,849,854,855,869,876,892,893,901,902,905,916,925,931,978,982,999,1012,1013].map(number=>`species-${number}`));
    const variants=forms.filter(form=>variantSpecies.has(form.speciesId));
    expect(variants.every(form=>form.availableGameIds!==undefined)).toBe(true);
    expect(forms.find(form=>form.id==='form-479-heat')?.availableGameIds).toEqual(['go','bdsp','swsh','pla','sv','za']);
    expect(forms.find(form=>form.id==='form-892-default')?.availableGameIds).toEqual(['go','swsh','sv']);
    expect(forms.find(form=>form.id==='form-931-white-plumage')?.availableGameIds).toEqual(['go','sv','za']);
    expect(forms.find(form=>form.id==='form-1012-artisan')?.availableGameIds).toEqual(['go','sv']);
  });

  it('tracks compatibility exceptions in the newly added variant families',()=>{
    expect(forms.find(form=>form.id==='form-666-archipelago')?.availableGameIds).toEqual(['go','sv','za']);
    expect(forms.find(form=>form.id==='form-666-fancy')?.availableGameIds).toEqual(['sv','za']);
    expect(forms.find(form=>form.id==='form-666-poke-ball')?.availableGameIds).toEqual(['sv','za']);
    expect(forms.find(form=>form.id==='form-710-small')?.availableGameIds).toEqual(['go','swsh','za']);
    expect(forms.find(form=>form.id==='form-869-rainbow-swirl-strawberry-sweet')?.availableGameIds).toEqual(['swsh','sv']);
    expect(forms.find(form=>form.id==='form-876-female')?.availableGameIds).toEqual(['go','swsh','sv','za']);
    expect(forms.find(form=>form.id==='form-902-female')?.availableGameIds).toEqual(['pla','sv']);
    expect(forms.find(form=>form.id==='form-982-three-segment')?.availableGameIds).toEqual(['go','sv']);
    expect(forms.find(form=>form.id==='form-386-attack')?.availableGameIds).toEqual(['go','bdsp']);
    expect(forms.find(form=>form.id==='form-905-therian')?.availableGameIds).toEqual(['go','pla','sv']);
    expect(forms.find(form=>form.id==='form-647-resolute')?.availableGameIds).toEqual(['go','swsh','sv','za']);
    expect(forms.find(form=>form.id==='form-718-10-percent')?.availableGameIds).toEqual(['go','swsh','za']);
    expect(forms.find(form=>form.id==='form-901-bloodmoon')?.availableGameIds).toEqual(['sv']);
    expect(forms.find(form=>form.id==='form-999-roaming')?.availableGameIds).toEqual(['go','sv','za']);
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
