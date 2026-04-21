// @ts-check

// @ts-check

/**
 * @typedef {Object} DomainRecord
 *
 * @property {string} $schema
 *  The URL of the JSON schema that this record adheres to. "./../../schemas/domain-scan.schema.json"
 *
 * @property {string} domain
 *   The bare domain name (e.g., "dmv.ca.gov").
 *
 * @property {string} targetURL
 *   The full URL (including protocol) that the scanner should attempt.
 *
 * @property {boolean} www
 *   Whether the original ingestion URL included "www".
 *
 * @property {boolean} active
 *   Whether this domain should appear in final statewide reports.
 *
 * @property {boolean} includeInScan
 *   Whether the scanner should attempt to fetch this domain.
 *
 * @property {string} title
 *   The <title> extracted from the scanned page.
 *
 * @property {number | null} lastStatus
 *   HTTP status code from the last scan.
 * @property {boolean} goodScan
 *   Whether the last scan was considered successful and shouldn't be overwritten by negative results.
 * @property {string} [finalUrl]
 *   The final resolved URL after redirects, or null if none occurred.
 * @property {boolean} [ignoreFinalUrl]
 *   Whether to ignore the final resolved URL after redirects.
 *
 * @property {string | null} metaGenerator
 * @property {{[key: string]: string}} responseHeaders
 *   Raw response headers, preserving order and duplicates.
 *
 * @property {boolean} cloudflare
 * @property {boolean} slow
 * @property {boolean} hasStatewideAlerts
 * @property {boolean} usesStateTemplate
 * @property {boolean} hasJQuery
 *
 * @property {string[]} googleAnalytics
 *   All GA property IDs found (UA, GA4, Ads, etc.).
 *
 * @property {string[]} socialLinks
 *   All outbound social media URLs found on the page.
 *
 * @property {boolean} linksToCaGov
 *   Whether the page links back to https://ca.gov or https://www.ca.gov.
 *
 * @property {string} [cosmeticTargetURL]
 *   If this domain is cosmetic, the URL it forwards to; otherwise null.
 *
 * @property {string | null} errorMessage
 *   A human-readable error message if the scan failed.
 *
 * @property {string | null} notes
 *   Free-form manual notes.
 * @property {string[]} [DOMErrors]
 *  Any DOM parsing errors captured during analysis.
 * @property {boolean} nocache
 *  Whether the page included cache-busting headers.
 * @property {boolean} [manualEntry]
 *  Whether the record was updated manually.
 * @property {boolean} [authenticationRequired]
 *  Whether the page requires authentication to access, and can't be scanned.
 */

/**
 * Create a new starter DomainRecord with defaults.
 * @returns {DomainRecord}
 */
export function createDomainRecord() {
  return {
    $schema: "./../../schemas/domain-scan.schema.json",
    domain: "",
    targetURL: "",
    www: true,

    goodScan: false,

    active: true,
    includeInScan: true,

    title: "",
    lastStatus: null,

    metaGenerator: null,

    cloudflare: false,
    slow: false,
    hasStatewideAlerts: false,
    usesStateTemplate: false,
    hasJQuery: false,

    googleAnalytics: [],
    socialLinks: [],

    linksToCaGov: false,

    cosmeticTargetURL: null,

    errorMessage: null,
    nocache: false,

    responseHeaders: {},
    notes: null
  };
}
