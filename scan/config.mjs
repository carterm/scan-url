import path from "node:path";

export default {
  writeFailureFile: true,
  failureSearchString: "Fetch error: fetch failed Connect Timeout",
  failureLogFile: path.join(process.cwd(), "publish/scan-failures.json")
};