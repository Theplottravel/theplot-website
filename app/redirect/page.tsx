'use client'

import { useEffect } from 'react';
import Script from 'next/script';

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

/**
 * Enhanced redirect page that handles email-based deep links and special modes.
 * Redirects users to the app via Branch or app scheme (theplot://).
 */
export default function RedirectPage({ searchParams }: RedirectPageProps) {
  let { target, mode, oobCode, email, token, uid, username } = searchParams;

  console.log('Redirect page called with params:', searchParams);

  useEffect(() => {
    const handleRedirect = async () => {
      // Handle safe links that might wrap our original URL
      if (target) {
        const extractedTarget = extractOriginalUrlFromSafeLink(target);
        if (extractedTarget !== target) {
          console.log('Extracted original URL from safe link:', extractedTarget);
          target = extractedTarget;
          
          // Re-parse the extracted URL to get the real parameters
          try {
            const extractedUri = new URL(extractedTarget);
            const extractedParams = new URLSearchParams(extractedUri.search);
            
            mode = extractedParams.get('mode') || mode;
            oobCode = extractedParams.get('oobCode') || oobCode;
            email = extractedParams.get('email') || email;
            token = extractedParams.get('token') || token;
            uid = extractedParams.get('uid') || uid;
            username = extractedParams.get('username') || username;
            
            console.log('Re-parsed parameters from extracted URL:', { mode, oobCode, email, token, uid, username });
          } catch (e) {
            console.error('Error re-parsing extracted URL:', e);
          }
        }
      }

      // Initialize Branch SDK and create deep link
      if (typeof window !== 'undefined' && (mode === 'custom_password_reset' || mode === 'verify_email')) {
        try {
          // @ts-ignore
          const branch = window.branch;
          if (!branch) {
            throw new Error('Branch SDK not loaded');
          }

          await new Promise((resolve, reject) => {
            branch.init(process.env.NEXT_PUBLIC_BRANCH_KEY, (err: any) => {
              if (err) reject(err);
              else resolve(true);
            });
          });

          const linkData = {
            channel: 'website',
            feature: mode === 'custom_password_reset' ? 'password_reset' : 'email_verification',
            data: {
              mode,
              oobCode,
              email,
              token,
              uid,
              username,
            }
          };

          const url = await new Promise<string>((resolve, reject) => {
            branch.link(linkData, (err: any, url: string) => {
              if (err) reject(err);
              else resolve(url);
            });
          });

          console.log(`Redirecting to Branch deep link: ${url}`);
          window.location.href = url;
        } catch (error) {
          console.error('Error creating Branch deep link:', error);
          // Fallback to app scheme
          const path = mode === 'custom_password_reset' ? 'reset' : 'verify';
          const fallbackUrl = `theplot://${path}?mode=${encodeURIComponent(mode || '')}&oobCode=${encodeURIComponent(oobCode || '')}&email=${encodeURIComponent(email || '')}&token=${encodeURIComponent(token || '')}&uid=${encodeURIComponent(uid || '')}&username=${encodeURIComponent(username || '')}`;
          console.log(`Falling back to app scheme: ${fallbackUrl}`);
          window.location.href = fallbackUrl;
        }
      } else if (target) {
        console.log('Handling target redirect:', target);
        let decodedTarget: string;
        try {
          decodedTarget = decodeURIComponent(target);
        } catch (e) {
          console.error('Error decoding target:', e);
          window.location.href = '/';
          return;
        }

        // Validate the deep link
        if (isValidDeepLink(decodedTarget)) {
          window.location.href = decodedTarget;
        } else {
          console.error('Invalid deep link format:', decodedTarget);
          window.location.href = '/';
        }
      } else {
        console.log('No valid parameters found, redirecting to homepage');
        window.location.href = '/';
      }
    };

    handleRedirect();
  }, [mode, oobCode, email, token, uid, username, target]);

  return (
    <>
      <Script
        src="https://cdn.branch.io/branch-latest.min.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-[#FFFFF2] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to The Plot app...</p>
          <p className="text-sm text-gray-400 mt-2">If you are not redirected, <a href="/" className="text-[#17cd1c] hover:underline">return to homepage</a>.</p>
        </div>
      </Script>
    </>
  );
}

