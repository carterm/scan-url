// @ts-check

/**
 * @typedef {Object} NormalizedUrl
 * @property {string} domain
 * @property {string} preferredPath
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

    // Normalize path: "/" is the default
    const path = url.pathname && url.pathname !== "/" ? url.pathname : "/";

    return {
      domain: hostname,
      preferredPath: path,
      www: hasWww
    };
  } catch {
    return null;
  }
}
