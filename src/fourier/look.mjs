export function lookOf(colorSchemes) {
  return {
    colorSchemes,
    glows: colorSchemes.includes('dark'),
    bleeds: colorSchemes.includes('light'),
    adapts: colorSchemes.length > 1,
  };
}
