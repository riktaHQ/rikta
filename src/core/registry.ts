import { Constructor } from './types';
import { 
  ConfigProviderAlreadyRegisteredException,
} from './exceptions/config.exceptions';

/**
 * Config provider registration info
 */
interface ConfigProviderRegistration {
  token: string;
  providerClass: Constructor;
}

/**
 * Global Registry
 * 
 * Stores references to all decorated classes for auto-discovery.
 * Controllers and providers register themselves here via decorators.
 * 
 * The registry acts as a collection point during the decoration phase.
 * Once the application initializes, the registered classes are processed
 * and transferred to the DI container for resolution.
 */
class Registry {
  private static instance: Registry;
  
  /** All registered controllers */
  private controllers = new Set<Constructor>();
  
  /** All registered providers (services via @Injectable) */
  private providers = new Set<Constructor>();
  
  /** All registered custom providers (via @Provider) */
  private customProviders = new Set<Constructor>();

  /** Map of config provider tokens to their class constructors */
  private configProviderMap = new Map<string, Constructor>();

  private constructor() {}

  static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  /**
   * Reset the registry (useful for testing)
   */
  static reset(): void {
    const newInstance = new Registry();
    Registry.instance = newInstance;
  }

  /**
   * Register a controller
   */
  registerController(target: Constructor): void {
    this.controllers.add(target);
  }

  /**
   * Register a provider
   */
  registerProvider(target: Constructor): void {
    this.providers.add(target);
  }

  /**
   * Get all registered controllers
   */
  getControllers(): Constructor[] {
    return [...this.controllers];
  }

  /**
   * Get all registered providers
   */
  getProviders(): Constructor[] {
    return [...this.providers];
  }

  /**
   * Check if a controller is registered
   */
  hasController(target: Constructor): boolean {
    return this.controllers.has(target);
  }

  /**
   * Check if a provider is registered
   */
  hasProvider(target: Constructor): boolean {
    return this.providers.has(target);
  }

  /**
   * Register a custom provider (@Provider)
   */
  registerCustomProvider(target: Constructor): void {
    this.customProviders.add(target);
  }

  /**
   * Get all registered custom providers
   */
  getCustomProviders(): Constructor[] {
    return [...this.customProviders];
  }

  /**
   * Check if a custom provider is registered
   */
  hasCustomProvider(target: Constructor): boolean {
    return this.customProviders.has(target);
  }

  // ============================================================================
  // Config Provider Methods
  // ============================================================================

  /**
   * Register a config provider with its injection token
   * 
   * @param token - The injection token (e.g., 'APP_CONFIG')
   * @param providerClass - The config provider class constructor
   * @throws {ConfigProviderAlreadyRegisteredException} If the token is already registered
   * 
   * @example
   * ```typescript
   * registry.registerConfigProvider('APP_CONFIG', AppConfigProvider);
   * ```
   */
  registerConfigProvider(token: string, providerClass: Constructor): void {
    if (this.configProviderMap.has(token)) {
      const existingClass = this.configProviderMap.get(token)!;
      throw new ConfigProviderAlreadyRegisteredException(
        token,
        existingClass.name,
        providerClass.name
      );
    }
    
    this.configProviderMap.set(token, providerClass);
  }

  /**
   * Get all registered config provider classes with their tokens
   * 
   * @returns Array of registration info objects
   * 
   * @internal Used by auto-discovery mechanism
   */
  getConfigProviderRegistrations(): ConfigProviderRegistration[] {
    return Array.from(this.configProviderMap.entries()).map(([token, providerClass]) => ({
      token,
      providerClass,
    }));
  }

  /**
   * Clear all config provider registrations (useful for testing)
   * 
   * This will remove all registered config providers
   * 
   * @internal
   */
  clearConfigProviders(): void {
    this.configProviderMap.clear();
  }
}

/**
 * Global registry instance
 */
export const registry = Registry.getInstance();
export { Registry };

