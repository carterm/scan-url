//@ts-check
/**
 * @typedef {import("../types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import fs from "node:fs";
import path from "node:path";
const DOMAIN_DIR = path.join(process.cwd(), "src/_data/domains");

/**
 * Load a DomainRecord JSON file.
 * @param {string} filePath
 * @returns {DomainRecord | null}
 */
export function loadRecord(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    // @ts-ignore
    console.warn(`⚠️ Could not load ${filePath}: ${err.message}`);
    return null;
  }
}

/**
 * Load all DomainRecord JSON files in the DOMAIN_DIR.
 */
export function loadAllDomainRecords() {
  const files = fs.readdirSync(DOMAIN_DIR).filter(f => f.endsWith(".json"));
  const items = [];
  for (const file of files) {
    const filePath = path.join(DOMAIN_DIR, file);
    const record = loadRecord(filePath);
    if (record) {
      items.push({ filePath, record });
    }
  }
  return items;
}

/**
 * Save a DomainRecord JSON file.
 * @param {string} filePath
 * @param {DomainRecord} record
 */
export function saveRecord(filePath, record) {
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
}
