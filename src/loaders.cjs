//@ts-check

const fs = require("node:fs");

/**
 * @param {string} filename
 */
const loadAndSortUrls = filename =>
  [
    ...new Set(
      fs
        .readFileSync(`${__dirname}/${filename}`, {
          encoding: "utf-8"
        })
        .split("\n")
        .map(x => x.trim())
        .filter(x => x)
        .filter(x => !x.startsWith("//")) //remove comments
        .map(x => (x.includes("/") ? x : `${x}/`))
        .map(x => (x.startsWith("http") ? x : `https://${x}`))
    )
  ].sort();

module.exports = { loadAndSortUrls };
