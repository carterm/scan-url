//@ts-check
/**
 * @typedef {import("../types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import fs from "node:fs";

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
 * Save a DomainRecord JSON file.
 * @param {string} filePath
 * @param {DomainRecord} record
 */
export function saveRecord(filePath, record) {
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
}
