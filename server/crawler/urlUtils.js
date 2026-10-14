/**
 * URL Utilities for Crawler
 * Single Responsibility: URL normalization, parsing and internal/external classification
 */

/**
 * Normalizes URL: removes fragments, trailing slashes, handles relative links and base tags
 * @param {string} rawHref - Target href found on page
 * @param {string} baseHref - Base URL of the page containing the href
 * @param {string} [documentBaseUrl] - Optional <base href="..."> declared in HTML
 * @returns {string|null} - Normalized URL string or null if invalid
 */
function normalizeUrl(rawHref, baseHref, documentBaseUrl) {
  if (!rawHref || typeof rawHref !== 'string') return null;

  const trimmed = rawHref.trim();

  // Ignore non-http/https schemes
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('#')
  ) {
    return null;
  }

  try {
    const effectiveBase = documentBaseUrl ? new URL(documentBaseUrl, baseHref).href : baseHref;
    const resolved = new URL(trimmed, effectiveBase);

    // Only allow http: and https: protocols
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return null;
    }

    // Remove hash/fragment
    resolved.hash = '';

    let pathname = resolved.pathname;
    // Normalize trailing slash (keep root slash '/')
    if (pathname.length > 1 && pathname.endsWith('/')) {
      resolved.pathname = pathname.slice(0, -1);
    }

    return resolved.href;
  } catch {
    return null;
  }
}

/**
 * Checks if targetUrl belongs to the same domain/subdomain hierarchy as rootUrl
 * @param {string} targetUrl 
 * @param {string} rootUrl 
 * @returns {boolean}
 */
function isInternalUrl(targetUrl, rootUrl) {
  try {
    const targetObj = new URL(targetUrl);
    const rootObj = new URL(rootUrl);

    // Primary hostname matching
    const targetHost = targetObj.hostname.toLowerCase().replace(/^www\./, '');
    const rootHost = rootObj.hostname.toLowerCase().replace(/^www\./, '');

    return targetHost === rootHost;
  } catch {
    return false;
  }
}

/**
 * Formats a clean path representation for tree visualization
 * @param {string} urlString 
 * @returns {string}
 */
function getDisplayPath(urlString) {
  try {
    const obj = new URL(urlString);
    return obj.pathname + (obj.search || '');
  } catch {
    return urlString;
  }
}

module.exports = {
  normalizeUrl,
  isInternalUrl,
  getDisplayPath,
};
