export const DESKTOP = desktopScene();
export const MOBILE = mobileScene();

function desktopScene() {
  const width = 846;
  const height = 250;
  const baseline = 158;
  return {
    name: 'hero',
    width,
    height,
    signature: { maxWidth: 580, baseline, shiftX: 6 },
    closingSwoop: { bottomY: baseline + 44, bottomSpanShare: 0.5, bottomHandleSpanShare: 0.18 },
    chainBand: { hiddenAbove: 14, fullFrom: 64, fullTo: height - 44, hiddenBelow: height - 10 },
    graticule: { spacing: 23.5, centerY: baseline - 40 },
    inkWidths: { light: { main: 2.5, secondary: 5.4 }, dark: { main: 1.8, secondary: 4.4 } },
    hotHeadWidth: 3.6,
    chainWidths: { circle: 0.7, arm: 0.95, thinArm: 0.71, faintArm: 0.48 },
    gridWidth: 1.6,
    phosphor: { bloom: 4.4, bloomGain: 1.6, glow: 1.1, glowGain: 1.6 },
    bleed: { blur: 1.2, gain: 0.28 },
    readout: { right: width - 18, baseline: 26, size: 12 },
    screens: [
      { maxWidth: 760, readoutScale: 1.2 },
      { maxWidth: 640, readoutScale: 1.4, chainWidths: { circle: 1, arm: 1.3, thinArm: 1, faintArm: 0.7 } },
      {
        maxWidth: 500,
        inkWidths: { main: 4, secondary: 8.4 },
        hotHeadWidth: 6.4,
        chainWidths: { circle: 1.6, arm: 2.2, thinArm: 1.7, faintArm: 1.3 },
        hidesMinorCircles: true,
        nibScale: 2,
        gridWidth: 3.2,
        hidesReadout: true,
      },
    ],
  };
}

function mobileScene() {
  const width = 560;
  const height = 270;
  const baseline = 164;
  return {
    name: 'hero-mobile',
    width,
    height,
    signature: { maxWidth: 480, baseline, shiftX: 4 },
    closingSwoop: { bottomY: baseline + 40, bottomSpanShare: 0.5, bottomHandleSpanShare: 0.2 },
    chainBand: { hiddenAbove: 36, fullFrom: 80, fullTo: height - 40, hiddenBelow: height - 10 },
    graticule: { spacing: 28, centerY: baseline - 34 },
    inkWidths: { light: { main: 3.2, secondary: 7 }, dark: { main: 2.6, secondary: 6.2 } },
    hotHeadWidth: 4.8,
    chainWidths: { circle: 1.1, arm: 1.4, thinArm: 1.05, faintArm: 0.7 },
    gridWidth: 1.6,
    phosphor: { bloom: 5.5, bloomGain: 1.5, glow: 1.4, glowGain: 1.6 },
    bleed: { blur: 1.4, gain: 0.28 },
    readout: { right: width - 16, baseline: 30, size: 18 },
    screens: [],
  };
}
