# Fourier signature

The header of this profile is a name drawn by 320 spinning circles.

Each circle turns at its own fixed speed and carries the next one on its rim. With enough circles in the chain, the tip at the end can follow almost any closed line. Here that line is the pen path of the name, written in a single-line script font. The path is sampled over time and run through a discrete Fourier transform, and the 320 largest terms become the circles. The formula in the corner is that series.

Each circle is one SMIL rotation, and the ink appears along the path as the tip passes. There is no JavaScript, which is why it can run in a README. The image follows the light or dark theme, puts the name on two lines on a phone, shows the finished name when reduced motion is on, and comes to rest after about five seconds.

## Build

```sh
npm install
npm run build
```

This writes the five images to `assets/fourier`.

## Code

- `generate.mjs`, `hero.mjs`: build each image
- `signature.mjs`: sets the name in the font
- `route.mjs`: joins the strokes into one closed pen path
- `pace.mjs`: decides how fast the pen moves
- `series.mjs`, `fourier.mjs`: turn the path into circles
- `chain.mjs`, `ink.mjs`: animate the circles and the ink
- `document.mjs`: writes the SVG
