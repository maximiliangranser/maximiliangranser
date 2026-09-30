import fs from 'node:fs';
import { heroFiles } from './hero.mjs';

const OUTPUT_PATH = 'assets/fourier';
const outputUrl = new URL(`../../${OUTPUT_PATH}/`, import.meta.url);

fs.mkdirSync(outputUrl, { recursive: true });
for (const { file, svg } of heroFiles()) {
  fs.writeFileSync(new URL(file, outputUrl), svg);
  console.log(`${OUTPUT_PATH}/${file}`);
}
