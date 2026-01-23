//@ts-check
/**
 * @typedef {import("./types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import { createDomainRecord } from "./types/DomainRecord.mjs";

import fetch from "node-fetch";
import https from "node:https";
import { JSDOM } from "jsdom";

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * @param {string} url
 * @returns {Promise<DomainRecord>}
 */
export async function fetchAndAnalyze(url) {
  const start = Date.now();

  const domainRecord = createDomainRecord();

  const res = await fetch(url, {
    redirect: "follow",
    agent: insecureAgent
  });

  const status = res.status;
  const finalUrl = res.url;

  /**
   * @type {{ name: string; value: string }[]}
   */
  const headers = [];
  res.headers.forEach((value, name) => {
    headers.push({ name, value });
  });

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
    domainRecord.responseHeaders = headers;
    domainRecord.contentSize = contentSize;
    domainRecord.cloudflare = cloudflareChallenge;
    domainRecord.errorMessage = cloudflareChallenge
      ? "Cloudflare challenge detected"
      : `HTTP ${status}`;

    return domainRecord;
  }

  // Parse HTML
  const dom = new JSDOM(body);
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
  domainRecord.responseHeaders = headers;
  domainRecord.contentSize = contentSize;
  domainRecord.cloudflare = false;
  domainRecord.title = title;
  domainRecord.metaGenerator = metaGenerator;
  domainRecord.socialLinks = socialLinks;
  domainRecord.linksToCaGov = linksToCaGov;
  domainRecord.errorMessage = null;

  return domainRecord;
}
