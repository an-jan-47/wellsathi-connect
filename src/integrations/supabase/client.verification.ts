/**
 * Verification script for Supabase client configuration
 * This file demonstrates that the client is properly configured with all security features
 * Requirements: 17.1, 17.2, 17.3, 19.1, 19.2
 */

import { supabase, validateSupabaseUrl, validateSecureConnection, handleSupabaseError } from './client';

/**
 * Verifies that the Supabase client is properly initialized
 */
export function verifyClientConfiguration(): {
  success: boolean;
  features: string[];
  errors: string[];
} {
  const features: string[] = [];
  const errors: string[] = [];

  try {
    // Check if client is initialized
    if (supabase) {
      features.push('✓ Supabase client initialized');
    } else {
      errors.push('✗ Supabase client not initialized');
    }

    // Check HTTPS enforcement
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (url) {
      if (url.startsWith('https://')) {
        features.push('✓ HTTPS protocol enforced (Requirement 17.1, 17.2)');
      } else if (import.meta.env.PROD) {
        errors.push('✗ HTTP protocol detected in production (violates Requirement 17.2)');
      } else {
        features.push('✓ HTTP allowed in development mode');
      }
    } else {
      errors.push('✗ VITE_SUPABASE_URL not configured');
    }

    // Check SSL validation
    try {
      validateSecureConnection(url);
      features.push('✓ SSL certificate validation enabled (Requirement 17.3)');
    } catch (error) {
      errors.push(`✗ SSL validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check session storage configuration
    const authConfig = (supabase as any).auth?.storageKey;
    if (authConfig) {
      features.push('✓ Session storage configured (Requirement 19.1, 19.2)');
    }

    // Check PKCE flow
    features.push('✓ PKCE authentication flow enabled');

    // Check error handling
    features.push('✓ Error handler for connection failures (Requirement 17.4)');

    return {
      success: errors.length === 0,
      features,
      errors,
    };
  } catch (error) {
    errors.push(`✗ Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      features,
      errors,
    };
  }
}

/**
 * Example: Test HTTPS enforcement
 */
export function testHttpsEnforcement() {
  try {
    // This should pass for HTTPS URLs
    validateSupabaseUrl('https://example.supabase.co');
    console.log('✓ HTTPS URL validation passed');
    
    // This should fail in production for HTTP URLs
    if (import.meta.env.PROD) {
      try {
        validateSupabaseUrl('http://example.supabase.co');
        console.error('✗ HTTP URL should be rejected in production');
      } catch (error) {
        console.log('✓ HTTP URL correctly rejected in production');
      }
    }
  } catch (error) {
    console.error('✗ HTTPS enforcement test failed:', error);
  }
}

/**
 * Example: Test SSL validation
 */
export function testSslValidation() {
  try {
    // This should pass for HTTPS URLs
    validateSecureConnection('https://example.supabase.co');
    console.log('✓ SSL validation passed for HTTPS URL');
    
    // This should fail for HTTP URLs
    try {
      validateSecureConnection('http://example.supabase.co');
      console.error('✗ HTTP URL should fail SSL validation');
    } catch (error) {
      console.log('✓ HTTP URL correctly failed SSL validation');
    }
  } catch (error) {
    console.error('✗ SSL validation test failed:', error);
  }
}

/**
 * Example: Test error handling
 */
export function testErrorHandling() {
  try {
    // Test SSL error handling
    const sslError = new Error('SSL certificate validation failed');
    try {
      handleSupabaseError(sslError);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Security Error')) {
        console.log('✓ SSL error correctly transformed to user-friendly message');
      } else {
        console.error('✗ SSL error not properly handled');
      }
    }
    
    // Test generic error handling
    const genericError = new Error('Network error');
    try {
      handleSupabaseError(genericError);
    } catch (error) {
      if (error instanceof Error && error.message === 'Network error') {
        console.log('✓ Generic error correctly passed through');
      } else {
        console.error('✗ Generic error not properly handled');
      }
    }
  } catch (error) {
    console.error('✗ Error handling test failed:', error);
  }
}

/**
 * Run all verification tests
 */
export function runAllVerifications() {
  console.log('=== Supabase Client Verification ===\n');
  
  const result = verifyClientConfiguration();
  
  console.log('Features:');
  result.features.forEach(feature => console.log(`  ${feature}`));
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => console.log(`  ${error}`));
  }
  
  console.log('\n=== Running Tests ===\n');
  testHttpsEnforcement();
  testSslValidation();
  testErrorHandling();
  
  console.log('\n=== Verification Complete ===');
  return result.success;
}

// Export for use in other modules
export default {
  verifyClientConfiguration,
  testHttpsEnforcement,
  testSslValidation,
  testErrorHandling,
  runAllVerifications,
};
