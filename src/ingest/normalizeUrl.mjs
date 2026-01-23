// @ts-check

/**
 * @typedef {Object} NormalizedUrl
 * @property {string} domain
 * @property {string} preferredUrl
 * @property {string} path
 */

import { URL } from "node:url";

/**
 * Normalize a raw URL string into a canonical domain + preferred URL.
 * @param {string} raw
 * @returns {NormalizedUrl | null}
 */
export function normalizeUrl(raw) {
  try {
    const url = new URL(raw.trim());

    /** @type {string} */
    const hostname = url.hostname.replace(/^www\./, "");

    /** @type {string} */
    const path = url.pathname === "/" ? "" : url.pathname;

    return {
      domain: hostname,
      preferredUrl: `https://${hostname}${path}`,
      path
    };
  } catch {
    return null;
  }
}
