import fs from 'node:fs';
import opentype from 'opentype.js';
import { compactPathData, hundredths } from './format.mjs';
import { runningTotals } from './geometry.mjs';
import { element } from './markup.mjs';

const INDEX_SCALE = 0.75;
const SUBSCRIPT_DROP = 0.28;
const SUPERSCRIPT_RISE = 0.42;
const COMMAND_COORDINATES = {
  M: ['x', 'y'],
  L: ['x', 'y'],
  Q: ['x1', 'y1', 'x', 'y'],
  C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
  Z: [],
};

export function loadOutlineFont(url) {
  const buffer = fs.readFileSync(url);
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

export function readout(font, { right, baseline, size }, termCount) {
  const runs = formulaRuns(termCount).map((run) => ({ ...run, size: size * run.scale }));
  const widths = runs.map((run) => font.getAdvanceWidth(run.text, run.size));
  const lefts = runningTotals([right - runningTotals(widths).at(-1), ...widths]);
  const outlines = runs.map((run, i) => runOutline(font, run, lefts[i], baseline + run.shift * size));
  return element('path', { class: 'readout', d: outlines.join('') });
}

function runOutline(font, run, left, baseline) {
  const { commands } = font.getPath(run.text, left, baseline, run.size);
  return compactPathData(commands.map(pathCommand).join(''));
}

function pathCommand(command) {
  const coordinates = COMMAND_COORDINATES[command.type].map((key) => hundredths(command[key]));
  return `${command.type}${coordinates.join(' ')}`;
}

function formulaRuns(termCount) {
  const plain = (text) => ({ text, scale: 1, shift: 0 });
  return [
    plain('z(t) = Σ c'),
    { text: 'k', scale: INDEX_SCALE, shift: SUBSCRIPT_DROP },
    plain(' e'),
    { text: 'ikωt', scale: INDEX_SCALE, shift: -SUPERSCRIPT_RISE },
    plain(`   ${termCount} terms`),
  ];
}
