//@ts-check

const fs = require("node:fs");

const masterTimeoutMs = 5000;
// const stateTemplateCdnVersions = require("./state-template-cdn.json");

const { timeoutPromise } = require("./support.cjs");
const { CreateJsdomPromise } = require("./jsdomwork.cjs");

const urls = [
  ...new Set(
    fs
      .readFileSync(`${__dirname}/testtargets.txt`, {
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
        .catch(error => {
          // console.error(target, error);

          return {
            target,
            error: { message: error.message, code: error.code }
          };
        })
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

  fs.mkdirSync(`_results`, { recursive: true });
  fs.writeFileSync("_results/results.json", jsonResults);
};
(async () => {
  await processUrls();

  console.timeEnd("Done");
  process.exit();
})();
