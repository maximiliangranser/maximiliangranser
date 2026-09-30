import { INK, TIMELINE_SECONDS } from './config.mjs';
import { compactPathData, hundredths, round, seconds } from './format.mjs';
import { partialSum } from './fourier.mjs';
import { distance, polylineLength, simplifyGraph, simplifyPolyline } from './geometry.mjs';
import { element } from './markup.mjs';
import { secondsAt } from './timeline.mjs';

const GRID_STEP = 10 ** -INK.coordinateDecimals;

export function inkStrokes(series) {
  return series.pieces.map((piece) => inkStroke(series, piece));
}

export function inkPathDefinitions(strokes) {
  return strokes.map((stroke, index) => element('path', { id: inkPathId(index), d: stroke.pathData }))
    .join('');
}

export function drawnInk(strokes) {
  return strokes.map((stroke, index) => {
    const reveal = heldKeyframes({
      hold: stroke.length + INK.hiddenLead,
      begin: stroke.begin,
      duration: stroke.duration,
      keyTimes: stroke.keyTimes,
      values: stroke.offsets,
    });
    return inkPathUse(index, {
      class: inkClass(stroke),
      'stroke-dasharray': `${hundredths(stroke.length)} ${hundredths(stroke.length + INK.gapPadding)}`,
      'stroke-dashoffset': 0,
    }, [dashOffsetAnimation(reveal)]);
  }).join('');
}

export function hotInkHeads(strokes) {
  return strokes.map((stroke, index) => {
    const head = Math.min(stroke.length, INK.hotHeadLength);
    const drainedOffset = -stroke.length - INK.hotHeadTrail;
    return inkPathUse(index, {
      class: 'hot-head',
      'stroke-dasharray': `${hundredths(head)} ${hundredths(stroke.length + head + INK.hotHeadGapPadding)}`,
      'stroke-dashoffset': hundredths(drainedOffset),
    }, [dashOffsetAnimation(hotHeadTravel(stroke, head, drainedOffset))]);
  }).join('');
}

function hotHeadTravel(stroke, head, drainedOffset) {
  const duration = stroke.duration + TIMELINE_SECONDS.hotHeadDrain;
  const onDrainClock = (keyTime) => (keyTime * stroke.duration) / duration;
  const behindInkEnd = (inkOffset) => head - (stroke.length - inkOffset);
  return heldKeyframes({
    hold: head + INK.hotHeadHiddenLead,
    begin: stroke.begin,
    duration,
    keyTimes: [...stroke.keyTimes.map(onDrainClock), 1],
    values: [...stroke.offsets.map(behindInkEnd), drainedOffset],
  });
}

export function finishedInk(strokes) {
  return strokes.map((stroke, index) => inkPathUse(index, { class: inkClass(stroke) })).join('');
}

function inkStroke(series, piece) {
  const trace = traceOf(series, piece);
  const vertices = roundedVertices(trace.points);
  const length = polylineLength(vertices);
  const traceLength = trace.arcLengths.at(-1);
  const loopSpan = piece.end - piece.start;
  const keys = simplifyGraph(trace.loopTimes, trace.arcLengths, INK.dashTolerance);
  return {
    pathData: relativePathData(vertices),
    length,
    begin: secondsAt(piece.start, series.period),
    duration: loopSpan * series.period,
    keyTimes: keys.map((i) => (trace.loopTimes[i] - piece.start) / loopSpan),
    offsets: keys.map((i) => length * (1 - trace.arcLengths[i] / traceLength)),
    secondary: piece.secondary,
    ...verticalExtent(vertices),
  };
}

function verticalExtent(points) {
  const ys = points.map((point) => point[1]);
  return { top: Math.min(...ys), bottom: Math.max(...ys) };
}

function traceOf({ center, terms }, { start, end }) {
  const count = Math.max(INK.minTraceSamples, Math.ceil((end - start) * INK.traceSamplesPerLoop));
  const loopTimes = [];
  const points = [];
  for (let i = 0; i <= count; i++) {
    const loopTime = start + ((end - start) * i) / count;
    loopTimes.push(loopTime);
    points.push(partialSum(center, terms, loopTime));
  }
  const arcLengths = [0];
  for (let i = 1; i <= count; i++) arcLengths.push(arcLengths[i - 1] + distance(points[i - 1], points[i]));
  return { loopTimes, points, arcLengths };
}

function roundedVertices(points) {
  const vertices = simplifyPolyline(points, INK.pathTolerance)
    .map((i) => [toGrid(points[i][0]), toGrid(points[i][1])])
    .filter((vertex, i, all) => i === 0 || vertex[0] !== all[i - 1][0] || vertex[1] !== all[i - 1][1]);
  return vertices.length > 1 ? vertices : visibleDot(vertices[0]);
}

function visibleDot(vertex) {
  return [vertex, [vertex[0] + GRID_STEP, vertex[1]]];
}

function relativePathData(vertices) {
  const pair = ([x, y]) => `${toGrid(x)} ${toGrid(y)}`;
  const steps = vertices.slice(1).map(([x, y], i) => pair([x - vertices[i][0], y - vertices[i][1]]));
  return compactPathData(`M${pair(vertices[0])}l${steps.join(' ')}`);
}

function toGrid(value) {
  return round(value, INK.coordinateDecimals);
}

function inkPathId(index) {
  return `inkPath${index}`;
}

function inkPathUse(index, attributes, children) {
  return element('use', { href: `#${inkPathId(index)}`, ...attributes }, children);
}

function inkClass(stroke) {
  return stroke.secondary ? 'core secondary' : 'core';
}

function heldKeyframes({ hold, begin, duration, keyTimes, values }) {
  const total = begin + duration;
  return {
    total,
    keyTimes: [0, ...keyTimes.map((keyTime) => (begin + keyTime * duration) / total)],
    values: [hold, ...values],
  };
}

function dashOffsetAnimation({ total, keyTimes, values }) {
  const keyframes = increasingKeyframes(keyTimes, values);
  return element('animate', {
    attributeName: 'stroke-dashoffset',
    dur: seconds(total),
    values: keyframes.map((keyframe) => hundredths(keyframe.value)).join(';'),
    keyTimes: keyframes.map((keyframe) => keyframe.time).join(';'),
    fill: 'freeze',
  });
}

function increasingKeyframes(keyTimes, values) {
  const lastIndex = keyTimes.length - 1;
  const keyframes = [];
  keyTimes.forEach((keyTime, i) => {
    const keyframe = { time: i === lastIndex ? 1 : round(keyTime, INK.keyTimeDecimals), value: values[i] };
    const advances = !keyframes.length || keyframe.time > keyframes.at(-1).time;
    if (advances) keyframes.push(keyframe);
    else if (i === lastIndex) keyframes[keyframes.length - 1] = keyframe;
  });
  return keyframes;
}
