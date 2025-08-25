import { redirect } from 'next/navigation';

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
 * This page acts as an intermediary to redirect users to their intended destination.
 */
export default function RedirectPage({ searchParams }: RedirectPageProps) {
  let { target, mode, oobCode, email, token, uid, username } = searchParams;

  console.log('Redirect page called with params:', searchParams);

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
        
        // Override with extracted parameters if they exist
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

  // Handle password reset mode
  if (mode === 'custom_password_reset' && oobCode) {
    console.log('Handling password reset with oobCode:', oobCode);
    // Create a Branch.io deep link for password reset
    const branchLink = `https://theplot.app-link.com/?mode=custom_password_reset&oobCode=${encodeURIComponent(oobCode)}&email=${encodeURIComponent(email || '')}`;
    redirect(branchLink);
  }

  // Handle email verification for email changes
  if (mode === 'verify_email' && token) {
    console.log('Handling email verification with token:', token);
    const branchLink = `https://theplot.app-link.com/?mode=verify_email&token=${encodeURIComponent(token)}&uid=${encodeURIComponent(uid || '')}`;
    redirect(branchLink);
  }

  // NOTE: Account verification (signup) no longer uses deep links
  // Users must manually enter the verification code from their email

  // Handle regular target redirects (for universal links)
  if (target) {
    console.log('Handling target redirect:', target);
    let decodedTarget: string;
    try {
      decodedTarget = decodeURIComponent(target);
    } catch (e) {
      console.error('Error decoding target:', e);
      // Handle malformed URI component by redirecting to a safe fallback
      redirect('/');
    }

    // Validate the deep link
    if (isValidDeepLink(decodedTarget)) {
      redirect(decodedTarget);
    } else {
      console.error('Invalid deep link format:', decodedTarget);
      redirect('/');
    }
  }

  // If no valid parameters, redirect to homepage
  console.log('No valid parameters found, redirecting to homepage');
  redirect('/');

  // This component will not render anything as `redirect` terminates rendering
  return null;
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
    
    // Handle Microsoft Office 365 ATP Safe Links (different format)
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
        // Mimecast uses base64 encoding
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
    
    // If no safe link pattern is detected, return original
    return safeLink;
  } catch (e) {
    console.error('Error extracting URL from safe link:', e);
    return safeLink;
  }
}

// Helper function to decode Proofpoint URLs
function decodeProofpointUrl(encodedUrl: string): string {
  try {
    // Proofpoint URL Defense encoding patterns
    let decoded = encodedUrl;
    
    // Replace common Proofpoint encoding patterns
    decoded = decoded.replace(/-/g, '%');
    decoded = decoded.replace(/_/g, '/');
    
    // Try to decode
    try {
      decoded = decodeURIComponent(decoded);
    } catch (e) {
      // If decoding fails, try direct replacement patterns
      decoded = encodedUrl
        .replace(/\*2D/g, '-')
        .replace(/\*2E/g, '.')
        .replace(/\*3A/g, ':')
        .replace(/\*2F/g, '/')
        .replace(/\*3F/g, '?')
        .replace(/\*3D/g, '=')
        .replace(/\*26/g, '&');
    }
    
    // Validate that we have a proper URL
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
  // App scheme regex for deep links
  const appSchemeRegex = /^app:\/\/[a-zA-Z0-9\-\._~:\/?#\[\]@!$&'()*+,;=]+$/;
  
  // Web fallback regex for your domain
  const webFallbackRegex = /^https:\/\/theplot\.world\/app\/[a-zA-Z0-9\-\._~:\/?#\[\]@!$&'()*+,;=]+$/;
  
  // Branch.io links
  const branchLinkRegex = /^https:\/\/theplot\.app-link\.com\/.*$/;

  // For HTTPS URLs, additional security checks
  if (url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      
      // Check for userinfo component (security risk)
      if (urlObj.username || urlObj.password) {
        return false;
      }
      
      // Allow theplot.world and Branch.io domains
      const allowedHosts = ['theplot.world', 'theplot.app-link.com'];
      if (!allowedHosts.includes(urlObj.host)) {
        return false;
      }
      
      // For theplot.world, ensure path starts with '/app/'
      if (urlObj.host === 'theplot.world' && !urlObj.pathname.startsWith('/app/')) {
        return false;
      }
      
    } catch (e) {
      return false;
    }
  }

  return appSchemeRegex.test(url) || webFallbackRegex.test(url) || branchLinkRegex.test(url);
}