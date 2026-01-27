/**
 * Decorators for @riktajs/passport
 */

export {
  Authenticated,
  isAuthenticated,
  getAuthenticatedOptions,
  type AuthenticatedOptions,
} from './authenticated.decorator.js';

export {
  PassportStrategy,
  getStrategyRegistry,
  isPassportStrategy,
  getStrategyMetadata,
  getStrategyOptions,
  type PassportStrategyOptions,
} from './strategy.decorator.js';

export {
  CurrentUser,
  Req,
} from './current-user.decorator.js';
