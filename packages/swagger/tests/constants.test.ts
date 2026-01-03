import { describe, it, expect } from 'vitest';
import {
  API_TAGS_METADATA,
  API_OPERATION_METADATA,
  API_RESPONSE_METADATA,
  API_PROPERTY_METADATA,
  API_BODY_METADATA,
  API_PARAM_METADATA,
  API_QUERY_METADATA,
  API_HEADER_METADATA,
  API_SECURITY_METADATA,
  API_EXCLUDE_METADATA,
  API_DEPRECATED_METADATA,
} from '../src/constants.js';

describe('Swagger Constants', () => {
  describe('Swagger metadata symbols', () => {
    it('should export unique symbols for each metadata key', () => {
      const symbols = [
        API_TAGS_METADATA,
        API_OPERATION_METADATA,
        API_RESPONSE_METADATA,
        API_PROPERTY_METADATA,
        API_BODY_METADATA,
        API_PARAM_METADATA,
        API_QUERY_METADATA,
        API_HEADER_METADATA,
        API_SECURITY_METADATA,
        API_EXCLUDE_METADATA,
        API_DEPRECATED_METADATA,
      ];

      // All symbols should be unique
      const uniqueSymbols = new Set(symbols);
      expect(uniqueSymbols.size).toBe(symbols.length);
    });

    it('should have correct symbol descriptions', () => {
      expect(API_TAGS_METADATA.description).toBe('rikta:swagger:apiTags');
      expect(API_OPERATION_METADATA.description).toBe('rikta:swagger:apiOperation');
      expect(API_RESPONSE_METADATA.description).toBe('rikta:swagger:apiResponse');
      expect(API_PROPERTY_METADATA.description).toBe('rikta:swagger:apiProperty');
      expect(API_BODY_METADATA.description).toBe('rikta:swagger:apiBody');
      expect(API_PARAM_METADATA.description).toBe('rikta:swagger:apiParam');
      expect(API_QUERY_METADATA.description).toBe('rikta:swagger:apiQuery');
      expect(API_HEADER_METADATA.description).toBe('rikta:swagger:apiHeader');
      expect(API_SECURITY_METADATA.description).toBe('rikta:swagger:apiSecurity');
      expect(API_EXCLUDE_METADATA.description).toBe('rikta:swagger:apiExclude');
      expect(API_DEPRECATED_METADATA.description).toBe('rikta:swagger:apiDeprecated');
    });

    it('should be typeof symbol', () => {
      expect(typeof API_TAGS_METADATA).toBe('symbol');
      expect(typeof API_OPERATION_METADATA).toBe('symbol');
      expect(typeof API_RESPONSE_METADATA).toBe('symbol');
    });
  });
});
