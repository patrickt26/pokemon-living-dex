import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CollectionEntry, PokemonForm, Species } from '../domain/models';
import { PokemonBox } from './PokemonBox';

const species:Species={id:'species-479',nationalDexNumber:479,name:'Rotom',defaultFormId:'form-479-default'};
const standard:PokemonForm={id:'form-479-default',speciesId:species.id,name:'Standard',sprite:'standard.png',shinySprite:'standard-shiny.png',types:['electric','ghost']};
const heat:PokemonForm={id:'form-479-heat',speciesId:species.id,name:'Heat',sprite:'heat.png',shinySprite:'heat-shiny.png',types:['electric','fire']};
const entry=(form:PokemonForm,shiny=false):CollectionEntry=>({id:form.id,speciesId:species.id,formId:form.id,gameId:'home',originGameId:'home',ownOT:true,shiny,alpha:false,quantity:1,createdAt:'2026-01-01',updatedAt:'2026-01-01'});

afterEach(cleanup);

describe('PokemonBox form collection',()=>{
  it('shows an owned alternate form when the primary form is missing',()=>{
    const onSelect=vi.fn();
    render(<PokemonBox title="BOX 01" items={[{species,form:standard,dexNumber:479,collectBySpecies:true}]} entries={[entry(heat)]} forms={[standard,heat]} onSelect={onSelect}/>);

    expect(screen.getByRole('button',{name:/Rotom, National Dex #479, 1 owned/})).toBeInTheDocument();
    expect(screen.getByRole('img',{name:'Rotom'})).toHaveAttribute('src','heat.png');
    expect(screen.getByText('Heat')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('button',{name:/Rotom, National Dex/}),{key:'Enter'});
    expect(onSelect).toHaveBeenCalledWith(heat);
  });

  it('keeps the primary form visible when both forms are owned',()=>{
    render(<PokemonBox title="BOX 01" items={[{species,form:standard,dexNumber:479,collectBySpecies:true}]} entries={[entry(standard),entry(heat,true)]} forms={[standard,heat]} onSelect={vi.fn()}/>);

    expect(screen.getByRole('img',{name:'Rotom'})).toHaveAttribute('src','standard.png');
    expect(screen.queryByText('Heat')).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:/2 owned/})).toBeInTheDocument();
  });
});
