import { fireEvent,render,within } from '@testing-library/react';
import { describe,expect,it,vi } from 'vitest';
import { useSearchSuggestionsStore } from '../store/searchSuggestionsStore';
import { useUiStore } from '../store/uiStore';
import { SearchField } from './SearchField';

describe('SearchField',()=>{
  it('suggests Pokémon and supports keyboard selection',()=>{
    useSearchSuggestionsStore.setState({scope:'/games/pla',suggestions:[{id:'species-25',name:'Pikachu',dexNumber:56}]});
    const onChange=vi.fn();
    const {container}=render(<SearchField value="pika" onChange={onChange}/>);
    const view=within(container);
    const input=view.getByRole('combobox');
    fireEvent.focus(input);
    expect(view.getByRole('option',{name:/Pikachu/})).toBeInTheDocument();
    expect(view.getByText('#056')).toBeInTheDocument();
    fireEvent.keyDown(input,{key:'ArrowDown'});
    fireEvent.keyDown(input,{key:'Enter'});
    expect(onChange).toHaveBeenCalledWith('Pikachu');
    expect(useUiStore.getState().searchTargetSpeciesId).toBe('species-25');
    fireEvent.change(input,{target:{value:'Pik'}});
    expect(useUiStore.getState().searchTargetSpeciesId).toBeNull();
  });
});
