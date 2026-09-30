export function round(value, decimals) {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

export function tenths(value) {
  return String(round(value, 1));
}

export function hundredths(value) {
  return String(round(value, 2));
}

export function thousandths(value) {
  return String(round(value, 3));
}

export function compactPathData(pathData) {
  return pathData.replace(/ -/g, '-');
}

export function seconds(value) {
  return `${thousandths(value)}s`;
}
