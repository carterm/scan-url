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
  const GoogleAnalytics = [...new Set(code.toUpperCase().match(GA))].sort();

  //if (target == "https://www.p65warnings.ca.gov/") {
  //  let x = 1;
  //}
  let redirectURL = doc.URL !== target ? doc.URL : undefined;
  if (redirectURL?.startsWith("https://login.microsoftonline.com")) {
    redirectURL = "[login.microsoftonline.com]";
  }
  if (redirectURL?.startsWith(target)) {
    //remove the host in redirect if it matches target
    redirectURL = redirectURL.replace(target, "/");
  }
  const title =
    (doc.title?.trim().length
      ? doc.title.trim()
      : /** @type {HTMLMetaElement} */ (
          doc.head.querySelector("meta[name=title i]") ||
            doc.head.querySelector(
              'meta[name="og:title" i], meta[property="og:title" i]'
            ) ||
            doc.head.querySelector(
              'meta[name="twitter:title" i], meta[property="twitter:title" i]'
            ) ||
            doc.head.querySelector('meta[name="author" i]') ||
            doc.head.querySelector('meta[name="description" i]')
        )?.content) || "";

  return {
    target,
    redirectURL,
    title,
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
