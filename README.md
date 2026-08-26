# Living Dex

MVP local-first para gerenciar uma Pokémon Living Dex em uma interface de boxes. Construído com React, TypeScript, Vite, Tailwind CSS, TanStack Query e Dexie/IndexedDB.

## Executar

```bash
corepack enable
pnpm install
pnpm dev
```

Validação: `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`.

## Publicar na Vercel

1. Crie um repositório no GitHub e envie este projeto para ele.
2. Em [vercel.com](https://vercel.com), escolha **Add New Project** e importe o repositório.
3. Confirme as configurações: Install Command `pnpm install`, Build Command `pnpm build` e Output Directory `dist`.
4. Clique em **Deploy**. Novos pushes na branch conectada gerarão deployments automaticamente.

O arquivo `vercel.json` configura o fallback das rotas do React Router para `index.html`. Isso permite abrir diretamente URLs como `/national` e `/backup` após a publicação.

Alternativamente, pela CLI: `corepack pnpm dlx vercel` (preview) ou `corepack pnpm dlx vercel --prod` (produção).

## Backup e uso offline

A página **Backup & restore** exporta um JSON versionado e permite revisar, mesclar ou substituir a coleção. A importação valida espécies, formas e jogos contra o catálogo antes de alterar o IndexedDB.

O build de produção registra um service worker e inclui um Web App Manifest. Depois da primeira abertura, a aplicação pode ser instalada e reutiliza do cache os assets já carregados. Dados pessoais continuam no IndexedDB do dispositivo e não são enviados a um servidor.

## Estrutura

- `src/domain`: modelos estáveis e regras puras de projeção/progresso.
- `src/data`: catálogo Pokémon normalizado e `PokemonDataSource` substituível.
- `src/repositories`: contrato de persistência e implementação Dexie.
- `src/services`: casos de uso e validações, sem dependência de React.
- `src/hooks`: integração TanStack Query entre serviços e interface.
- `src/components` e `src/pages`: UI reutilizável e rotas.
- `src/styles.css`: tema e componentes visuais compostos com Tailwind CSS v4 (`@theme`, `@layer` e `@apply`).

O CI em `.github/workflows/ci.yml` executa instalação imutável, lint, typecheck, testes e build usando pnpm.

O catálogo inclui as 1.025 espécies da National Dex e formas representativas regionais/especiais. Os nomes são gerados de uma exportação PokéAPI e ficam versionados em `generatedSpecies.ts`; a aplicação nunca consulta PokéAPI ao abrir uma página.

As memberships de Game Dex são geradas pelos recursos Pokédex da PokéAPI (`pnpm data:generate:games`) e versionadas. Sword/Shield agrupa Galar + Isle of Armor + Crown Tundra e oferece uma checklist adicional dos 47 chefes lendários/Ultra Beasts de Dynamax Adventures; Scarlet/Violet agrupa Paldea + Kitakami + Blueberry; Legends Z-A combina Lumiose + Hyperspace/Mega Dimension. BDSP e FireRed/LeafGreen oferecem seletores distintos entre a Dex regional e sua National Dex desbloqueável.

Os dados da coleção ficam somente no IndexedDB do navegador. Não há autenticação, telemetria ou backend.

Veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para detalhes e caminhos de extensão.
