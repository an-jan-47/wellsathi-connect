# Supabase API Client

This module provides a secure Supabase client wrapper with HTTPS enforcement and SSL certificate validation.

## Features

- **HTTPS Enforcement**: Automatically enforces HTTPS protocol in production environments (Requirement 17.1, 17.2)
- **SSL Certificate Validation**: Validates secure connections before establishing them (Requirement 17.3)
- **Error Handling**: Provides user-friendly error messages for connection failures (Requirement 17.4)
- **Secure Session Storage**: Uses sessionStorage instead of localStorage for enhanced security (Requirement 19.1, 19.2)
- **PKCE Flow**: Implements Proof Key for Code Exchange for enhanced authentication security
- **TypeScript Support**: Full TypeScript type definitions from generated database types

## Usage

### Basic Usage

```typescript
import { supabase } from '@/integrations/supabase/client';

// Fetch data
const { data, error } = await supabase
  .from('clinics')
  .select('*');

if (error) {
  console.error('Error fetching clinics:', error);
}
```

### Error Handling

```typescript
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';

try {
  const { data, error } = await supabase
    .from('clinics')
    .select('*');
    
  if (error) {
    handleSupabaseError(error);
  }
  
  return data;
} catch (error) {
  // Error will be transformed into user-friendly message
  // for SSL/connection issues
  console.error(error);
  throw error;
}
```

## Security Features

### HTTPS Enforcement

In production mode, the client will reject any HTTP URLs and only accept HTTPS connections:

```typescript
// ✅ Valid in production
VITE_SUPABASE_URL=https://your-project.supabase.co

// ❌ Will throw error in production
VITE_SUPABASE_URL=http://your-project.supabase.co
```

### SSL Certificate Validation

The browser automatically validates SSL certificates for all HTTPS connections. Invalid or expired certificates will cause the connection to fail with a security error.

### Secure Session Storage

The client uses `sessionStorage` instead of `localStorage` for session management:

- **sessionStorage** is cleared when the browser tab is closed, reducing the risk of token theft
- Tokens are not persisted across browser sessions
- More secure than localStorage while maintaining Supabase SDK functionality

**Note**: For maximum security in production applications, consider implementing server-side session management with httpOnly cookies. The current implementation is a client-side compromise that balances security with Supabase SDK requirements.

### PKCE Flow

The client uses Proof Key for Code Exchange (PKCE) authentication flow, which provides enhanced security against authorization code interception attacks.

### Error Messages

Connection failures are transformed into user-friendly messages:

- SSL/Certificate errors: "Security Error: Unable to establish a secure connection..."
- Missing URL: "Supabase URL is not configured"
- Invalid URL format: "Invalid Supabase URL format..."

## Configuration

Set the following environment variables in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## Testing

The validation functions are exported for testing purposes:

```typescript
import { validateSupabaseUrl, validateSecureConnection } from '@/integrations/supabase/client';

// Test HTTPS enforcement
validateSupabaseUrl('https://example.supabase.co'); // ✅ Pass
validateSupabaseUrl('http://example.supabase.co');  // ❌ Fail in production

// Test secure connection
validateSecureConnection('https://example.supabase.co'); // ✅ Pass
validateSecureConnection('http://example.supabase.co');  // ❌ Fail
```

## Requirements Mapping

- **17.1**: HTTPS protocol enforced for all backend requests
- **17.2**: HTTP requests rejected in production environments
- **17.3**: SSL certificate validation (browser-native)
- **17.4**: User-friendly error messages for connection failures
- **19.1**: Uses sessionStorage instead of localStorage for session tokens
- **19.2**: Session tokens cleared when browser tab closes (sessionStorage behavior)
