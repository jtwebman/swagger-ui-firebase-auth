/**
 * Firebase configuration object
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

/**
 * Supported authentication providers
 */
export type AuthProvider =
  | 'email'
  | 'google'
  | 'apple'
  | 'github'
  | 'microsoft'
  | 'twitter'
  | 'facebook'
  | 'phone'
  | 'anonymous'
  | Record<string, unknown>; // Custom provider config

/**
 * Plugin options
 */
export interface SwaggerFirebaseAuthOptions {
  /**
   * Auth providers to enable
   * @default ['email']
   */
  authProviders?: AuthProvider[];

  /**
   * Milliseconds before token expiry to trigger refresh
   * @default 300000 (5 minutes)
   */
  refreshBeforeExpiryMs?: number;

  /**
   * FirebaseUI sign-in flow type
   * @default 'popup'
   */
  signInFlow?: 'popup' | 'redirect';

  /**
   * Security scheme name in Swagger/OpenAPI spec
   * @default 'firebase'
   */
  securitySchemeName?: string;

  /**
   * Terms of Service URL for FirebaseUI
   */
  tosUrl?: string | null;

  /**
   * Privacy Policy URL for FirebaseUI
   */
  privacyPolicyUrl?: string | null;
}

/**
 * Result object for swagger-ui-express integration
 */
export interface SwaggerFirebaseAuthResult {
  /**
   * Array of Firebase SDK JavaScript CDN URLs
   */
  customJs: string[];

  /**
   * FirebaseUI CSS CDN URL
   */
  customCssUrl: string;

  /**
   * Generated JavaScript plugin code to inject
   */
  initScript: string;
}

/**
 * Create Swagger UI Firebase Auth configuration
 *
 * @param firebaseConfig - Firebase configuration object
 * @param options - Plugin options
 * @returns Configuration object for swagger-ui-express
 *
 * @example
 * ```javascript
 * const { createSwaggerFirebaseAuth } = require('swagger-ui-firebase-auth');
 *
 * const firebaseAuth = createSwaggerFirebaseAuth({
 *   apiKey: 'your-api-key',
 *   authDomain: 'your-project.firebaseapp.com',
 *   projectId: 'your-project',
 * }, {
 *   authProviders: ['email', 'google'],
 * });
 *
 * app.get('/api-docs', (req, res) => {
 *   const html = swaggerUi.generateHTML(swaggerSpec, {
 *     customJs: firebaseAuth.customJs,
 *     customCssUrl: firebaseAuth.customCssUrl,
 *   }, {}, null, null, null, null, null, firebaseAuth.initScript);
 *   res.send(html);
 * });
 * ```
 */
export function createSwaggerFirebaseAuth(
  firebaseConfig: FirebaseConfig,
  options?: SwaggerFirebaseAuthOptions
): SwaggerFirebaseAuthResult;

/**
 * Generate the Swagger UI plugin script directly
 *
 * @param firebaseConfig - Firebase configuration object
 * @param options - Plugin options
 * @returns JavaScript code string
 */
export function generatePluginScript(
  firebaseConfig: FirebaseConfig,
  options?: SwaggerFirebaseAuthOptions
): string;

/**
 * Firebase SDK JavaScript CDN URLs
 */
export const FIREBASE_JS_URLS: string[];

/**
 * FirebaseUI CSS CDN URL
 */
export const FIREBASE_CSS_URL: string;

/**
 * Default plugin options
 */
export const DEFAULT_OPTIONS: Required<Omit<SwaggerFirebaseAuthOptions, 'tosUrl' | 'privacyPolicyUrl'>> & {
  tosUrl: null;
  privacyPolicyUrl: null;
};
