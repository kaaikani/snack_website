// Facebook Pixel utility functions
declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, any>) => void;
    _fbq?: any;
  }
}

/**
 * Track a Facebook Pixel event
 */
export function trackFacebookEvent(
  eventName: string,
  params?: Record<string, any>,
): void {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
  }
}

/**
 * Get page name from pathname
 */
export function getPageName(pathname: string): string {
  // Remove query parameters from pathname for comparison
  const cleanPath = pathname.split('?')[0];

  if (cleanPath === '/') {
    return 'Home';
  }
  if (cleanPath.startsWith('/collections')) {
    return 'Collections';
  }
  if (cleanPath.startsWith('/products')) {
    return 'Products';
  }
  if (cleanPath.startsWith('/checkout')) {
    return 'Checkout';
  }
  if (cleanPath.startsWith('/account')) {
    return 'Account';
  }
  if (cleanPath.startsWith('/favorites')) {
    return 'Favorites';
  }
  return 'Other';
}

/**
 * Track page view with page name
 */
export function trackPageView(pageName?: string): void {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    const name = pageName || getPageName(window.location.pathname);
    window.fbq('track', 'PageView', {
      page_name: name,
      content_name: name,
    });
  }
}

/**
 * Track sign up event
 */
export function trackSignUp(params?: Record<string, any>): void {
  trackFacebookEvent('CompleteRegistration', params);
}

/**
 * Track sign in event
 */
export function trackSignIn(params?: Record<string, any>): void {
  trackFacebookEvent('Lead', params);
}

/**
 * Track button click
 */
export function trackButtonClick(
  buttonName: string,
  params?: Record<string, any>,
): void {
  trackFacebookEvent('ButtonClick', {
    button_name: buttonName,
    ...params,
  });
}

/**
 * Track custom event
 */
export function trackCustomEvent(
  eventName: string,
  params?: Record<string, any>,
): void {
  trackFacebookEvent(eventName, params);
}
