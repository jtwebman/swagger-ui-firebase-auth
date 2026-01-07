'use strict';

/**
 * Firebase authentication plugin for Swagger UI
 * Supports multiple auth providers and automatic token refresh
 */

// Firebase SDK CDN URLs
const FIREBASE_SDK_VERSION = '12.7.0';
const FIREBASE_UI_VERSION = '6.1.0';

const FIREBASE_JS_URLS = [
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-compat.js`,
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth-compat.js`,
  `https://www.gstatic.com/firebasejs/ui/${FIREBASE_UI_VERSION}/firebase-ui-auth.js`,
];

const FIREBASE_CSS_URL = `https://www.gstatic.com/firebasejs/ui/${FIREBASE_UI_VERSION}/firebase-ui-auth.css`;

/**
 * Default options
 */
const DEFAULT_OPTIONS = {
  // Auth providers to enable (default: email only)
  authProviders: ['email'],
  // Refresh token 5 minutes before expiry
  refreshBeforeExpiryMs: 5 * 60 * 1000,
  // FirebaseUI sign-in flow
  signInFlow: 'popup',
  // Security scheme name in Swagger
  securitySchemeName: 'firebase',
  // Optional Terms of Service URL
  tosUrl: null,
  // Optional Privacy Policy URL
  privacyPolicyUrl: null,
};

/**
 * Build FirebaseUI sign-in options based on enabled providers
 */
function buildSignInOptions(providers) {
  const signInOptions = [];

  for (const provider of providers) {
    if (typeof provider === 'object') {
      // Custom provider config passed directly
      signInOptions.push(provider);
      continue;
    }

    switch (provider) {
      case 'email':
        signInOptions.push({
          provider: 'firebase.auth.EmailAuthProvider.PROVIDER_ID',
          requireDisplayName: false,
        });
        break;
      case 'google':
        signInOptions.push({
          provider: 'firebase.auth.GoogleAuthProvider.PROVIDER_ID',
          customParameters: { prompt: 'select_account' },
        });
        break;
      case 'apple':
        signInOptions.push('firebase.auth.OAuthProvider.PROVIDER_ID_APPLE');
        break;
      case 'github':
        signInOptions.push('firebase.auth.GithubAuthProvider.PROVIDER_ID');
        break;
      case 'microsoft':
        signInOptions.push('firebase.auth.OAuthProvider.PROVIDER_ID_MICROSOFT');
        break;
      case 'twitter':
        signInOptions.push('firebase.auth.TwitterAuthProvider.PROVIDER_ID');
        break;
      case 'facebook':
        signInOptions.push('firebase.auth.FacebookAuthProvider.PROVIDER_ID');
        break;
      case 'phone':
        signInOptions.push({
          provider: 'firebase.auth.PhoneAuthProvider.PROVIDER_ID',
          defaultCountry: 'US',
        });
        break;
      case 'anonymous':
        signInOptions.push('firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID');
        break;
      default:
        console.warn(`Unknown auth provider: ${provider}`);
    }
  }

  return signInOptions;
}

/**
 * Generate the sign-in options JavaScript code
 */
function generateSignInOptionsCode(providers) {
  const options = [];

  for (const provider of providers) {
    if (typeof provider === 'object') {
      // Custom provider config - serialize it
      options.push(JSON.stringify(provider));
      continue;
    }

    switch (provider) {
      case 'email':
        options.push(`{
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: false,
          }`);
        break;
      case 'google':
        options.push(`{
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            customParameters: { prompt: 'select_account' },
          }`);
        break;
      case 'apple':
        options.push(`{
            provider: 'apple.com',
            providerName: 'Apple',
          }`);
        break;
      case 'github':
        options.push('firebase.auth.GithubAuthProvider.PROVIDER_ID');
        break;
      case 'microsoft':
        options.push(`{
            provider: 'microsoft.com',
            providerName: 'Microsoft',
          }`);
        break;
      case 'twitter':
        options.push('firebase.auth.TwitterAuthProvider.PROVIDER_ID');
        break;
      case 'facebook':
        options.push('firebase.auth.FacebookAuthProvider.PROVIDER_ID');
        break;
      case 'phone':
        options.push(`{
            provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
            defaultCountry: 'US',
          }`);
        break;
      case 'anonymous':
        options.push('firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID');
        break;
    }
  }

  return options.join(',\n                  ');
}

/**
 * Generate the Swagger UI plugin script
 *
 * @param {Object} firebaseConfig - Firebase configuration object
 * @param {Object} options - Plugin options
 * @returns {string} JavaScript code to inject into Swagger UI
 */
