const MIN_VERTEX_SPACING = 1e-6;
const MIN_CURVE_POINT_SPACING = 1e-9;
const CURVE_SEGMENTS = { minimum: 8, perPixel: 2 };

export function distance(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

export function along(point, direction, length) {
  return [point[0] + direction[0] * length, point[1] + direction[1] * length];
}

export function turnAngle(previous, current, next) {
  const incoming = [current[0] - previous[0], current[1] - previous[1]];
  const outgoing = [next[0] - current[0], next[1] - current[1]];
  const cross = incoming[0] * outgoing[1] - incoming[1] * outgoing[0];
  const dot = incoming[0] * outgoing[0] + incoming[1] * outgoing[1];
  return Math.abs(Math.atan2(cross, dot));
}

export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function clamp(value, lowest, highest) {
  return Math.min(highest, Math.max(lowest, value));
}

export function runningTotals(values) {
  const totals = [];
  for (const value of values) totals.push((totals.at(-1) ?? 0) + value);
  return totals;
}

export function polylineLength(points) {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += distance(points[i - 1], points[i]);
  return length;
}

export function resample(points, spacing) {
  const length = polylineLength(points);
  if (length === 0) return [points[0].slice(), points[0].slice()];
  const count = Math.max(1, Math.round(length / spacing));
  const segmentLength = (index) => distance(points[index], points[index + 1]);
  const lastSegment = points.length - 2;
  const resampled = [];
  let segment = 0;
  let travelled = 0;
  for (let k = 0; k <= count; k++) {
    const target = (length * k) / count;
    while (segment < lastSegment && travelled + segmentLength(segment) < target) {
      travelled += segmentLength(segment);
      segment++;
    }
    const a = points[segment];
    const b = points[segment + 1];
    const u = clamp((target - travelled) / (distance(a, b) || 1), 0, 1);
    resampled.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return resampled;
}

export function smoothStroke(points, { spacing, cornerTurnDegrees }) {
  const vertices = points.filter((p, i) => i === 0 || distance(points[i - 1], p) > MIN_VERTEX_SPACING);
  if (vertices.length < 2) return [vertices[0], vertices[0]];
  const dense = [];
  for (const run of splitAtCorners(vertices, cornerTurnDegrees)) {
    for (const p of catmullRom(run)) {
      const last = dense.at(-1);
      if (!last || distance(last, p) > MIN_CURVE_POINT_SPACING) dense.push(p);
    }
  }
  return resample(dense, spacing);
}

function splitAtCorners(vertices, cornerTurnDegrees) {
  const runs = [];
  let run = [vertices[0]];
  for (let i = 1; i < vertices.length; i++) {
    run.push(vertices[i]);
    const isInner = i < vertices.length - 1;
    if (isInner && toDegrees(turnAngle(vertices[i - 1], vertices[i], vertices[i + 1])) > cornerTurnDegrees) {
      runs.push(run);
      run = [vertices[i]];
    }
  }
  runs.push(run);
  return runs;
}

function catmullRom(points) {
  if (points.length === 2) return points.map((p) => p.slice());
  const last = points.length - 1;
  const extended = [reflect(points[1], points[0]), ...points, reflect(points[last - 1], points[last])];
  const curve = [];
  for (let i = 1; i < extended.length - 2; i++) {
    const controls = extended.slice(i - 1, i + 3);
    const knots = centripetalKnots(controls);
    const segments = Math.max(
      CURVE_SEGMENTS.minimum,
      Math.ceil(distance(controls[1], controls[2]) * CURVE_SEGMENTS.perPixel),
    );
    for (let s = i > 1 ? 1 : 0; s <= segments; s++) {
      const t = knots[1] + ((knots[2] - knots[1]) * s) / segments;
      curve.push(catmullRomPoint(controls, knots, t));
    }
  }
  return curve;
}

function reflect(point, mirror) {
  return [2 * mirror[0] - point[0], 2 * mirror[1] - point[1]];
}

function centripetalKnots(controls) {
  const knots = [0];
  for (let i = 1; i < controls.length; i++) {
    knots.push(knots[i - 1] + Math.sqrt(distance(controls[i - 1], controls[i])));
  }
  return knots;
}

function catmullRomPoint([p0, p1, p2, p3], [t0, t1, t2, t3], t) {
  const a1 = blend(p0, p1, [t0, t1], t);
  const a2 = blend(p1, p2, [t1, t2], t);
  const a3 = blend(p2, p3, [t2, t3], t);
  const b1 = blend(a1, a2, [t0, t2], t);
  const b2 = blend(a2, a3, [t1, t3], t);
  return blend(b1, b2, [t1, t2], t);
}

function blend(a, b, [from, to], t) {
  const span = to - from;
  return [
    a[0] * (to - t) / span + b[0] * (t - from) / span,
    a[1] * (to - t) / span + b[1] * (t - from) / span,
  ];
}

export function cubicBezier([p0, p1, p2, p3], segments) {
  const curve = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    curve.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return curve;
}

export function startDirection(points, span) {
  const start = points[0];
  return direction(start, firstPointBeyond(start, points.slice(1), span));
}

export function endDirection(points, span) {
  const end = points.at(-1);
  return direction(firstPointBeyond(end, points.slice(0, -1).reverse(), span), end);
}

function firstPointBeyond(anchor, candidates, span) {
  let reached = anchor;
  for (const candidate of candidates) {
    reached = candidate;
    if (distance(anchor, candidate) >= span) break;
  }
  return reached;
}

function direction(from, to) {
  const length = distance(from, to) || 1;
  return [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
}

export function simplifyPolyline(points, tolerance) {
  const deviation = (i, first, last) => distanceToSegment(points[i], points[first], points[last]);
  return douglasPeucker(points.length, tolerance, deviation);
}

export function simplifyGraph(xs, ys, tolerance) {
  return douglasPeucker(xs.length, tolerance, (i, first, last) => {
    const interpolated = ys[first] + ((ys[last] - ys[first]) * (xs[i] - xs[first])) / (xs[last] - xs[first]);
    return Math.abs(ys[i] - interpolated);
  });
}

function douglasPeucker(count, tolerance, deviation) {
  const keep = new Uint8Array(count);
  keep[0] = keep[count - 1] = 1;
  const pending = [[0, count - 1]];
  while (pending.length) {
    const [first, last] = pending.pop();
    let farthest = -1;
    let largestDeviation = tolerance;
    for (let i = first + 1; i < last; i++) {
      const d = deviation(i, first, last);
      if (d > largestDeviation) {
        largestDeviation = d;
        farthest = i;
      }
    }
    if (farthest >= 0) {
      keep[farthest] = 1;
      pending.push([first, farthest], [farthest, last]);
    }
  }
  const kept = [];
  for (let i = 0; i < count; i++) if (keep[i]) kept.push(i);
  return kept;
}

function distanceToSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distance(p, a);
  const u = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSquared, 0, 1);
  return distance(p, [a[0] + u * dx, a[1] + u * dy]);
}
