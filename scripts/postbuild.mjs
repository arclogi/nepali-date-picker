import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

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
