/**
 * SSRF URL Validation
 * Validates outgoing crawler URLs against private subnets, loopbacks, and metadata IPs
 * to prevent Server-Side Request Forgery.
 * Author: Aakarsh Sharma
 */

import { URL } from 'url';
import { ALLOW_LOCAL_URLS, NODE_ENV } from '../../config/env.js';

// ── Private / Loopback CIDR Subnets ─────────────────────────────────────────
// IPv4 loopback (127.0.0.0/8)
const LOOPBACK_IPV4_REGEX = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
// IPv6 loopback (::1)
const LOOPBACK_IPV6 = '::1';
// Cloud metadata IP address (169.254.169.254)
const CLOUD_METADATA_IP = '169.254.169.254';
// RFC-1918 Private class A (10.0.0.0/8)
const PRIVATE_CLASS_A_REGEX = /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
// RFC-1918 Private class B (172.16.0.0/12)
const PRIVATE_CLASS_B_REGEX = /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/;
// RFC-1918 Private class C (192.168.0.0/16)
const PRIVATE_CLASS_C_REGEX = /^192\.168\.\d{1,3}\.\d{1,3}$/;

/**
 * Validates a candidate target URL for SSRF safety and protocol legitimacy.
 *
 * @param {string} targetUrl - Raw URL string to validate.
 * @returns {{ isValid: boolean, normalizedUrl?: string, reason?: string }} Validation outcome.
 */
export const validateUrlSafety = (targetUrl) => {
  // Check existence
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { isValid: false, reason: 'URL must be a non-empty string.' };
  }

  // Auto-prepend http:// if scheme was omitted by the user
  let urlToParse = targetUrl.trim();
  if (!/^https?:\/\//i.test(urlToParse)) {
    urlToParse = `https://${urlToParse}`;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlToParse);
  } catch {
    return { isValid: false, reason: 'Invalid URL format.' };
  }

  // 1. Enforce strict HTTP / HTTPS protocols (block file://, gopher://, ftp://)
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { isValid: false, reason: `Disallowed protocol: ${parsedUrl.protocol}` };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 2. In evaluation testing or non-production mode with ALLOW_LOCAL_URLS enabled,
  // permit localhost and local testing ports (e.g. http://localhost:8099)
  if (ALLOW_LOCAL_URLS || NODE_ENV === 'test') {
    return { isValid: true, normalizedUrl: parsedUrl.toString() };
  }

  // 3. In production mode, strictly guard against SSRF, cloud metadata, and loopbacks
  if (
    hostname === 'localhost' ||
    hostname === LOOPBACK_IPV6 ||
    LOOPBACK_IPV4_REGEX.test(hostname) ||
    hostname === CLOUD_METADATA_IP ||
    PRIVATE_CLASS_A_REGEX.test(hostname) ||
    PRIVATE_CLASS_B_REGEX.test(hostname) ||
    PRIVATE_CLASS_C_REGEX.test(hostname)
  ) {
    return { isValid: false, reason: 'Access to loopback or private network addresses is forbidden in production.' };
  }

  return { isValid: true, normalizedUrl: parsedUrl.toString() };
};
