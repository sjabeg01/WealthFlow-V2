export function toNumber(value: unknown): any {
  if (value === null || value === undefined || value === '') return null;
  const parsed =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}
