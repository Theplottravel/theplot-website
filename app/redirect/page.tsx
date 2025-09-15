'use client'

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';

interface RedirectPageProps {
  searchParams: {
    target?: string;
    mode?: string;
    oobCode?: string;
    email?: string;
    token?: string;
    uid?: string;
    username?: string;
  };
}

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  userAgent: string;
}

interface RedirectStrategy {
  primary: string;
  fallback: string[];
  displayMessage: string;
}

interface EnvironmentConfig {
  isStaging: boolean;
  baseUrl: string;
  apiEndpoint: string;
  appStoreUrl: string;
  playStoreUrl: string;
}

export default function ImprovedRedirectPage({ searchParams }: RedirectPageProps) {
  let { target, mode, oobCode, email, token, uid, username } = searchParams;
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [redirectStrategy, setRedirectStrategy] = useState<RedirectStrategy | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [attemptedDeepLink, setAttemptedDeepLink] = useState(false);

  console.log('Redirect page called with params:', searchParams);

  // Enhanced device detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isMobile = isIOS || isAndroid;
      const isDesktop = !isMobile;

      const device: DeviceInfo = {
        isIOS,
        isAndroid,
        isMobile,
        isDesktop,
        userAgent
      };

      setDeviceInfo(device);
      console.log('Device detected:', device);
    }
  }, []);

  // Validate and sanitize parameters
  const validateParameters = () => {
    if (mode && !['custom_password_reset', 'verify_email'].includes(mode)) {
      throw new Error('Invalid mode parameter');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    if (oobCode && !/^[a-zA-Z0-9_-]{20,}$/.test(oobCode)) {
      throw new Error('Invalid verification code format');
    }

    if (uid && !/^[a-zA-Z0-9]{20,}$/.test(uid)) {
      throw new Error('Invalid user ID format');
    }

    if (token && !/^[a-zA-Z0-9_-]{16,}$/.test(token)) {
      throw new Error('Invalid token format');
    }

    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      throw new Error('Invalid username format');
    }
  };

  // Create redirect strategy based on device and action
  const createRedirectStrategy = (device: DeviceInfo): RedirectStrategy => {
    const envConfig = getEnvironmentConfig(); // Fixed: declare envConfig here
    
    const baseParams = new URLSearchParams();
    if (mode) baseParams.set('mode', mode);
    if (oobCode) baseParams.set('oobCode', oobCode);
    if (email) baseParams.set('email', email);
    if (token) baseParams.set('token', token);
    if (uid) baseParams.set('uid', uid);
    if (username) baseParams.set('username', username);
    
    // Add environment to parameters
    baseParams.set('environment', envConfig.isStaging ? 'staging' : 'production');
  
    const paramString = baseParams.toString();
    const action = mode === 'custom_password_reset' ? 'reset' : 'verify';
  
    if (device.isMobile) {
      return {
        primary: `theplot://${action}?${paramString}`, // Prioritize direct deep link
        fallback: [
          `https://link${envConfig.isStaging ? '-staging' : ''}.theplot.world/${action}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}?${paramString}`, // Environment-specific Branch link
          envConfig.appStoreUrl,
          envConfig.playStoreUrl,
          `${envConfig.baseUrl}/app/${action}?${paramString}`
        ],
        displayMessage: `Opening The Plot app${envConfig.isStaging ? ' (Staging)' : ''}...`
      };
    }
  
    return {
      primary: `${envConfig.baseUrl}/app/${action}?${paramString}`,
      fallback: [
        `${envConfig.baseUrl}/download?redirect=${encodeURIComponent(`/app/${action}?${paramString}`)}`
      ],
      displayMessage: `Redirecting to The Plot web app${envConfig.isStaging ? ' (Staging)' : ''}...`
    };
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // iOS-specific deep link detection with improved reliability
  const attemptIOSDeepLink = async (deepLinkUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let resolved = false;
      const startTime = Date.now();
      
      // iOS-specific event handling
      const handleVisibilityChange = () => {
        // iOS apps cause immediate visibility change when opened
        if (document.hidden && !resolved) {
          resolved = true;
          console.log('iOS app opened - document hidden');
          cleanup();
          resolve(true);
        }
      };

      const handlePageHide = () => {
        // iOS Safari fires pagehide when opening apps
        if (!resolved) {
          resolved = true;
          console.log('iOS app opened - pagehide event');
          cleanup();
          resolve(true);
        }
      };

      const handleBlur = () => {
        // Window blur happens when iOS opens app, but add delay to avoid false positives
        if (!resolved && Date.now() - startTime > 300) {
          resolved = true;
          console.log('iOS app opened - window blur');
          cleanup();
          resolve(true);
        }
      };

      const cleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pagehide', handlePageHide);
        window.removeEventListener('blur', handleBlur);
        clearTimeout(fallbackTimer);
      };

      // Shorter timeout for iOS - apps open very quickly
      const fallbackTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('iOS app not installed or failed to open');
          cleanup();
          resolve(false);
        }
      }, 1500); // Reduced from 3000ms to 1500ms for iOS

      // Set up iOS-specific event listeners
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pagehide', handlePageHide);
      window.addEventListener('blur', handleBlur);

      console.log('Attempting iOS deep link:', deepLinkUrl);
      
      // For iOS, use direct location.href instead of iframe for better reliability
      try {
        window.location.href = deepLinkUrl;
      } catch (error) {
        console.error('iOS location.href failed:', error);
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }
    });
  };

  // Android deep link detection (keep existing functionality)
  const attemptAndroidDeepLink = async (deepLinkUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let resolved = false;
      const startTime = Date.now();
      
      const handleVisibilityChange = () => {
        if (document.hidden && !resolved) {
          resolved = true;
          console.log('Android app opened - page became hidden');
          cleanup();
          resolve(true);
        }
      };

      const handleBlur = () => {
        if (!resolved) {
          resolved = true;
          console.log('Android app opened - window lost focus');
          cleanup();
          resolve(true);
        }
      };

      const handlePageShow = (e: PageTransitionEvent) => {
        if (e.persisted && !resolved && Date.now() - startTime > 2000) {
          resolved = true;
          console.log('Android app opened - page was persisted');
          cleanup();
          resolve(true);
        }
      };

      const cleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('pageshow', handlePageShow);
        clearTimeout(fallbackTimer);
      };

      const fallbackTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('Android app detection timeout - app likely not installed');
          cleanup();
          resolve(false);
        }
      }, 3000);

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('pageshow', handlePageShow);

      console.log('Attempting Android deep link:', deepLinkUrl);
      
      try {
        window.location.href = deepLinkUrl;
      } catch (error) {
        console.error('Error opening Android deep link:', error);
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }
    });
  };

  function getEnvironmentConfig(): EnvironmentConfig {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isStaging = hostname.includes('staging') || hostname.includes('test') || 
                     process.env.NODE_ENV === 'development';
    
    return {
      isStaging,
      baseUrl: isStaging ? 'https://staging.theplot.world' : 'https://theplot.world',
      apiEndpoint: isStaging ? '/api/getBranchLink' : '/api/getBranchLink',
      appStoreUrl: isStaging 
        ? 'https://testflight.apple.com/join/your-testflight-link' // Replace with actual TestFlight link
        : 'https://apps.apple.com/app/the-plot/id123456789',
      playStoreUrl: isStaging
        ? 'https://play.google.com/apps/internaltest/4700151707835615870' // Replace with actual internal testing link
        : 'https://play.google.com/store/apps/details?id=com.example.plot1_1_1_3'
    };
  }
  
  

  // Updated attemptRedirect function with platform-specific handling
  const attemptRedirect = async (url: string): Promise<boolean> => {
    try {
      if (url.startsWith('http')) {
        console.log('Redirecting to web URL:', url);
        window.location.href = url;
        return true;
      } else if (url.startsWith('theplot://')) {
        console.log('Attempting deep link:', url);
        setAttemptedDeepLink(true);
        
        // Use platform-specific deep link detection
        if (deviceInfo?.isIOS) {
          return await attemptIOSDeepLink(url);
        } else if (deviceInfo?.isAndroid) {
          return await attemptAndroidDeepLink(url);
        } else {
          // Fallback for other platforms
          return await attemptAndroidDeepLink(url);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Redirect attempt failed:', error);
      return false;
    }
  };

  // Main redirect logic
  useEffect(() => {
    if (!deviceInfo) return;

    const handleRedirect = async () => {
      try {
        setIsRedirecting(true);
        setError(null);

        // Extract original URL from safe links if needed
        if (target) {
          const extractedTarget = extractOriginalUrlFromSafeLink(target);
          if (extractedTarget !== target) {
            console.log('Extracted original URL from safe link:', extractedTarget);
            target = extractedTarget;
            
            try {
              const extractedUri = new URL(extractedTarget);
              const extractedParams = new URLSearchParams(extractedUri.search);
              
              mode = extractedParams.get('mode') || mode;
              oobCode = extractedParams.get('oobCode') || oobCode;
              email = extractedParams.get('email') || email;
              token = extractedParams.get('token') || token;
              uid = extractedParams.get('uid') || uid;
              username = extractedParams.get('username') || username;
            } catch (e) {
              console.error('Error re-parsing extracted URL:', e);
            }
          }
        }

        // Validate parameters
        validateParameters();

        // Create redirect strategy
        const strategy = createRedirectStrategy(deviceInfo);
        setRedirectStrategy(strategy);

        if (mode === 'custom_password_reset' || mode === 'verify_email') {
          // For mobile devices, try direct deep link first
          if (deviceInfo.isMobile) {
            // Try primary deep link
            if (await attemptRedirect(strategy.primary)) {
              return;
            }

            // For iOS, show manual options faster instead of trying all fallbacks
            if (deviceInfo.isIOS) {
              setCurrentAttempt(1);
              console.log('iOS direct deep link failed, trying Branch link once');
              
              // Try Branch link once for iOS
              try {
                const envConfig = getEnvironmentConfig();
                const queryParams = new URLSearchParams();
                if (mode) queryParams.set('mode', mode);
                if (oobCode) queryParams.set('oobCode', oobCode);
                if (email) queryParams.set('email', email);
                if (token) queryParams.set('token', token);
                if (uid) queryParams.set('uid', uid);
                if (username) queryParams.set('username', username);
                
                // Add environment parameter
                queryParams.set('environment', envConfig.isStaging ? 'staging' : 'production');
              
                console.log(`Fetching Branch link for ${envConfig.isStaging ? 'staging' : 'production'} environment...`);
                const response = await fetch(`${envConfig.apiEndpoint}?${queryParams.toString()}`, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                  signal: AbortSignal.timeout(10000)
                });
              
                if (response.ok) {
                  const data = await response.json();
                  console.log(`Branch API response for ${envConfig.isStaging ? 'staging' : 'production'}:`, data);
                  if (data.url && await attemptRedirect(data.url)) {
                    return;
                  }
                } else {
                  console.error(`Branch API failed for ${envConfig.isStaging ? 'staging' : 'production'}:`, response.status, await response.text());
                }
              } catch (branchError) {
                console.error(`Branch API error for ${envConfig.isStaging ? 'staging' : 'production'}:`, branchError);
              }

              // For iOS, stop here and show manual options
              setCurrentAttempt(2);
              setIsRedirecting(false);
              return;
            }

            // For Android, continue with existing fallback logic
            setCurrentAttempt(1);
            try {
              const queryParams = new URLSearchParams();
              if (mode) queryParams.set('mode', mode);
              if (oobCode) queryParams.set('oobCode', oobCode);
              if (email) queryParams.set('email', email);
              if (token) queryParams.set('token', token);
              if (uid) queryParams.set('uid', uid);
              if (username) queryParams.set('username', username);

              console.log('Fetching Branch link...');
              const response = await fetch(`/api/getBranchLink?${queryParams.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(10000)
              });

              if (response.ok) {
                const data = await response.json();
                if (data.url && await attemptRedirect(data.url)) {
                  return;
                }
              }
            } catch (branchError) {
              console.error('Branch API failed:', branchError);
            }

            // Try remaining fallbacks (app store, web) for Android
            for (let i = 1; i < strategy.fallback.length; i++) {
              setCurrentAttempt(i + 1);
              if (await attemptRedirect(strategy.fallback[i])) {
                return;
              }
              await sleep(1000);
            }

            throw new Error('All redirect attempts failed');
          } else {
            // For desktop, go directly to web app
            if (await attemptRedirect(strategy.primary)) {
              return;
            }
          }

          throw new Error('All redirect attempts failed');
        } else if (target) {
          // Handle direct target redirects
          let decodedTarget: string;
          try {
            decodedTarget = decodeURIComponent(target);
          } catch (e) {
            throw new Error('Invalid target URL format');
          }

          if (isValidDeepLink(decodedTarget)) {
            if (await attemptRedirect(decodedTarget)) {
              return;
            }
          } else {
            throw new Error('Invalid deep link format');
          }
        } else {
          // No valid parameters, redirect to homepage
          console.log('No valid parameters, redirecting to homepage');
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Redirect error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setIsRedirecting(false);
        
        // Ultimate fallback after delay
        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      }
    };

    // Faster execution for iOS, keep existing timing for Android
    const timer = setTimeout(handleRedirect, deviceInfo.isIOS ? 100 : 500);
    return () => clearTimeout(timer);
  }, [deviceInfo, mode, oobCode, email, token, uid, username, target]);

  // Manual redirect for user
  const handleManualRedirect = () => {
    if (redirectStrategy && redirectStrategy.fallback.length > 0) {
      const fallbackUrl = currentAttempt > 0 && currentAttempt < redirectStrategy.fallback.length 
        ? redirectStrategy.fallback[currentAttempt]
        : redirectStrategy.fallback[0];
      window.location.href = fallbackUrl;
    } else {
      window.location.href = '/';
    }
  };

  const handleTryAgain = () => {
    if (redirectStrategy) {
      window.location.href = redirectStrategy.primary;
    }
  };

  return (
    <>
      <Script
        src="https://cdn.branch.io/branch-latest.min.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-[#FFFFF2] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          {isRedirecting ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#17cd1c] mx-auto mb-4"></div>
              <p className="text-gray-700 text-lg mb-2">
                {redirectStrategy?.displayMessage || 'Preparing redirect...'}
              </p>
              {deviceInfo && (
                <p className="text-gray-500 text-sm mb-2">
                  Detected: {deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Desktop'}
                </p>
              )}
              {currentAttempt > 0 && (
                <p className="text-orange-600 text-sm mb-2">
                  {deviceInfo?.isIOS ? (
                    currentAttempt === 1 ? 'Trying alternative link...' : 'Checking app availability...'
                  ) : (
                    currentAttempt === 1 && attemptedDeepLink ? 'Checking if app is installed...' : 
                    currentAttempt === 2 ? 'Redirecting to app store...' :
                    `Trying alternative method (${currentAttempt})...`
                  )}
                </p>
              )}
              {attemptedDeepLink && currentAttempt === 1 && !deviceInfo?.isIOS && (
                <div className="mt-4">
                  <button
                    onClick={handleManualRedirect}
                    className="text-[#17cd1c] underline text-sm hover:text-green-600"
                  >
                    App not opening? Tap here to continue
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className={`mb-4 ${error ? 'text-red-500' : 'text-orange-500'}`}>
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={error ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 18.5c-.77.833.192 2.5 1.732 2.5z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {error ? 'Unable to Redirect' : 'App Not Found'}
              </h2>
              <p className="text-gray-600 mb-4">
                {error || (deviceInfo?.isIOS ? 
                  'The Plot app might not be installed on your device.' :
                  'The redirect process encountered an issue.')}
              </p>
              <div className="space-y-3">
                {!error && (
                  <button
                    onClick={handleTryAgain}
                    className="block w-full bg-[#17cd1c] hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Try Opening App Again
                  </button>
                )}
                <button
                  onClick={handleManualRedirect}
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {deviceInfo?.isIOS ? 'Get App from App Store' : 
                   deviceInfo?.isMobile ? 'Open App Store' : 'Open Web App'}
                </button>
                {deviceInfo?.isMobile && (
                  <button
                    onClick={() => window.location.href = 'https://theplot.world/app/reset'}
                    className="block w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Use Web Version
                  </button>
                )}
              </div>
            </>
          )}
          
          <p className="text-sm text-gray-400 mt-4">
            If you continue to have problems,{' '}
            <Link href="/" className="text-[#17cd1c] hover:underline">
              return to homepage
            </Link>
            {' '}or{' '}
            <Link href="/support" className="text-[#17cd1c] hover:underline">
              contact support
            </Link>.
          </p>
        </div>
      </div>
    </>
  );
}

// Enhanced safe link extraction with more providers (keep existing)
function extractOriginalUrlFromSafeLink(safeLink: string): string {
  try {
    const uri = new URL(safeLink);
    
    // Microsoft Outlook Safe Links (various regions)
    if (uri.host?.includes('safelinks.protection.outlook.com')) {
      const url = uri.searchParams.get('url');
      if (url) return decodeURIComponent(url);
    }
    
    // Proofpoint URL Defense
    if (uri.host?.includes('urldefense.proofpoint.com') || uri.host?.includes('urldefense.com')) {
      const pathSegments = uri.pathname.split('/');
      if (pathSegments.length > 0) {
        const encodedUrl = pathSegments[pathSegments.length - 1];
        return decodeProofpointUrl(encodedUrl);
      }
    }
    
    // Barracuda Links
    if (uri.host?.includes('linkprotect.cudasvc.com')) {
      const url = uri.searchParams.get('u');
      if (url) return decodeURIComponent(url);
    }
    
    // Mimecast Secure Email Gateway
    if (uri.host?.includes('protect.mimecast.com')) {
      const url = uri.searchParams.get('u');
      if (url) {
        try {
          return atob(url);
        } catch (e) {
          return decodeURIComponent(url);
        }
      }
    }
    
    // Cisco Email Security
    if (uri.host?.includes('ipas.cisco.com')) {
      const url = uri.searchParams.get('u');
      if (url) return decodeURIComponent(url);
    }
    
    // FireEye Email Security
    if (uri.host?.includes('fireeye.com')) {
      const url = uri.searchParams.get('u');
      if (url) return decodeURIComponent(url);
    }
    
    return safeLink;
  } catch (e) {
    console.error('Error extracting URL from safe link:', e);
    return safeLink;
  }
}

// Enhanced Proofpoint URL decoding (keep existing)
function decodeProofpointUrl(encodedUrl: string): string {
  try {
    let decoded = encodedUrl;
    
    // Method 1: Replace hyphens and underscores
    decoded = decoded.replace(/-/g, '%').replace(/_/g, '/');
    
    try {
      decoded = decodeURIComponent(decoded);
    } catch (e) {
      // Method 2: Proofpoint hex encoding
      decoded = encodedUrl
        .replace(/\*2D/g, '-')
        .replace(/\*2E/g, '.')
        .replace(/\*3A/g, ':')
        .replace(/\*2F/g, '/')
        .replace(/\*3F/g, '?')
        .replace(/\*3D/g, '=')
        .replace(/\*26/g, '&');
    }
    
    // Validate the decoded URL
    try {
      const testUri = new URL(decoded);
      if (testUri.protocol && testUri.host) {
        return decoded;
      }
    } catch (e) {
      // Invalid URL, return original
    }
    
    return encodedUrl;
  } catch (e) {
    console.error('Error decoding Proofpoint URL:', e);
    return encodedUrl;
  }
}

// Enhanced deep link validation (keep existing)
function isValidDeepLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Block dangerous schemes
    const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousSchemes.some(scheme => url.toLowerCase().startsWith(scheme))) {
      return false;
    }
    
    // Block credentials in URLs
    if (urlObj.username || urlObj.password) {
      return false;
    }
    
    // Validate allowed hosts for HTTPS URLs
    if (url.startsWith('https://')) {
      const allowedHosts = ['theplot.world', 'link.theplot.world'];
      if (!allowedHosts.includes(urlObj.host)) {
        return false;
      }
      
      // Validate path structure
      if (urlObj.host === 'theplot.world' && !urlObj.pathname.startsWith('/app/')) {
        return false;
      }
    }
    
    // Validate app scheme URLs
    if (url.startsWith('theplot://')) {
      const validPaths = ['reset', 'verify', 'login', 'signup'];
      const pathMatch = url.match(/^theplot:\/\/([^?]+)/);
      if (pathMatch && !validPaths.includes(pathMatch[1])) {
        return false;
      }
    }
    
    // Validate Branch links
    if (url.startsWith('https://link.theplot.world/')) {
      return true;
    }
    
    return url.startsWith('theplot://') || url.startsWith('https://theplot.world/app/') || url.startsWith('https://link.theplot.world/');
    
  } catch (e) {
    return false;
  }
}