//@ts-check
const { JSDOM, VirtualConsole, ResourceLoader } = require("jsdom");
const { fetch, Agent } = require("undici");
const { performance } = require("node:perf_hooks");

const fetchTimeout = 15000; //15 seconds
/**
 * Process the JSDOM object to extract relevant information
 * @param {import("jsdom").JSDOM} dom
 * @param {string} target
 * @param {import("undici").Response} response
 * @param {number} duration
 */
const processDom = (dom, target, response, duration) => {
  const doc = dom.window.document;

  const scripts = [...doc.scripts]
    .map(x => x.src)
    .filter(x => x)
    .map(x => new URL(x, target).href);

  const code = [...doc.scripts].map(x => `${x.text};${x.src}`).join(";");
  const GA = /GTM-\w{7}|G-\w{10}|UA-\d{7,8}-\d{1,2}/gim;
  const GoogleAnalytics = [...new Set(code.toUpperCase().match(GA))].sort();
  const headers = Object.fromEntries(response.headers.entries());

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
    stateTemplate: scripts.find(
      x => x.includes("cagov.core") || x.includes("caweb-core")
    ),
    JQuery: scripts.find(x => x.includes("jquery")),
    GoogleAnalytics: GoogleAnalytics.length ? GoogleAnalytics : undefined,
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    duration,
    headers
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
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", e => {
    errors.push({ target, error: e });
  });

  const insecureAgent = new Agent({
    connect: { rejectUnauthorized: false, timeout: fetchTimeout },
    bodyTimeout: fetchTimeout, // time allowed for the body to be received
    headersTimeout: fetchTimeout // time allowed for headers
  });

  //console.log(`Fetching: ${target}`);

  const start = performance.now();
  //console.time(`Fetching: ${target}`);

  // Let fetch handle redirects automatically
  /** @type {import("undici").Response} */
  let response;
  try {
    response = await fetch(target, {
      dispatcher: insecureAgent,
      redirect: "follow"
    });
  } catch (e) {
    return {
      target,
      // @ts-ignore
      errorcode: e.message,
      // @ts-ignore
      errormessage: e.cause?.message || ""
    };
  }
  const end = performance.now();
  const duration = Math.round((end - start) / 1000);
  //console.log(`Fetching ${target} took ${durationMs.toFixed(2)} ms`);

  const finalUrl = response.url;

  const html = await response.text();

  const dom = new JSDOM(html, {
    url: finalUrl,
    resources: new CustomResourceLoader(),
    virtualConsole
  });
  //console.timeEnd(`Fetching: ${target}`);

  return processDom(dom, target, response, duration);
};

module.exports = { processDom, CreateJsdomPromise };
