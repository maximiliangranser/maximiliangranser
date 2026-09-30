import { PEN_PATH } from './config.mjs';
import {
  along, clamp, cubicBezier, distance, endDirection, resample, smoothStroke, startDirection,
} from './geometry.mjs';

export function orderStrokes(strokes) {
  const words = groupByWord(strokes);
  const ordered = [];
  const penPosition = () => ordered.at(-1)?.points.at(-1);
  const place = (stroke) => ordered.push({ ...stroke, points: orientFrom(stroke, penPosition()) });
  words.forEach((word, index) => {
    word.filter(isMain).forEach(place);
    const secondary = word.filter(isSecondary);
    if (!secondary.length) return;
    const nextStroke = (words[index + 1] ?? words[0]).find(isMain).points;
    shorterVisitingOrder(secondary, penPosition(), nextStroke).forEach(place);
  });
  return ordered;
}

export function closedPenPath(strokes, closingSwoop) {
  const smoothed = strokes.map(smoothedStroke);
  const samples = [];
  const pieces = [];
  smoothed.forEach((stroke, index) => {
    const first = samples.length;
    appendSamples(samples, stroke.points, 'ink');
    pieces.push({ secondary: stroke.secondary, first, last: samples.length - 1 });
    const move = penMoveAfter(smoothed, index, closingSwoop);
    appendSamples(samples, move.points.slice(1, -1), move.motion);
  });
  return { samples, pieces };
}

function smoothedStroke(stroke) {
  const points = smoothStroke(stroke.points, {
    spacing: PEN_PATH.sampleSpacing,
    cornerTurnDegrees: PEN_PATH.cornerTurnDegrees,
  });
  return { secondary: stroke.secondary, points };
}

function penMoveAfter(strokes, index, closingSwoop) {
  const current = strokes[index].points;
  if (index === strokes.length - 1) {
    return { points: swoop(current, strokes[0].points, closingSwoop), motion: 'close' };
  }
  return { points: connector(current, strokes[index + 1].points), motion: 'lift' };
}

function isSecondary(stroke) {
  return stroke.secondary;
}

function isMain(stroke) {
  return !stroke.secondary;
}

function groupByWord(strokes) {
  const words = [];
  for (const stroke of strokes) {
    const current = words.at(-1);
    if (current && current[0].word === stroke.word) current.push(stroke);
    else words.push([stroke]);
  }
  return words;
}

function orientFrom(stroke, pen) {
  if (!pen) return stroke.points;
  const first = stroke.points[0];
  const last = stroke.points.at(-1);
  return distance(pen, last) < distance(pen, first) ? stroke.points.slice().reverse() : stroke.points;
}

function shorterVisitingOrder(strokes, pen, nextStroke) {
  const leftToRight = strokes.slice().sort((a, b) => meanX(a) - meanX(b));
  const rightToLeft = leftToRight.slice().reverse();
  const leftToRightIsShorter = travel(leftToRight, pen, nextStroke) <= travel(rightToLeft, pen, nextStroke);
  return leftToRightIsShorter ? leftToRight : rightToLeft;
}

function meanX(stroke) {
  return stroke.points.reduce((sum, point) => sum + point[0], 0) / stroke.points.length;
}

function travel(order, pen, nextStroke) {
  let position = pen;
  let length = 0;
  for (const stroke of order) {
    const points = orientFrom(stroke, position);
    length += distance(position, points[0]);
    position = points.at(-1);
  }
  const toNextStroke = Math.min(distance(position, nextStroke[0]), distance(position, nextStroke.at(-1)));
  return length + toNextStroke;
}

function appendSamples(samples, points, motion) {
  for (const point of points) samples.push({ point, motion });
}

function connector(previous, next) {
  const start = previous.at(-1);
  const end = next[0];
  const gap = distance(start, end);
  const { reach, minHandle, maxHandle, minSegments } = PEN_PATH.connector;
  const handle = clamp(gap * reach, minHandle, maxHandle);
  const leave = endDirection(previous, PEN_PATH.tangentSpan);
  const arrive = startDirection(next, PEN_PATH.tangentSpan);
  const controls = [start, along(start, leave, handle), along(end, arrive, -handle), end];
  const segments = Math.max(minSegments, Math.ceil(gap));
  return resample(cubicBezier(controls, segments), PEN_PATH.sampleSpacing);
}

function swoop(previous, next, { bottomY, bottomSpanShare, bottomHandleSpanShare }) {
  const start = previous.at(-1);
  const end = next[0];
  const span = end[0] - start[0];
  const bottom = [start[0] + span * bottomSpanShare, bottomY];
  const bottomHandle = Math.abs(span) * bottomHandleSpanShare;
  const heading = [Math.sign(span) || -1, 0];
  const leave = endDirection(previous, PEN_PATH.tangentSpan);
  const arrive = startDirection(next, PEN_PATH.tangentSpan);
  const down = distance(start, bottom);
  const up = distance(bottom, end);
  const reach = PEN_PATH.swoopEndHandleReach;
  const descent = cubicBezier(
    [start, along(start, leave, down * reach), along(bottom, heading, -bottomHandle), bottom],
    Math.ceil(down),
  );
  const ascent = cubicBezier(
    [bottom, along(bottom, heading, bottomHandle), along(end, arrive, -up * reach), end],
    Math.ceil(up),
  );
  return resample([...descent, ...ascent.slice(1)], PEN_PATH.sampleSpacing);
}
