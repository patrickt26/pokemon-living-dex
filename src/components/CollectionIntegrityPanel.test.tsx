import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CollectionEntry } from '../domain/models';
import { useUiStore } from '../store/uiStore';
import { CollectionIntegrityPanel } from './CollectionIntegrityPanel';

const mocks=vi.hoisted(()=>({mutate:vi.fn()}));
vi.mock('../hooks/useCollection',()=>({useCollectionActions:()=>({changeAll:{mutate:mocks.mutate,isPending:false}})}));

const incompatible:CollectionEntry={id:'old-entry',speciesId:'species-550',formId:'form-550-white-striped',gameId:'swsh',originGameId:'swsh',shiny:false,alpha:false,ownOT:true,quantity:2,createdAt:'2026-01-01',updatedAt:'2026-01-01'};

describe('CollectionIntegrityPanel',()=>{
  afterEach(()=>{cleanup();mocks.mutate.mockReset()});

  it('offers only compatible games and repairs the complete entry',()=>{
    useUiStore.setState({language:'en'});
    render(<CollectionIntegrityPanel entries={[incompatible]}/>);

    expect(screen.getByText('Incompatible old entries found')).toBeInTheDocument();
    const select=screen.getByLabelText('Correct to game') as HTMLSelectElement;
    expect([...select.options].map(option=>option.value)).toEqual(['home','go','pla','sv']);

    fireEvent.change(select,{target:{value:'pla'}});
    fireEvent.click(screen.getByRole('button',{name:'Fix entry'}));
    expect(mocks.mutate).toHaveBeenCalledWith({id:'old-entry',changes:{gameId:'pla',originGameId:'pla'}});
  });

  it('reports a healthy collection when no repair is needed',()=>{
    useUiStore.setState({language:'en'});
    render(<CollectionIntegrityPanel entries={[{...incompatible,gameId:'sv',originGameId:'sv'}]}/>);
    expect(screen.getByText('No compatibility problems found')).toBeInTheDocument();
  });
});
