/**
 * Passport Plugin for Fastify
 * 
 * Integrates @fastify/passport and @fastify/secure-session with Rikta.
 * 
 * @packageDocumentation
 */

import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import type { Authenticator } from '@fastify/passport';
import fastifySecureSession from '@fastify/secure-session';
import fastifyPassportPkg from '@fastify/passport';
import fp from 'fastify-plugin';
import type { PassportOptions, BaseUser } from './interfaces/index.js';
import { DEFAULT_PASSPORT_OPTIONS } from './interfaces/passport-options.interface.js';
import { MissingPassportSecretError, PassportSetupError } from './errors.js';

// Handle CJS/ESM interop - cast through unknown to Authenticator
const fastifyPassport = fastifyPassportPkg as unknown as Authenticator;

/**
 * Validate passport options
 */
function validateOptions(options: PassportOptions): void {
  if (!options.secret || options.secret.length < 32) {
    throw new MissingPassportSecretError();
  }
  
  if (options.salt && options.salt.length !== 16) {
    throw new PassportSetupError(
      'Salt must be exactly 16 bytes if provided'
    );
  }
}

/**
 * Passport plugin callback
 */
const passportPluginCallback: FastifyPluginCallback<PassportOptions> = async (
  fastify: FastifyInstance,
  options: PassportOptions,
) => {
  // Merge with defaults
  const opts: PassportOptions = {
    ...DEFAULT_PASSPORT_OPTIONS,
    ...options,
    cookie: {
      ...DEFAULT_PASSPORT_OPTIONS.cookie,
      ...options.cookie,
    },
  };
  
  // Validate options
  validateOptions(opts);
  
  try {
    // Register secure session for cookie-based sessions
    if (opts.session !== false) {
      await fastify.register(fastifySecureSession, {
        key: Buffer.from(opts.secret.padEnd(32, '0').slice(0, 32)),
        cookie: {
          path: opts.cookie?.path ?? '/',
          httpOnly: opts.cookie?.httpOnly ?? true,
          secure: opts.cookie?.secure ?? false,
          sameSite: opts.cookie?.sameSite ?? 'lax',
          maxAge: opts.cookie?.maxAge,
          domain: opts.cookie?.domain,
        },
        cookieName: opts.cookieName ?? 'session',
      });
    }
    
    // Register passport
    await fastify.register(fastifyPassport.initialize());
    
    if (opts.session !== false) {
      await fastify.register(fastifyPassport.secureSession());
    }
    
    // Default serialization
    fastifyPassport.registerUserSerializer(
      async (user: BaseUser) => user
    );
    
    fastifyPassport.registerUserDeserializer(
      async (user: BaseUser) => user
    );
    
    // Store passport instance and options on fastify for later access
    fastify.decorate('passportOptions', opts);
    fastify.decorate('passport', fastifyPassport);
    
  } catch (error) {
    if (error instanceof PassportSetupError) {
      throw error;
    }
    throw new PassportSetupError(
      'Failed to initialize passport plugin',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * Passport plugin for Fastify with Rikta integration.
 * 
 * Provides session management via @fastify/secure-session and
 * authentication via @fastify/passport.
 * 
 * @example
 * ```typescript
 * import { passportPlugin } from '@riktajs/passport';
 * 
 * await app.server.register(passportPlugin, {
 *   secret: 'your-32-character-secret-key-here',
 *   cookie: {
 *     httpOnly: true,
 *     secure: process.env.NODE_ENV === 'production',
 *   },
 * });
 * ```
 */
export const passportPlugin = fp(passportPluginCallback, {
  name: '@riktajs/passport',
  fastify: '5.x',
});

/**
 * Helper function to register passport with typed options
 * 
 * Use this helper when you have type mismatches with app.server.register.
 * This handles the internal type casting.
 * 
 * @example
 * ```typescript
 * import { registerPassport } from '@riktajs/passport';
 * 
 * await registerPassport(app.server, {
 *   secret: 'your-secret-key-min-32-chars',
 * });
 * ```
 */
export async function registerPassport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fastify: any,
  options: PassportOptions,
): Promise<void> {
  await fastify.register(passportPlugin, options);
}

// Re-export fastify-passport for direct access
export type { Authenticator } from '@fastify/passport';
