import { PALETTES, PHOSPHOR } from './config.mjs';
import { onlyWhen } from './markup.mjs';

export const INK_FILTER = { light: 'bleed', dark: 'phosphor' };
export const NIB_HALO_GRADIENT = 'nibHalo';

const ROUND_STROKE = 'fill:none;stroke-linecap:round;stroke-linejoin:round';
const GLOW_DISPLAY = { light: 'none', dark: 'inline' };
const READOUT_MIDDLE_ABOVE_BASELINE = 0.36;

const SCREEN_RULES = {
  readoutScale: (scale, { scene }) => readoutScaling(scene.readout, scale),
  inkWidths: inkWidthRules,
  hotHeadWidth: (width, { look }) => (look.glows ? `.hot-head{stroke-width:${width}}` : ''),
  chainWidths: chainWidthRules,
  hidesMinorCircles: (hides) => (hides ? '.minor{display:none}' : ''),
  nibScale: (scale) => `.nib{transform:scale(${scale})}`,
  gridWidth: (width) => `.grid{stroke-width:${width}}`,
  hidesReadout: (hides) => (hides ? '.readout{display:none}' : ''),
};

export function stylesheet(scene, look) {
  return [
    `.core{${ROUND_STROKE};stroke:var(--ink)}`,
    ...onlyWhen(look.glows, hotHeadRule(scene.hotHeadWidth)),
    colorSchemeCss(scene, look),
    '.plate{fill:var(--plate)}',
    ...chainRules(scene.chainWidths, look),
    `.grid{fill:none;stroke:var(--grid);stroke-width:${scene.gridWidth};stroke-linecap:round;`
      + 'stroke-opacity:var(--grid-opacity)}',
    '.readout{fill:var(--readout)}',
    '.still{display:none}',
    '@media (prefers-reduced-motion: reduce){.animated{display:none}.still{display:inline}}',
    ...scene.screens.map((screen) => screenCss(screen, scene, look)),
  ].join('\n');
}

function hotHeadRule(width) {
  return `.hot-head{${ROUND_STROKE};stroke:var(--hot-head);stroke-width:${width};`
    + `opacity:${PHOSPHOR.hotHeadOpacity}}`;
}

function colorSchemeCss(scene, look) {
  const [base, alternative] = look.colorSchemes;
  const rootCss = `:root{color-scheme:${look.colorSchemes.join(' ')};${variables(base)}}`;
  const baseCss = `${rootCss}${schemeRules(scene, base, look)}`;
  if (!alternative) return baseCss;
  const alternativeCss = `:root{${variables(alternative)}}${schemeRules(scene, alternative, look)}`;
  return `${baseCss}\n@media (prefers-color-scheme: ${alternative}){${alternativeCss}}`;
}

function variables(colorScheme) {
  return Object.entries(PALETTES[colorScheme]).map(([name, value]) => `${name}:${value}`).join(';');
}

function schemeRules(scene, colorScheme, look) {
  const glowDisplay = look.adapts ? `.hot-head,.nib-halo{display:${GLOW_DISPLAY[colorScheme]}}` : '';
  const inkFilter = `.ink{filter:url(#${INK_FILTER[colorScheme]})}`;
  return `${inkFilter}${inkWidthRules(scene.inkWidths[colorScheme])}${glowDisplay}`;
}

function inkWidthRules({ main, secondary }) {
  return `.core{stroke-width:${main}}.core.secondary{stroke-width:${secondary}}`;
}

function chainRules({ circle, arm, thinArm, faintArm }, look) {
  return [
    `.circle{fill:none;stroke:var(--circle);stroke-width:${circle};opacity:var(--circle-opacity)}`,
    `.arm{fill:none;stroke:var(--arm);stroke-width:${arm};stroke-linecap:round;opacity:var(--arm-opacity)}`,
    '.arm.fundamental{opacity:var(--fundamental-arm-opacity)}',
    `.arm.thin{stroke-width:${thinArm}}`,
    `.arm.faint{stroke:var(--faint-arm);stroke-width:${faintArm};opacity:var(--faint-arm-opacity)}`,
    '.joint{fill:var(--joint)}',
    '.nib{fill:var(--nib)}',
    ...onlyWhen(look.glows, `.nib-halo{fill:url(#${NIB_HALO_GRADIENT});opacity:${PHOSPHOR.nibHaloOpacity}}`),
  ];
}

function chainWidthRules({ circle, arm, thinArm, faintArm }) {
  return `.circle{stroke-width:${circle}}.arm{stroke-width:${arm}}`
    + `.arm.thin{stroke-width:${thinArm}}.arm.faint{stroke-width:${faintArm}}`;
}

function screenCss(screen, scene, look) {
  const { maxWidth, ...settings } = screen;
  const context = { scene, look };
  const rules = Object.entries(settings).map(([setting, value]) => screenRule(setting, value, context));
  return `@media (max-width: ${maxWidth}px){${rules.join('')}}`;
}

function screenRule(setting, value, context) {
  const rule = SCREEN_RULES[setting];
  if (!rule) throw new Error(`Scene "${context.scene.name}" has an unknown screen setting "${setting}".`);
  return rule(value, context);
}

function readoutScaling(readout, scale) {
  const x = readout.right;
  const y = readout.baseline - readout.size * READOUT_MIDDLE_ABOVE_BASELINE;
  return `.readout{transform:translate(${x}px,${y}px) scale(${scale}) translate(${-x}px,${-y}px)}`;
}
