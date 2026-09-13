import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PokemonForm } from '../domain/models';
import { BulkAddGameButton } from './BulkAddGameButton';

const pikachu:PokemonForm={id:'form-25-default',speciesId:'species-25',name:'Standard',sprite:'pikachu.png',types:['electric']};
const unsupported:PokemonForm={id:'form-9999-default',speciesId:'species-9999',name:'Standard',sprite:'missing.png',types:[]};

afterEach(cleanup);

describe('BulkAddGameButton',()=>{
  it('asks for a game and adds only forms compatible with it',()=>{
    const onAdd=vi.fn();
    render(<BulkAddGameButton forms={[pikachu,unsupported]} onAdd={onAdd}>Add all</BulkAddGameButton>);
    fireEvent.click(screen.getByRole('button',{name:'Add all'}));
    fireEvent.change(screen.getByLabelText('Game'),{target:{value:'sv'}});
    expect(document.querySelector('.bulk-add-summary')).toHaveTextContent('1 compatible Pokémon · SV');
    fireEvent.click(screen.getByRole('button',{name:'Add to game'}));
    expect(onAdd).toHaveBeenCalledWith('sv',[pikachu]);
  });

  it('keeps the entire batch when HOME is selected',()=>{
    const onAdd=vi.fn();
    render(<BulkAddGameButton forms={[pikachu,unsupported]} onAdd={onAdd}>Add all</BulkAddGameButton>);
    fireEvent.click(screen.getByRole('button',{name:'Add all'}));
    fireEvent.click(screen.getByRole('button',{name:'Add to game'}));
    expect(onAdd).toHaveBeenCalledWith('home',[pikachu,unsupported]);
  });

  it('hides games without Alpha support for Alpha batches',()=>{
    render(<BulkAddGameButton forms={[pikachu]} onAdd={vi.fn()} requiresAlpha>Add all</BulkAddGameButton>);
    fireEvent.click(screen.getByRole('button',{name:'Add all'}));
    expect(screen.getByRole('option',{name:/Pokémon HOME/})).toBeInTheDocument();
    expect(screen.queryByRole('option',{name:/Scarlet \/ Violet/})).not.toBeInTheDocument();
  });
});
