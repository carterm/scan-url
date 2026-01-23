// @ts-check

/**
 * @typedef {import("../types/DomainRecord.cjs").DomainRecord} DomainRecord
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeUrl } from "./normalizeUrl.mjs";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN_DIR = path.join(process.cwd(), "src/_data/domains");
const INGEST_FILE = path.join(__dirname, "ingestTarget.txt");

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
 * @param {string} preferredPath
 * @param {boolean} www
 * @returns {DomainRecord}
 */
function createStarterRecord(domain, preferredPath, www) {
  return {
    domain,
    preferredPath,
    www,
    title: `title for ${domain}`,
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
    console.error("❌ ingestTarget.txt not found. Create it in src/ingest/");
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

    const { domain, preferredPath, www } = normalized;
    const filePath = path.join(DOMAIN_DIR, `${domain}.json`);

    /** @type {DomainRecord} */
    let record;

    if (fs.existsSync(filePath)) {
      const existing = loadRecord(filePath);
      if (existing) {
        record = existing;

        // Update preferredPath if new one is shorter ("/" wins)
        if (
          !record.preferredPath ||
          preferredPath.length < record.preferredPath.length
        ) {
          record.preferredPath = preferredPath;
        }

        // Update www flag if new info arrives
        if (www && !record.www) {
          record.www = true;
        }
      } else {
        record = createStarterRecord(domain, preferredPath, www);
      }
    } else {
      record = createStarterRecord(domain, preferredPath, www);
    }

    saveRecord(filePath, record);
  }

  console.log(`✅ Ingested ${urls.length} URL(s).`);
}

// Auto-run when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestUrls();
}
