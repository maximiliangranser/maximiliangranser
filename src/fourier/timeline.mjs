import { TIMELINE_SECONDS } from './config.mjs';

export function chainSchedule(series) {
  const lastInkAt = secondsAt(series.lastInkEnd, series.period);
  const fadeOutAt = lastInkAt + TIMELINE_SECONDS.chainFadeDelay;
  const hideAt = fadeOutAt + TIMELINE_SECONDS.chainFadeOut + TIMELINE_SECONDS.safetyMargin;
  return { fadeOutAt, hideAt, stopAt: hideAt + TIMELINE_SECONDS.safetyMargin };
}

export function secondsAt(loopTime, period) {
  return TIMELINE_SECONDS.preroll + loopTime * period;
}

export function loopTimeAt(seconds, period) {
  return (seconds - TIMELINE_SECONDS.preroll) / period;
}

export function writingPeriod(pieces) {
  return TIMELINE_SECONDS.writing / (lastInkEnd(pieces) - pieces[0].start);
}

export function closingMoveSeconds(pieces) {
  return (1 - lastInkEnd(pieces)) * writingPeriod(pieces);
}

export function lastInkEnd(pieces) {
  return Math.max(...pieces.map((piece) => piece.end));
}
