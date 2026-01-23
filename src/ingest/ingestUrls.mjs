// @ts-check

/**
 * @typedef {import("../types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import { createDomainRecord } from "../types/DomainRecord.mjs";

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
  const domainRecord = createDomainRecord();
  domainRecord.domain = domain;
  domainRecord.preferredPath = preferredPath;
  domainRecord.www = www;
  domainRecord.title = "Title for " + domain;
  return domainRecord;
}

/**
 * Update an existing record with new ingestion info.
 * @param {DomainRecord} record
 * @param {string} preferredPath
 * @param {boolean} www
 */
function updateRecordFromIngest(record, preferredPath, www) {
  if (preferredPath.length < record.preferredPath.length) {
    record.preferredPath = preferredPath;
  }

  if (www && !record.www) {
    record.www = true;
  }
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

  const urls = fs
    .readFileSync(INGEST_FILE, "utf8")
    .split(/\r?\n/)
    .map(u => u.trim())
    .filter(Boolean);

  for (const raw of urls) {
    const normalized = normalizeUrl(raw);
    if (!normalized) continue;

    const { domain, preferredPath, www } = normalized;
    const filePath = path.join(DOMAIN_DIR, `${domain}.json`);

    const record =
      loadRecord(filePath) ?? createStarterRecord(domain, preferredPath, www);

    updateRecordFromIngest(record, preferredPath, www);

    saveRecord(filePath, record);
  }

  console.log(`✅ Ingested ${urls.length} URL(s).`);
}

// Auto-run when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestUrls();
}
