//@ts-check

/**
 * @typedef {import("../types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import fs from "node:fs";
import path from "node:path";
import { loadRecord, saveRecord } from "../helpers/fileIO.mjs";

const DOMAIN_DIR = path.join(process.cwd(), "src/_data/domains");
const ingestFile = path.join(process.cwd(), "scan/ingest/ingestTarget.txt");

function loadAllDomainRecords() {
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

async function buildIngestTargets() {
  const items = loadAllDomainRecords();

  // write all the target URLs to a file for ingestion
  const targetURLs = items
    .filter(({ record }) => record.includeInScan)
    .map(({ record }) => record.targetURL)

    .filter(Boolean);

  targetURLs.sort();

  fs.writeFileSync(ingestFile, targetURLs.join("\n"), "utf-8");

  console.log(`Wrote ${targetURLs.length} target URLs to ${ingestFile}`);
}

await buildIngestTargets();