// Helper function to extract original URLs from safe links
function extractOriginalUrlFromSafeLink(safeLink: string): string {
  try {
    const uri = new URL(safeLink);
    
    // Handle Microsoft Outlook Safe Links
    if (uri.host?.includes('safelinks.protection.outlook.com')) {
      const url = uri.searchParams.get('url');
      if (url) {
        return decodeURIComponent(url);
      }
    }
    
    // Handle Microsoft Office 365 ATP Safe Links
    if (uri.host?.includes('nam02.safelinks.protection.outlook.com') || 
        uri.host?.includes('nam04.safelinks.protection.outlook.com') || 
        uri.host?.includes('eur01.safelinks.protection.outlook.com') ||
        uri.host?.includes('eur02.safelinks.protection.outlook.com') ||
        uri.host?.includes('eur03.safelinks.protection.outlook.com') ||
        uri.host?.includes('apc01.safelinks.protection.outlook.com')) {
      const url = uri.searchParams.get('url');
      if (url) {
        return decodeURIComponent(url);
      }
    }
    
    // Handle Proofpoint URL Defense
    if (uri.host?.includes('urldefense.proofpoint.com') || 
        uri.host?.includes('urldefense.com')) {
      const pathSegments = uri.pathname.split('/');
      if (pathSegments.length > 0) {
        const encodedUrl = pathSegments[pathSegments.length - 1];
        return decodeProofpointUrl(encodedUrl);
      }
    }
    
    // Handle Barracuda Links
    if (uri.host?.includes('linkprotect.cudasvc.com')) {
      const url = uri.searchParams.get('u');
      if (url) {
        return decodeURIComponent(url);
      }
    }
    
    // Handle Mimecast Secure Email Gateway
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
    
    // Handle Cisco Email Security
    if (uri.host?.includes('ipas.cisco.com')) {
      const url = uri.searchParams.get('u');
      if (url) {
        return decodeURIComponent(url);
      }
    }
    
    // Handle Symantec Email Security.cloud
    if (uri.host?.includes('emea01.safelinks.protection.outlook.com') ||
        uri.host?.includes('gcc02.safelinks.protection.outlook.com')) {
      const url = uri.searchParams.get('url');
      if (url) {
        return decodeURIComponent(url);
      }
    }
    
    return safeLink;
  } catch (e) {
    console.error('Error extracting URL from safe link:', e);
    return safeLink;
  }
}

// Helper function to decode Proofpoint URLs
function decodeProofpointUrl(encodedUrl: string): string {
  try {
    let decoded = encodedUrl;
    
    decoded = decoded.replace(/-/g, '%');
    decoded = decoded.replace(/_/g, '/');
    
    try {
      decoded = decodeURIComponent(decoded);
    } catch (e) {
      decoded = encodedUrl
        .replace(/\*2D/g, '-')
        .replace(/\*2E/g, '.')
        .replace(/\*3A/g, ':')
        .replace(/\*2F/g, '/')
        .replace(/\*3F/g, '?')
        .replace(/\*3D/g, '=')
        .replace(/\*26/g, '&');
    }
    
    try {
      const testUri = new URL(decoded);
      if (testUri.protocol && testUri.host) {
        return decoded;
      }
    } catch (e) {
      // If URL validation fails, return original
    }
    
    return encodedUrl;
  } catch (e) {
    console.error('Error decoding Proofpoint URL:', e);
    return encodedUrl;
  }
}

// Enhanced validation for deep links and web fallbacks
function isValidDeepLink(url: string): boolean {
  const appSchemeRegex = /^theplot:\/\/[a-zA-Z0-9\-\._~:\/?#\[\]@!$&'()*+,;=]+$/;
  const webFallbackRegex = /^https:\/\/theplot\.world\/app\/[a-zA-Z0-9\-\._~:\/?#\[\]@!$&'()*+,;=]+$/;
  const branchLinkRegex = /^https:\/\/link\.theplot\.world\/.*$/;

  if (url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.username || urlObj.password) {
        return false;
      }
      
      const allowedHosts = ['theplot.world', 'link.theplot.world'];
      if (!allowedHosts.includes(urlObj.host)) {
        return false;
      }
      
      if (urlObj.host === 'theplot.world' && !urlObj.pathname.startsWith('/app/')) {
        return false;
      }
      
    } catch (e) {
      return false;
    }
  }

  return appSchemeRegex.test(url) || webFallbackRegex.test(url) || branchLinkRegex.test(url);
}