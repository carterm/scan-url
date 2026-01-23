//@ts-check

/**
 * @typedef {import("./node_modules/@11ty/eleventy/src/defaultConfig.js").defaultConfig} EleventyDefaultConfig
 * @typedef {import("@11ty/eleventy/UserConfig").default} eleventyConfig
 */

module.exports = function (/** @type {eleventyConfig} **/ eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  //Start with default config, easier to configure 11ty later
  /** @type {EleventyDefaultConfig} */
  const config = {
    // allow nunjucks templating in .html files
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["html", "njk", "11ty.js", "md"],

    dir: {
      // site content pages
      input: "pages",
      data: "../src/_data",
      // site structure pages (path is realtive to input directory)
      includes: "../src/_includes",
      // @ts-ignore
      layouts: "../src/_includes/layouts",
      // site final outpuut directory
      output: "_site"
    }
  };

  return config;
};
