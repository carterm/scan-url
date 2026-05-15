//@ts-check

/**
 * @typedef {import("./node_modules/@11ty/eleventy/src/defaultConfig.js").defaultConfig} EleventyDefaultConfig
 * @typedef {import("@11ty/eleventy/UserConfig").default} eleventyConfig
 */

export default function (/** @type {eleventyConfig} **/ eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "./node_modules/@cagovweb/state-template/dist/css/cagov.core.min.css":
      "css/cagov.core.min.css",
    "./node_modules/@cagovweb/state-template/dist/js/cagov.core.min.js":
      "js/cagov.core.min.js"
  });

  //Start with default config, easier to configure 11ty later
  /** @type {EleventyDefaultConfig} */
  const config = {
    // allow nunjucks templating in .html files
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["html", "njk", "11ty.js", "md"],
    keys: {},
    dir: {
      // site content pages
      input: "pages",
      data: "../src/_data",
      // site structure pages (path is realtive to input directory)

      // site final outpuut directory
      output: "_site"
    }
  };

  return config;
}
