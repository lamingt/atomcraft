// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["devserver-redesign--atomcraft-temp.netlify.app"], // for preview servers on netlify
    },
  },
  output: "static",
  adapter: netlify(),
  site: "https://www.atomcraft.com.au",
});
