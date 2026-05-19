/** Maps API category names (English) to localized chart labels. */
export function translateMatchCategory(
  name: string,
  t: (key: string) => string,
): string {
  const key = `match.categoryLabels.${name}`;
  const label = t(key);
  return label === key ? name : label;
}
