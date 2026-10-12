// @ts-check

/**
 * @typedef {object} NormalizedUrl
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
  if (!raw.startsWith("http://") && !raw.startsWith("https://"))
    raw = `https://${raw}`;

  const url = new URL(raw);

  const rawHostname = url.hostname;
  const hasWww = rawHostname.startsWith("www.");

  const hostname = rawHostname.replace(/^www\./, "");

  return {
    domain: hostname,
    targetURL: url.href,
    www: hasWww
  };
}
