import { describe, expect, it } from 'vitest';
import { forms, games } from '../data/catalog';
import type { CollectionEntry } from './models';
import { findCollectionCompatibilityIssues } from './collectionCompatibility';

const entry=(changes:Partial<CollectionEntry>):CollectionEntry=>({id:'entry-1',speciesId:'species-550',formId:'form-550-white-striped',gameId:'swsh',originGameId:'swsh',shiny:false,alpha:false,ownOT:true,quantity:2,createdAt:'2026-01-01',updatedAt:'2026-01-01',...changes});
const formsById=new Map(forms.map(form=>[form.id,form]));

describe('findCollectionCompatibilityIssues',()=>{
  it('finds an old form and game combination that is no longer valid',()=>{
    const [issue]=findCollectionCompatibilityIssues([entry({})],formsById,games);
    expect(issue?.invalidGameIds).toEqual(['swsh']);
    expect(issue?.compatibleGames.map(game=>game.id)).toEqual(['home','go','pla','sv']);
  });

  it('checks the origin game as well as the collection game',()=>{
    const [issue]=findCollectionCompatibilityIssues([entry({gameId:'home',originGameId:'swsh'})],formsById,games);
    expect(issue?.invalidGameIds).toEqual(['swsh']);
  });

  it('does not infer incompatibility for standard forms without an explicit rule',()=>{
    expect(findCollectionCompatibilityIssues([entry({speciesId:'species-25',formId:'form-25-default',gameId:'frlg',originGameId:'frlg'})],formsById,games)).toEqual([]);
  });
});
