//@ts-check
// scan/mergeScanResult.mjs
/**
 * @typedef {import("./types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
/**
 * Merge a successful ScanResult into an existing DomainRecord.
 * Only updates fields that the scanner is responsible for.
 *
 * @param {DomainRecord} record
 * @param {DomainRecord} scan
 * @returns {DomainRecord}
 */
export function mergeScanResult(record, scan) {
  const updated = { ...record };

  //
  // Core scan metadata
  //
  updated.lastChecked = new Date().toISOString();
  updated.lastStatus = scan.lastStatus;
  updated.finalUrl = scan.finalUrl;

  //
  // Headers + protocol + size
  //
  updated.responseHeaders = scan.responseHeaders;
  updated.contentSize = scan.contentSize;

  //
  // Page content
  //
  updated.title = scan.title;
  updated.metaGenerator = scan.metaGenerator;

  //
  // Analytics + social
  //
  updated.googleAnalytics = scan.googleAnalytics;
  updated.socialLinks = scan.socialLinks;

  //
  // Flags
  //
  updated.linksToCaGov = scan.linksToCaGov;
  updated.cloudflare = scan.cloudflare;
  updated.slow = scan.slow;
  updated.hasStatewideAlerts = scan.hasStatewideAlerts;
  updated.usesStateTemplate = scan.usesStateTemplate;
  updated.hasJQuery = scan.hasJQuery;

  //
  // Error handling
  //
  updated.errorMessage = scan.errorMessage ?? null;

  return updated;
}
