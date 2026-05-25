import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "static",
  site: "https://www.darrellmesser.com",
  adapter: cloudflare()
});