//@ts-check
/**
 * @typedef {import("./types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import pLimit from "p-limit";
import { fetchAndAnalyze } from "./fetchAndAnalyze.mjs";
import { saveRecord, loadAllDomainRecords, saveFailure, writeFailures } from "./helpers/fileIO.mjs";
import config from "./config.mjs";

const limit = pLimit(40);

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
          if (config.writeFailureFile) saveFailure(scan, config.failureSearchString);
        }
      } else console.log(`✅ Scanned ${record.domain}`);
    })
  );

  await Promise.all(tasks);
  if (config.writeFailureFile) writeFailures(config.failureLogFile);  // do this last after everything has synced up
}

console.time("scanAll");
await scanAll();
console.timeEnd("scanAll");
