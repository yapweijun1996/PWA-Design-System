/** WCAG relative luminance for opaque, six-digit sRGB values. */
export function contrastRatio(foreground: string, background: string): number | null {
  const luminance = (input: string): number | null => {
    if (!/^#[0-9a-f]{6}$/i.test(input)) return null;
    const rgb = [1, 3, 5].map(offset => Number.parseInt(input.slice(offset, offset + 2), 16) / 255)
      .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  };
  const a = luminance(foreground), b = luminance(background);
  if (a === null || b === null) return null;
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
