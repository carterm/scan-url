//@ts-check

const fs = require("node:fs");

console.time("Done");

(async () => {
  const data = require("../_results/good.json");

  const result = {
    total: data.length,
    alertCount: data.filter(x => x.statewideAlerts).length,
    stateTemplateCount: data.filter(x => x.stateTemplate).length
  };
  fs.writeFileSync("_results/report.json", JSON.stringify(result, null, 2));

  console.timeEnd("Done");
  process.exit();
})();
