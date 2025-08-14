import { redirect } from 'next/navigation';

interface RedirectPageProps {
  searchParams: {
    target?: string;
    mode?: string;
    oobCode?: string;
    email?: string;
    token?: string;
  };
}

/**
 * Enhanced redirect page that handles both deep links and special modes.
 * This page acts as an intermediary to redirect users to their intended destination.
 */
export default function RedirectPage({ searchParams }: RedirectPageProps) {
  const { target, mode, oobCode, email, token } = searchParams;

  // Handle special modes first (like password reset)
  if (mode === 'custom_password_reset' && oobCode) {
    // Create a Branch.io deep link for password reset
    const branchLink = `https://theplot.app-link.com/?mode=custom_password_reset&oobCode=${encodeURIComponent(oobCode)}&email=${encodeURIComponent(email || '')}`;
    redirect(branchLink);
  }

  // Handle email verification
  if (mode === 'verify_email' && token) {
    const branchLink = `https://theplot.app-link.com/?mode=verify_email&token=${encodeURIComponent(token)}`;
    redirect(branchLink);
  }

  // Handle regular target redirects
  if (!target) {
    // If no target parameter, redirect to the homepage
    redirect('/');
  }

  let decodedTarget: string;
  try {
    decodedTarget = decodeURIComponent(target);
  } catch (e) {
    // Handle malformed URI component by redirecting to a safe fallback
    redirect('/');
  }

  // Enhanced validation for deep links and web fallbacks
  const isValidDeepLink = (url: string) => {
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
  };

  if (!isValidDeepLink(decodedTarget)) {
    // If the deep link format is invalid, redirect to homepage
    redirect('/');
  }

  // Perform the redirect
  redirect(decodedTarget);

  // This component will not render anything as `redirect` terminates rendering
  return null;
}