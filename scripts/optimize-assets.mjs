#!/usr/bin/env node
/**
 * Batch GLB optimizer using @gltf-transform/cli (Draco geometry + WebP 1024px textures).
 * Usage:
 *   node scripts/optimize-assets.mjs [inputDir] [outputDir]
 * Defaults:
 *   inputDir  = ./raw-models
 *   outputDir = ./public/models
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const inputDir = path.resolve(process.argv[2] ?? './raw-models');
const outputDir = path.resolve(process.argv[3] ?? './public/models');

if (!fs.existsSync(inputDir)) {
  console.log(`Input directory not found: ${inputDir}`);
  console.log('Place raw CC0 .glb models inside ./raw-models and re-run `npm run optimize:assets`.');
  process.exit(0);
}

fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(inputDir).filter((f) => f.toLowerCase().endsWith('.glb'));
if (files.length === 0) {
  console.log(`No .glb files found in ${inputDir}.`);
  process.exit(0);
}

for (const file of files) {
  const src = path.join(inputDir, file);
  const dst = path.join(outputDir, file);
  console.log(`Optimizing ${file} -> public/models/${file}`);
  execFileSync(
    'npx',
    [
      '@gltf-transform/cli',
      'optimize',
      src,
      dst,
      '--compress',
      'draco',
      '--texture-compress',
      'webp',
      '--texture-size',
      '1024',
    ],
    { stdio: 'inherit' },
  );
}

console.log(`Optimized ${files.length} model(s) successfully.`);
