export const FONTS = {
  signature: new URL('../../fonts/EMSAllure.svg', import.meta.url),
  readout: new URL('../../fonts/JetBrainsMono-Regular.ttf', import.meta.url),
};

export const SERIES = {
  termCount: 240,
  sampleCount: 8192,
  highestFrequency: 700,
  coefficientDecimals: 3,
};

export const PEN_PATH = {
  sampleSpacing: 0.25,
  cornerTurnDegrees: 100,
  tangentSpan: 3,
  connector: { reach: 0.33, minHandle: 2, maxHandle: 70, minSegments: 16 },
  swoopEndHandleReach: 0.4,
};

export const PEN_PACE = {
  curvatureScale: 0.05,
  curvatureExponent: 0.5,
  curvatureSmoothing: 2.5,
  speedSmoothing: 6,
  liftedSpeed: 1.3,
  closingSpeedSearch: { lowest: 0.02, highest: 20, iterations: 40 },
};

export const TIMELINE_SECONDS = {
  preroll: 0.6,
  writing: 3.4,
  closingMove: 1.6,
  chainFadeIn: 0.5,
  chainFadeDelay: 0.2,
  chainFadeOut: 0.6,
  hotHeadDrain: 0.35,
  safetyMargin: 0.05,
};

export const CHAIN = {
  circleCount: 34,
  minorCircleRank: 12,
  jointCount: 14,
  largeJointCount: 4,
  largeJointRadius: 1.6,
  smallJointRadius: 1.2,
  fundamentalArmCount: 2,
  armFullRadius: 5,
  thinArmRadius: 2,
  circleFullRadius: 14,
  fadeExponent: 1.6,
  minArmOpacity: 0.012,
  omitOpacityFrom: 0.995,
  nibRadius: 2.1,
  nibHaloRadius: 11,
};

export const INK = {
  traceSamplesPerLoop: 30000,
  minTraceSamples: 40,
  coordinateDecimals: 1,
  pathTolerance: 0.07,
  dashTolerance: 0.2,
  keyTimeDecimals: 5,
  hiddenLead: 4,
  gapPadding: 8,
  hotHeadLength: 46,
  hotHeadHiddenLead: 1,
  hotHeadGapPadding: 2,
  hotHeadTrail: 0.5,
};

export const ELEMENT_DEPTH = { webkitLimit: 256, allowed: 200 };

export const PALETTES = {
  light: {
    '--plate': '#ffffff',
    '--ink': '#1b2a55',
    '--arm': '#59636e',
    '--arm-opacity': '0.8',
    '--fundamental-arm-opacity': '0.2',
    '--faint-arm': '#8c959f',
    '--faint-arm-opacity': '0.4',
    '--circle': '#8c959f',
    '--circle-opacity': '0.42',
    '--joint': '#424a53',
    '--nib': '#1b2a55',
    '--grid': '#aab3bd',
    '--grid-opacity': '0.85',
    '--readout': '#6e7781',
  },
  dark: {
    '--plate': '#0d1117',
    '--ink': '#eafff5',
    '--hot-head': '#d4ffe9',
    '--arm': '#8be8bf',
    '--arm-opacity': '0.66',
    '--fundamental-arm-opacity': '0.16',
    '--faint-arm': '#8be8bf',
    '--faint-arm-opacity': '0.66',
    '--circle': '#3dbf8b',
    '--circle-opacity': '0.30',
    '--joint': '#c9fbe3',
    '--nib': '#ffffff',
    '--grid': '#1c3a30',
    '--grid-opacity': '0.9',
    '--readout': '#6f9384',
  },
};

export const PHOSPHOR = {
  bloomColor: '#1fe38c',
  glowColor: '#4dffa6',
  hotHeadOpacity: 0.6,
  nibHaloColor: '#5dffb4',
  nibHaloOpacity: 0.5,
  nibHaloCore: { offset: 0.35, opacity: 0.35 },
};

export const FILTER_MARGIN_PERCENT = {
  phosphor: { x: 4, y: 24 },
  bleed: { x: 2, y: 10 },
};
