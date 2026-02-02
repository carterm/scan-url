//@ts-check
/**
 * @typedef {import("./types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import fs from "node:fs";
import path from "node:path";
import pLimit from "p-limit";
import { fetchAndAnalyze } from "./fetchAndAnalyze.mjs";
import { loadRecord, saveRecord } from "./helpers/fileIO.mjs";

const DOMAIN_DIR = path.join(process.cwd(), "src/_data/domains");
const limit = pLimit(40);

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

async function scanAll() {
  const items = loadAllDomainRecords();

  const tasks = items.map(({ filePath, record }) =>
    limit(async () => {
      if (!record.includeInScan) {
        console.log(`🚫 Skipped ${record.domain}`);
        return;
      }

      const scan = await fetchAndAnalyze(record);

      if (JSON.stringify(record) !== JSON.stringify(scan)) {
        scan.goodScan = !scan.errorMessage;
        if (!record.goodScan || scan.goodScan) {
          saveRecord(filePath, scan);
          console.log(`📝 Updated save ${record.domain}`);
        } else {
          console.log(`❌ Error ${record.domain} (${scan.errorMessage})`);
        }
      } else {
        console.log(`✅ Scanned ${record.domain}`);
      }
    })
  );

  await Promise.all(tasks);
}

console.time("scanAll");
await scanAll();
console.timeEnd("scanAll");
