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

export function getCataloguedVariantFormsForGame(forms: readonly PokemonForm[], game: Game) {
  return forms.filter(form => (form.region !== undefined || (form.formGroupIds?.length ?? 0) > 0) && isFormAvailableInGame(form, game));
}
