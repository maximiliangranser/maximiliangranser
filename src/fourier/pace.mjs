import { PEN_PACE, PEN_PATH, TIMELINE_SECONDS } from './config.mjs';
import { distance, turnAngle } from './geometry.mjs';
import { closingMoveSeconds } from './timeline.mjs';

const MIN_STEP_LENGTH = 1e-9;
const KERNEL_REACH_IN_SIGMAS = 3;

export function loopTimes(path) {
  const timesAtClosingSpeed = timingByClosingSpeed(path.samples);
  const isTooSlow = (closingSpeed) => {
    const pieces = timedPieces(path.pieces, timesAtClosingSpeed(closingSpeed));
    return closingMoveSeconds(pieces) > TIMELINE_SECONDS.closingMove;
  };
  return timesAtClosingSpeed(logarithmicBisection(PEN_PACE.closingSpeedSearch, isTooSlow));
}

export function timedPieces(pieces, times) {
  return pieces.map((piece) => ({
    secondary: piece.secondary,
    start: times[piece.first],
    end: times[piece.last],
  }));
}

export function positionsAtUniformTimes(path, times, count) {
  const { samples } = path;
  const last = samples.length - 1;
  const xs = new Float64Array(count);
  const ys = new Float64Array(count);
  let j = 0;
  for (let m = 0; m < count; m++) {
    const time = m / count;
    while (j < last && times[j + 1] <= time) j++;
    const a = samples[j].point;
    const b = cyclic(samples, j + 1).point;
    const u = (time - times[j]) / (times[j + 1] - times[j] || 1);
    xs[m] = a[0] + (b[0] - a[0]) * u;
    ys[m] = a[1] + (b[1] - a[1]) * u;
  }
  return { xs, ys };
}

function logarithmicBisection({ lowest, highest, iterations }, isTooLow) {
  let low = Math.log(lowest);
  let high = Math.log(highest);
  let middle;
  for (let i = 0; i < iterations; i++) {
    middle = (low + high) / 2;
    if (isTooLow(Math.exp(middle))) low = middle;
    else high = middle;
  }
  return Math.exp(middle);
}

function timingByClosingSpeed(samples) {
  const bendSlowdown = bendSlowdowns(samples);
  const stepLengths = samples.map(({ point }, i) => distance(point, cyclic(samples, i + 1).point));
  return (closingSpeed) => {
    const speeds = { ink: 1, lift: PEN_PACE.liftedSpeed, close: closingSpeed };
    const slowness = Float64Array.from(samples, (sample) => 1 / speeds[sample.motion]);
    const smoothedSlowness = smoothCircular(slowness, PEN_PACE.speedSmoothing / PEN_PATH.sampleSpacing);
    return normalizedTimes(stepLengths, smoothedSlowness.map((value, i) => value * bendSlowdown[i]));
  };
}

function bendSlowdowns(samples) {
  const { curvatureSmoothing, curvatureScale, curvatureExponent } = PEN_PACE;
  const curvature = smoothCircular(turningRates(samples), curvatureSmoothing / PEN_PATH.sampleSpacing);
  return curvature.map((bend) => Math.pow(1 + bend / curvatureScale, curvatureExponent));
}

function turningRates(samples) {
  return Float64Array.from(samples, ({ point }, i) => {
    const previous = cyclic(samples, i - 1).point;
    const next = cyclic(samples, i + 1).point;
    const incoming = distance(previous, point) || MIN_STEP_LENGTH;
    const outgoing = distance(point, next) || MIN_STEP_LENGTH;
    return turnAngle(previous, point, next) / ((incoming + outgoing) / 2);
  });
}

function normalizedTimes(stepLengths, slowness) {
  const count = stepLengths.length;
  const times = new Float64Array(count + 1);
  for (let i = 0; i < count; i++) {
    times[i + 1] = times[i] + stepLengths[i] * 0.5 * (slowness[i] + slowness[(i + 1) % count]);
  }
  const total = times[count];
  for (let i = 0; i <= count; i++) times[i] /= total;
  return times;
}

function cyclic(items, index) {
  return items[(index + items.length) % items.length];
}

function smoothCircular(values, sigma) {
  const count = values.length;
  const radius = Math.ceil(sigma * KERNEL_REACH_IN_SIGMAS);
  const weights = [];
  let weightSum = 0;
  for (let i = -radius; i <= radius; i++) {
    const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
    weights.push(weight);
    weightSum += weight;
  }
  const smoothed = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    let sum = 0;
    for (let j = -radius; j <= radius; j++) sum += values[(i + j + count) % count] * weights[j + radius];
    smoothed[i] = sum / weightSum;
  }
  return smoothed;
}
