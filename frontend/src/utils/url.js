/**
 * Dynamic Application URL & Path Resolution Utilities
 * Research Factors — Editorial Platform
 *
 * Handles runtime route prefixes across subfolder hosting (e.g., /rf/)
 * and root hosting (/) dynamically based on Vite's configured BASE_URL.
 */

/**
 * Resolves an internal app route path respecting Vite's dynamic base path (e.g., '/rf/' or '/').
 *
 * Examples:
 * - If base is '/rf/':
 *     getAppPath('/research/preview/123') => '/rf/research/preview/123'
 *     getAppPath('/')                     => '/rf/'
 *     getAppPath('sponsorship')           => '/rf/sponsorship'
 * - If base is '/':
 *     getAppPath('/research/preview/123') => '/research/preview/123'
 *     getAppPath('/')                     => '/'
 *     getAppPath('sponsorship')           => '/sponsorship'
 *
 * @param {string} [path='/'] - Target path within the app
 * @returns {string} Route path prefixed with base path
 */
export function getAppPath(path = '/') {
  const rawBase = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const cleanBase = rawBase.replace(/\/+$/, '');
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '/';

  if (!cleanBase) {
    return cleanPath;
  }
  if (cleanPath === '/') {
    return `${cleanBase}/`;
  }
  return `${cleanBase}${cleanPath}`;
}

/**
 * Resolves a fully-qualified URL for internal app paths, combining the origin
 * and the dynamic base path.
 *
 * Examples:
 * - If origin is 'https://demo.wizmonk.com' and base is '/rf/':
 *     getAppUrl('/research/preview/123') => 'https://demo.wizmonk.com/rf/research/preview/123'
 * - If origin is 'https://demo.wizmonk.com' and base is '/':
 *     getAppUrl('/research/preview/123') => 'https://demo.wizmonk.com/research/preview/123'
 *
 * @param {string} [path='/'] - Target path within the app
 * @returns {string} Fully qualified absolute URL
 */
export function getAppUrl(path = '/') {
  const appPath = getAppPath(path);
  if (typeof window === 'undefined' || !window.location?.origin) {
    return appPath;
  }
  return `${window.location.origin}${appPath}`;
}
