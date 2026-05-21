export function normalizeText(parts: Array<string | null | undefined>): string {
  return ` ${parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

export function hasAny(text: string, phrases: string[]): string | null {
  for (const phrase of phrases) {
    const normalized = ` ${phrase.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
    if (text.includes(normalized)) return phrase;
  }
  return null;
}
