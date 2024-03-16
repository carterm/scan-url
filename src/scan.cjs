//@ts-check

const fs = require("node:fs");
const { timeoutPromise } = require("./support.cjs");
const { CreateJsdomPromise } = require("./jsdomwork.cjs");
const { loadAndSortUrls } = require("./loaders.cjs");
const { getUrlHashes } = require("./urlHash.cjs");

const masterTimeoutMs = parseInt(
  process.env.SCAN_MASTER_TIMEOUT || (500000).toString(),
  10
);

const inputFile = "testtargets.txt";
const resultsFolder = "_results";
const resultsFile = "results.json";
const hashesFile = "hashes.json";

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
const CdnFilePaths = [
  "/css/cagov.core.css",
  "/css/cagov.core.min.css",
  "/js/cagov.core.js",
  "/js/cagov.core.min.js"
];

(async () => {
  const hashUrls = cdnversions.flatMap(version =>
    CdnFilePaths.map(
      filepath =>
        `https://cdn.cdt.ca.gov/cdt/statetemplate/${version}${filepath}`
    )
  );

  console.log("downloading hashes...");
  const fileHashData = await getUrlHashes(hashUrls);

  const cdnReplacements = [
    { from: "https://", to: "http://" },
    {
      from: "://cdn.cdt.ca.gov/",
      to: "://california.azureedge.net/"
    }
  ];

  cdnReplacements.forEach(replacement => {
    const clone = structuredClone(fileHashData);

    clone.forEach(c => {
      c.url = c.url.replace(replacement.from, replacement.to);
    });

    fileHashData.push(...clone);
  });

  fs.mkdirSync(resultsFolder, { recursive: true });
  fs.writeFileSync(
    `${resultsFolder}/${hashesFile}`,
    JSON.stringify(fileHashData, null, 2)
  );

  await processUrls();

  console.timeEnd("Done");
  process.exit();
})();
