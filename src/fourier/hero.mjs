import { profile } from '../profile.config.mjs';
import { FONTS } from './config.mjs';
import { assertParsableDepth, heroDocument } from './document.mjs';
import { tenths } from './format.mjs';
import { inkStrokes } from './ink.mjs';
import { loadOutlineFont } from './readout.mjs';
import { DESKTOP, MOBILE } from './scenes.mjs';
import { signatureSeries } from './series.mjs';
import { placeSignature } from './signature.mjs';
import { loadSingleLineFont } from './singleline.mjs';
import { chainSchedule } from './timeline.mjs';

const TITLE = `A chain of rotating circles draws the signature ${profile.display} in one continuous line, `
  + 'next to the formula of the series.';

const BOTH_SCHEMES = ['light', 'dark'];

const HERO_FILES = [
  { file: 'hero.svg', scene: DESKTOP, colorSchemes: BOTH_SCHEMES },
  { file: 'hero-light.svg', scene: DESKTOP, colorSchemes: ['light'] },
  { file: 'hero-dark.svg', scene: DESKTOP, colorSchemes: ['dark'] },
  { file: 'hero-mobile.svg', scene: MOBILE, colorSchemes: BOTH_SCHEMES },
  { file: 'hero-mobile-dark.svg', scene: MOBILE, colorSchemes: ['dark'] },
];

export function heroFiles() {
  const signatureFont = loadSingleLineFont(FONTS.signature);
  const readoutFont = loadOutlineFont(FONTS.readout);
  const scenes = new Set(HERO_FILES.map(({ scene }) => scene));
  const drawings = new Map([...scenes].map((scene) => [scene, sceneDrawing(scene, signatureFont)]));
  return HERO_FILES.map(({ file, scene, colorSchemes }) => {
    const drawing = drawings.get(scene);
    const svg = heroDocument({ scene, drawing, colorSchemes, title: TITLE, readoutFont });
    assertParsableDepth(file, svg);
    return { file, svg };
  });
}

function sceneDrawing(scene, signatureFont) {
  const strokes = placeSignature(signatureFont, profile.display, scene);
  const series = signatureSeries(strokes, scene.closingSwoop);
  const ink = inkStrokes(series);
  assertInkWithinChainBand(scene, ink);
  return { series, schedule: chainSchedule(series), ink };
}

function assertInkWithinChainBand({ name, chainBand }, ink) {
  const top = Math.min(...ink.map((stroke) => stroke.top));
  const bottom = Math.max(...ink.map((stroke) => stroke.bottom));
  if (top >= chainBand.fullFrom && bottom <= chainBand.fullTo) return;
  throw new Error(`Scene "${name}": the ink of "${profile.display}" spans y ${tenths(top)} to `
    + `${tenths(bottom)}, outside ${chainBand.fullFrom} to ${chainBand.fullTo}, where the chain mask is at `
    + 'full strength; adjust the signature of this scene in scenes.mjs.');
}
