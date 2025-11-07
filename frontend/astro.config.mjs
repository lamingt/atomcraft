// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import netlify from "@astrojs/netlify/static";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["devserver-redesign--atomcraft-temp.netlify.app"],
    },
  },
  output: "static",
  adapter: netlify(),
});
