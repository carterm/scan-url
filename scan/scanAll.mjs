//@ts-check
/**
 * @typedef {import("./types/DomainRecord.mjs").DomainRecord} DomainRecord
 */
import pLimit from "p-limit";
import { fetchAndAnalyze } from "./fetchAndAnalyze.mjs";
import { saveRecord, loadAllDomainRecords } from "./helpers/fileIO.mjs";

const limit = pLimit(40);

async function scanAll() {
  const items = loadAllDomainRecords();

  const tasks = items.map(({ filePath, record }) =>
    limit(async () => {
      if (!record.includeInScan) {
        console.log(`🚫 Skipped ${record.domain}`);
        return;
      }

      let scan = await fetchAndAnalyze(record);
      // Ensure $schema is the first property in the scan object
      scan = {
        //@ts-ignore
        $schema: "./../../schemas/domain-scan.schema.json",
        ...scan
      };

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
