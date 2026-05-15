// @ts-check

/**
 * @typedef {Object} NormalizedUrl
 * @property {string} domain
 * @property {string} targetURL
 * @property {boolean} www
 */

import { URL } from "node:url";

/**
 * Normalize a raw URL string into a canonical domain + preferred path.
 * @param {string} raw
 * @returns {NormalizedUrl | null}
 */
export function normalizeUrl(raw) {
  try {
    const url = new URL(raw.trim());

    const rawHostname = url.hostname;
    const hasWww = rawHostname.startsWith("www.");

    const hostname = rawHostname.replace(/^www\./, "");

    return {
      domain: hostname,
      targetURL: raw.trim(),
      www: hasWww
    };
  } catch {
    return null;
  }
}
