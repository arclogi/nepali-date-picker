import { copyFile, mkdir } from 'node:fs/promises';

const distDir = new URL('../dist/', import.meta.url);

await mkdir(distDir, { recursive: true });
await copyFile(new URL('../src/styles.css', import.meta.url), new URL('./styles.css', distDir));

