// src/test/nlpSearchService.test.ts
import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageQuery } from '../lib/naturalLanguageSearchService';

describe('Natural Language Search Service (Zero-API Internal NLP)', () => {
  it('Scenario 1: "T-shirt coton bio homme, moins de 15 €, Europe"', () => {
    const parsed = parseNaturalLanguageQuery('T-shirt coton bio homme, moins de 15 €, Europe');
    
    expect(parsed.productType).toBe('tshirt');
    expect(parsed.materials).toContain('coton');
    expect(parsed.certifications).toContain('Bio');
    expect(parsed.gender).toBe('homme');
    expect(parsed.maxPrice).toBe(15);
    expect(parsed.currency).toBe('EUR');
    expect(parsed.regions).toContain('Europe');
    expect(parsed.intent).toBe('standard_search');
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('Scenario 2: "Café équitable colombien en grains 1kg maximum 30€"', () => {
    const parsed = parseNaturalLanguageQuery('Café équitable colombien en grains 1kg maximum 30€');
    
    expect(parsed.productType).toBe('coffee');
    expect(parsed.certifications).toContain('Commerce Équitable');
    expect(parsed.countries).toContain('Colombie');
    expect(parsed.maxPrice).toBe(30);
    expect(parsed.weightQuantity).toBe('1kg');
    expect(parsed.intent).toBe('standard_search');
  });

  it('Scenario 3: "Meilleur chocolat noir bio 70% sans gluten avec livraison rapide"', () => {
    const parsed = parseNaturalLanguageQuery('Meilleur chocolat noir bio 70% sans gluten avec livraison rapide');
    
    expect(parsed.productType).toBe('chocolate');
    expect(parsed.certifications).toContain('Bio');
    expect(parsed.minPercentage).toBe(70);
    expect(parsed.glutenFree).toBe(true);
    expect(parsed.fastDelivery).toBe(true);
  });

  it('Scenario 4: "Alternative moins chère au miel Manuka avec traçabilité complète"', () => {
    const parsed = parseNaturalLanguageQuery('Alternative moins chère au miel Manuka avec traçabilité complète');
    
    expect(parsed.intent).toBe('alternative_search');
    expect(parsed.referenceTarget).toMatch(/miel/i);
    expect(parsed.cheaperPriority).toBe(true);
    expect(parsed.fullTraceability).toBe(true);
  });

  it('Scenario 5: "Vêtements enfants bio fabriqués en France MOQ inférieur à 50"', () => {
    const parsed = parseNaturalLanguageQuery('Vêtements enfants bio fabriqués en France MOQ inférieur à 50');
    
    expect(parsed.gender).toBe('enfant');
    expect(parsed.certifications).toContain('Bio');
    expect(parsed.countries).toContain('France');
    expect(parsed.maxMoq).toBe(50);
  });
});
