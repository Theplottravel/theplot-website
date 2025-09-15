// api/getBranchLink/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { 
  getEnvironmentConfig, 
  validateEnvironmentConfig,
  getServiceAccountCredentials,
  type EnvironmentConfig 
} from '../../config/environment';
// Type definitions
interface BranchLinkRequest {
  mode: string;
  oobCode: string;
  email: string;
  token?: string;
  uid?: string;
  username?: string;
}

interface RequestContext {
  requestId: string;
  clientIP: string;
  userAgent: string;
  timestamp: string;
  environment: EnvironmentConfig;
}

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Rate limiting with environment-aware limits
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  identifier: string, 
  config: EnvironmentConfig
): boolean {
  const { requests, windowMs } = config.features.rateLimit;
  const now = Date.now();
  const current = rateLimitStore.get(identifier);
  
  if (!current || current.resetTime < now) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= requests) {
    return false;
  }
  
  current.count++;
  return true;
}

// Request context builder
function buildRequestContext(req: NextRequest): RequestContext {
  const environment = getEnvironmentConfig(req);
  validateEnvironmentConfig(environment);

  return {
    requestId: `${environment.name}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    clientIP: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
              req.headers.get('x-real-ip') || 
              req.headers.get('cf-connecting-ip') ||
              'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    environment,
  };
}

// Enhanced request validation with environment-specific rules
function validateBranchLinkRequest(
  data: Record<string, unknown>, 
  context: RequestContext
): BranchLinkRequest {
  const errors: string[] = [];

  // Mode validation
  if (!data.mode || typeof data.mode !== 'string') {
    errors.push('Mode is required');
  } else if (!['custom_password_reset', 'verify_email'].includes(data.mode)) {
    errors.push('Invalid mode value');
  }

  // OOB Code validation with environment-specific rules
  if (!data.oobCode || typeof data.oobCode !== 'string') {
    errors.push('Verification code is required');
  } else {
    const codePattern = context.environment.name === 'development' 
      ? /^[a-zA-Z0-9_-]{10,}$/ // Relaxed for development
      : /^[a-zA-Z0-9_-]{20,100}$/; // Strict for production/staging
    
    if (!codePattern.test(data.oobCode)) {
      errors.push('Invalid verification code format');
    }
  }

  // Email validation
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  // Optional field validation
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
    throw new APIError(
      `Validation failed: ${errors.join(', ')}`, 
      400, 
      'VALIDATION_ERROR',
      { environment: context.environment.name, errors }
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

// Robust retry mechanism with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  context?: RequestContext
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (context?.environment.features.debugLogging) {
        console.warn(`[${context.requestId}] Attempt ${attempt}/${maxAttempts} failed:`, lastError.message);
      }
      
      if (attempt === maxAttempts) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Enhanced authentication with environment-specific credentials
async function authenticateWithFirebase(context: RequestContext): Promise<GoogleAuth> {
  try {
    const credentials = getServiceAccountCredentials(context.environment);
    
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId: context.environment.firebase.projectId,
    });
    
    // Test authentication
    await auth.getClient();
    
    if (context.environment.features.debugLogging) {
      console.log(`[${context.requestId}] Successfully authenticated with ${context.environment.name} Firebase project`);
    }
    
    return auth;
  } catch (error) {
    throw new APIError(
      `Authentication failed for ${context.environment.name} environment`,
      503,
      'AUTH_FAILED',
      { environment: context.environment.name, projectId: context.environment.firebase.projectId }
    );
  }
}

// Secure secret retrieval with caching
const secretCache = new Map<string, { value: string; expiry: number }>();

async function getSecret(
  secretName: string, 
  auth: GoogleAuth, 
  context: RequestContext
): Promise<string> {
  const cacheKey = `${context.environment.firebase.projectId}:${secretName}`;
  const cached = secretCache.get(cacheKey);
  
  // Return cached value if not expired (1 hour cache)
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }

  try {
    const secretValue = await withRetry(async () => {
      const smClient = new SecretManagerServiceClient({ auth });
      const [version] = await smClient.accessSecretVersion({
        name: `projects/${context.environment.firebase.projectId}/secrets/${secretName}/versions/latest`,
      });
      
      const value = version.payload?.data?.toString();
      if (!value) {
        throw new Error(`Secret ${secretName} is empty`);
      }
      
      return value;
    }, 3, 1000, context);

    // Cache the secret for 1 hour
    secretCache.set(cacheKey, {
      value: secretValue,
      expiry: Date.now() + 3600000
    });

    if (context.environment.features.debugLogging) {
      console.log(`[${context.requestId}] Retrieved secret ${secretName} (length: ${secretValue.length})`);
    }

    return secretValue;
  } catch (error) {
    throw new APIError(
      `Failed to retrieve secret: ${secretName}`,
      503,
      'SECRET_RETRIEVAL_FAILED',
      { secretName, environment: context.environment.name }
    );
  }
}

// Branch link generation with comprehensive error handling
async function generateBranchLink(
  params: BranchLinkRequest,
  branchKey: string,
  context: RequestContext
): Promise<string> {
  const action = params.mode === 'custom_password_reset' ? 'reset' : 'verify';
  
  // Build query parameters
  const queryParams = new URLSearchParams({
    mode: params.mode,
    oobCode: params.oobCode,
    email: params.email,
  });

  if (params.token) queryParams.set('token', params.token);
  if (params.uid) queryParams.set('uid', params.uid);
  if (params.username) queryParams.set('username', params.username);

  const branchPayload = {
    branch_key: branchKey,
    channel: 'email',
    feature: params.mode === 'custom_password_reset' ? 'password_reset' : 'email_verification',
    campaign: `${params.mode}_email_${context.environment.name}`,
    tags: [
      params.mode, 
      'email_redirect', 
      'api_generated', 
      context.environment.name
    ],
    data: {
      // Core authentication data
      mode: params.mode,
      oobCode: params.oobCode,
      email: params.email,
      environment: context.environment.name,
      ...(params.token && { token: params.token }),
      ...(params.uid && { uid: params.uid }),
      ...(params.username && { username: params.username }),
      
      // Environment-specific URLs
      '$desktop_url': `${context.environment.urls.webApp}/app/${action}?${queryParams.toString()}`,
      '$fallback_url': `${context.environment.urls.webApp}/app/${action}`,
      '$ios_url': `${context.environment.urls.deepLink}${action}?${queryParams.toString()}`,
      '$android_url': `${context.environment.urls.deepLink}${action}?${queryParams.toString()}`,
      '$ios_store_url': context.environment.urls.appStore,
      '$android_store_url': context.environment.urls.playStore,
      
      // Metadata
      'request_id': context.requestId,
      'generated_at': context.timestamp,
      'client_ip': context.clientIP,
      'user_agent': context.userAgent,
      'firebase_project': context.environment.firebase.projectId,
      'app_package': context.environment.app.androidPackage,
    },
    
    // Unique alias with environment prefix
    alias: `${context.environment.name}_${params.mode}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    type: 0,
  };

  return await withRetry(async () => {
    const response = await fetch('https://api2.branch.io/v1/url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `ThePlot-${context.environment.name}/1.0`,
      },
      body: JSON.stringify(branchPayload),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read response');
      throw new Error(`Branch API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('Branch API returned invalid response - missing URL');
    }

    return data.url;
  }, 3, 1000, context);
}

// Security headers
function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

// Main GET handler
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let context: RequestContext | undefined;

  try {
    // Build request context with environment detection
    context = buildRequestContext(req);

    if (context.environment.features.debugLogging) {
      console.log(`[${context.requestId}] Request started for ${context.environment.name} environment`);
      console.log(`[${context.requestId}] Client: ${context.clientIP} | UA: ${context.userAgent}`);
    }

    // Rate limiting
    if (!checkRateLimit(context.clientIP, context.environment)) {
      throw new APIError(
        'Rate limit exceeded. Please wait before trying again.',
        429,
        'RATE_LIMIT_EXCEEDED',
        { clientIP: context.clientIP, environment: context.environment.name }
      );
    }

    // Parse and validate request
    const url = new URL(req.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const validatedParams = validateBranchLinkRequest(rawParams, context);

    if (context.environment.features.debugLogging) {
      console.log(`[${context.requestId}] Processing ${validatedParams.mode} for ${validatedParams.email}`);
    }

    // Authenticate with Firebase
    const auth = await authenticateWithFirebase(context);

    // Retrieve Branch key
    const branchKey = await getSecret(context.environment.secrets.branchKey, auth, context);

    // Generate Branch link
    const branchUrl = await generateBranchLink(validatedParams, branchKey, context);

    const duration = Date.now() - startTime;

    if (context.environment.features.debugLogging) {
      console.log(`[${context.requestId}] Request completed successfully in ${duration}ms`);
    }

    return NextResponse.json(
      {
        success: true,
        url: branchUrl,
        metadata: {
          requestId: context.requestId,
          mode: validatedParams.mode,
          action: validatedParams.mode === 'custom_password_reset' ? 'reset' : 'verify',
          environment: context.environment.name,
          projectId: context.environment.firebase.projectId,
          duration,
          timestamp: context.timestamp,
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
      const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
      console[logLevel](`[${context?.requestId || 'unknown'}] API Error (${error.code}):`, error.message, error.context);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            requestId: context?.requestId || 'unknown',
            environment: context?.environment.name || 'unknown',
            duration,
            timestamp: new Date().toISOString(),
            ...(context?.environment.features.debugLogging && { context: error.context }),
          }
        },
        {
          status: error.statusCode,
          headers: getSecurityHeaders(),
        }
      );
    }

    // Unexpected errors
    console.error(`[${context?.requestId || 'unknown'}] Unexpected error:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred. Please try again later.',
          requestId: context?.requestId || 'unknown',
          environment: context?.environment.name || 'unknown',
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

// CORS handler
export async function OPTIONS(req: NextRequest) {
  const context = buildRequestContext(req);
  
  const allowedOrigins = [
    context.environment.urls.webApp,
    `${context.environment.urls.webApp.replace('https://', 'https://www.')}`,
    `https://link${context.environment.name === 'staging' ? '-staging' : ''}.theplot.world`
  ];

  const origin = req.headers.get('origin');
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    ...getSecurityHeaders(),
  };

  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}