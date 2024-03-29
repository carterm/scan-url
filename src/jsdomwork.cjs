//@ts-check
const { JSDOM, VirtualConsole, ResourceLoader } = require("jsdom");

/**
 *
 * @param {import("jsdom").JSDOM} dom
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

module.exports = { processDom, CreateJsdomPromise };