function generatePluginScript(firebaseConfig, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const signInOptionsCode = generateSignInOptionsCode(opts.authProviders);
  const firebaseConfigJson = JSON.stringify(firebaseConfig);

  // Build FirebaseUI config
  let firebaseUiConfig = `{
                signInFlow: '${opts.signInFlow}',
                signInOptions: [
                  ${signInOptionsCode}
                ],
                callbacks: {
                  signInSuccessWithAuthResult: () => {
                    close();
                    return false;
                  },
                },`;

  if (opts.tosUrl) {
    firebaseUiConfig += `\n                tosUrl: '${opts.tosUrl}',`;
  }
  if (opts.privacyPolicyUrl) {
    firebaseUiConfig += `\n                privacyPolicyUrl: '${opts.privacyPolicyUrl}',`;
  }

  firebaseUiConfig += '\n              }';

  return `
/**
 * Swagger UI Firebase Authentication Plugin
 * Generated by swagger-ui-firebase-auth
 *
 * Features:
 * - Firebase authentication via FirebaseUI
 * - Automatic token refresh before expiration
 * - Multiple auth provider support
 */

window.onload = function() {
  firebase.initializeApp(${firebaseConfigJson});
  const auth = firebase.auth();
  const ui = new firebaseui.auth.AuthUI(firebase.auth());

  // Token refresh timer reference
  let refreshTimerId = null;

  // Parse JWT to extract payload (for reading exp claim)
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('[swagger-ui-firebase-auth] Failed to parse JWT:', e);
      return null;
    }
  }

  // Update Swagger UI authorization header with new token
  function updateSwaggerAuth(authActions, token) {
    authActions.logoutWithPersistOption(['${opts.securitySchemeName}']);
    authActions.authorizeWithPersistOption({
      ${opts.securitySchemeName}: {
        name: '${opts.securitySchemeName}',
        schema: {
          type: 'apiKey',
          in: 'header',
          name: 'authorization',
        },
        value: 'Bearer ' + token,
      },
    });
  }

  // Setup proactive token refresh timer
  function setupRefreshTimer(user, authActions) {
    if (refreshTimerId) {
      clearTimeout(refreshTimerId);
      refreshTimerId = null;
    }

    user.getIdToken().then((token) => {
      const decoded = parseJwt(token);
      if (!decoded || !decoded.exp) {
        console.warn('[swagger-ui-firebase-auth] Could not parse JWT expiration');
        return;
      }

      const expiresAt = decoded.exp * 1000;
      const refreshAt = expiresAt - ${opts.refreshBeforeExpiryMs};
      const now = Date.now();
      const delay = refreshAt - now;

      if (delay > 0) {
        console.log('[swagger-ui-firebase-auth] Token refresh scheduled in ' + Math.round(delay / 1000 / 60) + ' minutes');
        refreshTimerId = setTimeout(async () => {
          try {
            const newToken = await user.getIdToken(true);
            console.log('[swagger-ui-firebase-auth] Token refreshed successfully');
            updateSwaggerAuth(authActions, newToken);
            setupRefreshTimer(user, authActions);
          } catch (e) {
            console.error('[swagger-ui-firebase-auth] Token refresh failed:', e);
            if (e.code === 'auth/user-token-expired' || e.code === 'auth/invalid-user-token') {
              console.log('[swagger-ui-firebase-auth] Session expired, signing out');
              firebase.auth().signOut();
            }
          }
        }, delay);
      } else {
        console.log('[swagger-ui-firebase-auth] Token expired or expiring soon, refreshing immediately');
        user.getIdToken(true).then((newToken) => {
          updateSwaggerAuth(authActions, newToken);
          setupRefreshTimer(user, authActions);
        }).catch((e) => {
          console.error('[swagger-ui-firebase-auth] Immediate token refresh failed:', e);
          firebase.auth().signOut();
        });
      }
    }).catch((e) => {
      console.error('[swagger-ui-firebase-auth] Failed to get token for refresh scheduling:', e);
    });
  }

  function clearRefreshTimer() {
    if (refreshTimerId) {
      clearTimeout(refreshTimerId);
      refreshTimerId = null;
      console.log('[swagger-ui-firebase-auth] Token refresh timer cleared');
    }
  }

  const WrappedAuthComponentPlugin = function (system) {
    return {
      wrapComponents: {
        AuthorizeBtnContainer: (_Original, system) => (props) => {
          const {
            authActions,
            authSelectors,
            specSelectors,
            getComponent,
            isAuthorized,
          } = props;

          const securityDefinitions = specSelectors.securityDefinitions();
          const authorizableDefinitions = authSelectors.definitionsToAuthorize();

          system.React.useEffect(() => {
            const unsubscribe = auth.onIdTokenChanged((user) => {
              if (user) {
                user.getIdToken().then((idToken) => {
                  console.log('[swagger-ui-firebase-auth] Token updated via onIdTokenChanged');
                  updateSwaggerAuth(authActions, idToken);
                  setupRefreshTimer(user, authActions);
                });
              } else {
                clearRefreshTimer();
                authActions.logoutWithPersistOption(['${opts.securitySchemeName}']);
              }
            });

            return () => {
              unsubscribe();
              clearRefreshTimer();
            };
          }, []);

          const AuthorizeBtn = getComponent('authorizeBtn', true);
          if (securityDefinitions) {
            return system.React.createElement(AuthorizeBtn, {
              onClick: () => authActions.showDefinitions(authorizableDefinitions),
              isAuthorized: !!authSelectors.authorized().size,
              showPopup: !!authSelectors.shownDefinitions(),
              getComponent,
            });
          }
          return null;
        },
      },
    };
  };

  const WrappedAuthorizationPopupPlugin = function (system) {
    return {
      wrapComponents: {
        authorizationPopup: (_Original, system) => (props) => {
          const React = system.React;
          let { authActions, authSelectors, getComponent } = props;

          function logout() {
            clearRefreshTimer();
            firebase.auth().signOut();
            authActions.logoutWithPersistOption(['${opts.securitySchemeName}']);
            close();
          }
          const CloseIcon = getComponent('CloseIcon');
          function close() {
            authActions.showDefinitions(false);
          }
          let title = 'Firebase Login';
          if (firebase.auth().currentUser) {
            title = 'Firebase Logout';
          }
          React.useEffect(() => {
            if (!ui.isPendingRedirect() && !firebase.auth().currentUser) {
              ui.start('#firebaseui-auth-container', ${firebaseUiConfig});
            }
          }, []);

          return React.createElement(
            'div',
            { className: 'dialog-ux' },
            React.createElement('div', { className: 'backdrop-ux' }),
            React.createElement(
              'div',
              { className: 'modal-ux' },
              React.createElement(
                'div',
                { className: 'modal-dialog-ux' },
                React.createElement(
                  'div',
                  { className: 'modal-ux-inner' },
                  React.createElement(
                    'div',
                    { className: 'modal-ux-header' },
                    React.createElement('h3', null, title),
                    React.createElement(
                      'button',
                      {
                        type: 'button',
                        className: 'close-modal',
                        onClick: close,
                      },
                      React.createElement(CloseIcon, null)
                    )
                  ),
                  !firebase.auth().currentUser
                    ? React.createElement(
                        'div',
                        { className: 'modal-ux-content' },
                        React.createElement('div', {
                          id: 'firebaseui-auth-container',
                        })
                      )
                    : React.createElement(
                        'button',
                        {
                          type: 'button',
                          className: 'close-modal',
                          onClick: logout,
                        },
                        'Logout'
                      )
                )
              )
            )
          );
        },
      },
    };
  };

  // Build Swagger UI
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  <% swaggerOptions %>
  url = options.swaggerUrl || url;
  var urls = options.swaggerUrls;
  var customOptions = options.customOptions;
  var spec1 = options.swaggerDoc;
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    displayRequestDuration: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl,
      WrappedAuthComponentPlugin,
      WrappedAuthorizationPopupPlugin
    ],
    layout: "StandaloneLayout"
  };
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var swaggerUi = SwaggerUIBundle(swaggerOptions);

  if (customOptions.oauth) {
    swaggerUi.initOAuth(customOptions.oauth);
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = swaggerUi.preauthorizeApiKey(key, value);
        if (!!authorized) clearInterval(pid);
      }, 500);
    }
  }

  if (customOptions.authAction) {
    swaggerUi.authActions.authorize(customOptions.authAction);
  }

  window.ui = swaggerUi;
};
`;
}

/**
 * Create Swagger UI Firebase Auth configuration
 *
 * @param {Object} firebaseConfig - Firebase configuration object
 * @param {Object} options - Plugin options
 * @returns {Object} Configuration object for swagger-ui-express
 */
function createSwaggerFirebaseAuth(firebaseConfig, options = {}) {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error('Firebase config with apiKey is required');
  }

  const script = generatePluginScript(firebaseConfig, options);

  return {
    customJs: FIREBASE_JS_URLS,
    customCssUrl: FIREBASE_CSS_URL,
    initScript: script,
  };
}

// Export everything
module.exports = {
  createSwaggerFirebaseAuth,
  generatePluginScript,
  FIREBASE_JS_URLS,
  FIREBASE_CSS_URL,
  DEFAULT_OPTIONS,
};
