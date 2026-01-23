// @ts-check

/**
 * @typedef {Object} DomainRecord
 * @property {string} domain
 * @property {string} preferredUrl
 * @property {number | null} lastStatus
 * @property {string | null} lastChecked
 * @property {string[]} redirects
 * @property {boolean | null} cloudflare
 * @property {boolean} cosmetic
 * @property {string | null} forwardsTo
 * @property {string} notes
 */

import fs from "node:fs";
import path from "node:path";
import { normalizeUrl } from "./normalizeUrl.mjs";

const DOMAIN_DIR = path.join(process.cwd(), "src/_data/domains");
const INGEST_FILE = path.join(process.cwd(), "src/ingest/ingestTarget.txt");

/**
 * Ensure the domain directory exists.
 */
function ensureDomainDir() {
  if (!fs.existsSync(DOMAIN_DIR)) {
    fs.mkdirSync(DOMAIN_DIR, { recursive: true });
  }
}

/**
 * Load an existing domain record from disk.
 * @param {string} filePath
 * @returns {DomainRecord | null}
 */
function loadRecord(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return /** @type {DomainRecord} */ (JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Write a domain record to disk.
 * @param {string} filePath
 * @param {DomainRecord} record
 */
function saveRecord(filePath, record) {
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
}

/**
 * Create a new starter domain record.
 * @param {string} domain
 * @param {string} preferredUrl
 * @returns {DomainRecord}
 */
function createStarterRecord(domain, preferredUrl) {
  return {
    domain,
    preferredUrl,
    lastStatus: null,
    lastChecked: null,
    redirects: [],
    cloudflare: null,
    cosmetic: false,
    forwardsTo: null,
    notes: ""
  };
}

/**
 * Ingest URLs from ingestTarget.txt and sync them into /src/_data/domains.
 */
export function ingestUrls() {
  ensureDomainDir();

  if (!fs.existsSync(INGEST_FILE)) {
    console.error("ingestTarget.txt not found. Create it in src/ingest/");
    return;
  }

  const urlList = fs.readFileSync(INGEST_FILE, "utf8");

  const urls = urlList
    .split(/\r?\n/)
    .map(u => u.trim())
    .filter(Boolean);

  for (const raw of urls) {
    const normalized = normalizeUrl(raw);
    if (!normalized) continue;

    const { domain, preferredUrl } = normalized;
    const filePath = path.join(DOMAIN_DIR, `${domain}.json`);

    /** @type {DomainRecord} */
    let record;

    if (fs.existsSync(filePath)) {
      const existing = loadRecord(filePath);
      if (existing) {
        record = existing;

        // Update preferredUrl if it's new or shorter
        if (
          !record.preferredUrl ||
          preferredUrl.length < record.preferredUrl.length
        ) {
          record.preferredUrl = preferredUrl;
        }
      } else {
        record = createStarterRecord(domain, preferredUrl);
      }
    } else {
      record = createStarterRecord(domain, preferredUrl);
    }

    saveRecord(filePath, record);
  }

  console.log(`Ingested ${urls.length} URL(s).`);
}
