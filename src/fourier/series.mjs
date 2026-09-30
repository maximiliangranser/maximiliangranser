import { SERIES, TIMELINE_SECONDS } from './config.mjs';
import { round } from './format.mjs';
import { fourierCoefficients, largestTerms } from './fourier.mjs';
import { toDegrees, toRadians } from './geometry.mjs';
import { loopTimes, positionsAtUniformTimes, timedPieces } from './pace.mjs';
import { closedPenPath, orderStrokes } from './route.mjs';
import { closingMoveSeconds, lastInkEnd, writingPeriod } from './timeline.mjs';

export function signatureSeries(strokes, closingSwoop) {
  const path = closedPenPath(orderStrokes(strokes), closingSwoop);
  const times = loopTimes(path);
  const pieces = timedPieces(path.pieces, times);
  assertPrerollWithinClosingMove(pieces);
  const positions = positionsAtUniformTimes(path, times, SERIES.sampleCount);
  const coefficients = fourierCoefficients(positions, SERIES.highestFrequency);
  return {
    center: roundedCenter(coefficients),
    terms: largestTerms(coefficients, SERIES.termCount).map(roundedTerm),
    pieces,
    period: writingPeriod(pieces),
    lastInkEnd: lastInkEnd(pieces),
  };
}

function assertPrerollWithinClosingMove(pieces) {
  const closingMove = closingMoveSeconds(pieces);
  if (closingMove >= TIMELINE_SECONDS.preroll) return;
  throw new Error(`The preroll (${TIMELINE_SECONDS.preroll} s) is longer than the closing pen move `
    + `(${closingMove.toFixed(2)} s).`);
}

function roundedCenter(coefficients) {
  const constant = coefficients.find((coefficient) => coefficient.k === 0);
  return [round(constant.re, SERIES.coefficientDecimals), round(constant.im, SERIES.coefficientDecimals)];
}

function roundedTerm({ k, r, phi }) {
  const deg = round(toDegrees(phi), SERIES.coefficientDecimals);
  return { k, r: round(r, SERIES.coefficientDecimals), deg, phi: toRadians(deg) };
}
