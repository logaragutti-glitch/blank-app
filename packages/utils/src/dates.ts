/** All timestamps in EVE OS are stored and transmitted as UTC ISO-8601 strings. */
export function nowUtc(): string {
  return new Date().toISOString();
}

export function isPast(isoDate: string): boolean {
  return new Date(isoDate).getTime() < Date.now();
}
