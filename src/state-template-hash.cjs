//@ts-check

const crypto = require("node:crypto");
const https = require("node:https");

/**
 * Generates a SHA-256 hash of the given content.
 * @param {string} content - The content to hash.
 */
function generateHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * @typedef {object} urlHash
 * @property {string} url
 * @property {string} [hash]
 * @property {number} [statusCode]
 */

/**
 * Downloads the content from a URL and generates its SHA-256 hash.
 * @param {string} url - The URL to download the content from.
 * @returns {Promise<urlHash>} A promise that resolves to an object containing the URL and its hash.
 */
function downloadAndHash(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let data = "";
        if (res.statusCode === 200) {
          res.on("data", chunk => {
            data += chunk;
          });
          res.on("end", () => {
            resolve({ url, hash: generateHash(data) });
          });
        } else {
          resolve({ url, statusCode: res.statusCode }); // Return null hash if status is not 200
        }
      })
      .on("error", err => {
        reject(err);
      });
  });
}

/**
 * Reads a JSON file and parses it to get URLs, then downloads the content from each URL and generates its hash.
 * @param {string[]} urls
 * @returns {Promise<urlHash[]>} A promise that resolves to an array of objects, each containing a URL and its hash.
 */
function getUrlHashes(urls) {
  return new Promise((resolve, reject) => {
    const downloadPromises = urls.map(downloadAndHash);

    Promise.all(downloadPromises)
      .then(results => resolve(results))
      .catch(error => reject(error));
  });
}

module.exports = { getUrlHashes };
