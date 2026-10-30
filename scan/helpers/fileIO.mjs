//@ts-check
/**
 * @typedef {import("../types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import fs from "node:fs";
import path from "node:path";
const DOMAIN_DIR = path.join(process.cwd(), "src/_data/domains");
let failures = []; // we'll store them here so we can do one JSON write at the end and get valid JSON out.

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
    if (record) items.push({ filePath, record });
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

export function saveFailure(record, searchString) {
  if(typeof searchString === "string"){  // if a search string was provided
    if(record.errorMessage === undefined || record.errorMessage.indexOf(searchString) === -1) {  // but there's no error message or the search string wasn't found
      return; // using this reversed logic because we only want to return *if* a search_string was provided *and* it's not present. Otherwise, all records should be written.
    }
  }
  // save out a smaller record to write later to a dedicated failures file
  failures.push({'domain':record.domain, 'errorMessage':record.errorMessage});
}

export function writeFailures(filePath) {
  fs.writeFileSync(filePath, JSON.stringify(failures, null, 2));
}
