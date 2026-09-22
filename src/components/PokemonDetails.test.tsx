import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { PokemonDetails } from './PokemonDetails';

describe('PokemonDetails', () => {
  afterEach(cleanup);
  it('updates the header when another form is selected', () => {
    const form = pokemonDataSource.getForms().find(candidate => candidate.id === 'form-479-default')!;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <PokemonDetails form={form} entries={[]} onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('Form'), { target: { value: 'form-479-heat' } });

    expect(screen.getByText('Heat form')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rotom' })).toHaveAttribute('src', expect.stringContaining('/10008.png'));
    expect(document.querySelectorAll('.details-type-icons .type-icon')).toHaveLength(2);
  });

  it('filters games again whenever the selected form changes', () => {
    const form = pokemonDataSource.getFormsById().get('form-550-default')!;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const view=render(<QueryClientProvider client={queryClient}><PokemonDetails form={form} entries={[]} onClose={vi.fn()} /></QueryClientProvider>);

    const gameSelect=view.getByLabelText('Game') as HTMLSelectElement;
    expect([...gameSelect.options].map(option=>option.text)).toEqual(['Pokémon HOME / National','Pokémon GO','Sword / Shield','Scarlet / Violet']);

    fireEvent.change(view.getByLabelText('Form'),{target:{value:'form-550-white-striped'}});

    expect([...gameSelect.options].map(option=>option.text)).toEqual(['Pokémon HOME / National','Pokémon GO','Pokémon Legends: Arceus','Scarlet / Violet']);
  });

  it('filters the manual game select for a regional form',()=>{
    const form=pokemonDataSource.getFormsById().get('form-26-alola')!;
    const queryClient=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
    const view=render(<QueryClientProvider client={queryClient}><PokemonDetails form={form} entries={[]} onClose={vi.fn()}/></QueryClientProvider>);
    const gameSelect=view.getByLabelText('Game') as HTMLSelectElement;
    expect([...gameSelect.options].map(option=>option.text)).toEqual(['Pokémon HOME / National','Pokémon GO','Sword / Shield','Scarlet / Violet','Pokémon Legends: Z-A']);
  });

  it('shows the evolution line and its conditions',()=>{
    const form=pokemonDataSource.getFormsById().get('form-1-default')!;
    const queryClient=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
    render(<QueryClientProvider client={queryClient}><PokemonDetails form={form} entries={[]} onClose={vi.fn()}/></QueryClientProvider>);

    expect(screen.getByRole('heading',{name:'Evolution line'})).toBeInTheDocument();
    expect(screen.getByText('Level up · level 16')).toBeInTheDocument();
    expect(screen.getByText('Level up · level 32')).toBeInTheDocument();
    expect(screen.getByText('Ivysaur')).toBeInTheDocument();
    expect(screen.getByText('Venusaur')).toBeInTheDocument();
  });
});
