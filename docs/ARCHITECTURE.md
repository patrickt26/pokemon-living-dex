# Arquitetura

## Interface e estilização

A interface usa Tailwind CSS v4 integrado pelo plugin oficial do Vite. Tokens de cor e tipografia, componentes semânticos e breakpoints ficam em `src/styles.css`. O dark mode troca os design tokens CSS no container `.app.dark`, preservando as mesmas utilities e componentes.

## Modelo de dados

`Species` representa a identidade da National Dex (`species-25`, Pikachu). `PokemonForm` representa uma aparência/variante estável e aponta para uma espécie (`form-26-alola` pertence a Raichu). `CollectionEntry` representa Pokémon efetivamente possuídos, agregados por forma, jogo, shiny e OT, com `quantity`. Assim várias cópias e combinações coexistem sem duplicar metadados estáticos.

`gameId` registra o jogo ao qual a entrada contribui nas Game Dexes. `originGameId` registra a origem e é normalizado para `gameId` quando não informado. No MVP, o seletor de jogo edita os dois campos em conjunto; a separação no modelo preserva a evolução futura para origem e localização independentes sem reinterpretar `Species` ou `Form`.

`DexEntry` é um tipo de projeção/catalogação, não uma tabela de posse. `Game.dexSpeciesIds` define associação configurável entre jogo e espécies. `FormGroup` é uma lista genérica de `formIds`, usada igualmente para Unown, Rotom, Furfrou e a linha Flabébé.

## Dexes derivadas da coleção

Collection é a fonte única de verdade. As funções puras em `domain/collection.ts` filtram entradas e calculam conjuntos únicos de espécies. National ignora o jogo; Game Dex filtra `gameId`; Shiny filtra `shiny`; Own OT filtra `ownOT`. Nenhum percentual ou booleano `owned` é persistido.

## Repository Pattern

`CollectionRepository` declara leitura, leitura por espécie, inclusão, atualização e remoção. `DexieCollectionRepository` é a implementação local. `CollectionService` depende apenas dessa interface; hooks React usam o serviço e invalidam o cache do TanStack Query. Componentes não importam Dexie.

Importações completas usam `replaceEntries`, uma operação atômica no repositório Dexie. `CollectionBackupService` valida o formato versionado contra o catálogo e consolida entradas equivalentes antes de mesclar ou substituir. IDs e timestamps internos não fazem parte do arquivo portátil.

Para testes ou outras plataformas, injete um repositório em memória. A composição atual fica em `app/dependencies.ts`.

## Adicionar um jogo

Adicione um objeto `Game` ao catálogo com id estável, nome, cor, `dexSpeciesIds` e, quando houver DLCs, `dexSections`. Rotas, seleção de jogo, badges e dashboard consomem a lista dinamicamente. `scripts/generate-game-dexes.mjs` gera as associações a partir dos recursos Pokédex da PokéAPI; a união das seções define o progresso geral do jogo.

## Adicionar um FormGroup

Crie as `PokemonForm` necessárias, associe seus ids por `formGroupIds` e adicione um `FormGroup` ao catálogo. A página genérica **Special Forms** passa a renderizá-lo automaticamente com boxes, progresso e edição; regras de coleção não precisam mudar porque toda forma já aponta para `speciesId`.

## Backup, migração e offline

O backup portátil tem `version`, `exportedAt` e `entries`, sem IDs ou timestamps internos. Alterações futuras no formato devem incrementar a versão e oferecer uma função de migração antes da validação. O banco Dexie mantém seu próprio versionamento de schema separadamente.

O PWA usa um service worker pequeno para o shell e cache em tempo de execução. IndexedDB continua sendo a fonte de verdade; o cache offline nunca substitui o Repository.

## Catálogo e importação

`PokemonDataSource` isola a origem dos metadados. `LocalPokemonDataSource` fornece dados empacotados e normalizados. Uma etapa de geração pode consultar PokéAPI em desenvolvimento/CI, validar ids e gravar JSON/TypeScript versionado; a execução do app continua offline-first e sem requisições por página.

## API Fastify futura

Implemente `ApiCollectionRepository` usando HTTP e mantendo o contrato. Troque a instância em `app/dependencies.ts`; serviços, hooks, regras e componentes permanecem iguais. O backend pode persistir as mesmas entidades no PostgreSQL, adicionar autenticação e sincronização. TanStack Query já oferece a fronteira de cache adequada para essa evolução.
