/**
 * Passport Options Interface
 * 
 * Configuration options for the @riktajs/passport plugin.
 */

/**
 * Secure session cookie options
 */
export interface SecureSessionCookieOptions {
  /**
   * Cookie path
   * @default '/'
   */
  path?: string;
  
  /**
   * HTTP only flag - prevents JavaScript access
   * @default true
   */
  httpOnly?: boolean;
  
  /**
   * Secure flag - only send over HTTPS
   * @default false
   */
  secure?: boolean;
  
  /**
   * SameSite attribute
   * @default 'lax'
   */
  sameSite?: 'strict' | 'lax' | 'none';
  
  /**
   * Max age in seconds
   */
  maxAge?: number;
  
  /**
   * Domain for the cookie
   */
  domain?: string;
}

/**
 * Configuration options for the Passport plugin
 */
export interface PassportOptions {
  /**
   * Secret key for session encryption.
   * Must be at least 32 characters for secure-session.
   */
  secret: string;
  
  /**
   * Salt for key derivation (optional).
   * Must be exactly 16 bytes if provided.
   */
  salt?: string;
  
  /**
   * Cookie configuration options
   */
  cookie?: SecureSessionCookieOptions;
  
  /**
   * Cookie name for the session
   * @default 'session'
   */
  cookieName?: string;
  
  /**
   * Whether to use sessions (default true)
   * Set to false for stateless JWT-based auth
   * @default true
   */
  session?: boolean;
  
  /**
   * Key for storing user info in session
   * @default 'passport'
   */
  sessionKey?: string;
}

/**
 * Default passport options
 */
export const DEFAULT_PASSPORT_OPTIONS: Partial<PassportOptions> = {
  cookieName: 'session',
  session: true,
  sessionKey: 'passport',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  },
};
