import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

const distDir = new URL('../dist/', import.meta.url);

await mkdir(distDir, { recursive: true });
await copyFile(new URL('../src/styles.css', import.meta.url), new URL('./styles.css', distDir));

// Add the client directive after tree shaking, which would otherwise strip it.
for (const file of ['index.js', 'index.cjs']) {
  const fileUrl = new URL(`./${file}`, distDir);
  const source = await readFile(fileUrl, 'utf8');
  if (!source.startsWith("'use client';")) {
    await writeFile(fileUrl, `'use client';\n${source}`);
  }
}

// Check the bundle layout: the shared date code is emitted once per format, both entries import
// it, and ./core plus the shared chunk stay server-safe (no client directive, no React).
const distFiles = await readdir(distDir);
const readDist = (file) => readFile(new URL(`./${file}`, distDir), 'utf8');
const importsReact = (source) =>
  /\bfrom\s*['"]react['"/]|\brequire\(\s*['"]react['"/]/.test(source);
const failures = [];

for (const extension of ['js', 'cjs']) {
  const chunks = distFiles.filter(
    (file) => file.startsWith('chunk-') && file.endsWith(`.${extension}`),
  );
  if (chunks.length === 0) {
    failures.push(`no shared .${extension} chunk was emitted`);
  }

  for (const file of [`core.${extension}`, ...chunks]) {
    const source = await readDist(file);
    if (source.includes('use client')) {
      failures.push(`${file} must not carry the "use client" directive`);
    }
    if (importsReact(source)) {
      failures.push(`${file} must not import React`);
    }
  }

  for (const file of [`index.${extension}`, `core.${extension}`]) {
    const source = await readDist(file);
    if (!chunks.some((chunk) => source.includes(`./${chunk}`))) {
      failures.push(`${file} must import the shared chunk`);
    }
    if (source.includes('function getDaysInNepaliMonth(')) {
      failures.push(`${file} duplicates the shared date code`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Bundle layout check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
