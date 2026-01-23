// @ts-check

/**
 * @typedef {Object} DomainRecord
 *
 * @property {string} domain
 *   The bare domain name (e.g., "dmv.ca.gov").
 *
 * @property {string} preferredPath
 *   The shortest known path discovered during ingestion.
 *
 * @property {boolean} www
 *   Whether the original URL included "www".
 *
 * @property {string} title
 *   The HTML <title> extracted during scanning.
 *
 * @property {string | null} finalUrl
 *   The final resolved URL after redirects.
 *
 * @property {string[]} redirects
 *   Full redirect chain discovered during scanning.
 *
 * @property {number | null} lastStatus
 *   Most recent HTTP status code.
 *
 * @property {string | null} lastChecked
 *   ISO timestamp of the last scan.
 *
 * @property {string | null} metaGenerator
 *   Value of <meta name="generator">, if present.
 *
 * @property {string | null} headerPoweredBy
 *   Value of the X-Powered-By header.
 *
 * @property {string | null} headerServer
 *   Value of the Server header.
 *
 * @property {boolean} cloudflare
 *   Whether the domain appears to be behind Cloudflare.
 *   Defaults to false.
 *
 * @property {boolean} slow
 *   Whether the response exceeded your slow threshold.
 *
 * @property {boolean} hasStatewideAlerts
 *   Whether the statewide alert banner is present.
 *
 * @property {boolean} usesStateTemplate
 *   Whether the site uses the CA.gov State Template.
 *
 * @property {boolean} hasJQuery
 *   Whether jQuery is present.
 *
 * @property {boolean} hasGoogleAnalytics
 *   Whether Google Analytics is present.
 *
 * @property {boolean} cosmetic
 *   Whether this domain is a cosmetic alias.
 *
 * @property {string | null} forwardsTo
 *   Canonical domain this one forwards to, if cosmetic.
 *
 * @property {string | null} errorCode
 *   Machine-readable error code from the scanner.
 *
 * @property {string | null} errorMessage
 *   Human-readable error message from the scanner.
 *
 * @property {string | null} notes
 *   Free-form notes for manual annotations.
 */
