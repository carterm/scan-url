//@ts-check

import { saveRecord, loadAllDomainRecords } from "./fileIO.mjs";

const items = loadAllDomainRecords();

// rebuild the JSON files with the new schema
for (const item of items) {
  const record = item.record;

  if (record.finalUrl?.length === 0) {
    delete record.finalUrl;
    saveRecord(item.filePath, record);
  }
}
