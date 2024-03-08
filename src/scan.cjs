//@ts-check

const fs = require("node:fs");
const { JSDOM } = require("jsdom");
const { URL } = require("node:url");
const requestTimeout = 10000;

const urls = [
  ...new Set(
    fs
      .readFileSync(`${__dirname}/targets.txt`, {
        encoding: "utf-8"
      })
      .split("\n")
      .map(x => x.trim())
      .filter(x => x)
      .filter(x => !x.startsWith("//")) //remove comments
      .map(x => (x.includes("/") ? x : `${x}/`))
      .map(x => (x.startsWith("http") ? x : `https://${x}`))
  )
].sort();

console.log(`Processing ${urls.length} urls...`);

/**
 *
 * @param {JSDOM} dom
 * @param {String} target
 */
const processDom = (dom, target) => {
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
};

// Process the results (e.g., extract JavaScript links)
const processUrls = async () => {
  const results = await Promise.all(
    urls.map(target =>
      Promise.race([
        new Promise((_resolve, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Timeout: Request took longer than ${requestTimeout} ms.`
              )
            );
          }, requestTimeout);
        }),
        JSDOM.fromURL(target, {
          beforeParse: () => console.log(`${target}...parsing`)
        }).then(dom => processDom(dom, target))
      ])
        .catch(error => {
          // console.error(target, error);
          console.log(`${target}...error.`);
          return {
            target,
            error: { message: error.message, code: error.code }
          };
        })
        .finally(() => {
          console.log(`${target}...done.`);
        })
    )
  );

  // Save results to a JSON file
  const jsonResults = JSON.stringify(results, null, 2);
  // Write jsonResults to a file (use fs module)

  fs.writeFileSync("results.json", jsonResults);
};
(async () => {
  await processUrls();

  console.log(`done.`);
})();
