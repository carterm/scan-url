// @ts-check

/**
 * @typedef {import("../types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import { createDomainRecord } from "../types/DomainRecord.mjs";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeUrl } from "./normalizeUrl.mjs";

import { loadRecord, saveRecord } from "../helpers/fileIO.mjs";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN_DIR = path.join(process.cwd(), "src/_data/domains");
const INGEST_FILE = path.join(__dirname, "ingestTarget.txt");

/**
 * Create a new starter DomainRecord.
 * @param {string} domain
 * @param {string} targetURL
 * @param {boolean} www
 * @returns {DomainRecord}
 */
function createStarterRecord(domain, targetURL, www) {
  const record = createDomainRecord();

  record.domain = domain;
  record.targetURL = targetURL;
  record.www = www;

  return record;
}

/**
 * Update an existing DomainRecord with new ingestion info.
 * Only updates fields that ingestion is responsible for.
 *
 * @param {DomainRecord} record
 * @param {string} targetURL
 * @param {boolean} www
 */
function updateRecordFromIngest(record, targetURL, www) {
  // Update targetURL only if the new one is "better"
  // Rule: shortest URL wins (e.g., https://example.com/ beats https://example.com/about)
  if (!record.targetURL || targetURL.length < record.targetURL.length) {
    record.targetURL = targetURL;
  }

  // Update www flag if new info indicates it should be true
  if (www && !record.www) {
    record.www = true;
  }

  // Ingestion does NOT touch:
  // - active
  // - includeInScan
  // - metaGenerator
  // - finalUrl
  // - responseHeaders
  // - httpVersion
  // - contentSize
  // - cloudflare, slow, template flags
  // - analytics, social links
  // - cosmeticTargetURL
  // - errorMessage
  // - notes
}

/**
 * Ingest URLs from ingestTarget.txt and sync them into /src/_data/domains.
 */
export function ingestUrls() {
  if (!fs.existsSync(INGEST_FILE)) {
    console.error("❌ ingestTarget.txt not found. Create it in src/ingest/");
    return;
  }

  if (!fs.existsSync(DOMAIN_DIR)) {
    fs.mkdirSync(DOMAIN_DIR, { recursive: true });
  }

  const urls = fs
    .readFileSync(INGEST_FILE, "utf8")
    .split(/\r?\n/)
    .map(u => u.trim());

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

ingestUrls();
