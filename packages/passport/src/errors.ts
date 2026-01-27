/**
 * Custom Passport Errors
 */

/**
 * Error thrown when passport plugin setup fails
 */
export class PassportSetupError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'PassportSetupError';
    Error.captureStackTrace(this, PassportSetupError);
  }
}

/**
 * Error thrown when passport secret is missing or invalid
 */
export class MissingPassportSecretError extends PassportSetupError {
  constructor() {
    super(
      'Passport secret is required and must be at least 32 characters. ' +
      'Please provide a valid secret in PassportOptions.'
    );
    this.name = 'MissingPassportSecretError';
  }
}

/**
 * Error thrown when passport is not initialized
 */
export class PassportNotInitializedError extends Error {
  constructor() {
    super(
      'Passport is not initialized. ' +
      'Please register the passportPlugin before using authentication features.'
    );
    this.name = 'PassportNotInitializedError';
  }
}

/**
 * Error thrown when strategy registration fails
 */
export class StrategyRegistrationError extends PassportSetupError {
  constructor(strategyName: string, cause?: Error) {
    super(`Failed to register strategy "${strategyName}"`, cause);
    this.name = 'StrategyRegistrationError';
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when user is not authenticated
 */
export class UnauthorizedError extends Error {
  public readonly statusCode = 401;
  
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
