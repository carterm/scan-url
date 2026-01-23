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
  "x-requestid"
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
    const duration = Math.round((end - start) / 1000);
    //console.log(`Fetching ${url} took ${duration} S`);
  }

  const status = res.status;
  const finalUrl = res.url;

  /**
   * @type {{ name: string; value: string }[]}
   */
  const headers = [];
  res.headers.forEach((value, name) => {
    if (!removeHeaders.includes(name.toLowerCase())) {
      headers.push({ name, value });
    }
  });
  domainRecord.responseHeaders = headers;

  const body = await res.text();
  const contentSize = Buffer.byteLength(body);

  // Basic Cloudflare detection (non-bypass)
  const cloudflareChallenge =
    (status === 200 && body.includes("cf-browser-verification")) ||
    body.includes("Just a moment");

  // If Cloudflare challenge or 4xx/5xx → return minimal result
  if (status >= 400 || cloudflareChallenge) {
    domainRecord.lastStatus = status;
    domainRecord.finalUrl = finalUrl;

    domainRecord.cloudflare = cloudflareChallenge;
    domainRecord.errorMessage = cloudflareChallenge
      ? "Cloudflare challenge detected"
      : `HTTP ${status}`;

    return domainRecord;
  }

  // Parse HTML
  const dom = new JSDOM(body, {
    url: finalUrl,
    resources: new CustomResourceLoader(),
    virtualConsole
  });

  const doc = dom.window.document;

  const title = doc.querySelector("title")?.textContent?.trim() || "";

  const metaGenerator =
    doc.querySelector('meta[name="generator"]')?.getAttribute("content") ||
    null;

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

  const socialLinks = anchorLinks
    .map(a => a.href)
    .filter(href => SOCIAL_DOMAINS.some(d => href.includes(d)));

  // CA.gov link detection
  const linksToCaGov = anchorLinks.some(a => {
    try {
      const u = new URL(a.href);
      const host = u.hostname.toLowerCase();
      return host === "ca.gov" || host === "www.ca.gov";
    } catch {
      return false;
    }
  });

  domainRecord.lastStatus = status;
  domainRecord.finalUrl = finalUrl;
  domainRecord.cloudflare = false;
  domainRecord.title = title;
  domainRecord.metaGenerator = metaGenerator;
  domainRecord.socialLinks = socialLinks;
  domainRecord.linksToCaGov = linksToCaGov;
  domainRecord.errorMessage = null;

  return domainRecord;
}
