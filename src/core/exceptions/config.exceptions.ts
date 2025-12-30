/**
 * Exception thrown when attempting to register a config provider with a token
 * that is already registered.
 */
export class ConfigProviderAlreadyRegisteredException extends Error {
  constructor(token: string, existingClass: string, newClass: string) {
    super(
      `Config provider with token "${token}" is already registered.\n` +
      `Existing: ${existingClass}\n` +
      `Attempted: ${newClass}\n` +
      `Use a different token or remove the duplicate registration.`
    );
    this.name = 'ConfigProviderAlreadyRegisteredException';
  }
}

/**
 * Exception thrown when attempting to retrieve a config provider that
 * has not been registered.
 */
export class ConfigProviderNotFoundException extends Error {
  constructor(token: string, availableTokens: string[] = []) {
    const suggestion = availableTokens.length > 0
      ? `\n\nAvailable tokens: ${availableTokens.join(', ')}`
      : '';
    
    super(
      `Config provider with token "${token}" not found.${suggestion}\n` +
      `Make sure the provider class is:\n` +
      `1. Decorated with @Provider('${token}')\n` +
      `2. Located in a file matching the autowired patterns\n` +
      `3. Properly exported from its module`
    );
    this.name = 'ConfigProviderNotFoundException';
  }
}

/**
 * Exception thrown when a config provider fails to instantiate.
 */
export class ConfigProviderInstantiationException extends Error {
  constructor(token: string, className: string, cause: Error) {
    super(
      `Failed to instantiate config provider "${className}" (token: "${token}").\n` +
      `Cause: ${cause.message}\n\n` +
      `Check that the provider:\n` +
      `1. Has a valid constructor\n` +
      `2. All constructor dependencies are registered\n` +
      `3. The provide() method is correctly implemented`
    );
    this.name = 'ConfigProviderInstantiationException';
    this.cause = cause;
  }
}
