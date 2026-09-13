/**
 * Unit Tests for Frontend App Constants & Helpers (Vitest)
 * Author: Aakarsh Sharma
 */

import { describe, it, expect } from 'vitest';
import { RoutePaths, DIFFICULTY_CONFIG, CATEGORY_META, CONFIDENCE_LEVELS } from '../utils/appConstants.js';
import { ApiUrls } from '../api/apiUrls.js';

describe('App Constants & Route Helpers', () => {
  it('generates correct dynamic route paths', () => {
    expect(RoutePaths.HOME).toBe('/');
    expect(RoutePaths.KITS).toBe('/kits');
    expect(RoutePaths.KIT_DETAIL('12345')).toBe('/kits/12345');
    expect(RoutePaths.KIT_PRACTICE('12345')).toBe('/kits/12345/practice');
  });

  it('generates correct API URLs', () => {
    expect(ApiUrls.AUTH_LOGIN).toBe('/api/auth/login');
    expect(ApiUrls.AUTH_REGISTER).toBe('/api/auth/register');
    expect(ApiUrls.KITS_GENERATE).toBe('/api/kits/generate');
    expect(ApiUrls.KIT_BY_ID('kit-99')).toBe('/api/kits/kit-99');
    expect(ApiUrls.KIT_REGENERATE_SECTION('kit-99')).toBe('/api/kits/kit-99/regenerate-section');
  });

  it('defines valid metadata for difficulties 1, 2, and 3', () => {
    expect(DIFFICULTY_CONFIG[1]).toBeDefined();
    expect(DIFFICULTY_CONFIG[2]).toBeDefined();
    expect(DIFFICULTY_CONFIG[3]).toBeDefined();
    expect(DIFFICULTY_CONFIG[1].label).toBe('Foundational');
    expect(DIFFICULTY_CONFIG[3].label).toBe('Hard / Architectural');
  });

  it('defines 4 spaced repetition confidence intervals', () => {
    const keys = Object.keys(CONFIDENCE_LEVELS);
    expect(keys).toHaveLength(4);
    expect(keys).toEqual(['AGAIN', 'HARD', 'GOOD', 'EASY']);
    expect(CONFIDENCE_LEVELS.AGAIN.value).toBe(1);
    expect(CONFIDENCE_LEVELS.EASY.value).toBe(4);
  });
});
