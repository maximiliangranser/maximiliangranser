import { CHAIN, TIMELINE_SECONDS } from './config.mjs';
import { hundredths, seconds, thousandths } from './format.mjs';
import { runningTotals } from './geometry.mjs';
import { element, onlyWhen } from './markup.mjs';
import { loopTimeAt } from './timeline.mjs';

const STILL_FRAME = { k: 0, deg: 0 };
const DEGREES_PER_TURN = 360;

export function chainVisibility(schedule) {
  return [
    opacityFade({ from: 0, to: 1, begin: 0, duration: TIMELINE_SECONDS.chainFadeIn }),
    opacityFade({ from: 1, to: 0, begin: schedule.fadeOutAt, duration: TIMELINE_SECONDS.chainFadeOut }),
    element('set', { attributeName: 'display', to: 'none', begin: seconds(schedule.hideAt), fill: 'freeze' }),
  ].join('');
}

export function rotatingChain({ series, schedule, look, marksMinorCircles }) {
  const { terms } = series;
  const spins = relativeSpins(series, schedule.stopAt);
  const drawnCount = terms.findLastIndex(isDrawn) + 1;
  const nibAndTail = nibWithUndrawnTail({
    lastDrawn: terms[drawnCount - 1],
    tail: terms.slice(drawnCount),
    tailSpins: spins.slice(drawnCount),
    nibFigures: nib(look),
  });
  const enclose = (inner, term, rank) => element('g', { transform: anchor(series, rank) }, [
    spinAnimation(spins[rank]),
    circle(term, rank, marksMinorCircles),
    arm(term, rank),
    joint(rank),
    inner,
  ]);
  return terms.slice(0, drawnCount).reduceRight(enclose, nibAndTail);
}

function opacityFade({ from, to, begin, duration }) {
  return element('animate', {
    attributeName: 'opacity',
    from,
    to,
    begin: seconds(begin),
    dur: seconds(duration),
    fill: 'freeze',
  });
}

function relativeSpins({ terms, period }, duration) {
  const start = loopTimeAt(0, period);
  const phase = (term) => DEGREES_PER_TURN * term.k * start + term.deg;
  return terms.map((term, rank) => {
    const parent = terms[rank - 1] ?? STILL_FRAME;
    const from = phase(term) - phase(parent);
    const turn = (DEGREES_PER_TURN * (term.k - parent.k) * duration) / period;
    return { from, to: from + turn, duration };
  });
}

function isDrawn(term, rank) {
  return hasCircle(rank) || hasJoint(rank) || hasArm(term);
}

function hasCircle(rank) {
  return rank < CHAIN.circleCount;
}

function hasJoint(rank) {
  return rank < CHAIN.jointCount;
}

function hasArm(term) {
  return armOpacity(term) >= CHAIN.minArmOpacity;
}

function anchor({ terms, center }, rank) {
  const [x, y] = rank === 0 ? center : [terms[rank - 1].r, 0];
  return `translate(${thousandths(x)} ${thousandths(y)})`;
}

function spinAnimation({ from, to, duration }, pivotX = 0) {
  const pivot = pivotX === 0 ? '' : ` ${thousandths(pivotX)} 0`;
  return element('animateTransform', {
    attributeName: 'transform',
    type: 'rotate',
    additive: 'sum',
    from: `${thousandths(from)}${pivot}`,
    to: `${thousandths(to)}${pivot}`,
    dur: seconds(duration),
    fill: 'freeze',
  });
}

function circle(term, rank, marksMinorCircles) {
  if (!hasCircle(rank)) return '';
  const isMinor = marksMinorCircles && rank >= CHAIN.minorCircleRank;
  return element('circle', {
    class: isMinor ? 'circle minor' : 'circle',
    r: hundredths(term.r),
    ...strokeOpacity(fade(term.r, CHAIN.circleFullRadius)),
  });
}

function arm(term, rank) {
  if (!hasArm(term)) return '';
  return element('path', {
    class: armClass(term, rank),
    ...strokeOpacity(armOpacity(term)),
    d: `M0 0H${hundredths(term.r)}`,
  });
}

function armClass(term, rank) {
  if (rank < CHAIN.fundamentalArmCount) return 'arm fundamental';
  if (term.r >= CHAIN.armFullRadius) return 'arm';
  return term.r >= CHAIN.thinArmRadius ? 'arm thin' : 'arm faint';
}

function joint(rank) {
  if (!hasJoint(rank)) return '';
  const radius = rank < CHAIN.largeJointCount ? CHAIN.largeJointRadius : CHAIN.smallJointRadius;
  return element('circle', { class: 'joint', r: radius });
}

function armOpacity(term) {
  return fade(term.r, CHAIN.armFullRadius);
}

function fade(radius, fullRadius) {
  return Math.pow(Math.min(1, radius / fullRadius), CHAIN.fadeExponent);
}

function strokeOpacity(opacity) {
  return opacity < CHAIN.omitOpacityFrom ? { 'stroke-opacity': thousandths(opacity) } : {};
}

function nib(look) {
  return [
    ...onlyWhen(look.glows, element('circle', { class: 'nib-halo', r: CHAIN.nibHaloRadius })),
    element('circle', { class: 'nib', r: CHAIN.nibRadius }),
  ].join('');
}

function nibWithUndrawnTail({ lastDrawn, tail, tailSpins, nibFigures }) {
  const pivots = runningTotals([lastDrawn, ...tail].map((term) => term.r));
  const placedNib = element('g', { transform: `translate(${thousandths(pivots.at(-1))} 0)` }, [nibFigures]);
  if (!tail.length) return placedNib;
  return element('g', {}, [...tailSpins.map((spin, i) => spinAnimation(spin, pivots[i])), placedNib]);
}
