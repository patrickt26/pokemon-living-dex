import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pokemonDataSource } from '../data/PokemonDataSource';
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

  it('respects the game availability of each Basculin stripe',()=>{
    const formsById=pokemonDataSource.getFormsById();
    const forms=['form-550-blue-striped','form-550-white-striped'].map(id=>formsById.get(id)!);
    render(<BulkAddGameButton forms={forms} onAdd={vi.fn()}>Add all</BulkAddGameButton>);
    fireEvent.click(screen.getByRole('button',{name:'Add all'}));
    expect(screen.getByRole('option',{name:'Sword / Shield — 1/2'})).toBeInTheDocument();
    expect(screen.getByRole('option',{name:'Pokémon Legends: Arceus — 1/2'})).toBeInTheDocument();
    expect(screen.getByRole('option',{name:'Scarlet / Violet — 2/2'})).toBeInTheDocument();
  });

  it('offers Scarlet and Violet for the compatible Flabebe line forms',()=>{
    const formsById=pokemonDataSource.getFormsById();
    const group=pokemonDataSource.getFormGroups().find(candidate=>candidate.id==='flabebe-line')!;
    const forms=group.formIds.map(id=>formsById.get(id)!);
    render(<BulkAddGameButton forms={forms} onAdd={vi.fn()}>Add all</BulkAddGameButton>);
    fireEvent.click(screen.getByRole('button',{name:'Add all'}));
    expect(screen.getByRole('option',{name:'Scarlet / Violet — 12/13'})).toBeInTheDocument();
    expect(screen.getByRole('option',{name:'Pokémon Legends: Z-A — 13/13'})).toBeInTheDocument();
  });
});
