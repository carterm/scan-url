//@ts-check

const fs = require("node:fs");
const { JSDOM, VirtualConsole, ResourceLoader } = require("jsdom");
const { URL } = require("node:url");
const requestTimeout = 5000;
// const stateTemplateCdnVersions = require("./state-template-cdn.json");

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

  const code = [...doc.scripts].map(x => `${x.text};${x.src}`).join(";");
  const GA = /GTM-\w{7}|G-\w{10}|UA-\d{7,8}-\d{1,2}/gim;
  const GoogleAnalytics = [...new Set(code.match(GA))].sort();

  return {
    target,
    redirectURL: doc.URL !== target ? doc.URL : undefined,
    generator: /** @type {HTMLMetaElement} */ (
      doc.head.querySelector("meta[name=generator i]")
    )?.content,
    statewideAlerts: scripts.find(x => x.includes("alert.cdt.ca.gov")),
    stateTemplate: scripts.find(x => x.includes("cagov.core")),
    JQuery: scripts.find(x => x.includes("jquery")),
    GoogleAnalytics: GoogleAnalytics.length ? GoogleAnalytics : undefined
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
      // console.log(`skipping - ${url}`);
      return null;
    }
    return super.fetch(url, options);
  }
}

/**
 * @param {string} target
 * @param {any[]} errors
 */
const CreateJsdomPromise = async (target, errors) => {
  // Virtual Console shows errors processing the dom without stopping execution
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", e => {
    errors.push({
      target,
      error: e
    });
  });

  const dom = await JSDOM.fromURL(target, {
    //runScripts: "dangerously",
    //pretendToBeVisual: true,
    resources: new CustomResourceLoader(),
    virtualConsole
  });
  return processDom(dom, target);
};

// Process the results (e.g., extract JavaScript links)
const processUrls = async () => {
  /** @type {any[]} */
  const errors = [];
  const results = await Promise.all(
    urls.map(target =>
      Promise.race([
        new Promise((_resolve, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Timeout: All requests took longer than ${requestTimeout} ms.`
              )
            );
          }, requestTimeout);
        }),
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
