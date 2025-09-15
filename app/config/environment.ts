// config/environment.ts
export interface EnvironmentConfig {
    name: 'production' | 'staging' | 'development';
    firebase: {
      projectId: string;
      region: string;
    };
    secrets: {
      branchKey: string;
      serviceAccount: string;
    };
    app: {
      androidPackage: string;
      iosBundleId: string;
    };
    urls: {
      webApp: string;
      deepLink: string;
      appStore: string;
      playStore: string;
    };
    features: {
      strictFiltering: boolean;
      debugLogging: boolean;
      rateLimit: {
        requests: number;
        windowMs: number;
      };
    };
  }
  
  // Centralized environment configuration
  const environments: Record<string, EnvironmentConfig> = {
    production: {
      name: 'production',
      firebase: {
        projectId: 'plot1-1-3',
        region: 'europe-west2',
      },
      secrets: {
        branchKey: 'BRANCH_KEY',
        serviceAccount: 'GOOGLE_SERVICE_ACCOUNT_KEY',
      },
      app: {
        androidPackage: 'com.example.plot1_1_1_3',
        iosBundleId: 'com.example.plot1_1_1_3',
      },
      urls: {
        webApp: 'https://theplot.world',
        deepLink: 'theplot://',
        appStore: 'https://apps.apple.com/app/the-plot/id123456789',
        playStore: 'https://play.google.com/store/apps/details?id=com.example.plot1_1_1_3',
      },
      features: {
        strictFiltering: true,
        debugLogging: false,
        rateLimit: {
          requests: 10,
          windowMs: 60000,
        },
      },
    },
    staging: {
      name: 'staging',
      firebase: {
        projectId: 'the-plot---staging',
        region: 'europe-west2',
      },
      secrets: {
        branchKey: 'BRANCH_KEY_STAGING',
        serviceAccount: 'GOOGLE_SERVICE_ACCOUNT_KEY_STAGING',
      },
      app: {
        androidPackage: 'com.example.plot1_1_1_3.staging',
        iosBundleId: 'com.example.plot1_1_1_3.staging',
      },
      urls: {
        webApp: 'https://staging.theplot.world',
        deepLink: 'theplot://',
        appStore: 'https://testflight.apple.com/join/your-testflight-link',
        playStore: 'https://play.google.com/apps/internaltest/4700151707835615870',
      },
      features: {
        strictFiltering: false,
        debugLogging: true,
        rateLimit: {
          requests: 50,
          windowMs: 60000,
        },
      },
    },
    development: {
      name: 'development',
      firebase: {
        projectId: 'the-plot---staging',
        region: 'europe-west2',
      },
      secrets: {
        branchKey: 'BRANCH_KEY_STAGING',
        serviceAccount: 'GOOGLE_SERVICE_ACCOUNT_KEY_STAGING',
      },
      app: {
        androidPackage: 'com.example.plot1_1_1_3.staging',
        iosBundleId: 'com.example.plot1_1_1_3.staging',
      },
      urls: {
        webApp: 'http://localhost:3000',
        deepLink: 'theplot://',
        appStore: 'https://testflight.apple.com/join/your-testflight-link',
        playStore: 'https://play.google.com/apps/internaltest/4700151707835615870',
      },
      features: {
        strictFiltering: false,
        debugLogging: true,
        rateLimit: {
          requests: 100,
          windowMs: 60000,
        },
      },
    },
  };
  
  /**
   * Get environment configuration with fallback chain
   * Priority: ENV var > deployment context > hostname > default
   */
  export function getEnvironmentConfig(request?: Request): EnvironmentConfig {
    let environmentName: string;
  
    // Method 1: Explicit environment variable (highest priority)
    environmentName = process.env.ENVIRONMENT || process.env.NODE_ENV || '';
  
    // Method 2: Deployment platform detection
    if (!environmentName) {
      // Vercel deployment detection
      if (process.env.VERCEL_ENV) {
        environmentName = process.env.VERCEL_ENV === 'production' ? 'production' : 'staging';
      }
      // Netlify deployment detection
      else if (process.env.NETLIFY) {
        environmentName = process.env.CONTEXT === 'production' ? 'production' : 'staging';
      }
      // Railway deployment detection
      else if (process.env.RAILWAY_ENVIRONMENT) {
        environmentName = process.env.RAILWAY_ENVIRONMENT;
      }
    }
  
    // Method 3: Hostname-based detection (for request context)
    if (!environmentName && request) {
      const hostname = new URL(request.url).hostname;
      if (hostname.includes('staging') || hostname.includes('dev')) {
        environmentName = 'staging';
      } else if (hostname === 'theplot.world' || hostname === 'www.theplot.world') {
        environmentName = 'production';
      }
    }
  
    // Method 4: Default fallback
    if (!environmentName) {
      environmentName = 'production';
    }
  
    // Normalize environment name
    const normalizedEnv = normalizeEnvironmentName(environmentName);
    
    const config = environments[normalizedEnv];
    if (!config) {
      throw new Error(`Invalid environment: ${normalizedEnv}. Available: ${Object.keys(environments).join(', ')}`);
    }
  
    return config;
  }
  
  /**
   * Normalize environment names to handle various naming conventions
   */
  function normalizeEnvironmentName(env: string): string {
    const normalized = env.toLowerCase().trim();
    
    // Handle common variations
    const mappings: Record<string, string> = {
      'prod': 'production',
      'stage': 'staging',
      'stg': 'staging',
      'dev': 'development',
      'develop': 'development',
      'local': 'development',
      'test': 'staging',
      'preview': 'staging',
    };
  
    return mappings[normalized] || normalized;
  }
  
  /**
   * Validate environment configuration
   */
  export function validateEnvironmentConfig(config: EnvironmentConfig): void {
    const requiredFields = [
      'firebase.projectId',
      'secrets.branchKey',
      'app.androidPackage',
      'urls.webApp'
    ];
  
    for (const field of requiredFields) {
      // Fixed: Use proper type-safe property access
      const value = getNestedProperty(config, field);
      if (!value) {
        throw new Error(`Missing required environment config: ${field}`);
      }
    }
  }

  /**
   * Type-safe nested property accessor
   */
  function getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }
  
  /**
   * Get environment-specific service account credentials
   */
  export function getServiceAccountCredentials(config: EnvironmentConfig): Record<string, unknown> {
    const credentialsJson = process.env[config.secrets.serviceAccount];
    
    if (!credentialsJson) {
      throw new Error(`Service account credentials not found: ${config.secrets.serviceAccount}`);
    }
  
    try {
      return JSON.parse(credentialsJson) as Record<string, unknown>;
    } catch (_error) {
      throw new Error(`Invalid service account credentials format: ${config.secrets.serviceAccount}`);
    }
  }