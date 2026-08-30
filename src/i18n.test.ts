import { describe, expect, it } from 'vitest';
import { en, ptBR, translate } from './i18n';

describe('translations', () => {
  it('keeps locale dictionaries in sync', () => {
    expect(Object.keys(ptBR).sort()).toEqual(Object.keys(en).sort());
  });

  it('preserves established product terms in Portuguese', () => {
    expect(ptBR.shinyMode).toBe('Shiny');
    expect(ptBR.alpha).toBe('Alpha');
    expect(ptBR.allOt).toContain('OT');
    expect(ptBR.search).toContain('Pokémon');
    expect(ptBR.nationalLivingDex).toContain('Living Dex');
    expect(ptBR.searchDescription).toContain('box');
  });

  it('translates the fixed interface copy found by the audit', () => {
    expect(translate('pt-BR', 'backToTop')).toBe('Voltar ao topo');
    expect(translate('pt-BR', 'collectionView')).toBe('Visualização da coleção');
    expect(translate('pt-BR', 'regionalCollection')).toBe('HABITATS ALTERNATIVOS');
    expect(translate('pt-BR', 'quickStart')).toBe('INÍCIO RÁPIDO');
    expect(translate('pt-BR', 'variantRotomDescription')).toBe('Todas as formas de eletrodomésticos');
  });
});
