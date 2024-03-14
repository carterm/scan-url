//@ts-check

const fs = require("node:fs");
const { timeoutPromise } = require("./support.cjs");
const { CreateJsdomPromise } = require("./jsdomwork.cjs");
const { loadAndSortUrls } = require("./loaders.cjs");
const { getUrlHashes } = require("./state-template-hash.cjs");

const masterTimeoutMs = parseInt(
  process.env.SCAN_MASTER_TIMEOUT || (500000).toString(),
  10
);

const inputFile = "testtargets.txt";
const resultsFolder = "_results";
const resultsFile = "results.json";

// const stateTemplateCdnVersions = require("./state-template-cdn.json");

const urls = loadAndSortUrls(inputFile);

const total = urls.length;
let remaining = total;
console.log(`Processing ${total} urls...`);
console.time("Done");

// Process the results (e.g., extract JavaScript links)
const processUrls = async () => {
  /** @type {any[]} */
  const errors = [];
  const results = await Promise.all(
    urls.map(target =>
      Promise.race([
        timeoutPromise(masterTimeoutMs),
        CreateJsdomPromise(target, errors)
      ])
        .catch(error => ({
          target,
          error: { message: error.message, code: error.code }
        }))
        .finally(() => {
          remaining--;
          console.log(
            `${target} ...done. ${remaining} remain (${((100 * (total - remaining)) / total).toFixed(0)}%).`
          );
        })
    )
  );

  // Add any errors reported to the terminal to the results
  errors.forEach(e => {
    Object.assign(
      results.find(r => r.target === e.target),
      e
    );
  });

  // Save results to a JSON file
  const jsonResults = JSON.stringify(results, null, 2);
  // Write jsonResults to a file (use fs module)

  fs.mkdirSync(resultsFolder, { recursive: true });
  fs.writeFileSync(`${resultsFolder}/${resultsFile}`, jsonResults);
};

const cdnversions = require("./state-template-cdn.json");

(async () => {
  /** @type {string[]} */
  const hashUrls = [];

  const CdnLocations = [
    "https://cdn.cdt.ca.gov/cdt/statetemplate/",
    "https://california.azureedge.net/cdt/statetemplate/"
  ];

  const CdnFilePaths = [
    "/css/cagov.core.css",
    "/css/cagov.core.min.css",
    "/js/cagov.core.js",
    "/js/cagov.core.min.js"
  ];

  cdnversions.forEach(version => {
    CdnLocations.forEach(cdnpath => {
      CdnFilePaths.forEach(filepath => {
        hashUrls.push(cdnpath + version + filepath);
      });
    });
  });

  const fileHashData = await getUrlHashes(hashUrls);

  await processUrls();

  console.timeEnd("Done");
  process.exit();
})();
