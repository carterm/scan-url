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
  .map(x => x.trim())
  .filter(x => x.startsWith("http"));

/**
 * @param {string} target
 * @returns {Promise<string>}
 */
const getScript = target => {
  return new Promise((resolve, reject) => {
    const client = target.startsWith("https") ? https : http;

    client
      .get(target, resp => {
        let data = "";
        resp.on("data", chunk => {
          data += chunk;
        });
        resp.on("end", () => {
          if (resp.statusCode !== 200) {
            const error = {
              statusCode: resp.statusCode,
              statusMessage: resp.statusMessage,
              location: resp.headers.location
            };
            if (!error.location) {
              delete error.location;
            }

            reject({
              target,
              error
            });
          }

          resolve(data);
        });
      })
      .on("error", error => {
        reject({ target, error });
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
            statewideAlerts: scripts.includes("https://alert.cdt.ca.gov/"),
            stateTemplate,
            JQuery
          };
        })
        .catch(err => {
          //console.error(err);
          return err;
        })
    )
  );

  // Save results to a JSON file
  const jsonResults = JSON.stringify(results, null, 2);
  // Write jsonResults to a file (use fs module)

  fs.writeFileSync("results.json", jsonResults);
};

processUrls();
