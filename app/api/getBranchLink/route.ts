import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Configuration
const PROJECT_NUMBER = '415525525584';
const PROJECT_ID = 'plot1-1-3';
const POOL_ID = 'vercel-pool';
const PROVIDER_ID = 'vercel-provider';

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface BranchLinkRequest {
  mode: string;
  oobCode: string;
  email: string;
  token?: string;
  uid?: string;
  username?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Rate limiting
function checkRateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  
  const current = rateLimitStore.get(identifier);
  
  if (!current || current.resetTime < now) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

// Input validation
function validateBranchLinkRequest(data: Record<string, unknown>): BranchLinkRequest {
  const errors: ValidationError[] = [];

  // Validate mode
  if (!data.mode || typeof data.mode !== 'string') {
    errors.push({ field: 'mode', message: 'Mode is required' });
  } else if (!['custom_password_reset', 'verify_email'].includes(data.mode)) {
    errors.push({ field: 'mode', message: 'Invalid mode value' });
  }

  // Validate oobCode
  if (!data.oobCode || typeof data.oobCode !== 'string') {
    errors.push({ field: 'oobCode', message: 'Verification code is required' });
  } else if (!/^[a-zA-Z0-9_-]{20,100}$/.test(data.oobCode)) {
    errors.push({ field: 'oobCode', message: 'Invalid verification code format' });
  }

  // Validate email
  if (!data.email || typeof data.email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  } else if (data.email.length > 254) {
    errors.push({ field: 'email', message: 'Email too long' });
  }

  // Validate optional token
  if (data.token && (typeof data.token !== 'string' || !/^[a-zA-Z0-9_-]{16,}$/.test(data.token))) {
    errors.push({ field: 'token', message: 'Invalid token format' });
  }

  // Validate optional uid
  if (data.uid && (typeof data.uid !== 'string' || !/^[a-zA-Z0-9]{20,}$/.test(data.uid))) {
    errors.push({ field: 'uid', message: 'Invalid user ID format' });
  }

  // Validate optional username
  if (data.username && (typeof data.username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(data.username))) {
    errors.push({ field: 'username', message: 'Invalid username format' });
  }

  if (errors.length > 0) {
    throw new APIError(
      `Validation failed: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  return {
    mode: data.mode as string,
    oobCode: data.oobCode as string,
    email: (data.email as string).toLowerCase().trim(),
    token: data.token as string | undefined,
    uid: data.uid as string | undefined,
    username: data.username as string | undefined
  };
}

// Security headers
function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'",
  };
}

// Retry mechanism
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxAttempts) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Operation failed, retrying in ${delay}ms. Attempt ${attempt}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    // Security: Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') || // Cloudflare
                    'unknown';

    console.log(`[${requestId}] API request from ${clientIP}`);

    // Rate limiting
    if (!checkRateLimit(clientIP, 10, 60000)) {
      throw new APIError(
        'Too many requests. Please wait before trying again.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Parse and validate request
    const url = new URL(req.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const validatedParams = validateBranchLinkRequest(rawParams);

    console.log(`[${requestId}] Validated params for mode: ${validatedParams.mode}`);

    // Authentication with retry
    let auth: GoogleAuth;
    let branchKey: string;

    try {
      auth = await withRetry(async () => {
        const googleAuth = new GoogleAuth({
          credentials: {
            type: 'external_account',
            audience: `//iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}`,
          },
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        
        // Test authentication
        await googleAuth.getClient();
        return googleAuth;
      });

      console.log(`[${requestId}] Successfully authenticated with GCP`);
    } catch (authError) {
      console.error(`[${requestId}] Authentication failed:`, authError);
      throw new APIError(
        'Authentication service unavailable',
        503,
        'AUTH_SERVICE_UNAVAILABLE'
      );
    }

    // Fetch Branch key with retry
    try {
      branchKey = await withRetry(async () => {
        const smClient = new SecretManagerServiceClient({ auth });
        const [version] = await smClient.accessSecretVersion({
          name: `projects/${PROJECT_ID}/secrets/branch_key/versions/latest`,
        });
        
        const keyData = version.payload?.data?.toString();
        if (!keyData) {
          throw new Error('Branch key is empty');
        }
        
        return keyData;
      });

      console.log(`[${requestId}] Successfully retrieved Branch key`);
    } catch (secretError) {
      console.error(`[${requestId}] Secret retrieval failed:`, secretError);
      throw new APIError(
        'Configuration service unavailable',
        503,
        'CONFIG_SERVICE_UNAVAILABLE'
      );
    }

    // Generate Branch link with retry and enhanced payload
    const branchUrl = await withRetry(async () => {
      const action = validatedParams.mode === 'custom_password_reset' ? 'reset' : 'verify';
      
      const branchPayload = {
        branch_key: branchKey,
        channel: 'email',
        feature: validatedParams.mode === 'custom_password_reset' ? 'password_reset' : 'email_verification',
        campaign: `${validatedParams.mode}_email`,
        stage: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
        tags: [validatedParams.mode, 'email_redirect'],
        data: {
          // Core parameters
          mode: validatedParams.mode,
          oobCode: validatedParams.oobCode,
          email: validatedParams.email,
          ...(validatedParams.token && { token: validatedParams.token }),
          ...(validatedParams.uid && { uid: validatedParams.uid }),
          ...(validatedParams.username && { username: validatedParams.username }),
          
          // Fallback URLs
          '$desktop_url': `https://theplot.world/app/${action}?mode=${encodeURIComponent(validatedParams.mode)}&oobCode=${encodeURIComponent(validatedParams.oobCode)}&email=${encodeURIComponent(validatedParams.email)}`,
          '$fallback_url': `https://theplot.world/app/${action}`,
          
          // Mobile deep links
          '$ios_url': `theplot://${action}?mode=${encodeURIComponent(validatedParams.mode)}&oobCode=${encodeURIComponent(validatedParams.oobCode)}&email=${encodeURIComponent(validatedParams.email)}`,
          '$android_url': `theplot://${action}?mode=${encodeURIComponent(validatedParams.mode)}&oobCode=${encodeURIComponent(validatedParams.oobCode)}&email=${encodeURIComponent(validatedParams.email)}`,
          
          // App Store fallbacks
          '$ios_store_url': 'https://apps.apple.com/app/the-plot/id123456789',
          '$android_store_url': 'https://play.google.com/store/apps/details?id=com.theplot.app',
          
          // Metadata
          'request_id': requestId,
          'timestamp': new Date().toISOString(),
        },
        // Branch-specific options
        alias: `${validatedParams.mode}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        type: 2, // Marketing link
      };

      console.log(`[${requestId}] Calling Branch API`);

      const response = await fetch('https://api2.branch.io/v1/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ThePlot/1.0 (redirect-service)',
        },
        body: JSON.stringify(branchPayload),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        throw new Error(`Branch API responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.url) {
        throw new Error('Branch API returned invalid response - missing URL');
      }

      console.log(`[${requestId}] Branch API success`);
      return data.url;
    });

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Request completed successfully in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        url: branchUrl,
        metadata: {
          requestId,
          mode: validatedParams.mode,
          feature: validatedParams.mode === 'custom_password_reset' ? 'password_reset' : 'email_verification',
          duration,
          timestamp: new Date().toISOString(),
        }
      },
      {
        status: 200,
        headers: getSecurityHeaders(),
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof APIError) {
      console.error(`[${requestId}] API Error (${error.code}):`, error.message);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            requestId,
            duration,
          }
        },
        {
          status: error.statusCode,
          headers: getSecurityHeaders(),
        }
      );
    }

    // Unexpected errors
    console.error(`[${requestId}] Unexpected error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred. Please try again later.',
          requestId,
          duration,
        }
      },
      {
        status: 500,
        headers: getSecurityHeaders(),
      }
    );
  }
}

// Enhanced CORS handling
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'https://theplot.world',
    'https://www.theplot.world',
    'https://link.theplot.world'
  ];

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
    ...getSecurityHeaders(),
  };

  // Only set CORS origin if it's in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
      ...getSecurityHeaders(),
    },
  });
}