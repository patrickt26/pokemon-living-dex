export type SpeciesId = string;
export type FormId = string;
export type GameId = string;
export type Region = 'alola' | 'galar' | 'hisui' | 'paldea';

export interface Species { id: SpeciesId; nationalDexNumber: number; name: string; defaultFormId: FormId; }
export interface PokemonForm { id: FormId; speciesId: SpeciesId; name: string; sprite: string; shinySprite?: string; region?: Region; formGroupIds?: string[]; }
export interface GameDexSection { id: string; name: string; dexSpeciesIds: SpeciesId[]; formOverrides?: Partial<Record<SpeciesId,FormId>>; }
export interface Game { id: GameId; name: string; shortName: string; color: string; logo?: string; dexSpeciesIds: SpeciesId[]; dexSections?: GameDexSection[]; hasDex?: boolean; supportsAlpha?: boolean; }
export interface FormGroup { id: string; name: string; description: string; formIds: FormId[]; }
export interface DexEntry { speciesId: SpeciesId; formId: FormId; gameId?: GameId; }
export interface CollectionEntry { id: string; speciesId: SpeciesId; formId: FormId; shiny: boolean; alpha: boolean; gameId: GameId; ownOT: boolean; quantity: number; originGameId?: GameId; createdAt: string; updatedAt: string; }
export type CollectionEntryInput = Omit<CollectionEntry, 'id' | 'createdAt' | 'updatedAt' | 'alpha'> & { alpha?: boolean };
export type OtFilter = 'all' | 'own' | 'other';
export type AlphaFilter = 'all' | 'alpha' | 'regular';
export type OwnershipFilter = 'all' | 'owned' | 'missing';
export interface EntrySummary { total: number; ownOT: number; otherOT: number; shiny: number; byGame: Record<GameId, number>; }
export interface Progress { obtained: number; total: number; percentage: number; }
