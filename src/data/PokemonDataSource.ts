import type { FormGroup, Game, PokemonForm, Species } from '../domain/models';
import { formGroups, forms, games, species } from './catalog';
export interface PokemonDataSource { getSpecies(): readonly Species[]; getForms(): readonly PokemonForm[]; getGames(): readonly Game[]; getFormGroups(): readonly FormGroup[]; }
export class LocalPokemonDataSource implements PokemonDataSource { getSpecies(){return species;} getForms(){return forms;} getGames(){return games;} getFormGroups(){return formGroups;} }
export const pokemonDataSource: PokemonDataSource = new LocalPokemonDataSource();
