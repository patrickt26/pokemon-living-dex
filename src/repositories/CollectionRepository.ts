import type { CollectionEntry, CollectionEntryInput, SpeciesId } from '../domain/models';
export interface CollectionRepository {
  getEntries(): Promise<CollectionEntry[]>;
  getEntriesBySpecies(speciesId: SpeciesId): Promise<CollectionEntry[]>;
  addEntry(entry: CollectionEntryInput): Promise<CollectionEntry>;
  updateEntry(id: string, changes: Partial<CollectionEntryInput>): Promise<CollectionEntry>;
  removeEntry(id: string): Promise<void>;
  replaceEntries(entries: CollectionEntryInput[]): Promise<void>;
}
