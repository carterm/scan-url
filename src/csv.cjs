//@ts-check

const fs = require("node:fs");
const converter = require("json-2-csv");

console.time("Done");

const data = require("../_results/results.json");

(() => {
  const resultData = [
    {
      target: data.length.toString(),
      redirectURL: data.filter(x => x.redirectURL).length.toString(),
      title: data.filter(x => x.title).length.toString(),
      generator: data.filter(x => x.generator).length.toString(),
      statewideAlerts: data.filter(x => x.statewideAlerts).length.toString(),
      stateTemplate: data.filter(x => x.stateTemplate).length.toString(),
      JQuery: data.filter(x => x.JQuery).length.toString(),
      GoogleAnalytics: data.filter(x => x.GoogleAnalytics).length.toString(),
      errorcode: data.filter(x => x.error?.code).length.toString(),
      errormessage: data.filter(x => x.error?.message).length.toString()
    }
  ];

  data.forEach(row => {
    resultData.push({
      target: row.target,
      redirectURL: row.redirectURL || "",
      title: row.title || "",
      generator: row.generator || "",
      statewideAlerts: row.statewideAlerts || "",
      stateTemplate: row.stateTemplate || "",
      JQuery: row.JQuery || "",
      GoogleAnalytics: row.GoogleAnalytics ? row.GoogleAnalytics.join(",") : "",
      errorcode: row.error?.code || "",
      errormessage: row.error?.message || ""
    });
  });

  const csv = converter.json2csv(resultData);

  fs.writeFileSync("publish/data.csv", csv);
  console.log(csv);

  console.timeEnd("Done");
  process.exit();
})();
