//@ts-check

const fs = require("node:fs");
const { JSDOM, VirtualConsole, ResourceLoader } = require("jsdom");
const { URL } = require("node:url");
const requestTimeout = 5000;

/*
const data = require("../_results/all results.json");

fs.writeFileSync(
  "_results/good.txt",
  data
    .filter(x => !x.error)
    .map(x => x.target)
    .join("\n")
);
*/

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

const total = urls.length;
let remaining = total;
console.log(`Processing ${total} urls...`);
console.time("Done");

/**
 *
 * @param {JSDOM} dom
 * @param {string} target
 */
const processDom = (dom, target) => {
  const doc = dom.window.document;

  const scripts = [...doc.scripts]
    .map(x => x.src)
    .filter(x => x)
    .map(x => new URL(x, target).href);

  return {
    target,
    redirectURL: doc.URL !== target ? doc.URL : undefined,
    generator: /** @type {HTMLMetaElement} */ (
      doc.head.querySelector("meta[name=generator i]")
    )?.content,
    statewideAlerts: scripts.find(x => x.includes("alert.cdt.ca.gov")),
    stateTemplat: scripts.find(x => x.includes("cagov.core")),
    JQuery: scripts.find(x => x.includes("jquery"))
  };
};

class CustomResourceLoader extends ResourceLoader {
  /**
   *
   * @param {string} url
   * @param {import("jsdom").FetchOptions} options
   */
  fetch(url, options) {
    if (options.referrer) {
      // Ignore externals
      return null;
    }
    return super.fetch(url, options);
  }
}

//This will hide processing errors
const virtualConsole = new VirtualConsole();
//virtualConsole.on("jsdomError", e => {
//console.error("something", e);
//});

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
          resources: new CustomResourceLoader(),
          virtualConsole
        }).then(dom => processDom(dom, target))
      ])
        .catch(error => {
          // console.error(target, error);
          //console.log(`${target}...error.`);
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

  // Save results to a JSON file
  const jsonResults = JSON.stringify(results, null, 2);
  // Write jsonResults to a file (use fs module)

  fs.writeFileSync("_results/results.json", jsonResults);
};
(async () => {
  await processUrls();

  console.timeEnd("Done");
  process.exit();
})();
