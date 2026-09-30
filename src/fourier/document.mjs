import { chainVisibility, rotatingChain } from './chain.mjs';
import { ELEMENT_DEPTH, FILTER_MARGIN_PERCENT, PALETTES, PHOSPHOR } from './config.mjs';
import { thousandths } from './format.mjs';
import { graticule } from './graticule.mjs';
import { drawnInk, finishedInk, hotInkHeads, inkPathDefinitions } from './ink.mjs';
import { lookOf } from './look.mjs';
import { element, escapeXml, onlyWhen } from './markup.mjs';
import { readout } from './readout.mjs';
import { INK_FILTER, NIB_HALO_GRADIENT, stylesheet } from './stylesheet.mjs';

const CHAIN_MASK = 'chainMask';
const CHAIN_MASK_GRADIENT = 'chainFade';
const PLATE_CORNER_RADIUS = 12;
const CHANNEL_MAXIMUM = 255;

export function heroDocument({ scene, drawing, colorSchemes, title, readoutFont }) {
  const look = lookOf(colorSchemes);
  const label = escapeXml(title);
  const content = onSeparateLines(
    element('title', {}, [label]),
    element('style', {}, [`<![CDATA[${onSeparateLines(stylesheet(scene, look))}]]>`]),
    element('defs', {}, [onSeparateLines(...definitions(scene, drawing, look))]),
    element('rect', { class: 'plate', width: scene.width, height: scene.height, rx: PLATE_CORNER_RADIUS }),
    graticule(scene),
    animatedDrawing(scene, drawing, look),
    stillDrawing(drawing),
    readout(readoutFont, scene.readout, drawing.series.terms.length),
  );
  return `${element('svg', rootAttributes(scene, label), [content])}\n`;
}

export function assertParsableDepth(file, svg) {
  const depth = elementDepth(svg);
  if (depth <= ELEMENT_DEPTH.allowed) return;
  throw new Error(`${file}: elements nest ${depth} levels deep, more than the ${ELEMENT_DEPTH.allowed} `
    + `allowed (WebKit stops parsing SVG images at ${ELEMENT_DEPTH.webkitLimit} levels).`);
}

function rootAttributes({ width, height }, label) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    role: 'img',
    'aria-label': label,
  };
}

function onSeparateLines(...parts) {
  return `\n${parts.join('\n')}\n`;
}

function animatedDrawing(scene, drawing, look) {
  const { series, schedule, ink } = drawing;
  const marksMinorCircles = scene.screens.some((screen) => screen.hidesMinorCircles);
  return element('g', { class: 'animated' }, [
    element('g', { class: 'ink' }, [drawnInk(ink), ...onlyWhen(look.glows, hotInkHeads(ink))]),
    element('g', { opacity: 0, mask: `url(#${CHAIN_MASK})` }, [
      chainVisibility(schedule),
      rotatingChain({ series, schedule, look, marksMinorCircles }),
    ]),
  ]);
}

function stillDrawing(drawing) {
  return element('g', { class: 'still' }, [element('g', { class: 'ink' }, [finishedInk(drawing.ink)])]);
}

function definitions(scene, drawing, look) {
  return [
    ...onlyWhen(look.glows, phosphorFilter(scene.phosphor)),
    ...onlyWhen(look.bleeds, bleedFilter(scene.bleed)),
    ...onlyWhen(look.glows, nibHaloGradient()),
    chainMaskGradient(scene),
    chainMask(scene),
    inkPathDefinitions(drawing.ink),
  ];
}

function phosphorFilter({ bloom, bloomGain, glow, glowGain }) {
  const { bloomColor, glowColor } = PHOSPHOR;
  return element('filter', filterRegion(INK_FILTER.dark, FILTER_MARGIN_PERCENT.phosphor), [
    tintedBlur({ blurred: 'bloomBlur', blur: bloom, color: bloomColor, gain: bloomGain, result: 'bloom' }),
    tintedBlur({ blurred: 'glowBlur', blur: glow, color: glowColor, gain: glowGain, result: 'glow' }),
    merge(['bloom', 'glow', 'SourceGraphic']),
  ]);
}

function bleedFilter({ blur, gain }) {
  return element('filter', filterRegion(INK_FILTER.light, FILTER_MARGIN_PERCENT.bleed), [
    tintedBlur({ blurred: 'bleedBlur', blur, color: PALETTES.light['--ink'], gain, result: 'bleed' }),
    merge(['bleed', 'SourceGraphic']),
  ]);
}

function filterRegion(id, marginPercent) {
  return {
    id,
    x: `-${marginPercent.x}%`,
    y: `-${marginPercent.y}%`,
    width: `${100 + 2 * marginPercent.x}%`,
    height: `${100 + 2 * marginPercent.y}%`,
    'color-interpolation-filters': 'sRGB',
  };
}

function tintedBlur({ blurred, blur, color, gain, result }) {
  const [red, green, blue] = unitChannels(color);
  const values = `0 0 0 0 ${red} 0 0 0 0 ${green} 0 0 0 0 ${blue} 0 0 0 ${gain} 0`;
  return element('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: blur, result: blurred })
    + element('feColorMatrix', { in: blurred, values, result });
}

function unitChannels(hexColor) {
  return hexColor.slice(1).match(/../g).map((hex) => thousandths(parseInt(hex, 16) / CHANNEL_MAXIMUM));
}

function merge(inputs) {
  return element('feMerge', {}, inputs.map((input) => element('feMergeNode', { in: input })));
}

function nibHaloGradient() {
  const { nibHaloColor: color, nibHaloCore: core } = PHOSPHOR;
  return element('radialGradient', { id: NIB_HALO_GRADIENT }, [
    element('stop', { offset: 0, 'stop-color': color }),
    element('stop', { offset: core.offset, 'stop-color': color, 'stop-opacity': core.opacity }),
    element('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }),
  ]);
}

function chainMaskGradient({ height, chainBand }) {
  const edges = [
    [0, '#000'],
    [chainBand.hiddenAbove, '#000'],
    [chainBand.fullFrom, '#fff'],
    [chainBand.fullTo, '#fff'],
    [chainBand.hiddenBelow, '#000'],
    [height, '#000'],
  ];
  const stop = ([y, color]) => element('stop', { offset: thousandths(y / height), 'stop-color': color });
  const stops = edges.map(stop);
  const axis = { gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: height };
  return element('linearGradient', { id: CHAIN_MASK_GRADIENT, ...axis }, stops);
}

function chainMask({ width, height }) {
  const area = { maskUnits: 'userSpaceOnUse', x: 0, y: 0, width, height };
  return element('mask', { id: CHAIN_MASK, ...area }, [
    element('rect', { width, height, fill: `url(#${CHAIN_MASK_GRADIENT})` }),
  ]);
}

function elementDepth(svg) {
  const markup = svg.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  let depth = 0;
  let deepest = 0;
  for (const [, closing, selfClosing] of markup.matchAll(/<(\/?)[A-Za-z][\w:-]*\b[^>]*?(\/?)>/g)) {
    if (closing) {
      depth--;
    } else {
      deepest = Math.max(deepest, depth + 1);
      if (!selfClosing) depth++;
    }
  }
  if (depth !== 0) throw new Error(`The generated SVG has unbalanced tags (depth ${depth} at the end).`);
  return deepest;
}
