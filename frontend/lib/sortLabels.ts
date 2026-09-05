const spanish = new Intl.Collator("es", { sensitivity: "base", numeric: true });

export function sortLabels<T>(items: T[], label: (item: T) => string): T[] {
  return [...items].sort((a, b) => spanish.compare(label(a).trim(), label(b).trim()));
}
