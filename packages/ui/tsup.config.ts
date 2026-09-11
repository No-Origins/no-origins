import { defineConfig } from "tsup";

// Unbundled: one output file per source file, so each component keeps its own "use client" directive
// (a bundled entry would hoist or drop it). Bundlers resolve the extensionless relative imports.
export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx"],
  bundle: false,
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom", "react/jsx-runtime", "@xyflow/react"],
});
