import { describe, expect, it } from 'vitest';
import type { Game, PokemonForm } from './models';
import { getCataloguedVariantFormsForGame } from './gameAvailability';

const game:Game={id:'sv',name:'Scarlet / Violet',shortName:'SV',color:'#e0623c',dexSpeciesIds:['species-550']};
const form=(id:string,extra:Partial<PokemonForm>={}):PokemonForm=>({id,speciesId:'species-550',name:id,sprite:'sprite.png',types:['water'],...extra});

describe('game variant availability',()=>{
  it('returns only catalogued alternate forms compatible with the game',()=>{
    const standard=form('form-550-default',{availableGameIds:['sv']});
    const compatible=form('form-550-blue-striped',{formGroupIds:['basculin'],availableGameIds:['sv']});
    const incompatible=form('form-550-white-striped',{formGroupIds:['basculin'],availableGameIds:['pla']});
    const regional=form('form-550-paldea',{region:'paldea',availableGameIds:['sv']});

    expect(getCataloguedVariantFormsForGame([standard,compatible,incompatible,regional],game).map(item=>item.id)).toEqual([compatible.id,regional.id]);
  });
});
