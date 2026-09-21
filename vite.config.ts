import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import manifest from "./manifest.config.ts";

export default defineConfig({
  plugins: [crx({ manifest })],
  build: { sourcemap: true },
});
