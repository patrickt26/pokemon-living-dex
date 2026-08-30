import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { PokemonDetails } from './PokemonDetails';

describe('PokemonDetails', () => {
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
});
