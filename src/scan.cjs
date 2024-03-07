//@ts-check

const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs");
const { JSDOM } = require("jsdom");
const { URL } = require("node:url");

const urls = fs
  .readFileSync(`${__dirname}/targets.txt`, {
    encoding: "utf-8"
  })
  .split("\n")
  .filter(x => x);

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
const getScript = url => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, resp => {
        let data = "";
        resp.on("data", chunk => {
          data += chunk;
        });
        resp.on("end", () => {
          resolve(data);
        });
      })
      .on("error", err => {
        reject(err);
      });
  });
};

// Process the results (e.g., extract JavaScript links)
const processUrls = async () => {
  const results = await Promise.all(
    urls.map(target =>
      getScript(target)
        .then(response => {
          const dom = new JSDOM(response);

          const scripts = [...dom.window.document.scripts]
            .map(x => x.src)
            .filter(x => x)
            .map(x => new URL(x, target).href);

          const stateTemplate = scripts.find(x => x.includes("cagov.core"));
          const JQuery = scripts.find(x => x.includes("jquery"));

          return {
            target,
            scripts,
            statewideAlerts: scripts.includes("https://alert.cdt.ca.gov/"),
            stateTemplate,
            JQuery
          };
        })
        .catch(err => {
          console.error(err);
        })
    )
  );

  // Save results to a JSON file
  const jsonResults = JSON.stringify(results, null, 2);
  // Write jsonResults to a file (use fs module)

  fs.writeFileSync("results.json", jsonResults);
};

processUrls();
