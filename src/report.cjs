//@ts-check

const fs = require("node:fs");

console.time("Done");

const data = require("../_results/results.json");

(() => {
  let newList = [
    ...new Set(
      data
        .filter(x => !["ETIMEDOUT", "ENOTFOUND"].includes(x.error?.code || ""))

        .map(x => {
          if (x.redirectURL && x.redirectURL.endsWith("/")) {
            if (x.redirectURL?.split("/").length == 4) {
              return x.redirectURL;
            }
          }

          return x.target;
        })
    )
  ];
  newList = newList.filter(
    x => !newList.includes(x.replace("https://", "https://www."))
  );

  newList.sort();

  fs.writeFileSync("_results/resort.txt", newList.join("\n"));

  console.timeEnd("Done");
  process.exit();
})();
