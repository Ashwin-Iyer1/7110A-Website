import { readdir, mkdir, copyFile } from 'node:fs/promises';
await mkdir('public/decoders', { recursive: true });
await copyFile('node_modules/meshoptimizer/meshopt_decoder.cjs', 'public/decoders/meshopt_decoder.js');
await copyFile('node_modules/meshoptimizer/LICENSE.md', 'public/decoders/MESHOPT_LICENSE.txt');
await mkdir('public/blockly-media', { recursive: true });
for (const file of await readdir('node_modules/blockly/media')) {
  if (/^[\w.-]+\.(svg|png|cur)$/.test(file)) await copyFile(`node_modules/blockly/media/${file}`, `public/blockly-media/${file}`);
}
