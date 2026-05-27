// Pick a readable foreground for a given background using WCAG relative
// luminance. Returns near-black on light backgrounds and near-white on dark.
// Accepts #rgb, #rrggbb, or any hex; falls back to white if unparseable.

const LIGHT = '#f8fafc';
const DARK = '#0b1020';

function parseHex(hex) {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function srgbToLin(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  return (
    0.2126 * srgbToLin(rgb.r) +
    0.7152 * srgbToLin(rgb.g) +
    0.0722 * srgbToLin(rgb.b)
  );
}

export function textOn(bgHex) {
  return relativeLuminance(bgHex) > 0.45 ? DARK : LIGHT;
}

export function isLight(bgHex) {
  return relativeLuminance(bgHex) > 0.45;
}
