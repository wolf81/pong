import { readdirSync, statSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function walk(dir, baseDir) {
  let results = [];
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath, baseDir));
    } else {
      results.push(relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}

function generateManifest() {
  const baseDir = join(__dirname, '..', 'public', 'assets');
  if (!existsSync(baseDir)) {
    console.error(`[manifest] Directory not found: ${baseDir}`);
    process.exit(1);
  }

  const manifestPath = join(baseDir, 'manifest.json');
  if (existsSync(manifestPath)) {
    unlinkSync(manifestPath);
  }

  const assets = walk(baseDir, baseDir);
  writeFileSync(manifestPath, JSON.stringify({ assets }, null, 2));
  console.log(`[manifest] Wrote ${assets.length} entries to ${manifestPath}`);
}

generateManifest();
