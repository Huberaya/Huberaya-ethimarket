import { describe, it, expect } from 'vitest';
import {
  validateTemplateSyntax,
  KNOWN_TEMPLATE_VARIABLES
} from '../lib/certificationTemplatesService';

describe('validateTemplateSyntax() - Validation & Variable Extraction', () => {
  describe('Détection des variables', () => {
    it('détecte correctement une variable standard simple {variable}', () => {
      const res = validateTemplateSyntax('Bonjour {producer_name}');
      expect(res.valid).toBe(true);
      expect(res.detectedVariables).toEqual(['producer_name']);
      expect(res.invalidVariables).toEqual([]);
    });

    it('détecte les variables avec format double accolades {{variable}}', () => {
      const res = validateTemplateSyntax('Hello {{producer_name}}');
      expect(res.detectedVariables).toContain('producer_name');
    });

    it('détecte les variables avec espaces à l\'intérieur {{ producer_name }}', () => {
      const res = validateTemplateSyntax('Bonjour {{ producer_name }}');
      expect(res.detectedVariables).toContain('producer_name');
    });

    it('détecte de multiples variables différentes dans le texte', () => {
      const body = 'Bonjour {producer_name} ({body_name}), cert {certificate_number} émis le {issue_date} chez {certification_body_name}';
      const res = validateTemplateSyntax(body);
      expect(res.detectedVariables.length).toBe(5);
      expect(res.detectedVariables).toContain('producer_name');
      expect(res.detectedVariables).toContain('body_name');
      expect(res.detectedVariables).toContain('certificate_number');
      expect(res.detectedVariables).toContain('issue_date');
      expect(res.detectedVariables).toContain('certification_body_name');
    });

    it('détecte les variables présentes à la fois dans le subject ET le body', () => {
      const body = 'Bonjour {producer_name}';
      const subject = 'Demande {certificate_number}';
      const res = validateTemplateSyntax(body, subject);

      expect(res.detectedVariables).toContain('certificate_number');
      expect(res.detectedVariables).toContain('producer_name');
      expect(res.detectedVariables.length).toBe(2);
    });

    it('dédoublonne les variables répétées plusieurs fois', () => {
      const body = '{producer_name} et encore {producer_name} et {producer_name}';
      const res = validateTemplateSyntax(body);
      expect(res.detectedVariables).toEqual(['producer_name']);
      expect(res.detectedVariables.length).toBe(1);
    });

    it('retourne une liste vide et valid=true pour un texte sans aucune variable', () => {
      const res = validateTemplateSyntax('Corps de message simple sans tag.', 'Objet simple');
      expect(res.valid).toBe(true);
      expect(res.detectedVariables).toEqual([]);
      expect(res.invalidVariables).toEqual([]);
    });
  });

  describe('Variables invalides ou inconnues', () => {
    it('signale comme invalide une variable non répertoriée', () => {
      const res = validateTemplateSyntax('Bonjour {foo_bar_unknown_tag}');
      expect(res.valid).toBe(false);
      expect(res.invalidVariables).toEqual(['foo_bar_unknown_tag']);
      expect(res.detectedVariables).toEqual(['foo_bar_unknown_tag']);
    });

    it('isole précisément les variables invalides au sein d\'un texte mixte', () => {
      const res = validateTemplateSyntax(
        'Bonjour {producer_name}, voici votre faux {random_unknown_key}',
        'Sujet {certificate_number}'
      );
      expect(res.valid).toBe(false);
      expect(res.invalidVariables).toEqual(['random_unknown_key']);
      expect(res.detectedVariables.length).toBe(3);
    });

    it('valide sans erreur l\'ensemble des KNOWN_TEMPLATE_VARIABLES déclarées', () => {
      KNOWN_TEMPLATE_VARIABLES.forEach((varName) => {
        const res = validateTemplateSyntax(`Test {${varName}}`);
        expect(res.valid).toBe(true);
        expect(res.invalidVariables).toEqual([]);
        expect(res.detectedVariables).toContain(varName);
      });
    });
  });

  describe('Avertissements (warnings)', () => {
    it('émet un avertissement si producer_name est absent', () => {
      const res = validateTemplateSyntax('Certificat numéro {certificate_number}');
      expect(res.warnings.some((w) => w.includes('producer_name'))).toBe(true);
    });

    it('émet un avertissement si certificate_number est absent', () => {
      const res = validateTemplateSyntax('Bonjour {producer_name}');
      expect(res.warnings.some((w) => w.includes('certificate_number'))).toBe(true);
    });

    it('émet un avertissement listant les variables non reconnues', () => {
      const res = validateTemplateSyntax('{producer_name} {certificate_number} {bad_var_xyz}');
      expect(res.warnings.some((w) => w.includes('bad_var_xyz'))).toBe(true);
    });

    it('n\'émet aucun avertissement si toutes les variables recommandées sont présentes et valides', () => {
      const res = validateTemplateSyntax(
        'Bonjour {producer_name} ({body_name}), certificat {certificate_number}',
        'Certificat {certificate_number}'
      );
      expect(res.warnings).toEqual([]);
      expect(res.valid).toBe(true);
    });
  });
});
