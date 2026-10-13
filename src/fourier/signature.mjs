import { layOutText } from './singleline.mjs';

const INK_OVERSHOOT_ALLOWANCE = 1;

export function placeSignature(glyphs, text, scene) {
  const { baseline, shiftX, stackedWords } = scene.signature;
  const { strokes, advance } = stackedWords
    ? layOutStackedWords(glyphs, text, stackedWords.lineSpacing)
    : layOutText(glyphs, text);
  if (!strokes.length) throw new Error(`The signature text "${text}" has no strokes to draw.`);
  const width = signatureWidth(strokes, advance, scene);
  const scale = width / advance;
  const left = (scene.width - width) / 2 + shiftX;
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map(([x, y]) => [left + x * scale, baseline - y * scale]),
  }));
}

function layOutStackedWords(glyphs, text, lineSpacing) {
  const lines = text.split(' ').map((word) => layOutText(glyphs, word));
  const advance = Math.max(...lines.map((line) => line.advance));
  const strokes = lines.flatMap((line, index) => {
    const indent = (advance - line.advance) / 2;
    const drop = index * lineSpacing;
    return line.strokes.map((stroke) => ({
      ...stroke,
      word: index,
      points: stroke.points.map(([x, y]) => [x + indent, y - drop]),
    }));
  });
  return { strokes, advance };
}

function signatureWidth(strokes, advance, { signature, chainBand }) {
  const heights = strokes.flatMap((stroke) => stroke.points.map(([, y]) => y));
  const roomAbove = signature.baseline - chainBand.fullFrom - INK_OVERSHOOT_ALLOWANCE;
  const roomBelow = chainBand.fullTo - signature.baseline - INK_OVERSHOOT_ALLOWANCE;
  return Math.min(
    signature.maxWidth,
    widthFitting(roomAbove, Math.max(...heights), advance),
    widthFitting(roomBelow, -Math.min(...heights), advance),
  );
}

function widthFitting(room, extent, advance) {
  return extent > 0 ? (room * advance) / extent : Infinity;
}
