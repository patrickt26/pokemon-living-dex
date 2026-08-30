import type { FormGroup, Game, PokemonForm, Species } from '../domain/models';
import { formGroups, forms, games, species } from './catalog';
const speciesById=new Map(species.map(item=>[item.id,item]));
const formsById=new Map(forms.map(item=>[item.id,item]));
const formsBySpeciesId=new Map<string,PokemonForm[]>();
for(const form of forms){const current=formsBySpeciesId.get(form.speciesId)??[];current.push(form);formsBySpeciesId.set(form.speciesId,current)}
export interface PokemonDataSource { getSpecies(): readonly Species[]; getForms(): readonly PokemonForm[]; getGames(): readonly Game[]; getFormGroups(): readonly FormGroup[]; getSpeciesById():ReadonlyMap<string,Species>; getFormsById():ReadonlyMap<string,PokemonForm>; getFormsBySpeciesId():ReadonlyMap<string,readonly PokemonForm[]>; }
export class LocalPokemonDataSource implements PokemonDataSource { getSpecies(){return species;} getForms(){return forms;} getGames(){return games;} getFormGroups(){return formGroups;} getSpeciesById(){return speciesById;} getFormsById(){return formsById;} getFormsBySpeciesId(){return formsBySpeciesId;} }
export const pokemonDataSource: PokemonDataSource = new LocalPokemonDataSource();
