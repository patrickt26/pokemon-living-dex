import { getAvailableGamesForForm } from './gameAvailability';
import type { CollectionEntry, Game, PokemonForm } from './models';

export interface CollectionCompatibilityIssue {
  entry: CollectionEntry;
  form: PokemonForm;
  invalidGameIds: string[];
  compatibleGames: Game[];
}

export function findCollectionCompatibilityIssues(
  entries: readonly CollectionEntry[],
  formsById: ReadonlyMap<string, PokemonForm>,
  games: readonly Game[],
): CollectionCompatibilityIssue[] {
  return entries.flatMap(entry => {
    const form = formsById.get(entry.formId);
    // Only audit forms whose compatibility was explicitly catalogued. Dex
    // membership is not a reliable proxy for transfer-only standard forms.
    if (!form?.availableGameIds) return [];
    const recordedGameIds = [...new Set([entry.gameId, entry.originGameId ?? entry.gameId])];
    const invalidGameIds = recordedGameIds.filter(gameId => gameId !== 'home' && !form.availableGameIds!.includes(gameId));
    if (!invalidGameIds.length) return [];
    return [{ entry, form, invalidGameIds, compatibleGames:getAvailableGamesForForm(form,games) }];
  });
}
