import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Recursively collects file paths relative to baseDir
 */
function walk(dir, baseDir) {
  let results = [];
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath, baseDir));
    } else {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}

/**
 * Vite plugin to generate /public/assets/manifest.json at build time
 */
function assetManifestPlugin() {
  return {
    name: 'asset-manifest-generator',
    apply: 'build',
    buildStart() {
      const baseDir = path.join(__dirname, 'public', 'assets');
      if (!fs.existsSync(baseDir)) return;

      const assets = walk(baseDir, baseDir);
      const manifestPath = path.join(baseDir, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify({ assets }, null, 2));
      console.log(`[asset-manifest] Wrote ${assets.length} files to ${manifestPath}`);
    }
  };
}

export default defineConfig({
  root: ".",
  publicDir: "public",
  base: "/", // For publishing to Github Pages with custom subdomain.
  build: {
    target: "es2022",
    outDir: "dist",
  },
});
