// Single source for displaying point values. Uses U+2212 minus sign so
// negative scores read clearly ("−10") instead of an ambiguous hyphen.
export function formatPoints(n) {
  if (n < 0) return `−${Math.abs(n)}`;
  return String(n);
}
