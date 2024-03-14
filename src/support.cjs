//@ts-check

/**
 * @param {number} timeout
 */
const timeoutPromise = timeout =>
  new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(
        new Error(`Timeout: All requests took longer than ${timeout} ms.`)
      );
    }, timeout);
  });

module.exports = { timeoutPromise };
