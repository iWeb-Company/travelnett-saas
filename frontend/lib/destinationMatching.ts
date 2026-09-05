type DestinationLike = {
  id?: string | null;
  name?: string | null;
  nombre?: string | null;
  sigla?: string | null;
};

export const normalizeDestination = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const splitDestinationName = (value: unknown): string[] =>
  String(value ?? "")
    .split(/\s*[/,+]\s*/)
    .map(normalizeDestination)
    .filter(Boolean);

const findDestination = (value: unknown, destinations: DestinationLike[]) => {
  const normalized = normalizeDestination(value);
  return destinations.find((destination) =>
    [destination.id, destination.name, destination.nombre, destination.sigla]
      .some((candidate) => normalizeDestination(candidate) === normalized),
  );
};

const identityKeys = (value: unknown, destinations: DestinationLike[]): Set<string> => {
  const destination = findDestination(value, destinations);
  return new Set(
    [value, destination?.id, destination?.name, destination?.nombre, destination?.sigla]
      .map(normalizeDestination)
      .filter(Boolean),
  );
};

const nameParts = (value: unknown, destinations: DestinationLike[]): Set<string> => {
  const destination = findDestination(value, destinations);
  return new Set([
    ...splitDestinationName(destination?.name || destination?.nombre || value),
    ...identityKeys(value, destinations),
  ]);
};

/** Matches the same commercial destination, accepting id/name/sigla aliases. */
export const isSameDestination = (
  left: unknown,
  right: unknown,
  destinations: DestinationLike[],
): boolean => {
  const leftKeys = identityKeys(left, destinations);
  const rightKeys = identityKeys(right, destinations);
  return [...leftKeys].some((key) => rightKeys.has(key));
};

/** Matches a commercial destination against an operative combined destination. */
export const destinationComponentsOverlap = (
  left: unknown,
  right: unknown,
  destinations: DestinationLike[],
): boolean => {
  const leftParts = nameParts(left, destinations);
  const rightParts = nameParts(right, destinations);
  return [...leftParts].some((part) => rightParts.has(part));
};
