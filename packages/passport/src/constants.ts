/**
 * Constants for @riktajs/passport
 */

/**
 * Metadata key for storing strategy information
 */
export const PASSPORT_STRATEGY_METADATA = Symbol('passport:strategy');

/**
 * Metadata key for authenticated routes
 */
export const AUTHENTICATED_METADATA = Symbol('passport:authenticated');

/**
 * Metadata key for strategy options
 */
export const STRATEGY_OPTIONS_METADATA = Symbol('passport:strategy:options');

/**
 * Token for AuthenticatorService injection
 */
export const AUTHENTICATOR_SERVICE = Symbol('AuthenticatorService');

/**
 * Token for PassportOptions injection
 */
export const PASSPORT_OPTIONS = Symbol('PassportOptions');

/**
 * Token for strategy registry
 */
export const STRATEGY_REGISTRY = Symbol('StrategyRegistry');
