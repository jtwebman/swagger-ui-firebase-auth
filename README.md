# swagger-ui-firebase-auth

Firebase authentication plugin for Swagger UI with automatic token refresh.

[![npm version](https://badge.fury.io/js/swagger-ui-firebase-auth.svg)](https://www.npmjs.com/package/swagger-ui-firebase-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Firebase Authentication integration with Swagger UI
- **Automatic token refresh** - tokens are refreshed 5 minutes before expiration
- **Multiple auth providers** - Email, Google, Apple, GitHub, Microsoft, Twitter, Facebook, Phone, Anonymous
- Seamless integration with `swagger-ui-express`
- TypeScript type definitions included
- Customizable FirebaseUI options

## Installation

```bash
npm install swagger-ui-firebase-auth
```

## Quick Start

```javascript
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { createSwaggerFirebaseAuth } = require('swagger-ui-firebase-auth');
const swaggerDocument = require('./swagger.json');

const app = express();

// Create Firebase auth configuration
const firebaseAuth = createSwaggerFirebaseAuth({
  apiKey: 'your-firebase-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
});

// Serve Swagger UI with Firebase auth
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', (req, res) => {
  const html = swaggerUi.generateHTML(
    swaggerDocument,
    {
      customJs: firebaseAuth.customJs,
      customCssUrl: firebaseAuth.customCssUrl,
    },
    {},
    null,
    null,
    null,
    null,
    null,
    firebaseAuth.initScript
  );
  res.send(html);
});

app.listen(3000);
```

## Configuration

### Firebase Config

Pass your Firebase configuration as the first argument:

```javascript
const firebaseAuth = createSwaggerFirebaseAuth({
  apiKey: 'AIza...',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',      // optional
  messagingSenderId: '123456789',                  // optional
  appId: '1:123456789:web:abc123',                // optional
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `authProviders` | `string[]` | `['email']` | Auth providers to enable |
| `refreshBeforeExpiryMs` | `number` | `300000` | Milliseconds before token expiry to trigger refresh (default: 5 min) |
| `signInFlow` | `'popup' \| 'redirect'` | `'popup'` | FirebaseUI sign-in flow |
| `securitySchemeName` | `string` | `'firebase'` | Security scheme name in OpenAPI spec |
| `tosUrl` | `string \| null` | `null` | Terms of Service URL |
| `privacyPolicyUrl` | `string \| null` | `null` | Privacy Policy URL |

### Auth Providers

Enable multiple authentication providers:

```javascript
const firebaseAuth = createSwaggerFirebaseAuth(firebaseConfig, {
  authProviders: ['email', 'google', 'apple', 'github'],
});
```

**Supported providers:**
- `email` - Email/password authentication
- `google` - Google Sign-In
- `apple` - Sign in with Apple
- `github` - GitHub authentication
- `microsoft` - Microsoft authentication
- `twitter` - Twitter authentication
- `facebook` - Facebook authentication
- `phone` - Phone number authentication
- `anonymous` - Anonymous authentication

### Custom Provider Configuration

For advanced provider configuration, pass an object:

```javascript
const firebaseAuth = createSwaggerFirebaseAuth(firebaseConfig, {
  authProviders: [
    {
      provider: 'password',
      requireDisplayName: true,
      disableSignUp: { status: true },
    },
    'google',
  ],
});
```

## How It Works

### Token Refresh

Firebase ID tokens expire after 1 hour. This plugin:

1. **Listens for token changes** using `onIdTokenChanged()` - fires on sign-in, sign-out, and when Firebase auto-refreshes tokens
2. **Schedules proactive refresh** - sets a timer to refresh 5 minutes before expiration
3. **Updates Swagger UI** - automatically updates the authorization header with the new token
4. **Handles expired sessions** - if refresh fails (e.g., user revoked), signs out automatically

### Security Scheme

The plugin injects tokens as a Bearer token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

Make sure your OpenAPI spec includes the security scheme:

```yaml
components:
  securitySchemes:
    firebase:
      type: apiKey
      in: header
      name: authorization
```

## API Reference

### `createSwaggerFirebaseAuth(firebaseConfig, options?)`

Creates the configuration object for swagger-ui-express.

**Returns:**
```typescript
{
  customJs: string[];      // Firebase SDK URLs
  customCssUrl: string;    // FirebaseUI CSS URL
  initScript: string;      // Generated plugin script
}
```

### `generatePluginScript(firebaseConfig, options?)`

Generates just the JavaScript plugin code (useful for custom setups).

### Constants

```javascript
const {
  FIREBASE_JS_URLS,    // Array of Firebase SDK CDN URLs
  FIREBASE_CSS_URL,    // FirebaseUI CSS URL
  DEFAULT_OPTIONS,     // Default plugin options
} = require('swagger-ui-firebase-auth');
```

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project or select an existing one
3. Go to **Authentication** > **Sign-in method**
4. Enable the providers you want to use
5. For OAuth providers (Google, Apple, etc.), configure the OAuth credentials
6. Go to **Project Settings** > **General** > **Your apps**
7. Add a web app and copy the Firebase config

## TypeScript

Type definitions are included:

```typescript
import {
  createSwaggerFirebaseAuth,
  FirebaseConfig,
  SwaggerFirebaseAuthOptions,
  SwaggerFirebaseAuthResult,
} from 'swagger-ui-firebase-auth';
```

## Browser Support

This plugin uses Firebase SDK v10 and FirebaseUI v6, which support:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT - see [LICENSE](LICENSE)

## Credits

Created by [JT Turner](https://github.com/jtwebman)
