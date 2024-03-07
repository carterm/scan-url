//@ts-check

const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs");
const { JSDOM } = require("jsdom");

const urls = fs
  .readFileSync(`${__dirname}/targets.txt`, {
    encoding: "utf-8"
  })
  .split("\n");

/**
 * @param {string} url
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

const processUrls = async () => {
  const results = await Promise.all(
    urls.map(u =>
      getScript(u)
        .then(response => {
          const dom = new JSDOM(response);
          const links = dom.window.document.querySelectorAll("a");

          links.forEach(link => {
            console.log(link.href);
          });
        })
        .catch(err => {
          console.error(err);
        })
    )
  );
  // Process the results (e.g., extract JavaScript links)

  // Save results to a JSON file
  const jsonResults = JSON.stringify(results, null, 2);
  // Write jsonResults to a file (use fs module)

  fs.writeFileSync("results.json", jsonResults);
};

processUrls();
