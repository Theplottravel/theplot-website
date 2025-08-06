import { redirect } from 'next/navigation';

interface RedirectPageProps {
  searchParams: {
    deepLink?: string;
  };
}

/**
 * This page acts as an intermediary to redirect users to their intended deep link.
 * It expects the full deep link URL as a 'deepLink' query parameter.
 *
 * Example usage:
 * If your original deep link is `yourapp://products/123`,
 * you would construct your branch link to be `https://yourwebsite.com/redirect?deepLink=yourapp%3A%2F%2Fproducts%2F123`.
 * This page will then parse the `deepLink` parameter and redirect to it.
 */
export default function RedirectPage({ searchParams }: RedirectPageProps) {
  const { deepLink } = searchParams;

  // If no deepLink parameter is provided, redirect to the homepage or a default landing page.
  if (!deepLink) {
    redirect('/');
  }

  // Basic validation: Ensure the deepLink looks like a valid URI scheme.
  // In a production environment, you might want more robust validation,
  // such as whitelisting allowed schemes or checking for valid deep link formats.
  if (!deepLink.includes('://')) {
    // If the deep link format is invalid, redirect to a safe fallback.
    redirect('/');
  }

  // Perform the server-side redirect to the actual deep link.
  // The `redirect` function from `next/navigation` is used for this purpose.
  redirect(deepLink);

  // This component will not render anything as `redirect` throws an error and terminates rendering.
  return null;
}
