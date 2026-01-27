//@ts-check
/**
 * @typedef {import("./types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import { createDomainRecord } from "./types/DomainRecord.mjs";

import { fetch, Agent } from "undici";
import { performance } from "node:perf_hooks";
import { JSDOM, VirtualConsole, ResourceLoader } from "jsdom";

const removeHeaders = [
  "akamai-grn",
  "age",
  "date",
  "x-cache",
  "x-cache-hits",
  "x-served-by",
  "x-timer",
  "cf-ray",
  "set-cookie",
  "etag",
  "content-length",
  "x-envoy-upstream-service-time",
  "x-azure-ref",
  "via",
  "x-amz-cf-id",
  "last-modified",
  "cache-control",
  "content-security-policy",
  "content-security-policy-report-only",
  "request-id",
  "sprequestduration",
  "sprequestguid",
  "x-iinfo",
  "x-runtime",
  "keep-alive",
  "expires",
  "x-vercel-id",
  "server-timing",
  "x-contextid",
  "cf-cache-status",
  "x-request-id",
  "x-cache-status",
  "x-ac",
  "x-volterra-location",
  "x-tenup-cache",
  "report-to",
  "x-cache-age",
  "x-cache-ttl-remaining",
  "x-varnish",
  "x-sucuri-cache",
  "shopify-complexity-score",
  "x-rq",
  "x-amz-id-2",
  "x-amz-request-id",
  "x-wt",
  "x-orig-cache-control",
  "x-rack-cache",
  "x-drupal-dynamic-cache",
  "x-ms-request-id",
  "x-btcache",
  "x-pantheon-styx-hostname",
  "x-styx-req-id",
  "x-requestid",
  "x-nananana",
  "x-drupal-cache",
  "x-seen-by",
  "x-wix-request-id",
  "x-ms-middleware-request-id",
  "x-transaction-id",
  "x-middleware-start",
  "x-varnish-cache",
  "cache-tag",
  "x-amz-cf-pop",
  "x-cache-info",
  "ki-cf-cache-status",
  "on-ws",
  "x-shopid",
  "x-sorting-hat-shopid",
  "x-shardid"
];

const fetchTimeout = 15000; //15 seconds

const insecureAgent = new Agent({
  connect: { rejectUnauthorized: false, timeout: fetchTimeout },
  bodyTimeout: fetchTimeout, // time allowed for the body to be received
  headersTimeout: fetchTimeout // time allowed for headers
});

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
 * @param {string} url
 * @returns {Promise<DomainRecord>}
 */
export async function fetchAndAnalyze(url) {
  const domainRecord = createDomainRecord();
  domainRecord.targetURL = url;

  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", e => {
    console.log(`⚠️ JSDOM error for ${url}: ${e.message}`);
  });

  const start = performance.now();
  let duration = 0;
  // Let fetch handle redirects automatically
  /** @type {import("undici").Response} */
  let res;
  try {
    res = await fetch(url, {
      dispatcher: insecureAgent,
      redirect: "follow"
    });
  } catch (e) {
    //@ts-ignore
    domainRecord.errorMessage = `Fetch error: ${e.message} ${e.cause?.message || ""}`;

    return domainRecord;
  } finally {
    const end = performance.now();
    duration = Math.round((end - start) / 1000);
    //console.log(`Fetching ${url} took ${duration} S`);
  }

  domainRecord.lastStatus = res.status;
  domainRecord.finalUrl = res.url;
  domainRecord.responseHeaders = {};
  res.headers.forEach((value, name) => {
    if (!removeHeaders.includes(name.toLowerCase())) {
      domainRecord.responseHeaders[name] = domainRecord.responseHeaders[name]
        ? domainRecord.responseHeaders[name] + "; " + value
        : value;
    }
  });

  const cacheControl = res.headers.get("cache-control")?.toLowerCase();
  if (cacheControl) {
    domainRecord.nocache =
      cacheControl.includes("no-store") ||
      cacheControl.includes("no-cache") ||
      cacheControl.includes("max-age=0");
  }

  const body = await res.text();
  //const contentSize = Buffer.byteLength(body);

  // Basic Cloudflare detection (non-bypass)
  domainRecord.cloudflare =
    (domainRecord.lastStatus === 200 &&
      body.includes("cf-browser-verification")) ||
    body.includes("Just a moment");

  // If Cloudflare challenge or 4xx/5xx → return minimal result
  if (domainRecord.lastStatus >= 400 || domainRecord.cloudflare) {
    domainRecord.errorMessage = domainRecord.cloudflare
      ? "Cloudflare challenge detected"
      : `HTTP ${domainRecord.lastStatus}`;

    return domainRecord;
  }

  // Parse HTML
  const dom = new JSDOM(body, {
    url: res.url,
    resources: new CustomResourceLoader(),
    virtualConsole
  });

  const doc = dom.window.document;

  let redirectURL = doc.URL !== url ? doc.URL : undefined;
  if (redirectURL?.startsWith("https://login.microsoftonline.com")) {
    redirectURL = "[login.microsoftonline.com]";
  }
  if (redirectURL?.startsWith(url)) {
    //remove the host in redirect if it matches target
    redirectURL = redirectURL.replace(url, "/");
  }
  domainRecord.finalUrl = redirectURL ?? "";

  const scripts = [...doc.scripts]
    .map(x => x.src)
    .filter(x => x)
    .map(x => new URL(x, res.url).href);

  domainRecord.title =
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

  domainRecord.metaGenerator = /** @type {HTMLMetaElement} */ (
    doc.head.querySelector("meta[name=generator i]")
  )?.content;

  domainRecord.hasStatewideAlerts = scripts.some(x =>
    x.includes("alert.cdt.ca.gov")
  );

  domainRecord.usesStateTemplate = scripts.some(
    x => x.includes("cagov.core") || x.includes("caweb-core")
  );

  domainRecord.hasJQuery = scripts.some(x => x.includes("jquery"));

  const code = [...doc.scripts].map(x => `${x.text};${x.src}`).join(";");
  const GA = /GTM-\w{7}|G-\w{10}|UA-\d{7,8}-\d{1,2}/gim;

  domainRecord.googleAnalytics = [
    ...new Set(code.toUpperCase().match(GA))
  ].sort();

  domainRecord.slow = duration >= 5;

  // Social links
  const SOCIAL_DOMAINS = [
    "facebook.com",
    "twitter.com",
    "x.com",
    "instagram.com",
    "linkedin.com",
    "youtube.com",
    "tiktok.com"
  ];

  const anchorLinks = /** @type {HTMLAnchorElement[]} */ ([
    ...doc.querySelectorAll("a[href]")
  ]);

  domainRecord.socialLinks = [
    ...new Set(
      anchorLinks
        .map(a => a.href)
        .filter(href => SOCIAL_DOMAINS.some(d => href.includes(d)))
    )
  ].sort();

  // CA.gov link detection
  domainRecord.linksToCaGov = anchorLinks.some(a => {
    try {
      const u = new URL(a.href);
      const host = u.hostname.toLowerCase();
      return host === "ca.gov" || host === "www.ca.gov";
    } catch {
      return false;
    }
  });

  return domainRecord;
}
