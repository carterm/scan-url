//@ts-check

import { saveRecord, loadAllDomainRecords } from "./fileIO.mjs";

const items = loadAllDomainRecords();

// rebuild the JSON files with the new schema
for (const item of items) {
  const record = item.record;

  if (record.cosmeticTargetURL) {
    record.finalUrl = record.cosmeticTargetURL;
    delete record.cosmeticTargetURL;

    saveRecord(item.filePath, record);
  }
}
