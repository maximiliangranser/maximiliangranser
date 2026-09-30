import fs from 'node:fs';

const ENTITIES = { '&amp;': '&', '&apos;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>' };

const SECONDARY_STROKES = { i: [1], j: [1], t: [1] };

export function loadSingleLineFont(url) {
  const source = fs.readFileSync(url, 'utf8');
  const defaultAdvance = fontDefaultAdvance(source, url);
  const glyphs = new Map();
  for (const [, attributeText] of source.matchAll(/<glyph\s+([^>]*?)\/>/g)) {
    const attributes = parseAttributes(attributeText);
    if (attributes.unicode === undefined) continue;
    glyphs.set(decodeCharacter(attributes.unicode), {
      advance: Number(attributes['horiz-adv-x'] ?? defaultAdvance),
      pathData: attributes.d ?? '',
    });
  }
  return glyphs;
}

export function layOutText(glyphs, text) {
  const strokes = [];
  let penX = 0;
  let word = 0;
  for (const character of text) {
    if (character === ' ') word++;
    const glyph = glyphs.get(character);
    if (!glyph) throw new Error(`The single-line font has no glyph for "${character}".`);
    parsePolylines(glyph.pathData).forEach((polyline, index) => {
      strokes.push({
        word,
        secondary: SECONDARY_STROKES[character]?.includes(index) ?? false,
        points: polyline.map(([x, y]) => [penX + x, y]),
      });
    });
    penX += glyph.advance;
  }
  return { strokes, advance: penX };
}

function fontDefaultAdvance(source, url) {
  const match = /<font[^>]*horiz-adv-x="([\d.]+)"/.exec(source);
  if (!match) throw new Error(`The single-line font ${url.pathname} has no default horiz-adv-x.`);
  return Number(match[1]);
}

function parseAttributes(attributeText) {
  const pairs = [...attributeText.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]);
  return Object.fromEntries(pairs);
}

function decodeCharacter(unicode) {
  return unicode
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&\w+;/g, (entity) => ENTITIES[entity] ?? entity);
}

function parsePolylines(pathData) {
  const tokens = pathData.match(/[a-zA-Z]|-?[\d.]+(?:e-?\d+)?/g) ?? [];
  const polylines = [];
  let command = null;
  while (tokens.length) {
    if (/[a-zA-Z]/.test(tokens[0])) command = tokens.shift();
    if (command !== 'M' && command !== 'L') {
      throw new Error(`The single-line font uses path command "${command}"; only M and L are supported.`);
    }
    const point = [Number(tokens.shift()), Number(tokens.shift())];
    if (command === 'M') {
      polylines.push([]);
      command = 'L';
    }
    polylines.at(-1).push(point);
  }
  return polylines;
}
