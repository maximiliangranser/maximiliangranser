export function fourierCoefficients({ xs, ys }, highestFrequency) {
  const count = xs.length;
  const cosines = new Float64Array(count);
  const sines = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    cosines[i] = Math.cos((2 * Math.PI * i) / count);
    sines[i] = Math.sin((2 * Math.PI * i) / count);
  }
  const coefficients = [];
  for (let k = -highestFrequency; k <= highestFrequency; k++) {
    let re = 0;
    let im = 0;
    const step = ((k % count) + count) % count;
    let index = 0;
    for (let m = 0; m < count; m++) {
      re += xs[m] * cosines[index] + ys[m] * sines[index];
      im += ys[m] * cosines[index] - xs[m] * sines[index];
      index += step;
      if (index >= count) index -= count;
    }
    re /= count;
    im /= count;
    coefficients.push({ k, re, im, r: Math.hypot(re, im), phi: Math.atan2(im, re) });
  }
  return coefficients;
}

export function largestTerms(coefficients, count) {
  return coefficients
    .filter((coefficient) => coefficient.k !== 0)
    .sort((a, b) => b.r - a.r)
    .slice(0, count);
}

export function partialSum(center, terms, t) {
  let x = center[0];
  let y = center[1];
  for (const term of terms) {
    const angle = 2 * Math.PI * term.k * t + term.phi;
    x += term.r * Math.cos(angle);
    y += term.r * Math.sin(angle);
  }
  return [x, y];
}
