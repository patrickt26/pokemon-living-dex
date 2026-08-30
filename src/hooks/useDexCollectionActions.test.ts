import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { indexCollectionEntries } from '../domain/collection';
import type { CollectionEntry, PokemonForm } from '../domain/models';
import { useDexCollectionActions } from './useDexCollectionActions';

const actions=vi.hoisted(()=>({add:{mutate:vi.fn()},addMany:{mutate:vi.fn()},changeQuantity:{mutate:vi.fn()},removeMany:{mutate:vi.fn()}}));
vi.mock('./useCollection',()=>({useCollectionActions:()=>actions}));

const form:PokemonForm={id:'form-25-default',speciesId:'species-25',name:'Standard',sprite:'pikachu.png',types:['electric']};
const entry=(changes:Partial<CollectionEntry>={}):CollectionEntry=>({id:'entry-1',speciesId:form.speciesId,formId:form.id,gameId:'home',originGameId:'home',shiny:false,alpha:false,ownOT:true,quantity:1,createdAt:'x',updatedAt:'x',...changes});

beforeEach(()=>vi.clearAllMocks());

describe('useDexCollectionActions',()=>{
  it('decrements the indexed entry during quick editing',()=>{
    const entries=[entry({quantity:2})];const onSelect=vi.fn();const {result}=renderHook(()=>useDexCollectionActions({entries,entryIndex:indexCollectionEntries(entries),gameId:'home',ot:'all',shiny:'all',alpha:'all',onSelect}));
    act(()=>result.current.quickToggle(form));
    expect(actions.changeQuantity.mutate).toHaveBeenCalledWith({id:'entry-1',quantity:1});
    expect(actions.add.mutate).not.toHaveBeenCalled();
  });

  it('opens details when matching entries have multiple origins',()=>{
    const entries=[entry(),entry({id:'entry-2',originGameId:'go'})];const onSelect=vi.fn();const {result}=renderHook(()=>useDexCollectionActions({entries,entryIndex:indexCollectionEntries(entries),gameId:'home',ot:'all',shiny:'all',alpha:'all',onSelect}));
    act(()=>result.current.quickToggle(form));
    expect(onSelect).toHaveBeenCalledWith(form.id);
    expect(actions.changeQuantity.mutate).not.toHaveBeenCalled();
  });

  it('builds additions and removals for a form collection',()=>{
    const otherForm:PokemonForm={...form,id:'form-25-cosplay',name:'Cosplay'};const entries=[entry({gameId:'go',shiny:true,alpha:true}),entry({id:'entry-2',formId:otherForm.id})];const {result}=renderHook(()=>useDexCollectionActions({entries,entryIndex:indexCollectionEntries(entries),gameId:'home',ot:'all',shiny:'shiny',alpha:'alpha',onSelect:vi.fn()}));
    act(()=>{result.current.addForms([form,otherForm],candidate=>candidate.id===form.id);result.current.clearForms([form])});
    expect(actions.addMany.mutate).toHaveBeenCalledWith([{speciesId:form.speciesId,formId:form.id,gameId:'home',originGameId:'home',ownOT:true,shiny:true,alpha:true,quantity:1}]);
    expect(actions.removeMany.mutate).toHaveBeenCalledWith(['entry-1']);
  });
});
