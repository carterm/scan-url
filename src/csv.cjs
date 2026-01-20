//@ts-check

const fs = require("node:fs");
const converter = require("json-2-csv");
const publish_location = "publish/scan-results.csv";

console.time("Done");

const data = require("../_results/results.json");

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

/**
 *
 * @param {number} [duration]
 */
const DurationShow = duration => {
  if (duration && duration > 3) {
    return duration;
  } else {
    return "";
  }
};

(() => {
  const resultData = [
    {
      domain: 0,
      target: data.length,
      status: data.filter(x => x.status).length,
      redirectURL: data.filter(x => x.redirectURL).length,
      title: data.filter(x => x.title).length,
      generator: data.filter(x => x.generator).length,
      "x-powered-by": data.filter(x => x.headers?.["x-powered-by"]).length,
      server: data.filter(x => x.headers?.["server"]).length,
      slowResponse: data.filter(x => DurationShow(x.duration)).length,
      statewideAlerts: data.filter(x => x.statewideAlerts).length,
      stateTemplate: data.filter(x => x.stateTemplate).length,
      JQuery: data.filter(x => x.JQuery).length,
      GoogleAnalytics: data.filter(x => x.GoogleAnalytics).length,
      errorcode: data.filter(x => x.errorcode).length,
      errormessage: data.filter(x => x.errormessage).length
    },
    ...data
      .map(row => ({
        domain: (row.target.match(/\W*([\w-]*\.ca\.gov)/) || [])[1] || "",
        target: row.target,
        status: row.status || "",
        redirectURL: preview50(row.redirectURL),
        title: preview50(row.title),
        generator: row.generator || "",
        "x-powered-by": row.headers?.["x-powered-by"] || "",
        server: row.headers?.["server"] || "",
        slowResponse: DurationShow(row.duration),
        statewideAlerts: row.statewideAlerts || "",
        stateTemplate: row.stateTemplate || "",
        JQuery: row.JQuery || "",
        GoogleAnalytics: row.GoogleAnalytics
          ? row.GoogleAnalytics.join(",")
          : "",
        errorcode: row.errorcode || "",
        errormessage: row.errormessage || ""
      }))
      .sort((a, b) => {
        if (a.domain > b.domain) return 1;
        if (a.domain < b.domain) return -1;
        if (a.domain === b.domain) {
          if (a.target > b.target) return 1;
          if (a.target < b.target) return -1;
        }
        return 0;
      })
  ];

  resultData[0].domain = new Set(
    resultData.slice(1).map(row => row.domain)
  ).size;

  const csv = converter.json2csv(resultData);

  fs.writeFileSync(publish_location, csv);

  console.timeEnd("Done");
  process.exit();
})();
