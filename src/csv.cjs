//@ts-check

const fs = require("node:fs");

console.time("Done");

/**
 * Represents an object with various properties related to a website.
 * @typedef {object} WebsiteInfo
 * @property {string} target - The target URL of the website.
 * @property {string} redirectURL - The URL to which the website redirects.
 * @property {string} generator - The version of the website generator (e.g., "CAWeb v.1.1.4b").
 * @property {string} statewideAlerts - The URL for statewide alerts.
 * @property {string} stateTemplate - The URL for the state template.
 * @property {string} JQuery - The URL for the jQuery library.
 * @property {string[]} [GoogleAnalytics] - An array of Google Analytics tracking IDs.
 * @property {object} error - Details about the encountered error.
 *   @property {string} error.message - The error message (e.g., "unable to verify the first certificate").
 *   @property {string} error.code - The error code (e.g., "UNABLE_TO_VERIFY_LEAF_SIGNATURE").
 */

const data = /** @type {WebsiteInfo[]} */ (require("../_results/results.json"));

const columnNames = [
  "target",
  "redirectURL",
  "generator",
  "statewideAlerts",
  "stateTemplate",
  "JQuery",
  "GoogleAnalytics"
];

(() => {
  /**
   * @type {string[][]}
   */
  const resultData = [];

  resultData.push(columnNames);

  data.forEach(row => {
    resultData.push([
      row.target,
      row.redirectURL,
      row.generator,
      row.statewideAlerts,
      row.stateTemplate,
      row.JQuery,
      row.GoogleAnalytics ? row.GoogleAnalytics.join(",") : ""
    ]);
  });

  const result = resultData
    .map(row => {
      return row
        .map(item => (item ? `"${item.replace(`"`, `""`)}"` : ""))
        .join(",");
    })

    .join("\n");

  fs.writeFileSync("_results/data.csv", result);
  console.log(result);

  console.timeEnd("Done");
  process.exit();
})();
