export const APP_META_TITLE = 'Snackshop';
export const APP_META_DESCRIPTION = '';

export const DEMO_API_URL = 'http://localhost:80/shop-api';

export let API_URL: string =
  typeof process !== 'undefined' && process.env?.VENDURE_API_URL
    ? process.env.VENDURE_API_URL
    : DEMO_API_URL;

/**
 * Used in environments like Cloudflare Workers/Pages where `process.env` is not available.
 * Call this from a Remix loader using the context/env.
 */
export function setApiUrl(apiUrl: string) {
  API_URL = apiUrl;
}
