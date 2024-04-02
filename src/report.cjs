//@ts-check

const fs = require("node:fs");

console.time("Done");

(async () => {
  const data = require("../_results/results.json");

  const result = {
    total: data.length,
    alertCount: data.filter(x => x.statewideAlerts).length,
    stateTemplateCount: data.filter(x => x.stateTemplate).length,
    GoogleAnalytics: data.filter(x => x.GoogleAnalytics).length,
    GoogleAnalytics_G: data.filter(x =>
      x.GoogleAnalytics?.some(y => y.startsWith("G-"))
    ).length,
    GoogleAnalytics_UA: data.filter(x =>
      x.GoogleAnalytics?.some(y => y.startsWith("UA-"))
    ).length
  };
  fs.writeFileSync("_results/report.json", JSON.stringify(result, null, 2));

  const newList = [
    ...new Set(
      data.map(x => {
        if (x.redirectURL && x.redirectURL.endsWith("/")) {
          if (x.redirectURL?.split("/").length == 4) {
            return x.redirectURL;
          }
        }

        return x.target;
      })
    )
  ];

  newList.sort();

  fs.writeFileSync("_results/resort.txt", newList.join("\n"));
  console.log(result);

  console.timeEnd("Done");
  process.exit();
})();
