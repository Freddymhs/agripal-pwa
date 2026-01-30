import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@/": path.resolve(__dirname, "./src/") + "/",
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: [...configDefaults.exclude],
    setupFiles: ["src/__tests__/setup.ts"],
  },
});
