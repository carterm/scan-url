//@ts-check

const fs = require("node:fs");
const { JSDOM } = require("jsdom");
const { URL } = require("node:url");

const urls = fs
  .readFileSync(`${__dirname}/targets.txt`, {
    encoding: "utf-8"
  })
  .split("\n")
  .map(x => x.trim())
  .filter(x => x.startsWith("http"));

// Process the results (e.g., extract JavaScript links)
const processUrls = async () => {
  const results = await Promise.all(
    urls.map(target =>
      JSDOM.fromURL(target, {})
        .then(dom => {
          const scripts = [...dom.window.document.scripts]
            .map(x => x.src)
            .filter(x => x)
            .map(x => new URL(x, target).href);

          const stateTemplate = scripts.find(x => x.includes("cagov.core"));
          const JQuery = scripts.find(x => x.includes("jquery"));

          return {
            target,
            statewideAlerts: scripts.includes("https://alert.cdt.ca.gov/"),
            stateTemplate,
            JQuery
          };
        })
        .catch(error => {
          // console.error(target, error);
          return { target, error: { message: error.message } };
        })
    )
  );

  // Save results to a JSON file
  const jsonResults = JSON.stringify(results, null, 2);
  // Write jsonResults to a file (use fs module)

  fs.writeFileSync("results.json", jsonResults);
};

processUrls();
