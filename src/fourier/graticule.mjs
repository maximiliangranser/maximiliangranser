import { tenths } from './format.mjs';
import { element } from './markup.mjs';

const REACH = { horizontal: 0.5, vertical: 0.62 };

const BANDS = [
  { within: 0.55, opacity: 1 },
  { within: 0.75, opacity: 0.62 },
  { within: 0.92, opacity: 0.34 },
  { within: 1.05, opacity: 0.14 },
];

export function graticule({ width, height, graticule: { spacing, centerY } }) {
  const centerX = width / 2;
  const dotsByBand = BANDS.map(() => []);
  for (let x = centerX % spacing; x < width; x += spacing) {
    for (let y = centerY % spacing; y < height; y += spacing) {
      const reach = Math.hypot(
        (x - centerX) / (width * REACH.horizontal),
        (y - centerY) / (height * REACH.vertical),
      );
      const band = BANDS.findIndex(({ within }) => reach < within);
      if (band >= 0) dotsByBand[band].push(`M${tenths(x)} ${tenths(y)}h0`);
    }
  }
  return dotsByBand.map((dots, band) => bandPath(dots, BANDS[band])).join('');
}

function bandPath(dots, { opacity }) {
  const fading = opacity < 1 ? { opacity } : {};
  return element('path', { class: 'grid', ...fading, d: dots.join('') });
}
