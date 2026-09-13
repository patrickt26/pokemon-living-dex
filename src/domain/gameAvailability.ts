import type { Game, PokemonForm } from './models';

export function isFormAvailableInGame(form: PokemonForm, game: Game) {
  if (game.id === 'home') return true;
  return form.availableGameIds
    ? form.availableGameIds.includes(game.id)
    : game.dexSpeciesIds.includes(form.speciesId);
}

export function getAvailableGamesForForm(form: PokemonForm, games: readonly Game[]) {
  return games.filter(game => isFormAvailableInGame(form, game));
}
