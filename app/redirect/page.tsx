import { redirect } from 'next/navigation';

interface RedirectPageProps {
  searchParams: {
    target?: string;
  };
}

/**
 * This page acts as an intermediary to redirect users to their intended deep link.
 * It expects the full deep link URL as a 'target' query parameter.
 *
 * Example usage:
 * If your original deep link is `app://page?id=123`,
 * you would format the email link to be `https://theplot.world/redirect?target=app%3A%2F%2Fpage%3Fid%3D123`.
 * This page will then parse the `target` parameter and redirect to it.
 */
export default function RedirectPage({ searchParams }: RedirectPageProps) {
  const { target } = searchParams;

  // If no target parameter is provided, redirect to the homepage or a default landing page.
  if (!target) {
    redirect('/');
  }

  let decodedTarget: string;
  try {
    decodedTarget = decodeURIComponent(target);
  } catch (e) {
    // Handle malformed URI component by redirecting to a safe fallback.
    redirect('/');
  }

  // Whitelist validation for deep links and web fallbacks.
  // This is crucial to prevent open redirect vulnerabilities [^3].
  const isValidDeepLink = (url: string) => {
    // Regex to prevent userinfo deception and ensure valid scheme/host/path.
    // 1. `app://` scheme: Matches `app://` followed by any valid URI path characters.
    // 2. `https://theplot.world/app/` path: Matches `https://theplot.world/app/` followed by any valid URI path characters.
    const appSchemeRegex = /^app:\/\/[a-zA-Z0-9\-\._~:\/?#\[\]@!$&'()*+,;=]+$/;
    const webFallbackRegex = /^https:\/\/theplot\.world\/app\/[a-zA-Z0-9\-\._~:\/?#\[\]@!$&'()*+,;=]+$/;

    // Check for userinfo component (e.g., `foo@evil.com`) which is a security risk [^3].
    // For `https://` URLs, parse the URL to check the host specifically.
    if (url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        // Ensure no userinfo in the host part.
        if (urlObj.username || urlObj.password) {
          return false;
        }
        // Ensure the host is exactly 'theplot.world' and path starts with '/app/'.
        if (urlObj.host !== 'theplot.world' || !urlObj.pathname.startsWith('/app/')) {
          return false;
        }
      } catch (e) {
        // Invalid URL format (e.g., `new URL` throws an error).
        return false;
      }
    }

    // Check if the URL matches either the app scheme or the web fallback regex.
    return appSchemeRegex.test(url) || webFallbackRegex.test(url);
  };

  if (!isValidDeepLink(decodedTarget)) {
    // If the deep link format is invalid or not whitelisted, redirect to a safe fallback.
    redirect('/');
  }

  // Perform the server-side redirect to the actual deep link.
  // The `redirect` function from `next/navigation` uses HTTP 307 (Temporary Redirect) by default,
  // which is suitable for deep links to prevent caching issues and allow for future changes [^1].
  redirect(decodedTarget);

  // This component will not render anything as `redirect` terminates rendering.
  return null;
}
