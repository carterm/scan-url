// @ts-check

/**
 * @typedef {Object} DomainRecord
 * @property {string} domain
 * @property {string} preferredPath
 * @property {boolean} www
 * @property {string} title
 * @property {number | null} lastStatus
 * @property {string | null} lastChecked
 * @property {string[]} redirects
 * @property {boolean} cloudflare
 * @property {boolean} cosmetic
 * @property {string | null} forwardsTo
 * @property {string | null} notes
 * @property {string | null} finalUrl
 * @property {string | null} metaGenerator
 * @property {string | null} headerPoweredBy
 * @property {string | null} headerServer
 * @property {boolean} slow
 * @property {boolean} hasStatewideAlerts
 * @property {boolean} usesStateTemplate
 * @property {boolean} hasJQuery
 * @property {string[]} googleAnalytics
 * @property {string | null} errorCode
 * @property {string | null} errorMessage
 */

/**
 * Create a new starter DomainRecord with defaults.
 * @returns {DomainRecord}
 */
export function createDomainRecord() {
  return {
    domain: "",
    preferredPath: "/",
    www: true,
    title: "",
    lastStatus: null,
    lastChecked: null,
    redirects: [],
    finalUrl: null,
    metaGenerator: null,
    headerPoweredBy: null,
    headerServer: null,

    cloudflare: false,
    slow: false,
    hasStatewideAlerts: false,
    usesStateTemplate: false,
    hasJQuery: false,
    googleAnalytics: [],

    cosmetic: false,
    forwardsTo: null,

    errorCode: null,
    errorMessage: null,

    notes: null
  };
}
