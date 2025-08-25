import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Configuration
const PROJECT_ID = 'plot1-1-3';

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface BranchLinkRequest {
  mode: string;
  oobCode: string;
  email: string;
  token?: string;
  uid?: string;
  username?: string;
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

function validateBranchLinkRequest(data: Record<string, unknown>): BranchLinkRequest {
  const errors: string[] = [];

  if (!data.mode || typeof data.mode !== 'string') {
    errors.push('Mode is required');
  } else if (!['custom_password_reset', 'verify_email'].includes(data.mode)) {
    errors.push('Invalid mode value');
  }

  if (!data.oobCode || typeof data.oobCode !== 'string') {
    errors.push('Verification code is required');
  } else if (!/^[a-zA-Z0-9_-]{20,100}$/.test(data.oobCode)) {
    errors.push('Invalid verification code format');
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.token && (typeof data.token !== 'string' || !/^[a-zA-Z0-9_-]{16,}$/.test(data.token))) {
    errors.push('Invalid token format');
  }

  if (data.uid && (typeof data.uid !== 'string' || !/^[a-zA-Z0-9]{20,}$/.test(data.uid))) {
    errors.push('Invalid user ID format');
  }

  if (data.username && (typeof data.username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(data.username))) {
    errors.push('Invalid username format');
  }

  if (errors.length > 0) {
    throw new APIError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
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

function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  };
}

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
      console.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') ||
                    'unknown';

    console.log(`[${requestId}] API request from ${clientIP}`);

    // Rate limiting
    if (!checkRateLimit(clientIP, 10, 60000)) {
      throw new APIError('Too many requests. Please wait before trying again.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    // Parse and validate request
    const url = new URL(req.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const validatedParams = validateBranchLinkRequest(rawParams);

    console.log(`[${requestId}] Processing ${validatedParams.mode} for ${validatedParams.email}`);

    // Authentication with Service Account Key
    let auth: GoogleAuth;
    let branchKey: string;

    try {
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountKey) {
        throw new APIError('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set', 503, 'AUTH_CONFIG_MISSING');
      }

      let credentials;
      try {
        credentials = JSON.parse(serviceAccountKey);
      } catch (parseError) {
        throw new APIError('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format - must be valid JSON', 503, 'AUTH_CONFIG_INVALID');
      }

      auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      
      // Test authentication
      await auth.getClient();
      console.log(`[${requestId}] Successfully authenticated with Service Account`);

      // Fetch Branch key from Secret Manager
      branchKey = await withRetry(async () => {
        const smClient = new SecretManagerServiceClient({ auth });
        const [version] = await smClient.accessSecretVersion({
          name: `projects/${PROJECT_ID}/secrets/BRANCH_KEY/versions/latest`,
        });
        
        const keyData = version.payload?.data?.toString();
        if (!keyData) {
          throw new Error('Branch key is empty');
        }
        
        console.log(`[${requestId}] Successfully retrieved Branch key (length: ${keyData.length})`);
        return keyData;
      });

    } catch (authError) {
      console.error(`[${requestId}] Authentication failed:`, authError);
      
      if (authError instanceof APIError) {
        throw authError;
      }
      
      throw new APIError(
        'Authentication service unavailable. Please check your service account key.',
        503,
        'AUTH_SERVICE_UNAVAILABLE'
      );
    }

    // Generate Branch link
    const branchUrl = await withRetry(async () => {
      const action = validatedParams.mode === 'custom_password_reset' ? 'reset' : 'verify';
      
      // Create query parameters for URLs
      const queryParams = new URLSearchParams({
        mode: validatedParams.mode,
        oobCode: validatedParams.oobCode,
        email: validatedParams.email,
      });

      // Add optional parameters
      if (validatedParams.token) queryParams.set('token', validatedParams.token);
      if (validatedParams.uid) queryParams.set('uid', validatedParams.uid);
      if (validatedParams.username) queryParams.set('username', validatedParams.username);

      const branchPayload = {
        branch_key: branchKey,
        channel: 'email',
        feature: validatedParams.mode === 'custom_password_reset' ? 'password_reset' : 'email_verification',
        campaign: `${validatedParams.mode}_email`,
        tags: [validatedParams.mode, 'email_redirect', 'api_generated'],
        data: {
          // Core authentication data
          mode: validatedParams.mode,
          oobCode: validatedParams.oobCode,
          email: validatedParams.email,
          ...(validatedParams.token && { token: validatedParams.token }),
          ...(validatedParams.uid && { uid: validatedParams.uid }),
          ...(validatedParams.username && { username: validatedParams.username }),
          
          // Branch routing URLs
          '$desktop_url': `https://theplot.world/app/${action}?${queryParams.toString()}`,
          '$fallback_url': `https://theplot.world/app/${action}`,
          
          // Deep link URLs for mobile apps
          '$ios_url': `theplot://${action}?${queryParams.toString()}`,
          '$android_url': `theplot://${action}?${queryParams.toString()}`,
          
          // App store fallback URLs
          '$ios_store_url': 'https://apps.apple.com/app/the-plot/id123456789',
          '$android_store_url': 'https://play.google.com/store/apps/details?id=com.theplot.app',
          
          // Metadata
          'request_id': requestId,
          'generated_at': new Date().toISOString(),
          'client_ip': clientIP,
        },
        
        // Branch link options
        alias: `${validatedParams.mode}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        type: 2, // Marketing link type
      };

      console.log(`[${requestId}] Calling Branch API to create ${action} link`);

      const response = await fetch('https://api2.branch.io/v1/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ThePlot-RedirectService/1.0',
        },
        body: JSON.stringify(branchPayload),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error(`[${requestId}] Branch API error ${response.status}:`, errorText);
        throw new Error(`Branch API responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.url) {
        console.error(`[${requestId}] Branch API returned invalid response:`, data);
        throw new Error('Branch API returned invalid response - missing URL');
      }

      console.log(`[${requestId}] Branch API success - generated URL: ${data.url}`);
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
          action: validatedParams.mode === 'custom_password_reset' ? 'reset' : 'verify',
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
            timestamp: new Date().toISOString(),
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
          timestamp: new Date().toISOString(),
        }
      },
      {
        status: 500,
        headers: getSecurityHeaders(),
      }
    );
  }
}

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