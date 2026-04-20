// @ts-check
import { loadAllDomainRecords } from "./helpers/fileIO.mjs";
import fs from "node:fs";

import converter from "json-2-csv";
const publish_location = "publish/scan-results.csv";

const items = loadAllDomainRecords();
const domainRecords = items.map(i => i.record);

/**
 * Returns a safe 50‑character preview of a string.
 * - null/undefined → ""
 * - ≤ 50 chars → original string
 * - > 50 chars → first 50 chars + "…"
 * @param {string | null | undefined} value
 * @returns {string}
 */
function preview50(value) {
  if (typeof value !== "string") return "";

  return value.length > 50 ? `${value.slice(0, 50)}...` : value;
}

(() => {
  const resultData = domainRecords
    .map(row => ({
      domain: row.domain,
      target: row.targetURL,
      status: row.lastStatus || "",
      redirectURL: preview50(row.finalUrl),
      title: preview50(row.title),
      generator: preview50(row.metaGenerator) || "",
      "x-powered-by": row.responseHeaders["x-powered-by"] || "",
      server: row.responseHeaders["server"] || "",
      slowResponse: row.slow,
      statewideAlerts: row.hasStatewideAlerts,
      stateTemplate: row.usesStateTemplate,
      JQuery: row.hasJQuery,
      GoogleAnalytics: row.googleAnalytics.join(","),
      errormessage: row.errorMessage || ""
    }))
    .sort((a, b) => {
      if (a.domain > b.domain) return 1;
      if (a.domain < b.domain) return -1;
      if (a.domain === b.domain) {
        if (a.target > b.target) return 1;
        if (a.target < b.target) return -1;
      }
      return 0;
    });

  /*
  resultData[0].domain = new Set(
    resultData.slice(1).map(row => row.domain)
  ).size;
  */

  const csv = converter.json2csv(resultData);

  fs.writeFileSync(publish_location, csv);

  process.exit();
})();
