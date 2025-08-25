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
    const baseParams = new URLSearchParams();
    if (mode) baseParams.set('mode', mode);
    if (oobCode) baseParams.set('oobCode', oobCode);
    if (email) baseParams.set('email', email);
    if (token) baseParams.set('token', token);
    if (uid) baseParams.set('uid', uid);
    if (username) baseParams.set('username', username);

    const paramString = baseParams.toString();
    const action = mode === 'custom_password_reset' ? 'reset' : 'verify';

    if (device.isMobile) {
      return {
        primary: `theplot://${action}?${paramString}`, // Prioritize direct deep link
        fallback: [
          `https://link.theplot.world/${action}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}?${paramString}`, // Branch link as first fallback
          device.isIOS 
            ? `https://apps.apple.com/app/the-plot/id123456789` 
            : `https://play.google.com/store/apps/details?id=com.theplot.app`,
          `https://theplot.world/app/${action}?${paramString}`
        ],
        displayMessage: 'Opening The Plot app...'
      };
    }

    return {
      primary: `https://theplot.world/app/${action}?${paramString}`,
      fallback: [
        `https://theplot.world/download?redirect=${encodeURIComponent(`/app/${action}?${paramString}`)}`
      ],
      displayMessage: 'Redirecting to The Plot web app...'
    };
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Enhanced app detection using visibility and focus events
  const attemptDeepLinkWithDetection = async (deepLinkUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let resolved = false;
      const startTime = Date.now();
      
      // Set up event listeners to detect if app opened
      const handleVisibilityChange = () => {
        if (document.hidden && !resolved) {
          resolved = true;
          console.log('App opened - page became hidden');
          cleanup();
          resolve(true);
        }
      };

      const handleBlur = () => {
        if (!resolved) {
          resolved = true;
          console.log('App opened - window lost focus');
          cleanup();
          resolve(true);
        }
      };

      const handlePageShow = (e: PageTransitionEvent) => {
        if (e.persisted && !resolved && Date.now() - startTime > 2000) {
          resolved = true;
          console.log('App opened - page was persisted');
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

      // Set up timeout for fallback
      const fallbackTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('App detection timeout - app likely not installed');
          cleanup();
          resolve(false);
        }
      }, 3000);

      // Add event listeners
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('pageshow', handlePageShow);

      // Attempt to open the app
      console.log('Attempting to open app with URL:', deepLinkUrl);
      
      try {
        // For iOS, use a more reliable method
        if (deviceInfo?.isIOS) {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = deepLinkUrl;
          document.body.appendChild(iframe);
          
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        } else {
          // For Android and others
          window.location.href = deepLinkUrl;
        }
      } catch (error) {
        console.error('Error opening deep link:', error);
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }
    });
  };

  const attemptRedirect = async (url: string): Promise<boolean> => {
    try {
      if (url.startsWith('http')) {
        console.log('Redirecting to web URL:', url);
        window.location.href = url;
        return true;
      } else if (url.startsWith('theplot://')) {
        console.log('Attempting deep link:', url);
        setAttemptedDeepLink(true);
        return await attemptDeepLinkWithDetection(url);
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

            // Try Branch link as first fallback
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

            // Try remaining fallbacks (app store, web)
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

    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(handleRedirect, 500);
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
                  {currentAttempt === 1 && attemptedDeepLink ? 'Checking if app is installed...' : 
                   currentAttempt === 2 ? 'Redirecting to app store...' :
                   `Trying alternative method (${currentAttempt})...`}
                </p>
              )}
              {attemptedDeepLink && currentAttempt === 1 && (
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
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Unable to Redirect
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'The redirect process encountered an error.'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleManualRedirect}
                  className="block w-full bg-[#17cd1c] hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {deviceInfo?.isMobile ? 'Open App Store' : 'Open Web App'}
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

// Enhanced safe link extraction with more providers
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

// Enhanced Proofpoint URL decoding
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

// Enhanced deep link validation
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