import { collectionRepository } from '../repositories/DexieCollectionRepository';
import { CollectionService } from '../services/CollectionService';
import { CollectionBackupService } from '../services/CollectionBackupService';
import { pokemonDataSource } from '../data/PokemonDataSource';
export const collectionService = new CollectionService(collectionRepository);
export const collectionBackupService = new CollectionBackupService(collectionRepository,pokemonDataSource);
