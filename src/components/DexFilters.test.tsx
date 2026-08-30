import { fireEvent,render,screen,within } from '@testing-library/react';
import { describe,expect,it,vi } from 'vitest';
import { DexFilters } from './DexFilters';

const baseProps={search:'',onSearch:vi.fn(),ot:'all' as const,onOt:vi.fn(),ownership:'all' as const,onOwnership:vi.fn()};

describe('DexFilters',()=>{
  it('changes generation, ownership, OT and search filters',()=>{
    const onSearch=vi.fn(),onOt=vi.fn(),onOwnership=vi.fn(),onGeneration=vi.fn();
    render(<DexFilters {...baseProps} onSearch={onSearch} onOt={onOt} onOwnership={onOwnership} generations={[{id:'all',label:'All'},{id:'1',label:'1'}]} selectedGenerations={[]} onGeneration={onGeneration}/>);
    const generations=within(screen.getAllByLabelText('Generation filter').at(-1)!);
    expect(generations.getByRole('button',{name:'All'})).toHaveAttribute('aria-pressed','true');
    expect(generations.getByRole('button',{name:'1'})).toHaveAttribute('aria-pressed','false');
    fireEvent.change(screen.getByPlaceholderText('Search name or # number'),{target:{value:'Pikachu'}});
    fireEvent.click(generations.getByRole('button',{name:'1'}));
    fireEvent.click(screen.getByRole('button',{name:'Owned'}));
    fireEvent.click(screen.getByRole('button',{name:'Own OT'}));
    expect(onSearch).toHaveBeenCalledWith('Pikachu');expect(onGeneration).toHaveBeenCalledWith('1');expect(onOwnership).toHaveBeenCalledWith('owned');expect(onOt).toHaveBeenCalledWith('own');
  });

  it('marks multiple generation buttons as selected while All remains exclusive',()=>{
    render(<DexFilters {...baseProps} generations={[{id:'all',label:'All'},{id:'2',label:'2'},{id:'4',label:'4'}]} selectedGenerations={['2','4']} onGeneration={vi.fn()}/>);
    const generations=within(screen.getAllByLabelText('Generation filter').at(-1)!);
    expect(generations.getByRole('button',{name:'All'})).toHaveAttribute('aria-pressed','false');
    expect(generations.getByRole('button',{name:'2'})).toHaveAttribute('aria-pressed','true');
    expect(generations.getByRole('button',{name:'4'})).toHaveAttribute('aria-pressed','true');
  });

  it('changes the Alpha filter',()=>{
    const onAlpha=vi.fn();render(<DexFilters {...baseProps} alpha="all" onAlpha={onAlpha}/>);
    const alpha=within(screen.getByLabelText('Alpha filter'));fireEvent.click(alpha.getByRole('button',{name:'Alpha'}));fireEvent.click(alpha.getByRole('button',{name:'Not Alpha'}));
    expect(onAlpha).toHaveBeenNthCalledWith(1,'alpha');expect(onAlpha).toHaveBeenNthCalledWith(2,'regular');
  });

  it('changes the Shiny filter',()=>{
    const onShiny=vi.fn();render(<DexFilters {...baseProps} shiny="all" onShiny={onShiny}/>);
    const shiny=within(screen.getAllByLabelText('Collection view').at(-1)!);fireEvent.click(shiny.getByRole('button',{name:/Shiny/}));fireEvent.click(shiny.getByRole('button',{name:'Normal'}));
    expect(onShiny).toHaveBeenNthCalledWith(1,'shiny');expect(onShiny).toHaveBeenNthCalledWith(2,'regular');
  });

  it('supports multiple selected Pokemon types while All remains exclusive',()=>{
    const onType=vi.fn();render(<DexFilters {...baseProps} selectedTypes={['fire','flying']} onType={onType}/>);
    const types=within(screen.getByLabelText('Type filter'));
    expect(types.getByRole('button',{name:'All'})).toHaveAttribute('aria-pressed','false');
    expect(types.getByRole('button',{name:'Fire'})).toHaveAttribute('aria-pressed','true');
    expect(types.getByRole('button',{name:'Flying'})).toHaveAttribute('aria-pressed','true');
    fireEvent.click(types.getByRole('button',{name:'Water'}));expect(onType).toHaveBeenCalledWith('water');
  });
});
